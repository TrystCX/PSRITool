# 卫戍协议：规程数据库

本项目是一个本地运行的《卫戍协议》资料与攻略工具，覆盖盟约、干员、装备、敌人、机变阶段、攻略查询和商店预测。

## 使用

直接打开 `index.html`。

### 更新攻略

1. 用新的 `all_guides.json` 替换旧文件。
2. 双击 `同步攻略.bat`。
3. 等待窗口提示同步成功后，重新打开或刷新 `index.html`。

同步程序会把 JSON 转换成网页使用的紧凑数据并写入 `index.html`。原文件格式必须是 UTF-8 JSON，并包含 `guides` 数组；每篇攻略必须有 `guideId`。

同步程序需要 Node.js。也可以在 `app` 目录运行：

```text
node sync-guides.js
```

## 功能

- 核心盟约与附属盟约关系、激活条件和攻略编成
- 干员、装备、敌人和机变阶段图鉴
- 攻略按盟约、代理人、干员、Ban 位、收藏和排序筛选
- 攻略详情中的阵容、盟约、装备和回合信息
- 商店等级、干员合成、装备合成、期望名单和持有跟踪
- 回合出怪预览与敌人详情
- 开局截图识别盟约 Ban 位和特训敌人类型

## 文件结构

| 文件或目录 | 作用 |
| --- | --- |
| `index.html` | 网页入口、样式、交互逻辑和主要基础数据。 |
| `all_guides.json` | 原始攻略数据。更新后需要运行同步程序。 |
| `sync-guides.js` | 将攻略 JSON 写入 `index.html`。 |
| `同步攻略.bat` | Windows 下运行同步程序的入口。 |
| `sub-covenant-guides.js` | 附属盟约攻略编成和构筑建议。 |
| `spawn-data.js` | 回合出怪和敌人分组数据。 |
| `ban-shot.js` | 盟约与敌人截图识别逻辑。 |
| `enemy-text-shot.js` | 特训敌人文字匹配逻辑。 |
| `enemy-text-assets.js` | 特训敌人文字识别素材。 |
| `server.js` | 可选的本地 HTTP 服务，用于解决浏览器对 `file://` 权限的限制。 |
| `avatars/` | 干员和代理人头像。 |
| `class-icons/` | 职业图标。 |
| `cov-icons/` | 盟约图标。 |
| `enemy-icons/` | 敌人图标。 |
| `gear-icons/` | 装备图标。 |
| `map-thumbs/` | 地图缩略图。 |
| `mutation-icons/` | 机变阶段图标。 |

## 数据保存

Ban 位、收藏、持有干员、期望名单和商店状态保存在浏览器的本地存储中。它们不会写入攻略 JSON，也不会随 `index.html` 自动迁移到其他浏览器或端口。

网页默认不联网抓取数据。`all_guides.json` 的来源信息只作为文件元数据保存。
