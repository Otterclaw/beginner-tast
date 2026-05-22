const cloud = require('wx-server-sdk');
const Anthropic = require('@anthropic-ai/sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `你是专门处理获奖证书信息提取的助手。
请从OCR识别的证书文字中，精准提取获奖信息并以JSON格式返回。
只输出JSON，不要任何额外说明。`;

const USER_PROMPT_TEMPLATE = (ocrText) => `请从以下证书OCR识别文字中提取信息：

---
${ocrText}
---

提取以下字段（没有的字段返回空字符串）：
- 获奖年月：格式"YYYY.M"（如"2025.5"），从证书日期推断
- 项目类型：如"专业技能类"、"创新创业类"等
- 赛项名称：比赛或奖项的完整名称
- 主办单位：颁奖机构/主办方全称
- 级别：只填"国家级"/"省级"/"市级"/"校级"之一
- 类别：A、B等类别标识
- 名次：如"一等奖"、"二等奖"、"金奖"等
- 学生姓名：获奖学生（多人用顿号分隔）
- 指导老师：指导教师（多人用顿号分隔）
- 本专科："本科"或"专科"
- 学院名称：所属学院全称
- 专业名称：获奖学生所属专业
- 是否教育部认定："是"或"否"
- 证书编号：证书上的编号

返回格式：
{
  "获奖年月": "",
  "项目类型": "",
  "赛项名称": "",
  "主办单位": "",
  "级别": "",
  "类别": "",
  "名次": "",
  "学生姓名": "",
  "指导老师": "",
  "本专科": "",
  "学院名称": "",
  "专业名称": "",
  "是否教育部认定": "",
  "证书编号": ""
}`;

exports.main = async (event) => {
  const { ocrText } = event;

  if (!ocrText || ocrText.trim().length < 5) {
    return { success: false, error: 'OCR文字内容太少，无法解析' };
  }

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: USER_PROMPT_TEMPLATE(ocrText) }],
  });

  const responseText = message.content[0].text.trim();

  try {
    // 直接尝试解析
    const data = JSON.parse(responseText);
    return { success: true, data };
  } catch {
    // 尝试从响应中提取JSON
    const match = responseText.match(/\{[\s\S]*\}/);
    if (match) {
      const data = JSON.parse(match[0]);
      return { success: true, data };
    }
    return { success: false, error: '解析失败', raw: responseText };
  }
};
