//index.js

const softap = require("../../softap/softap");

//获取应用实例
const app = getApp()


Page({
  data: {
    motto: 'Hello World',
    apssid:app.globalData.config.apSsid,
    appsw:app.globalData.config.apPassword,
    devicessid:app.globalData.config.softApSsid,
    devicepsw:app.globalData.config.softApPassword,
    deviceList:[],
    progress:null,
    step:0,
    doRound:1
  },
  onLoad: function () {
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
  onShow: function () {
    let _this = this;
    
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
  inputROUND: function(e){
    this.setData({doRound:e.detail.value})
  },
  start: function(e){
    let _this = this;
    let m = new softap.SoftAP({
      apSSID:_this.data.apssid,
      apPassword:_this.data.appsw,
      deviceSSID:_this.data.devicessid,
      devicePassword:_this.data.devicepsw,
      verifyAP: false,
      onStep: function(step){
        console.log('[STEP]', step);
        _this.setData({motto:'配网中...'+step.message});
        switch(step.code){
          case "STEP_CONNECTED_AP":
            _this.setData({step:1});
            break;
          case "STEP_CONNECTED_DEVICE":
            _this.setData({step:2});
            break;
          case "STEP_SEND_WIFIINFO":
            _this.setData({step:3});
            break;
          case "STEP_SOFTAP_CONNECTING_AP":
            _this.setData({step:4});
            break;
          case "STEP_SOFTAP_SUCCESS":
            _this.setData({step:5});
            break;
          case "STEP_SOFTAP_FAILED":
            _this.setData({step:6});
            break;
        }
      },
      onSuccess: function(res){
        console.log('app', res);
        let list = _this.data.deviceList;
        list.push({deviceName: res.data.deviceName, productId: res.data.productId})
        let info = res.data.deviceName + " " + res.data.productId;
        _this.setData({motto:'配网成功：'+info,progress:null,deviceList: list});
        _this.checkRound();
      },
      onError: function(err){
        console.log('app', err);
        _this.setData({motto:'配网失败：'+err.message, progress:null});
        _this.checkRound();
      }
    });
    _this.setData({motto:'配网中',progress: m});
    m.start();
    // _this.setData({motto:'配网结束'});
  },
  stop: function(){
    if(this.data.progress){
      this.data.progress.interrupt();
      this.setData({motto:'已终止',progress:null});
    }
  },
  checkRound: function(){
    let _this = this;
    if(this.data.doRound-1 > 0){
      console.log("round:", this.data.doRound-1,'当前循环: '+(_this.data.doRound-1));
      _this.setData({motto:'当前循环: '+(_this.data.doRound-1)});
      setTimeout(()=>{
        _this.setData({doRound: this.data.doRound-1});
        _this.start();
      }, 3000);
    }
  }
})
