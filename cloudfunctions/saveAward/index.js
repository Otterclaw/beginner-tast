const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { data, imageFileID } = event;
  const wxContext = cloud.getWXContext();

  const record = {
    ...data,
    imageFileID: imageFileID || '',
    上传日期: data.上传日期 || new Date().toISOString().split('T')[0],
    创建时间: db.serverDate(),
    openid: wxContext.OPENID,
  };

  const result = await db.collection('awards').add({ data: record });
  return { success: true, id: result._id };
};
