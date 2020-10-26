const { formatTime } = require("../../utils/util");
const STORE_KEY = 'conter_click_data';
// pages/counter/click.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    num_in:0,
    num_out:0,
    color:['#ff4a4a','#0095ff','#ff8d00'],
    record: new Array()
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    try{
      let record = wx.getStorageSync(STORE_KEY);
      if(record){
        let _num_in = 0;
        let _num_out = 0;
        for(let i in record){
          let o = record[i];
          if(o.type == 1){
            _num_in += o.num;
          }else if(o.type == 0){
            _num_out += o.num;
          }
        }
        this.setData({record:record,num_in:_num_in,num_out:_num_out});
      }else{
        this.setData({record:[]});
      }
    }catch(e){}
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  addIn:function(e){
    let num = parseInt(e.currentTarget.dataset.num);
    this.data.num_in+=num;
    this.setData({num_in: this.data.num_in});
    this.pushR({num:num, type:1});
    wx.vibrateShort({
      success: (res) => {},
    });
  },
  addOut:function(e){
    let num = parseInt(e.currentTarget.dataset.num);
    this.data.num_out+=num;
    this.setData({num_out: this.data.num_out});
    this.pushR({num:num, type:0});
    wx.vibrateShort({
      success: (res) => {},
    });
  },
  delIn:function(e){
    let num = parseInt(e.currentTarget.dataset.num);
    this.data.num_in-=num;
    this.setData({num_in: this.data.num_in});
    this.pushR({num:-num, type:1});
    wx.vibrateShort({
      success: (res) => {},
    });
  },
  delOut:function(e){
    let num = parseInt(e.currentTarget.dataset.num);
    this.data.num_out-=num;
    this.setData({num_out: this.data.num_out});
    this.pushR({num:-num, type:0});
    wx.vibrateShort({
      success: (res) => {},
    });
  },
  pushR: function(data){
    data.time = formatTime(this.time());
    let record = this.data.record;
    record.unshift(data);
    this.setData({record:record});
    wx.setStorage({
      data: record,
      key: STORE_KEY,
    });
  },
  clear: function(){
    wx.removeStorage({
      key: STORE_KEY,
    });
    this.setData({record:[],num_in:0,num_out:0});
  },
  cleaner: function(){
    let _this = this;
    wx.showModal({
      title:'您即将清空全部操作记录！',
      content:'数据删除后将无法进行找回。',
      cancelColor:'#04BE02',
      confirmColor:'#FF7F00',
      success: function(res){
        if(res.confirm){
          _this.clear();
        }else if(res.cancel){

        }
      }
    });
  },
  copy: function(){
    let data = this.data.record.map((v)=>{
      return v.time+" "+(v.type==1?"进":"出")+" "+v.num;
    }).join("\n");
    data = "进："+this.data.num_in+" 出："+this.data.num_out+"\n" + data;
    wx.setClipboardData({
      data: data,
      success: function(res){
        wx.showToast({
          title: '复制成功',
        });
      }
    });
  },
  time:function(){
    return new Date();
  }
})