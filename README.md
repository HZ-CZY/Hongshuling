# 🕊️ 羽迹·深湾 — 深圳湾候鸟与红树林科普平台

深圳湾候鸟迁徙与红树林生态的可视化科普平台。本期在原有基础上，依据产品规划落地了 **8 大功能**，覆盖「现场知识获取 → 趣味学习 → 社区互动 → AI 问答 → 自传播 → 兴趣变现」的完整闭环。

## 功能地图（对应需求 8 项）

| # | 需求 | 实现 | 文件 |
|---|------|------|------|
| 1 | 首页地图 + 动植物小框弹出 | 高德地图标注红树林/候鸟分布，点选弹出科普小框（无 Key 自动降级示意地图） | `js/map.js` `js/app.js` |
| 2 | 每个动物知识问答 + 解锁 | 逐题作答、即时反馈，全对解锁下一物种并得徽章 | `js/quiz.js` `js/app.js` |
| 3 | 物种信息卡 | 结构化展示特征/习性/保护等级/趣闻/来深时间，可一键在地图绘迁徙路线 | `js/infocard.js` |
| 4 | 留言墙（UGC） | 按物种留言、浏览、点赞，localStorage 持久化 | `js/messages.js` |
| 5 | AI 助手对话式问答 | 知识库匹配引擎（离线可用）+ 可插拔 LLM API，支持"几月来深湾""和X区别"等个性化提问 | `js/ai.js` |
| 6 | 好友分享 | Web Share API + Canvas 分享卡片 + 复制链接 | `js/share.js` |
| 7 | 上传照片 AI 猜测迁徙路线 | 上传照片→识别/选择物种→地图绘制迁徙路线（含视觉 API 集成桩） | `js/photo.js` |
| 8 | 虚拟周边商城 | 电子徽章/科普卡牌/壁纸，科普币经济，答题解锁联动 | `js/store.js` |

## 目录结构

```
Hongshuling/
├── README.md
└── birds/
    ├── index.html            # 2D 科普主应用入口
    ├── space.html            # 3D 深空迁徙地球（Three.js，需 WebGL）
    ├── config.js             # 全局配置：高德 Key / AI 模式 / 存储
    ├── styles.css            # 统一样式（深色科技风）
    ├── data/
    │   └── species.js        # 物种知识库（6 候鸟 + 3 红树植物，全功能共享）
    └── js/
        ├── util.js           # 存储 / DOM / 提示 工具
        ├── map.js            # 地图视图（高德 + 示意降级）
        ├── infocard.js       # 物种信息卡
        ├── quiz.js           # 趣味问答 + 解锁
        ├── messages.js       # 留言墙 UGC
        ├── ai.js             # AI 助手问答
        ├── share.js          # 好友分享
        ├── photo.js          # 照片识别迁徙路线
        ├── store.js          # 虚拟周边商城
        └── app.js            # 应用编排 / 导航 / 物种面板
```

## 配置（部署前必看）

编辑 `birds/config.js`：

- `AMAP_KEY`：高德 Web 端 JS API Key（[申请](https://lbs.amap.com/)）。**留空时自动使用示意地图**，其余功能不受影响。
- `AI_MODE`：`'local'`（内置知识引擎，离线可用）或 `'llm'`（调用兼容 OpenAI 的接口，需配置 `LLM.BASE_URL / API_KEY / CHAT_MODEL / VISION_MODEL`）。
  - ⚠️ 生产环境 LLM 调用务必经**后端代理**，切勿前端明文暴露密钥。
- `DATA_SOURCES` / `EBIRD_KEY`：预留给后续接入 iNaturalist/GBIF/eBird 实时观测数据（当前版本以知识库为主）。

## 技术栈

- 2D：原生 JS（ES5 IIFE 模块）+ 高德地图 JS API 2.0（可选）
- 3D：Three.js + CSS2DRenderer（`space.html`）
- 存储：localStorage（UGC / 进度 / 商城）；生产环境 UGC 与交易应替换为后端 + 内容审核
- 部署：nginx 等静态托管

## 本期修复的 Bug

- `space.html`：物种卡片 `species-obs` 误显示为"航线数"、`species-status` 误显示为颜色色值 → 改为"距离 / 出发→到达"；移除路线循环中的死代码 `midIdx/isMid`。
- `index.html`（旧版）：移除硬编码暴露的 eBird API Key（meta 标签）；重写为模块化入口。
- `quiz.js`：新增完成守卫，防止重复提交导致重复解锁/重复发币。

## 运行

```bash
# 任意静态服务器，例如：
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000/birds/index.html
# 3D 地球：http://localhost:8000/birds/space.html （需支持 WebGL 的浏览器）
```

> 说明：`birds/bird-data-layer.js` 为早期"实时观测热力图"原型，新主应用已内置自洽的地图与数据层，该文件暂不加载，保留作后续接入实时数据的参考。
