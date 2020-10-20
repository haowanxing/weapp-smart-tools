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
  deviceSSID='4006500311';
  devicePassword='4006500311';
  listenPort='18266';
  tartgetPort='8266';
  tartgetAddress='192.168.4.2';
  msgStrToSend=''
  udpClient;
  waitMills=30e3;
  waitTimeouter;
  mIsInterrupted=false;
  sendDuringMills=1e3;
  sendInterval;
  deviceProductId;
  deviceName;
  onSuccess=(res)=>{}
  onError=(res)=>{}
  onStep=(code)=>{}
  constructor(config){
    config.apSSID ? this.apSSID = config.apSSID:'';
    config.apPassword ? this.apPassword = config.apPassword:'';
    config.deviceSSID ? this.deviceSSID = config.deviceSSID:'';
    config.devicePassword ? this.devicePassword = config.devicePassword:'';
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
    clearTimeout(_this.waitTimeouter);
    _this.waitTimeouter = setTimeout(()=>{
      _this._fail(_this.packError(504, 'Config timeout'));
    }, _this.waitMills)
    wx.startWifi({
      success: (res) => {
        let eCode = {
          12002:'密码错误',
          12003:'连接超时',
          12004:'重复连接',
          12007:'用户拒绝授权连接WiFi'
        };
        // 1.连接所需AP，验证信息正确性
        wx.connectWifi({
          SSID: _this.apSSID,
          password: _this.apPassword,
          success: function(apRes){
            _this.onStep(parseStep(STEP_CONNECTED_AP));
            // 2.连接设备热点，加入局域网
            wx.connectWifi({
              SSID: _this.deviceSSID,
              password: _this.devicePassword,
              success: (res)=>{
                _this.onStep(parseStep(STEP_CONNECTED_DEVICE));
                console.log('connected WIFI-AP',res);
                // 3.拼装消息体
                let info = {
                  "cmd":'softap-wifi-config',
                  "ssid": _this.apSSID,
                  "password": _this.apPassword
                };
                _this.msgStrToSend = JSON.stringify(info);
                // 4.初始化UDP并发送UDP报文
                _this.initUDP();
                _this._sendConfig();
              },
              fail:function(err){
                console.log('connect WiFi error:', err)
                _this._fail(_this.packError(202, '连接设备热点失败'));
              }
            });
          },
          fail: (err)=>{
            console.log('connect WiFi-AP error:', err)
            let errMsg = '未知原因';
            if(eCode[err.errCode]){
              errMsg = eCode[err.errCode];
            }
            _this._fail(_this.packError(201, '连接AP失败:'+errMsg, err));
          }
        });
        
      },
    })
  }
  backToAPConnection(){
    let _this = this;
    wx.connectWifi({
      SSID: _this.apSSID,
      password: _this.apPassword,
    });
  }
  _fail(body){
    this.interrupt();
    this.backToAPConnection();
    this.onError(body);
  }
  _success(){
    let _this = this;
    this.interrupt();
    this.backToAPConnection();
    this.onSuccess(_this.packError(0, '配网完成', {
      deviceName: _this.deviceName,
      productId: _this.productId
    }));
  }
  _sendConfig(){
    let _this = this;
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
  initUDP(){
    let _this = this;
    let udpClient = wx.createUDPSocket();
    let port = udpClient.bind(_this.listenPort);
    console.log('listen port',port);
    udpClient.onListening((res)=>{
      console.log('__async_listening', res);
    })
    udpClient.onMessage(_this.handleUDPMessage.bind(this));
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
  handleUDPMessage(res){
    let _this = this;
    let msg = _this._parseRecvMsg(res.message);
    console.log('receive message:', msg)
    let recv = JSON.parse(msg);
    // 回应中有设备的ProductID或DeviceName则存储
    if(recv.productId){
      _this.deviceProductId = recv.productId;
    }
    if(recv.deviceName){
      _this.deviceName = recv.deviceName;
    }
    if(recv.cmd == "softap-connected"){ // 配网完成
      _this.onStep(parseStep(STEP_SOFTAP_SUCCESS));
      _this._success();
    }else if(recv.cmd == "softap-received"){  // 收到配网信息，则设备尝试连接AP
      _this.onStep(parseStep(STEP_SOFTAP_CONNECTING_AP));
    }else if(recv.cmd == "softap-error"){
      _this.onStep(parseStep(STEP_SOFTAP_FAILED));  // 收到设备的连接失败回复
      _this._fail(_this.packError(401, '设备连接AP失败', recv.msg));
    }
  }
}
module.exports={
  SoftAP: SoftAP
}