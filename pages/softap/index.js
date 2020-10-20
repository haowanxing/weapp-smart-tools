//index.js

const softap = require("../../softap/softap");

//获取应用实例
const app = getApp()


Page({
  data: {
    motto: 'Hello World',
    apssid:'wihidden2',
    appsw:'12345678',
    devicessid:'4006500311',
    devicepsw:'4006500311'
  },
  onLoad: function () {
    let _this = this;
    
  },
  onShow: function () {
    let _this = this;
    wx.startWifi({
      success: (res) => {
        wx.getConnectedWifi({
          success: (result) => {
            console.log(result)
            _this.setData({apssid:result.wifi.SSID})
          },
        })
      },
    })
  },
  inputAPSSID: function(e){
    this.setData({apssid:e.detail.value})
  },
  inputAPPSW: function(e){
    this.setData({appsw:e.detail.value})
  },
  inputDEVICESSID: function(e){
    this.setData({devicessid:e.detail.value})
  },
  inputDEVICEPSW: function(e){
    this.setData({devicepsw:e.detail.value})
  },
  start: function(e){
    let _this = this;
    let m = new softap.SoftAP({
      apSSID:_this.data.apssid,
      apPassword:_this.data.appsw,
      deviceSSID:_this.data.devicessid,
      devicePassword:_this.data.devicepsw,
      onStep: function(step){
        console.log('[STEP]', step);
        _this.setData({motto:'配网中...'+step.message});
      },
      onSuccess: function(res){
        console.log('app', res);
        _this.setData({motto:'配网成功'+res.message});
      },
      onError: function(err){
        console.log('app', err);
        _this.setData({motto:'配网失败'+err.message});
      }
    });
    _this.setData({motto:'配网中'});
    m.start();
    // _this.setData({motto:'配网结束'});
  },
})
