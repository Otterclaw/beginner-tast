const app = getApp();

Page({
  data: {
    imageUrl: '',
    imageFileID: '',
    loading: false,
    loadingText: '准备中...',
    progress: 0,
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      camera: 'back',
      success: (res) => {
        const tempFile = res.tempFiles[0];
        this.setData({
          imageUrl: tempFile.tempFilePath,
          imageFileID: '',
        });
      },
    });
  },

  async startOCR() {
    if (!this.data.imageUrl) {
      wx.showToast({ title: '请先选择图片', icon: 'none' });
      return;
    }

    this.setData({ loading: true, loadingText: '上传图片中...', progress: 10 });

    try {
      // 1. 上传图片到云存储
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath: `certificates/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`,
        filePath: this.data.imageUrl,
      });
      const fileID = uploadRes.fileID;
      this.setData({ imageFileID: fileID, loadingText: '图片识别中...', progress: 35 });

      // 2. OCR 识别
      const ocrRes = await wx.cloud.callFunction({
        name: 'ocr',
        data: { fileID },
      });

      if (!ocrRes.result || !ocrRes.result.fullText) {
        throw new Error('OCR识别失败，请重试');
      }
      this.setData({ loadingText: 'AI解析信息中...', progress: 65 });

      // 3. AI 解析字段
      const parseRes = await wx.cloud.callFunction({
        name: 'parseAward',
        data: { ocrText: ocrRes.result.fullText },
      });

      if (!parseRes.result || !parseRes.result.success) {
        throw new Error('信息解析失败，请手动填写');
      }
      this.setData({ loadingText: '完成！', progress: 100 });

      // 4. 跳转到结果页
      const parsedData = parseRes.result.data;
      wx.navigateTo({
        url: `/pages/result/result?data=${encodeURIComponent(JSON.stringify(parsedData))}&fileID=${encodeURIComponent(fileID)}`,
      });

    } catch (err) {
      console.error('OCR流程出错:', err);
      wx.showModal({
        title: '识别出错',
        content: err.message || '请检查网络或稍后重试',
        showCancel: false,
      });
    } finally {
      this.setData({ loading: false, loadingText: '准备中...', progress: 0 });
    }
  },
});
