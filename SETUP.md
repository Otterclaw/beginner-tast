# 证书OCR识别归档小程序 — 部署说明

## 第一步：注册微信小程序

1. 访问 https://mp.weixin.qq.com 注册小程序账号
2. 记录你的 **AppID**

## 第二步：开通微信云开发

1. 用微信开发者工具打开此项目
2. 将 `project.config.json` 中的 `YOUR_APPID_HERE` 替换为你的AppID
3. 点击开发者工具上方的"云开发"按钮，开通云开发环境
4. 记录你的 **云开发环境ID**（格式如 `xxx-xxx-xxx`）
5. 将 `miniprogram/app.js` 中的 `YOUR_ENV_ID` 替换为你的环境ID

## 第三步：开通腾讯云OCR

1. 访问腾讯云控制台开通OCR服务（通用文字识别）
2. 获取 SecretId 和 SecretKey
3. 在微信云开发控制台，为 `ocr` 云函数设置环境变量：
   - `TENCENT_SECRET_ID` = 你的SecretId
   - `TENCENT_SECRET_KEY` = 你的SecretKey

## 第四步：配置Claude API

1. 访问 https://console.anthropic.com 获取API Key
2. 在微信云开发控制台，为 `parseAward` 云函数设置环境变量：
   - `ANTHROPIC_API_KEY` = 你的API Key

## 第五步：创建数据库集合

在云开发控制台 → 数据库，创建集合：
- 集合名称：`awards`
- 权限设置：所有用户可读写（或仅创建者可读写，根据需要）

## 第六步：部署云函数

在微信开发者工具中，右键点击每个云函数目录，选择"上传并部署（云端安装依赖）"：
- `cloudfunctions/ocr`
- `cloudfunctions/parseAward`
- `cloudfunctions/saveAward`
- `cloudfunctions/exportExcel`

## Excel列结构

| 列 | 字段名 | 说明 |
|----|--------|------|
| A | 序号 | 自动生成 |
| B | 获奖年月 | 格式：2025.5 |
| C | 项目类型 | 专业技能类等 |
| D | 赛项名称 | 比赛完整名称 |
| E | 主办单位 | 颁奖机构 |
| F | 级别 | 国家级/省级/市级/校级 |
| G | 类别 | A、B等 |
| H | 名次 | 一等奖/二等奖等 |
| I | 学生姓名 | 多人用顿号分隔 |
| J | 指导老师 | 多人用顿号分隔 |
| K | 本/专科 | 本科或专科 |
| L | 学院名称 | 所属学院 |
| M | 获奖学生所属专业名称 | 专业 |
| N | 是否属于教育部认定竞赛 | 是/否 |
| O | 证书编号 | 证书上的编号 |
| P | 上传日期 | 自动添加，格式：YYYY-MM-DD |

导出的Excel每个年份一个Sheet（如2025年、2024年），与你原有格式一致。

## 费用估算

- 微信云开发：免费套餐可用（每月一定调用次数）
- 腾讯云OCR：新用户1000次/月免费
- Claude API (Haiku)：约 $0.001/次，非常便宜
