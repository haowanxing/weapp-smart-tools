const STEP_CONNECTED_AP = 'STEP_CONNECTED_AP';
const STEP_CONNECTED_DEVICE = 'STEP_CONNECTED_DEVICE';
const STEP_SEND_WIFIINFO = 'STEP_SEND_WIFIINFO';
const STEP_SOFTAP_CONNECTING_AP = 'STEP_SOFTAP_CONNECTING_AP';
const STEP_SOFTAP_SUCCESS = 'STEP_SOFTAP_SUCCESS';
const STEP_SOFTAP_FAILED = 'STEP_SOFTAP_FAILED';
const STEP_INFO = {
  STEP_CONNECTED_AP:"连接AP路由器成功",
  STEP_CONNECTED_DEVICE:"连接设备热点成功",
  STEP_SEND_WIFIINFO:"正在发送WiFi信息",
  STEP_SOFTAP_CONNECTING_AP:"设备正在连接AP",
  STEP_SOFTAP_SUCCESS:"SoftAP配网成功",
  STEP_SOFTAP_FAILED:"SoftAP配网失败"
}
const parseStep = (code)=>{
  return {code: code, message: STEP_INFO[code]}
}
class SoftAP {
  apSSID='';
  apPassword='';
  deviceSSID='ESP_8266';
  devicePassword='ESP8266';
  listenPort='18266';
  tartgetPort='8266';
  tartgetAddress='255.255.255.255';
  msgStrToSend=''
  udpClient;
  waitMills=30e3;
  waitTimeouter;
  mIsInterrupted=false;
  sendDuringMills=1e3;
  sendInterval;
  deviceProductId;
  deviceName;
  wxWiFiCode = {
    12002:'密码错误',
    12003:'连接超时',
    12004:'重复连接',
    12007:'用户拒绝授权连接WiFi'
  };
  onSuccess=(res)=>{}
  onError=(res)=>{}
  onStep=(code)=>{}
  constructor(config){
    config.apSSID ? this.apSSID = config.apSSID:'';
    config.apPassword ? this.apPassword = config.apPassword:'';
    config.deviceSSID ? this.deviceSSID = config.deviceSSID:'';
    config.devicePassword ? this.devicePassword = config.devicePassword:'';
    config.tartgetAddress ? this.tartgetAddress = config.tartgetAddress:'';
    config.tartgetPort ? this.tartgetPort = config.tartgetPort:'';
    config.listenPort ? this.listenPort = config.listenPort:'';
    config.onSuccess ? this.onSuccess = config.onSuccess:'';
    config.onError ? this.onError = config.onError:'';
    config.onStep ? this.onStep = config.onStep:'';
    if( this.apSSID == ''){
      return this.onError(this.packError(101, '配置的WiFi名称不能为空'));
    }
    if (this.deviceSSID == ''){
      return this.onError(this.packError(101, '设备的热点名称不能为空'));
    }
  }
  packError(code, msg, data = null){
    return {code: code, message: msg, data: data};
  }
  start(){
    let _this = this;
    wx.startWifi({
      success: (res) => {
        // 1.连接所需AP，验证信息正确性
        _this._connectAP();
      },
    })
  }
  _backToAPConnection(){
    let _this = this;
    wx.connectWifi({
      SSID: _this.apSSID,
      password: _this.apPassword,
    });
  }
  _connectAP(){
    let _this = this;
    wx.connectWifi({
      SSID: _this.apSSID,
      password: _this.apPassword,
      success: function(apRes){
        wx.getConnectedWifi({
          complete: (result) => {
            if(result.wifi && result.wifi.SSID == _this.apSSID){
              _this.onStep(parseStep(STEP_CONNECTED_AP));
              console.log('connected WIFI-AP',result);
              // 2.连接设备热点，加入局域网
              _this._connectHotspot();
            }else{
              console.log('not connected WIFI-AP',result);
              _this._fail(_this.packError(202, '未能连接到无线AP',result));
            }
          }
        });
      },
      fail: (err)=>{
        console.log('connect WiFi-AP error:', err)
        _this._fail(_this.packError(201, '尝试连接AP失败:'+_this.getWxWiFiCodeStr(err.errCode), err));
      },
      complete: (res)=>{
        
      }
    });
  }
  _connectHotspot(){
    let _this = this;
    wx.connectWifi({
      SSID: _this.deviceSSID,
      password: _this.devicePassword,
      success: (hotRes)=>{
        wx.getConnectedWifi({
          complete: (result) => {
            if(result.wifi && result.wifi.SSID == _this.deviceSSID){
              _this.onStep(parseStep(STEP_CONNECTED_DEVICE));
              console.log('connected Hotspot',result);
              // 3.拼装消息体
              let info = {
                "cmd":'softap-wifi-config',
                "ssid": _this.apSSID,
                "password": _this.apPassword
              };
              _this.msgStrToSend = JSON.stringify(info);
              // 4.初始化UDP并发送UDP报文
              _this._initUDP();
              _this._sendConfig();
            }else{
              console.log('connect Hotsopt failed')
              _this._fail(_this.packError(204, '未能连接到设备热点!'));
            }
          },
        });
      },
      fail:function(err){
        console.log('connect WiFi-Hotsopt error:', err)
        _this._fail(_this.packError(203, '尝试连接设备热点失败:'+_this.getWxWiFiCodeStr(err.errCode), err));
      },
      complete:(res)=>{
      }
    });
  }
  _fail(body){
    this.interrupt();
    // this._backToAPConnection();
    this.onError(body);
  }
  _success(){
    let _this = this;
    this.interrupt();
    this._backToAPConnection();
    this.onSuccess(_this.packError(0, '配网完成', {
      deviceName: _this.deviceName,
      productId: _this.deviceProductId
    }));
  }
  _sendConfig(){
    let _this = this;
    clearTimeout(_this.waitTimeouter);
    _this.waitTimeouter = setTimeout(()=>{
      _this._fail(_this.packError(504, 'Config timeout'));
    }, _this.waitMills)
    _this.onStep(parseStep(STEP_SEND_WIFIINFO));
    clearInterval(_this.sendInterval);
    _this.sendInterval = setInterval(()=>{
      if(_this.mIsInterrupted){
        return clearInterval(_this.sendInterval);
      }
      console.log('send config');
      _this.udpClient.send({
        address: _this.tartgetAddress,
        port: _this.tartgetPort,
        message: _this.msgStrToSend
      })
    },_this.sendDuringMills);
  }
  _initUDP(){
    let _this = this;
    let udpClient = wx.createUDPSocket();
    let port = udpClient.bind(_this.listenPort);
    console.log('listen port',port);
    udpClient.onListening((res)=>{
      console.log('__async_listening', res);
    })
    udpClient.onMessage(_this._handleUDPMessage.bind(this));
    _this.udpClient = udpClient;
  }
  interrupt(){
    console.log('[DEBUG]', 'interrupt!');
    let _this = this;
    _this.mIsInterrupted = true;
    clearInterval(_this.sendInterval);
    clearTimeout(_this.waitTimeouter);
    if(_this.udpClient){
      _this.udpClient.close();
      _this.udpClient = null;
    }
  }
  _parseRecvMsg(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
  }
  _handleUDPMessage(res){
    let _this = this;
    let msg = _this._parseRecvMsg(res.message);
    console.log('receive message:', msg)
    try{
      let recv = JSON.parse(msg);
      // 回应中有设备的ProductID或DeviceName则存储
      if(recv.productId){
        _this.deviceProductId = recv.productId;
      }
      if(recv.deviceName){
        _this.deviceName = recv.deviceName;
      }
      if(recv.cmd == "softap-connected"){ // 配网完成
        /**
         * {"cmd":"softap-connected","productId":"AABBCCEEDD","deviceName":"XXX","ssid":"SSID","password":"12345678"}
         */
        _this.onStep(parseStep(STEP_SOFTAP_SUCCESS));
        _this._success();
      }else if(recv.cmd == "softap-received"){  // 收到配网信息，则设备尝试连接AP
        /**
         * {"cmd":"softap-received","productId":"AABBCCEEDD","deviceName":"XXX","ssid":"SSID","password":"12345678"}
         */
        _this.mIsInterrupted = true;
        _this.onStep(parseStep(STEP_SOFTAP_CONNECTING_AP));
      }else if(recv.cmd == "softap-error"){
        /**
         * {"cmd":"softap-error","msg":"1连接超时|2密码错误|3找不到AP|4连接失败","productId":"AABBCCEEDD","deviceName":"XXX","ssid":"SSID","password":"12345678"}
         */
        _this.onStep(parseStep(STEP_SOFTAP_FAILED));  // 收到设备的连接失败回复
        _this._fail(_this.packError(401, '设备连接AP失败', recv.msg));
        _this._backToAPConnection();
      }
    }catch(exception){
      return console.warn('无法解析收到的UDP消息：', res, exception);
    }
  }
  getWxWiFiCodeStr(code){
    let errMsg = '未知错误';
    if(this.wxWiFiCode[code]){
      errMsg = this.wxWiFiCode[code];
    }
    return errMsg;
  }
}
module.exports={
  SoftAP: SoftAP
}