//app.js
App({
  onLaunch: function () {
    // 展示本地存储能力
    // var logs = wx.getStorageSync('logs') || []
    // logs.unshift(Date.now())
    // wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
        if (!res.authSetting['scope.userLocation']){
          wx.authorize({
            scope: 'scope.userLocation',
            success () {
            }
          })
        }
      }
    })
    let accountInfo = wx.getAccountInfoSync();
    this.globalData.accountInfo = accountInfo;
    this.globalData.config = this.globalData.defaultConfig[accountInfo.miniProgram.envVersion];
  },
  globalData: {
    accountInfo:null,
    userInfo: null,
    config:{
      apSsid:"",
      apPassword:"",
      softApSsid:"",
      softApPassword:""
    },
    defaultConfig:{
      develop:{
        apSsid:"jiajiajia",
        apPassword:"400302100",
        softApSsid:"ESP_SOFTAP",
        softApPassword:"12345678"
      },
      trial:{
        apSsid:"jiajiajia",
        apPassword:"400302100",
        softApSsid:"4006500311",
        softApPassword:"4006500311"
      },
      release:{
        apSsid:"",
        apPassword:"",
        softApSsid:"",
        softApPassword:""
      }
    }
  }
})