const cloud = require('wx-server-sdk');
const tencentcloud = require('tencentcloud-sdk-nodejs');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const OcrClient = tencentcloud.ocr.v20181119.Client;

exports.main = async (event) => {
  const { fileID } = event;

  // 获取云存储文件的临时访问URL
  const { fileList } = await cloud.getTempFileURL({ fileList: [fileID] });
  const tempFileURL = fileList[0].tempFileURL;

  // 调用腾讯云OCR通用精准识别
  const client = new OcrClient({
    credential: {
      secretId: process.env.TENCENT_SECRET_ID,
      secretKey: process.env.TENCENT_SECRET_KEY,
    },
    region: 'ap-guangzhou',
  });

  const ocrResult = await client.GeneralAccurateOCR({ ImageUrl: tempFileURL });

  const fullText = ocrResult.TextDetections
    .map(block => block.DetectedText)
    .join('\n');

  return {
    success: true,
    fullText,
    blocks: ocrResult.TextDetections,
  };
};
