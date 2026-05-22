App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }
    wx.cloud.init({
      env: 'YOUR_ENV_ID',  // 替换为你的云开发环境ID
      traceUser: true,
    });
    this.checkAccess();
  },

  // 检查当前用户是否有访问权限
  async checkAccess() {
    try {
      const res = await wx.cloud.callFunction({ name: 'checkAccess' });
      if (!res.result.allowed) {
        wx.redirectTo({ url: '/pages/blocked/blocked' });
      }
    } catch (e) {
      console.error('权限检查失败', e);
    }
  },

  globalData: {
    isAllowed: false,
  },
});
