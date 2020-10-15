//index.js

const Esptouch = require("../../esptouch/Esptouch")

//获取应用实例
const app = getApp()

Page({
  data: {
    motto: '请填写并按下按钮',
    tips: '',
    wifiList:[{SSID:"+暂未获取WIFi列表+",BSSID:''}],
    wifiIndex:-1,
    esp:null,
    currentBssid:"",
    ssid:"",
    bssid:"",
    password:"",
    devices:[]
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function () {
    let _this = this;
  },
  onShow: function(){
    let _this = this;
    wx.startWifi({
      success: (res) => {
        console.log('start wifi',res);
        wx.getConnectedWifi({
          success: function(res){
            console.log(res);
            _this.setData({
              ssid: res.wifi.SSID,
              bssid: res.wifi.BSSID,
              currentBssid:res.wifi.BSSID,
            })
          },
          fail:function(err){
            console.log('getConnectedWifi fail',err);
            _this.setData({tips:"请先打开WiFi并连接到需要配置的信号"})
          },
          complete:function(res){
            console.log('cmplt',res);
          }
        });
      },
      fail: (err)=>{
        console.log('startWifi fail',err);
        _this.setData({tips:"请先打开WiFi并连接到需要配置的信号"})
      }
    })
  },
  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  getWiFiList:function(e){
    let _this = this;
    wx.getWifiList({
      success: (res) => {
        console.log('getWifiList',res);
        wx.onGetWifiList((result) => {
          console.log('onGetWifiList', result);
          _this.setData({wifiList: result.wifiList});
        });
      },
    })
  },
  selectWifi:function(e){
    let _this = this;
    let index = e.currentTarget.dataset.index;
    _this.setData({wifiIndex:index});
    let wifiInfo = _this.data.wifiList[index];
    _this.setData({
      bssid: wifiInfo.BSSID,
      ssid:wifiInfo.SSID
    });
  },
  setBssid:function(e){
    this.setData({
      bssid: e.detail.value
    })
  },
  setPassword:function(e){
    this.setData({
      password: e.detail.value
    })
  },
  preDoing:function(){
    let _this = this;
    if(_this.data.currentBssid != _this.data.bssid){
      wx.connectWifi({
        SSID: _this.data.ssid,
        password: _this.data.password,
        success (res) {
          console.log(res.errMsg);
          _this.setData({currentBssid: _this.data.bssid});
        }
      })
    }else{
      this.doConfig();
    }
  },
  doConfig:function(){
    let _this = this;
    _this.setData({motto:"准备中..."})
    if(this.data.bssid == ""){
      wx.showToast({
        title: 'bssid不能为空',
        duration: 1000,
        icon: 'none',
        image: null,
        mask: true,
        success: (res) => {},
        fail: (res) => {},
        complete: (res) => {},
      })
      return;
    }
    // let task = new Esptouch.Task(this.data.ssid, this.data.bssid,this.data.password);
    let options = {
      ssid: this.data.ssid, 
      bssid: this.data.bssid, 
      password: this.data.password,
      debug: true,
      onSuccess: function(res){
        console.log(res);
        _this.data.devices.push(res)
        _this.setData({devices:_this.data.devices});
        console.log(_this.data.devices);
        _this.setData({motto:"配网结束!"})
      },
      onError: (error)=>{
        console.log(error);
        _this.setData({motto:"配网结束!".concat(error.errMsg)});
      }
    }
    let task = new Esptouch.Task(options);
    this.setData({esp: task});
    console.log('Smartconfig start');
    task.start();
    console.log('smarconfig running out.')
    _this.setData({motto:"配网中..."})
  },
  doStop:function(){
    let _this = this;
    if(this.data.esp == null) return;
    this.data.esp.interrupt();
    _this.setData({motto:"已终止!"})
  }
})
