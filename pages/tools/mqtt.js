// 用自包含的 UMD 单文件构建（含微信 wx.connectSocket 支持）。
// 不用 npm 包 "mqtt"：微信 npm 打包器对其 module.exports=函数 的重导出处理有问题，
// 运行时 mqtt.connect 会变成 undefined。
const mqtt = require("../../utils/mqtt.min.js")
const { formatTime } = require("../../utils/util.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    client: null,
    connected: false,       // 连接状态
    connecting: false,      // 连接中
    // 默认预置 EMQX 免费公共节点（wss 端口 8084，路径 /mqtt，允许匿名）
    host: 'broker-cn.emqx.io',
    port: '8084',
    path: '/mqtt',
    clientId: '',           // 客户端ID，留空则连接时自动生成
    username: '',
    password: '',
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
    // 预置一个默认 ClientID，用户可自行修改
    this.setData({ clientId: 'smarttools_' + Date.now() });
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    // 页面卸载时确保断开连接，释放资源
    this.clearConnTimer();
    if (this.data.client) {
      this.data.client.end(true);
    }
  },

  setHost: function (e) {
    this.setData({ host: e.detail.value });
  },
  setPort: function (e) {
    this.setData({ port: e.detail.value });
  },
  setClientId: function (e) {
    this.setData({ clientId: e.detail.value });
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
    // 由 host / port / path 拼接完整 broker 地址（小程序真机要求 wxs 加密连接）
    let brokerUrl = 'wxs://' + _this.data.host + ':' + _this.data.port + _this.data.path;
    _this.setData({ connecting: true });
    let options = {
      username: _this.data.username,
      password: _this.data.password,
      reconnectPeriod: 0,
      connectTimeout: 8000    // mqtt.js 内部连接超时
    };
    // ClientID 留空时交给 mqtt.js 自动生成
    if (_this.data.clientId) {
      options.clientId = _this.data.clientId;
    }

    let client = mqtt.connect(brokerUrl, options);
    // connect 成功前先把 client 存起来，便于 error/close 时能 end
    _this.setData({ client: client });

    // 兜底超时：若 socket 合法域名未配置等原因导致连接静默卡住，
    // 10s 后强制收尾并提示，避免一直停留在“连接中”
    _this._connTimer = setTimeout(function () {
      if (_this.data.connecting && !_this.data.connected) {
        client.end(true);
        _this.setData({ client: null, connected: false, connecting: false });
        wx.showModal({
          title: '连接超时',
          content: '请检查网络，并确认已在小程序后台的 socket 合法域名中添加 wss://' + _this.data.host,
          showCancel: false
        });
      }
    }, 10000);

    client.on('connect', function () {
      _this.clearConnTimer();
      _this.setData({ connected: true, connecting: false });
      wx.showToast({ title: '已连接', icon: 'success' });
    });
    client.on('message', _this.messageHandler);
    client.on('error', function (err) {
      console.error('MQTT-Error:', err);
      _this.clearConnTimer();
      wx.showToast({ title: '连接失败', icon: 'none' });
      client.end(true);
      _this.setData({ client: null, connected: false, connecting: false });
    });
    client.on('close', function () {
      _this.clearConnTimer();
      _this.setData({ client: null, connected: false, connecting: false, subscribeList: [] });
    });
  },

  clearConnTimer: function () {
    if (this._connTimer) {
      clearTimeout(this._connTimer);
      this._connTimer = null;
    }
  },

  disconnect: function () {
    this.clearConnTimer();
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
