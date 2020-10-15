var ErrorConstant = function(e){
  e.SMARTCONFIG_ERROR_ALREADY_EXECUTED = 'SMARTCONFIG_ERROR_ALREADY_EXECUTED';
  e.SMARTCONFIG_ERROR_TIMEOUT = 'SMARTCONFIG_ERROR_TIMEOUT';
  e.SMART_CONFIG_ERROR = 'SMART_CONFIG_ERROR';
  var msg = {};
  msg[e.SMARTCONFIG_ERROR_ALREADY_EXECUTED] = '已经启动了一个配网流程',
  msg[e.SMARTCONFIG_ERROR_TIMEOUT] = 'SmartConfig配网超时',
  msg[e.SMART_CONFIG_ERROR] = 'SmartConfig配网失败';
  e.msg = msg;
  e.getErrorObject = (c)=>{
    return {code:c,errMsg:msg[c]};
  }
}
var GenSpecBytes = num => {
  return new Array(num).fill(1);
}
var Crc8Update = buffer => {
  const CRC_POLYNOM = 0x8c
  const CRC_INITIAL = 0x00
  var crcTable = [];
  for (let dividend = 0;dividend< 256;dividend++){
    let remainder = dividend
    for (let bit = 0; bit < 8; bit++){
      if ((remainder & 0x01) != 0){
        remainder = (remainder >> 1) ^ CRC_POLYNOM
      }else{
        remainder >>= 1
      }
    }
    crcTable[dividend] = remainder
  }
  let value = CRC_INITIAL
  for( let i = 0; i < buffer.length; i++ ){
    let v = (typeof buffer == "string")? buffer.charCodeAt(i): buffer[i];
    let data = v ^ value
    value = crcTable[data&0xff]^(value << 8)
  }
  return (value&0xff);
}
var SplitUint8To2Bytes = char =>{
  return [(char & 0xff) >> 4, char & 0x0f]
}
var Combine2BytesToOne = (high, low) => {
  return high<<4 | low
}
var CovertByte2Uint8 = b => {
  return (b & 0xff)
}
var Combine2bytesToU16 = (h, l) => {
  let highU8 = CovertByte2Uint8(h)
	let lowU8 = CovertByte2Uint8(l)
	return highU8<<8 | lowU8
}
var String2Bytes = str => {
  let arr = [];
  for(let i = 0; i < str.length; i++){
    arr[i] = str.charCodeAt(i);
  }
  return arr;
}
var Sleep = function (e) {
  return new Promise((function (t) {
    return setTimeout(t, e)
  }))
}
class Log {
  static LEVEL_DEBUG = 0;
  static LEVEL_INFO = 1;
  static LEVEL_WARN = 2;
  static LEVEL_ERROR = 3;
  static LEVEL_FATAL = 4;
  level = Log.LEVEL_ERROR;
  logger = [
    console.log,
    console.info,
    console.warn,
    console.error,
    console.log
  ];
  constructor(){
    this.level = Log.LEVEL_ERROR;
  }
  setLevel(lv){
    this.level = lv;
  }
  setLogger(lg){
    lg.debug !== void 0 ? this.logger[Log.LEVEL_DEBUG] = lg.debug: '';
    lg.info !== void 0 ? this.logger[Log.LEVEL_INFO] = lg.info: '';
    lg.warn !== void 0 ? this.logger[Log.LEVEL_WARN] = lg.warn: '';
    lg.error !== void 0 ? this.logger[Log.LEVEL_ERROR] = lg.error: '';
    lg.fatal !== void 0 ? this.logger[Log.LEVEL_FATAL] = lg.fatal: '';
  }
  log(s){
    this.message(Number.MAX_SAFE_INTEGER, s);
  }
  debug(s){
    this.message(Log.LEVEL_DEBUG, ['[DEBUG]'].concat(Array.prototype.slice.call(arguments)));
  }
  info(s){
    this.message(Log.LEVEL_INFO, ['[INFO]'].concat(Array.prototype.slice.call(arguments)));
  }
  warn(s){
    this.message(Log.LEVEL_WARN, ['[WARN]'].concat(Array.prototype.slice.call(arguments)));
  }
  error(s){
    this.message(Log.LEVEL_ERROR, ['[ERROR]'].concat(Array.prototype.slice.call(arguments)));
  }
  fatal(s){
    this.message(Log.LEVEL_FATAL, ['[FATAL]'].concat(Array.prototype.slice.call(arguments)));
  }
  message(lv, s){
    if(lv >= this.level){
      if(this.logger[lv] !== void 0){
        this.logger[lv].apply(null, s);
      }else{
        console.log(s);
      }
    }
  }
}
var logger = new Log();
logger.setLevel(0);
class EsptouchGenerator {
  mGcBytes2 = [];
  mDcBytes2 = [];
  constructor(apSsid, apBssid, apPassword, ipAddress){
    let guideCodeU81 = [515,514,513,512];
    guideCodeU81.forEach((val,idx,arr)=>{
      this.mGcBytes2[idx] = GenSpecBytes(val)
    })
    let dc = new DatumCode(apSsid, apBssid, apPassword, ipAddress)
    let dcU81 = dc.GetU8s();
    for(let i = 0; i<dcU81.length; i++){
      this.mDcBytes2[i] = GenSpecBytes(dcU81[i])
    }
  }
  getGcBytes(){
    return this.mGcBytes2;
  }
  getDcBytes(){
    return this.mDcBytes2;
  }
}
class DatumCode {
  EXTRA_LEN      = 40
  EXTRA_HEAD_LEN = 5
  mDatacodes = []
  constructor(apSsid, apBssid, apPassword, ipAddress){
    if(typeof apSsid == "string"){
      apSsid = String2Bytes(apSsid);
    }
    if(typeof apPassword == "string"){
      apPassword = String2Bytes(apPassword);
    }
    if(typeof apBssid == "string"){
      apBssid = apBssid.split(":").map((v)=>{return parseInt("0x"+v.toString(16));});
    }
    if(typeof ipAddress == "string"){
      ipAddress = ipAddress.split(".").map((v)=>{return parseInt(v);});
    }
    var totalXor = 0;
    var apPwdLen = apPassword.length;
    var apSsidCrc = Crc8Update(apSsid);
    var apBssidCrc = Crc8Update(apBssid);
    var apSsidLen = apSsid.length;
    var ipLen = ipAddress.length;
    var totalLen = this.EXTRA_HEAD_LEN + ipLen + apPwdLen + apSsidLen
    //build data codes
    this.mDatacodes.push(new DataCode(totalLen, 0));
    totalXor ^= totalLen;
    this.mDatacodes.push(new DataCode(apPwdLen, 1));
    totalXor ^= apPwdLen;
    this.mDatacodes.push(new DataCode(apSsidCrc, 2));
    totalXor ^= apSsidCrc;
    this.mDatacodes.push(new DataCode(apBssidCrc, 3));
    totalXor ^= apBssidCrc;
    // ESPDataCode 4 is null
    for(let i = 0; i< ipLen;i ++){
      let c = CovertByte2Uint8(ipAddress[i]);
      totalXor ^= c
      this.mDatacodes.push(new DataCode(c, i+ this.EXTRA_HEAD_LEN))
    }
    for(let i = 0; i< apPassword.length;i ++){
      let c = CovertByte2Uint8(apPassword[i]);
      totalXor ^= c
      this.mDatacodes.push(new DataCode(c, i+ this.EXTRA_HEAD_LEN + ipLen))
    }
    for(let i = 0; i< apSsid.length;i ++){
      let c = CovertByte2Uint8(apSsid[i]);
      totalXor ^= c
      this.mDatacodes.push(new DataCode(c, i+ this.EXTRA_HEAD_LEN + ipLen + apPwdLen))
    }
    // add total xor last
    for( let i=0; i< this.mDatacodes.length; i++){
      if( i == 4 ){
        this.mDatacodes.splice(i,0, new DataCode(totalXor, 4));
      }
    }
    // add bssid
    let bssidInsertIndex = this.EXTRA_HEAD_LEN;
    for( let i = 0; i < apBssid.length; i++ ){
      let index = totalLen + i;
      let c = CovertByte2Uint8(apBssid[i]);
      let dc = new DataCode(c, index)
      if (bssidInsertIndex >= this.mDatacodes.length) {
        this.mDatacodes.push(dc)
      } else {
        for (let k = 0; k < this.mDatacodes.length;k++){
          if (k == bssidInsertIndex) {
            this.mDatacodes.splice(k+1,0, dc)
            break
          }
        }
      }
      bssidInsertIndex += 4
    }
  }
  GetBytes(){
    let datumCode = new Array(this.mDatacodes.length + 6).fill(0);
    let index = 0;
    for (let i = 0; i<this.mDatacodes.length; i++){
      if( this.mDatacodes[i] instanceof DataCode){
        let dcBytes = this.mDatacodes[i].GetBytes()
        dcBytes.forEach((v)=>{
          datumCode[index] = v;
          index++;
        });
      }
    }
    return datumCode;
  }
  GetU8s(){
    let dataBytes = this.GetBytes()
    let bLen = dataBytes.length / 2;
    let dataU8s = new Array(bLen).fill(0);
    for( let i = 0; i< bLen; i++){
      let high = dataBytes[i*2];
      let low = dataBytes[i*2+1];
      dataU8s[i] = Combine2bytesToU16(high, low) + this.EXTRA_LEN;
    }
    return dataU8s;
  }
}
class DataCode {
  DATA_CODE_LEN = 6
  mSeqHeader 
	mDataHigh  
	mDataLow   
	mCrcHigh   
  mCrcLow
  constructor(u8, index){
    let dataBytes = SplitUint8To2Bytes(u8);
    let crcValue = Crc8Update([u8, index]);
    let crcBytes = SplitUint8To2Bytes(crcValue);
    this.mSeqHeader = index;
    this.mDataHigh = dataBytes[0];
    this.mDataLow = dataBytes[1];
    this.mCrcHigh = crcBytes[0];
    this.mCrcLow = crcBytes[1];
  }
  GetBytes() {
    let dataBytes = new Array(this.DATA_CODE_LEN).fill(0);
    dataBytes[0] = 0x00
    dataBytes[1] = Combine2BytesToOne(this.mCrcHigh, this.mDataHigh)
    dataBytes[2] = 0x01
    dataBytes[3] = this.mSeqHeader
    dataBytes[4] = 0x00
    dataBytes[5] = Combine2BytesToOne(this.mCrcLow, this.mDataLow)
    return dataBytes
  }
}
class UDPSocket {
  client;
  logger;
  constructor(listen=18266,logger=console){
    this.logger = logger !== void 0?logger:console;
    this.client = wx.createUDPSocket();
    this.client.onError((error) => {
      this.logger.error(error)
    });
    this.client.onListening(()=>{
      this.logger.info(" __listen")
    });
    let port = this.client.bind(listen);
    this.logger.info("Port:", port);
  }
  getClient(){
    return this.client;
  }
  handleMsg(obj){
    this.client.onMessage((result)=>{
      console.log("[Socket] result:",result);
      obj.receiveMsg(result);
    });
  }
  async sendData(data,host,port,offset,len,timeout){
    for(let i = offset; i< offset+len;i++){
      if(data[i].length == 0){
        continue;
      }
      let option = {
        address: host,
        message: data[i].join(""),
        port: port,
      }
      this.client.send(option);
      await Sleep(timeout);
    }
  }
  sendDataSideBySide(data,host,port,offset,len,timeout,fn){
    let _this = this;
    if( len === 1){
      // logger.debug('send:'.concat(data[offset].length));
      return _this.client.send({
        address: host,
        port: port,
        message: data[offset].join("")
      }), fn();
    }
    setTimeout((function () {
      var c = Math.min(data.length - 1, offset + 1),
      u = c >= data.length - 1 ? 1 : len - 1;
      // logger.debug('send:'.concat(data[offset].length));
      _this.client.send({
        address: host,
        port: port,
        message: data[offset].join("")
      }), _this.sendDataSideBySide(data, host, port, c, u, timeout, fn)
    }), timeout);
  }
}
class EsptouchTask{
  mApSsid;
  mApPassword;
  mApBssid;
  mtargetHostName = "255.255.255.255";
  mtargetPort = 7001;
  mListenPort = 18266;
  mTimeoutGuideCodeMillisecond = 2e3;
	mTimeoutDataCodeMillisecond = 4e3;
	mTimeoutTotalCodeMillisecond = this.mTimeoutGuideCodeMillisecond + this.mTimeoutDataCodeMillisecond;
	mWaitUdpSendingMillisecond = 45e3;
	mIntervalGuideCodeMillisecond = 8;
  mIntervalDataCodeMillisecond = 8;
  mIsInterrupt = false;
  mIsExecuted = false;
  mSetTimeoutProgress = 0;
  generator;
  socketClient;
  resultData;
  onSuccess = ()=>{}
  onError = ()=>{}
  constructor(options){
    this.mApSsid = options.ssid? options.ssid:'';
    this.mApPassword = options.password? options.password:'';
    this.mApBssid = options.bssid?options.bssid:'';
    this.onSuccess = options.onSuccess?options.onSuccess:()=>{};
    this.onError = options.onError?options.onError:()=>{};
    this.generator = new EsptouchGenerator(this.mApSsid, this.mApBssid, this.mApPassword, "192.168.0.1");
    this.socketClient = new UDPSocket(this.mListenPort, logger);
    this.socketClient.handleMsg(this);
  }
  receiveMsg(res){
    logger.debug('receive from',res.remoteInfo.address,res.message);
    let msg = new Uint8Array(res.message);
    if(msg.length == 11){
      let oneByte = msg[0];
      if(oneByte == (9+this.mApSsid.length+this.mApPassword.length)){
        this.interrupt();
        let mac = msg.slice(1,7);
        let macArr = [];
        for(let i in mac){
          macArr[i] = mac[i].toString(16);
        }
        this.resultData = {
          mac: macArr.join(':'),
          ip: msg.slice(7).join('.')
        };
        // console.log('配网成功',this.resultData);
        this.onSuccess(this.getResult());
      }
    }
  }
  interrupt(){
    clearTimeout(this.mSetTimeoutProgress);
    this.mIsInterrupt = true;
    this.socketClient.getClient().close();
  }
  getResult(){
    return this.resultData;
  }
  start(){
    if(this.mIsExecuted){
      ErrorConstant(this.ErrorCode || (this.ErrorCode = {}));
      return this.onError(_this.ErrorCode.getErrorObject(this.ErrorCode.SMARTCONFIG_ERROR_ALREADY_EXECUTED))
    }
    this.mIsExecuted = true;
    if("android" !== wx.getSystemInfoSync().platform){
      this.startInPromise()
    }else{
      this.startInNoPromise()
    }
  }
  async startInPromise(){
    let GcData = this.generator.getGcBytes();
    let DcData = this.generator.getDcBytes();
    let startTime = (new Date()).getTime();
    let currentTime = startTime;
    let lastTime = currentTime-this.mTimeoutTotalCodeMillisecond;
    let index = 0;
    logger.info('start smartconfig in promise');
    while(!this.mIsInterrupt){
      if(currentTime-lastTime >= this.mTimeoutTotalCodeMillisecond){
        logger.info("send gc code");
        while(!this.mIsInterrupt && (new Date()).getTime() - currentTime < this.mTimeoutGuideCodeMillisecond){
          await this.socketClient.sendData(GcData,this.mtargetHostName, this.mtargetPort, 0, GcData.length,this.mIntervalGuideCodeMillisecond)
          // check whether the udp is send enough time
          if((new Date()).getTime() - startTime > this.mWaitUdpSendingMillisecond){
            break;
          }
        }
        lastTime = currentTime;
      }else{
        await this.socketClient.sendData(DcData, this.mtargetHostName, this.mtargetPort, index, 3, this.mIntervalDataCodeMillisecond);
        index = (index + 3) % DcData.length;
      }
      currentTime = (new Date()).getTime();
      // check whether the udp is send enough time
      if( currentTime - startTime > this.mWaitUdpSendingMillisecond){
        ErrorConstant(this.ErrorCode || (this.ErrorCode = {}));
        this.onError(this.ErrorCode.getErrorObject(this.ErrorCode.SMARTCONFIG_ERROR_TIMEOUT));
        this.interrupt();
        break;
      }
    }
    return this.getResult();
  }
  async startInNoPromise(){
    let _this = this;
    let GcData = this.generator.getGcBytes();
    let DcData = this.generator.getDcBytes();
    let startTime = (new Date()).getTime();
    let lastTime = startTime-this.mTimeoutTotalCodeMillisecond;
    let index = 0;
    logger.info('start smartconfig in no promise');
    function a(){
      if (!_this.mIsInterrupt && new Date().getTime() - startTime < _this.mTimeoutGuideCodeMillisecond){
        return _this.socketClient.sendDataSideBySide(GcData, _this.mtargetHostName, _this.mtargetPort, 0, GcData.length, _this.mIntervalGuideCodeMillisecond, a);
      }
      c();
    }
    function c(){
      if (_this.mIsInterrupt){
        logger.debug('progress interrupted');
      }else{
        if(startTime - lastTime >= _this.mTimeoutTotalCodeMillisecond){
          logger.info("send gc code");
          a();
          lastTime = startTime;
        }else{
          _this.socketClient.sendDataSideBySide(DcData, _this.mtargetHostName, _this.mtargetPort, index, 3, _this.mIntervalDataCodeMillisecond, c);
          index = (index + 3) % DcData.length;
        }
        startTime = (new Date()).getTime();
      }
    }
    c();
    clearTimeout(this.mSetTimeoutProgress);
    this.mSetTimeoutProgress = setTimeout(function(){
      ErrorConstant(this.ErrorCode || (this.ErrorCode = {}));
      _this.onError(this.ErrorCode.getErrorObject(this.ErrorCode.SMARTCONFIG_ERROR_TIMEOUT));
      _this.interrupt()
    }, _this.mWaitUdpSendingMillisecond);
  }
}

module.exports = {
  Generator: EsptouchGenerator,
  UDPSocket: UDPSocket,
  Task: EsptouchTask
}