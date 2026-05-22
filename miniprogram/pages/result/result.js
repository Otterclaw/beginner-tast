Page({
  data: {
    form: {
      获奖年月: '',
      项目类型: '',
      赛项名称: '',
      主办单位: '',
      级别: '',
      类别: '',
      名次: '',
      学生姓名: '',
      指导老师: '',
      本专科: '',
      学院名称: '',
      专业名称: '',
      是否教育部认定: '',
      证书编号: '',
      上传日期: '',
    },
    imageUrl: '',
    imageFileID: '',
    saving: false,
    projectTypes: ['专业技能类', '创新创业类', '学科竞赛类', '文化艺术类', '体育竞技类', '社会实践类', '其他'],
    levelOptions: ['国家级', '省级', '市级', '校级'],
    rankOptions: ['特等奖', '一等奖', '二等奖', '三等奖', '优秀奖', '金奖', '银奖', '铜奖', '入围奖', '提名奖'],
    eduTypes: ['本科', '专科'],
    yesNoOptions: ['是', '否'],
  },

  onLoad(options) {
    const today = new Date();
    const uploadDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    let parsedData = {};
    if (options.data) {
      try {
        parsedData = JSON.parse(decodeURIComponent(options.data));
      } catch (e) {
        console.error('解析数据失败', e);
      }
    }

    const fileID = options.fileID ? decodeURIComponent(options.fileID) : '';

    // 如果有fileID，获取临时URL显示图片
    if (fileID) {
      wx.cloud.getTempFileURL({
        fileList: [fileID],
        success: (res) => {
          if (res.fileList && res.fileList[0]) {
            this.setData({ imageUrl: res.fileList[0].tempFileURL });
          }
        },
      });
    }

    this.setData({
      form: {
        获奖年月: parsedData.获奖年月 || '',
        项目类型: parsedData.项目类型 || '',
        赛项名称: parsedData.赛项名称 || '',
        主办单位: parsedData.主办单位 || '',
        级别: parsedData.级别 || '',
        类别: parsedData.类别 || '',
        名次: parsedData.名次 || '',
        学生姓名: parsedData.学生姓名 || '',
        指导老师: parsedData.指导老师 || '',
        本专科: parsedData.本专科 || '',
        学院名称: parsedData.学院名称 || '',
        专业名称: parsedData.专业名称 || '',
        是否教育部认定: parsedData.是否教育部认定 || '',
        证书编号: parsedData.证书编号 || '',
        上传日期: uploadDate,
      },
      imageFileID: fileID,
    });
  },

  onInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [`form.${key}`]: e.detail.value });
  },

  onPickerChange(e) {
    const key = e.currentTarget.dataset.key;
    const optionsMap = {
      项目类型: this.data.projectTypes,
      级别: this.data.levelOptions,
      名次: this.data.rankOptions,
      本专科: this.data.eduTypes,
      是否教育部认定: this.data.yesNoOptions,
    };
    const value = optionsMap[key][parseInt(e.detail.value)];
    this.setData({ [`form.${key}`]: value });
  },

  previewImage() {
    if (this.data.imageUrl) {
      wx.previewImage({ urls: [this.data.imageUrl] });
    }
  },

  async saveRecord() {
    const form = this.data.form;

    // 必填校验
    const required = ['获奖年月', '赛项名称', '名次', '学生姓名', '级别'];
    for (const field of required) {
      if (!form[field] || !form[field].trim()) {
        wx.showToast({ title: `请填写${field}`, icon: 'none', duration: 2000 });
        return;
      }
    }

    this.setData({ saving: true });
    try {
      const res = await wx.cloud.callFunction({
        name: 'saveAward',
        data: {
          data: form,
          imageFileID: this.data.imageFileID,
        },
      });

      if (res.result && res.result.success) {
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(() => {
          wx.switchTab({ url: '/pages/history/history' });
        }, 1500);
      } else {
        throw new Error('保存失败');
      }
    } catch (err) {
      console.error('保存出错:', err);
      wx.showModal({ title: '保存失败', content: err.message || '请稍后重试', showCancel: false });
    } finally {
      this.setData({ saving: false });
    }
  },
});
