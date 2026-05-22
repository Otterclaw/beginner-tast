Page({
  data: {
    exportMode: 'all',
    selectedYear: '',
    yearList: [],
    exporting: false,
    lastExportUrl: '',
    lastExportFileID: '',
    columnNames: [
      '序号', '获奖年月', '项目类型', '赛项名称', '主办单位',
      '级别', '类别', '名次', '学生姓名', '指导老师',
      '本/专科', '学院名称', '获奖学生所属专业名称',
      '是否属于教育部认定竞赛', '证书编号', '上传日期',
    ],
  },

  onShow() {
    this.loadYears();
  },

  async loadYears() {
    try {
      const db = wx.cloud.database();
      const { data } = await db.collection('awards').field({ 获奖年月: true }).limit(200).get();
      const years = [...new Set(
        data.map(r => r.获奖年月 ? r.获奖年月.split('.')[0] : null).filter(Boolean)
      )].sort((a, b) => b - a);
      this.setData({ yearList: years });
    } catch (e) {
      console.error('加载年份失败', e);
    }
  },

  setMode(e) {
    this.setData({ exportMode: e.currentTarget.dataset.mode, selectedYear: '' });
  },

  onYearChange(e) {
    const year = this.data.yearList[parseInt(e.detail.value)];
    this.setData({ selectedYear: year });
  },

  async exportExcel() {
    if (this.data.exportMode === 'year' && !this.data.selectedYear) {
      wx.showToast({ title: '请先选择年份', icon: 'none' });
      return;
    }

    this.setData({ exporting: true, lastExportUrl: '', lastExportFileID: '' });

    try {
      const res = await wx.cloud.callFunction({
        name: 'exportExcel',
        data: {
          year: this.data.exportMode === 'year' ? this.data.selectedYear : null,
        },
      });

      if (!res.result || !res.result.success) {
        throw new Error('导出失败');
      }

      this.setData({
        lastExportUrl: res.result.tempUrl,
        lastExportFileID: res.result.fileID,
      });

      wx.showToast({
        title: `共${res.result.recordCount}条记录`,
        icon: 'success',
        duration: 2000,
      });
    } catch (err) {
      console.error('导出出错:', err);
      wx.showModal({ title: '导出失败', content: err.message || '请稍后重试', showCancel: false });
    } finally {
      this.setData({ exporting: false });
    }
  },

  saveFile() {
    if (!this.data.lastExportUrl) return;
    wx.showLoading({ title: '下载中...' });
    wx.downloadFile({
      url: this.data.lastExportUrl,
      success: (res) => {
        wx.hideLoading();
        wx.openDocument({
          filePath: res.tempFilePath,
          fileType: 'xlsx',
          showMenu: true,
        });
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('下载失败:', err);
        wx.showToast({ title: '下载失败', icon: 'none' });
      },
    });
  },
});
