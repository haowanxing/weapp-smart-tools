//index.js

//获取应用实例
const app = getApp()

Page({
  data: {
  },
  onLoad: function () {
    let _this = this;
  },
  onShow: function(){
    let _this = this;
  },
  //事件处理函数
  toSmartconfig: function() {
    wx.navigateTo({
      url: '../smartconfig/index'
    })
  },
  toSoftAP: function() {
    wx.navigateTo({
      url: '../softap/index'
    })
  },
})
