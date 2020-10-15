//index.js

const Esptouch = require("../../esptouch/Esptouch")

//获取应用实例
const app = getApp()

Page({
  data: {
    motto: '请填写并按下按钮',
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    esp:null,
    ssid:"wihidden2",
    bssid:"00:1f:7a:59:4b:00",
    password:"12345678",
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
            })
          },
          fail:function(err){
            console.log(err);
          },
          complete:function(res){
            console.log('cmplt',res,'wifiinfo', _this.data);
          }
        })
      },
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
