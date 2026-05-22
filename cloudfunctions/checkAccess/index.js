const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async () => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  // 查询白名单集合
  const { data } = await db.collection('allowlist')
    .where({ openid })
    .limit(1)
    .get();

  return { allowed: data.length > 0 };
};
