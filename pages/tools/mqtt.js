// const mqtt = require("../../utils/mqtt.min.js")
// var mqtt = require("mqtt")
import * as mqtt from "mqtt"
import { formatTime } from "../../utils/util.js"

Page({

  /**
   * 页面的初始数据
   */
  data: {
    client: null,
    connected: false,       // 连接状态
    connecting: false,      // 连接中
    brokerUrl: 'wxs://widash-qps.wiwide.cn:8084/mqtt',
    username: 'guest',
    password: 'guest',
    topic: '',              // 订阅用 topic
    subscribeList: [],      // 已订阅 topic 列表
    pubTopic: '',           // 发布用 topic
    pubMessage: '',         // 发布内容
    messages: [],           // 收到的消息记录
    maxMessages: 200        // 消息记录上限，避免无限增长
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    // 页面卸载时确保断开连接，释放资源
    if (this.data.client) {
      this.data.client.end(true);
    }
  },

  setHost: function (e) {
    this.setData({ brokerUrl: e.detail.value });
  },
  setUsername: function (e) {
    this.setData({ username: e.detail.value });
  },
  setPassword: function (e) {
    this.setData({ password: e.detail.value });
  },
  setTopic: function (e) {
    this.setData({ topic: e.detail.value });
  },
  setPubTopic: function (e) {
    this.setData({ pubTopic: e.detail.value });
  },
  setPubMessage: function (e) {
    this.setData({ pubMessage: e.detail.value });
  },

  connect: function () {
    let _this = this;
    if (_this.data.client || _this.data.connecting) {
      return;
    }
    _this.setData({ connecting: true });
    let client = mqtt.connect(_this.data.brokerUrl, {
      username: _this.data.username,
      password: _this.data.password,
      reconnectPeriod: 0
    });
    // connect 成功前先把 client 存起来，便于 error/close 时能 end
    _this.setData({ client: client });

    client.on('connect', function () {
      console.log('MQTT-Connected!');
      _this.setData({ connected: true, connecting: false });
      wx.showToast({ title: '已连接', icon: 'success' });
    });
    client.on('message', _this.messageHandler);
    client.on('error', function (err) {
      console.error('MQTT-Error:', err);
      wx.showToast({ title: '连接失败', icon: 'none' });
      client.end(true);
      _this.setData({ client: null, connected: false, connecting: false });
    });
    client.on('close', function () {
      console.log('MQTT-Closed');
      _this.setData({ client: null, connected: false, connecting: false, subscribeList: [] });
    });
  },

  disconnect: function () {
    if (this.data.client) {
      this.data.client.end();
      this.setData({ client: null, connected: false, connecting: false, subscribeList: [] });
    }
  },

  sub: function () {
    let _this = this;
    let topic = _this.data.topic;
    if (!_this.data.connected || !topic) {
      return;
    }
    if (_this.data.subscribeList.indexOf(topic) != -1) {
      wx.showToast({ title: '已订阅该Topic', icon: 'none' });
      return;
    }
    _this.data.client.subscribe(topic, function (err) {
      if (err) {
        wx.showToast({ title: '订阅失败', icon: 'none' });
        return;
      }
      let list = _this.data.subscribeList.concat(topic);
      _this.setData({ subscribeList: list });
    });
  },

  unsub: function (e) {
    let _this = this;
    let topic = e.currentTarget.dataset.topic;
    if (!_this.data.connected) {
      return;
    }
    _this.data.client.unsubscribe(topic, function (err) {
      if (err) {
        wx.showToast({ title: '取消订阅失败', icon: 'none' });
        return;
      }
      let list = _this.data.subscribeList.filter(function (t) { return t != topic; });
      _this.setData({ subscribeList: list });
    });
  },

  publish: function () {
    let _this = this;
    if (!_this.data.connected) {
      wx.showToast({ title: '未连接', icon: 'none' });
      return;
    }
    if (!_this.data.pubTopic) {
      wx.showToast({ title: '请填写Topic', icon: 'none' });
      return;
    }
    _this.data.client.publish(_this.data.pubTopic, _this.data.pubMessage, function (err) {
      if (err) {
        wx.showToast({ title: '发布失败', icon: 'none' });
        return;
      }
      _this.addMessage(_this.data.pubTopic, _this.data.pubMessage, 'out');
    });
  },

  messageHandler: function (topic, message) {
    this.addMessage(topic, message.toString(), 'in');
  },

  // 追加一条消息记录（dir: in 收 / out 发），并做数量上限裁剪
  addMessage: function (topic, payload, dir) {
    let item = {
      topic: topic,
      payload: payload,
      dir: dir,
      time: formatTime(new Date())
    };
    let messages = [item].concat(this.data.messages);
    if (messages.length > this.data.maxMessages) {
      messages = messages.slice(0, this.data.maxMessages);
    }
    this.setData({ messages: messages });
  },

  clearMessages: function () {
    this.setData({ messages: [] });
  }

})
