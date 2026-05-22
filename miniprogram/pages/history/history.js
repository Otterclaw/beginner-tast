Page({
  data: {
    allList: [],
    filteredList: [],
    yearList: [],
    activeYear: '',
    searchKeyword: '',
    totalCount: 0,
    loading: false,
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const db = wx.cloud.database();
      const { data } = await db.collection('awards')
        .orderBy('创建时间', 'desc')
        .limit(200)
        .get();

      // 提取年份列表
      const years = [...new Set(
        data
          .map(r => r.获奖年月 ? r.获奖年月.split('.')[0] : null)
          .filter(Boolean)
      )].sort((a, b) => b - a);

      this.setData({
        allList: data,
        filteredList: data,
        yearList: years,
        totalCount: data.length,
        loading: false,
      });
    } catch (err) {
      console.error('加载数据失败:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  filterYear(e) {
    const year = e.currentTarget.dataset.year;
    this.setData({ activeYear: year }, () => this.applyFilter());
  },

  onSearch(e) {
    this.setData({ searchKeyword: e.detail.value }, () => this.applyFilter());
  },

  applyFilter() {
    const { allList, activeYear, searchKeyword } = this.data;
    let result = allList;

    if (activeYear) {
      result = result.filter(r => r.获奖年月 && r.获奖年月.startsWith(activeYear));
    }

    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim();
      result = result.filter(r =>
        (r.学生姓名 && r.学生姓名.includes(kw)) ||
        (r.赛项名称 && r.赛项名称.includes(kw)) ||
        (r.指导老师 && r.指导老师.includes(kw)) ||
        (r.主办单位 && r.主办单位.includes(kw))
      );
    }

    this.setData({ filteredList: result });
  },

  viewDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/result/result?recordId=${id}&readonly=1` });
  },
});
