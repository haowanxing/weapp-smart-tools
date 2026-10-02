// 万年历 + 黄历（数据层：lunar-javascript）
const { Lunar, Solar } = require('../../utils/lunar-javascript.js');

const WEEK_TITLE = ['日', '一', '二', '三', '四', '五', '六'];

Page({
  data: {
    weekTitle: WEEK_TITLE,
    year: 0,
    month: 0,      // 1-12
    days: [],      // 当月 42 格
    detail: {},    // 选中日黄历详情
    times: []      // 选中日十二时辰吉凶
  },

  onShareAppMessage: function () {
    return {
      title: '万年历 · 农历黄历',
      path: '/pages/tools/calendar'
    }
  },
  onShareTimeline: function () {
    return {
      title: '万年历 · 农历黄历'
    }
  },
  onLoad: function () {
    const now = new Date();
    this.cur = { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
    this.renderMonth(this.cur.y, this.cur.m);
    this.selectDay(this.cur.y, this.cur.m, this.cur.d);
  },

  // 渲染某年某月（42 格，含上下月补齐）
  renderMonth: function (year, month) {
    const first = new Date(year, month - 1, 1);
    const startTime = first.getTime() - first.getDay() * 86400000;
    const today = new Date();
    const tY = today.getFullYear(), tM = today.getMonth() + 1, tD = today.getDate();

    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startTime + i * 86400000);
      const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
      const lunar = Lunar.fromDate(date);
      const solar = lunar.getSolar();

      const term = lunar.getJieQi();
      const lFests = lunar.getFestivals();
      const sFests = solar.getFestivals();
      let sub = lunar.getDay() === 1 ? (lunar.getMonthInChinese() + '月') : lunar.getDayInChinese();
      let fest = false;
      if (sFests.length) { sub = sFests[0]; fest = true; }
      else if (lFests.length) { sub = lFests[0]; fest = true; }
      else if (term) { sub = term; fest = true; }

      days.push({
        year: y, month: m, day: d,
        inMonth: m === month,
        sub: sub,
        isFestival: fest,
        isToday: y === tY && m === tM && d === tD,
        isSelected: y === this.cur.y && m === this.cur.m && d === this.cur.d
      });
    }
    this.setData({ year, month, days });
  },

  // 选中某天，计算完整黄历
  selectDay: function (year, month, day) {
    this.cur = { y: year, m: month, d: day };
    const solar = Solar.fromYmd(year, month, day);
    const lunar = solar.getLunar();

    const festivals = solar.getFestivals().concat(lunar.getFestivals());
    const jq = lunar.getJieQi();
    if (jq) festivals.push(jq);

    const detail = {
      solar: year + '年' + month + '月' + day + '日',
      week: '星期' + WEEK_TITLE[solar.getWeek()],
      lunarYear: lunar.getYearInGanZhi() + '（' + lunar.getYearShengXiao() + '）年',
      lunarMD: lunar.getMonthInChinese() + '月' + lunar.getDayInChinese(),
      ganzhi: lunar.getYearInGanZhi() + '年 ' + lunar.getMonthInGanZhi() + '月 ' + lunar.getDayInGanZhi() + '日',
      festivals: festivals,
      yi: lunar.getDayYi().join('、'),
      ji: lunar.getDayJi().join('、'),
      chong: '冲' + lunar.getDayChongDesc() + ' 煞' + lunar.getDaySha(),
      zhiShen: lunar.getDayTianShen() + '（' + lunar.getDayTianShenType() + '・' + lunar.getDayTianShenLuck() + '）',
      zhiXing: lunar.getZhiXing() + '日',
      naYin: lunar.getDayNaYin(),
      xiu: lunar.getXiu() + lunar.getZheng() + lunar.getAnimal() + '（' + lunar.getXiuLuck() + '）',
      pengZu: lunar.getPengZuGan() + '，' + lunar.getPengZuZhi(),
      tai: lunar.getDayPositionTai(),
      posCai: lunar.getDayPositionCaiDesc(),
      posXi: lunar.getDayPositionXiDesc(),
      posFu: lunar.getDayPositionFuDesc(),
      posYangGui: lunar.getDayPositionYangGuiDesc(),
      posYinGui: lunar.getDayPositionYinGuiDesc()
    };

    // 十二时辰吉凶
    const times = lunar.getTimes().map(t => ({
      gz: t.getGanZhi(),
      range: t.getMinHm() + '~' + t.getMaxHm(),
      luck: t.getTianShenLuck(),       // 吉 / 凶
      shen: t.getTianShen()
    }));

    // 刷新选中态
    const days = this.data.days.map(c => ({
      ...c,
      isSelected: c.year === year && c.month === month && c.day === day
    }));

    this.setData({ detail, times, days });
  },

  onTapDay: function (e) {
    const c = this.data.days[e.currentTarget.dataset.idx];
    if (!c.inMonth) this.renderMonth(c.year, c.month);
    this.selectDay(c.year, c.month, c.day);
  },

  prevMonth: function () {
    let { year, month } = this.data;
    if (--month < 1) { month = 12; year--; }
    this.renderMonth(year, month);
  },

  nextMonth: function () {
    let { year, month } = this.data;
    if (++month > 12) { month = 1; year++; }
    this.renderMonth(year, month);
  },

  backToday: function () {
    const now = new Date();
    this.renderMonth(now.getFullYear(), now.getMonth() + 1);
    this.selectDay(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }
});
