//index.js

//获取应用实例
const app = getApp()

Page({
  data: {
    colorArr: ["#EE2C2C", "#ff7070", "#EEC900", "#4876FF", "#ff6100",
      "#7DC67D", "#E17572", "#7898AA", "#C35CFF", "#33BCBA", "#C28F5C",
      "#FF8533", "#6E6E6E", "#428BCA", "#5cb85c", "#FF674F", "#E9967A",
      "#66CDAA", "#00CED1", "#9F79EE", "#CD3333", "#FFC125", "#32CD32",
      "#00BFFF", "#68A2D5", "#FF69B4", "#DB7093", "#CD3278", "#607B8B"],
    boxList:[
      {title:"SmartConfig配网",url:"../smartconfig/index"},
      {title:"SoftAP配网",url:"../softap/index"},
      {title:"开发中...",url:""},
      {title:"开发中...",url:""},
      {title:"开发中...",url:""}
    ],
  },
  onLoad: function () {
    let _this = this;
  },
  onShow: function(){
    let _this = this;
  },
  //事件处理函数
  boxJump:function(e){
    let data = e.currentTarget.dataset;
    if(data.url){
      wx.navigateTo({
        url: data.url
      })
    }else{
      wx.showToast({
        title: data.title,
      })
    }
  },
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
