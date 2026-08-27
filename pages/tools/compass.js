// pages/tools/compass.js

// 四正方位用红色标注，四维(艮巽坤乾)用蓝色，其余黑色
const RED = '#c0392b';
const BLUE = '#2c5aa0';
const DARK = '#3a2f24';

// 把一组字符按等分角度铺成一个圆环
// arr: [{c, color}]，返回带 deg 的数组，index 0 位于正上方(北)
function ring(arr) {
  const n = arr.length;
  return arr.map((it, i) => ({
    c: it.c,
    color: it.color || DARK,
    deg: Math.round((i * 360 / n) * 100) / 100
  }));
}

// 便捷构造：字符串 + 需标红/标蓝的字符集合
function line(str, reds, blues) {
  const rs = reds || '';
  const bs = blues || '';
  return str.split('').map(c => ({
    c,
    color: rs.indexOf(c) > -1 ? RED : (bs.indexOf(c) > -1 ? BLUE : DARK)
  }));
}

Page({

  data: {
    isTip: true,
    direction: '--',
    angle: '--',
    rotate: 0,
    styleIndex: 0,
    styles: []
  },

  onLoad: function (options) {
    // 四正方位环
    const cardinal = ring(line('北东南西', '北东南西'));

    // 后天(文王)八卦：北起顺时针 坎艮震巽离坤兑乾
    const houtianSym = ring(line('☵☶☳☴☲☷☱☰'));
    const houtianName = ring([
      { c: '坎', color: RED }, { c: '艮', color: BLUE }, { c: '震', color: RED }, { c: '巽', color: BLUE },
      { c: '离', color: RED }, { c: '坤', color: BLUE }, { c: '兑', color: RED }, { c: '乾', color: BLUE }
    ]);

    // 先天(伏羲)八卦：北起顺时针 坤震离兑乾巽坎艮
    const xiantianSym = ring(line('☷☳☲☱☰☴☵☶'));
    const xiantianName = ring([
      { c: '坤', color: RED }, { c: '震', color: BLUE }, { c: '离', color: RED }, { c: '兑', color: BLUE },
      { c: '乾', color: RED }, { c: '巽', color: BLUE }, { c: '坎', color: RED }, { c: '艮', color: BLUE }
    ]);

    // 二十四山：子起顺时针，四正(子午卯酉)红、四维(艮巽坤乾)蓝
    const mountains = ring(line(
      '子癸丑艮寅甲卯乙辰巽巳丙午丁未坤申庚酉辛戌乾亥壬',
      '子午卯酉', '艮巽坤乾'
    ));

    const styles = [
      { name: '现代', type: 'image', src: '../../images/compass/compass2.png' },
      {
        name: '简约', type: 'dial', center: 'dot', needle: true,
        circles: [320, 300],
        rings: [{ items: cardinal, radius: 250, fontSize: 44 }]
      },
      {
        name: '后天八卦', type: 'dial', center: 'taiji',
        circles: [320, 285, 180, 120],
        rings: [
          { items: houtianSym, radius: 280, fontSize: 40 },
          { items: houtianName, radius: 225, fontSize: 34 },
          { items: cardinal, radius: 150, fontSize: 30 }
        ]
      },
      {
        name: '先天八卦', type: 'dial', center: 'taiji',
        circles: [320, 285, 180, 120],
        rings: [
          { items: xiantianSym, radius: 280, fontSize: 40 },
          { items: xiantianName, radius: 225, fontSize: 34 },
          { items: cardinal, radius: 150, fontSize: 30 }
        ]
      },
      {
        name: '二十四山', type: 'dial', center: 'taiji',
        circles: [320, 295, 235, 175, 110],
        rings: [
          { items: mountains, radius: 288, fontSize: 26 },
          { items: houtianName, radius: 205, fontSize: 30 },
          { items: cardinal, radius: 145, fontSize: 28 }
        ]
      }
    ];

    this.setData({ styles: styles });
  },

  onUnload: function () {
    wx.stopCompass({});
  },

  onShareAppMessage: function () {
    return {
      title: '我现在面向 ' + this.data.direction + ' 方向 , 点我使用迷你指南针为您指引方向！',
      path: '/pages/tools/compass'
    }
  },

  // 点击罗盘顺序切换样式
  switchStyle: function () {
    const next = (this.data.styleIndex + 1) % this.data.styles.length;
    this.setData({ styleIndex: next });
    wx.showToast({ title: this.data.styles[next].name, icon: 'none', duration: 800 });
  },

  kown: function (e) {
    this.setData({ isTip: false });
    this.startCompass();
  },

  startCompass: function () {
    wx.startCompass({
      success: (res) => {
        let that = this;
        wx.onCompassChange(function (res) {
          let directions = res.direction.toFixed(2);
          let radios = res.direction.toFixed(0);
          that.setData({
            angle: directions,
            rotate: 360 - radios,
            direction: check(radios)
          })
        });
        setTimeout(function () {
          if (that.data.direction == '--' && that.data.angle == '--') {
            wx.showToast({
              title: '您的手机没有电子罗盘或被禁用',
              icon: 'loading',
              duration: 5000,
              mask: true
            })
          }
        }, 3000);
        function check(i) {
          if (15 <= i && i <= 75) {
            return '东北'
          } else if (75 < i && i < 105) {
            return '正东'
          } else if (105 <= i && i <= 165) {
            return '东南'
          } else if (165 < i && i < 195) {
            return '正南'
          } else if (195 <= i && i <= 255) {
            return '西南'
          } else if (255 < i && i < 285) {
            return '正西'
          } else if (285 <= i && i <= 345) {
            return '西北'
          } else {
            return '正北'
          }
        }
      },
    });
  }
})
