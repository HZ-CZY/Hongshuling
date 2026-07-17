# 🕊️ 羽迹·深湾 — 候鸟栖息地地图与深湾气象

> **"羽迹深湾，候鸟归途"** — Shenzhen Bay Bird Ecology & Migration Interactive Map

**访问地址：** [czynavigation.iamczy.cn/birds/](https://czynavigation.iamczy.cn/birds/)

**作者：** Don't Work Buddy | **ICP 备案：** 粤ICP备2026085151号-1

---

## 简介

"羽迹·深湾"是一个交互式候鸟生态科普 Web 应用，以深圳湾为核心，综合展示：

- **高德地图 2D 底图**上标记深圳湾核心候鸟物种
- **候鸟迁徙路线可视化** — Canvas 覆盖层绘制的迁徙路径（避免 AMap 覆盖物卡顿）
- **全球候鸟迁徙 3D 地球** — Three.js 三维地球展示 8 条全球经典迁徙路线
- **观鸟数据整合** — iNaturalist / GBIF / eBird 三大生态数据库的实时观鸟标记热力层
- **气象信息** — Open-Meteo 实时天气数据 + 恶劣天气预警
- **物种百科** — 每种鸟类的科普详情、真实照片、知识问答
- **AI 科普识别** — 豆包 API 驱动的模拟候鸟识别（科普演示）
- **深圳湾 CCTV 直播** — 一键跳转央视在线观鸟

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端框架** | Vue 3 (SPA) | Vite 构建 |
| **地图引擎** | 高德地图 AMap JS API v2.0 | 2D 模式，Canvas 覆盖层绕开 AMap 覆盖物卡顿 Bug |
| **3D 地球** | Three.js | 独立页面 `space.html`，展示全球迁徙路线 |
| **气象** | Open-Meteo API | 免费开源天气 API，WMO 天气代码转中文 |
| **观鸟数据** | iNaturalist · GBIF · eBird | 前端实时调用 + 服务端定时缓存 |
| **AI 识别** | 豆包 API | 科普演示，非真实图像识别 |
| **部署** | Nginx 反向代理 | 子路径 `/birds/` |
| **样式** | 毛玻璃 (Glassmorphism) · 暗色主题 | 自研 CSS |

---

## 功能详解

### 🗺️ 深圳湾生态地图

高德地图 2D 模式下显示深圳湾区域，左侧导航栏提供七大功能入口：

| 面板 | 功能 |
|------|------|
| ℹ️ 详情 | 当前选中物种的科普详情（描述、保护状况、栖息地等） |
| 🧠 问答 | 候鸟知识问答互动 |
| 💬 留言 | 用户留言墙 |
| 📸 照片 | 物种真实照片展示 |
| 🛍️ 商城 | 生态文创展示 |
| 🤖 AI | 豆包"观鸟识别"科普演示 |
| 📤 分享 | 分享链接 |

底部物种栏可滚动浏览所有物种，点击后显示其迁徙路线（Canvas 覆盖层绘制）。

### 🦅 候鸟迁徙路线

点击底部任一候鸟物种，地图上会以 Canvas 覆盖层绘制其从繁殖地到深圳湾的迁徙路径：

- **发光粗外管 + 细实线内管** — 视觉层次丰富
- **方向箭头** — 每段路径中点显示迁徙方向
- **途经点标记** — 起点（🛫 出发）→ 中途站 → 终点（📍 深圳湾）
- **完全避开 AMap Polyline/Marker** — 使用 `map.lngLatToContainer()` + Canvas 绘制，从根本上杜绝 AMap 覆盖物卡死 Bug

**已收录的深圳湾候鸟迁徙路线：**

| 物种 | 繁殖地 → 越冬地 | 路线颜色 |
|------|----------------|----------|
| 黑脸琵鹭 | 朝鲜半岛 → 深圳湾 | 🔴 #FF6B6B |
| 红嘴鸥 | 蒙古/贝加尔湖 → 深圳湾 | 🟢 #4ECDC4 |
| 大白鹭 | 长江中下游 → 深圳湾 | ⚪ #FFFFFF |
| 苍鹭 | 华北 → 深圳湾 | ⚪ #95A5A6 |
| 白腰杓鹬 | 西伯利亚 → 深圳湾 | 🟠 #F39C12 |
| 红颈滨鹬 | 北极苔原 → 深圳湾 | 🔵 #3498DB |

### 🌍 深空·羽迹 — 3D 迁徙地球

独立页面 `space.html`，使用 Three.js 构建的 3D 地球，展示全球 8 条经典候鸟迁徙路线：

- 北极燕鸥（格陵兰 → 南极）、斑尾塍鹬（阿拉斯加 → 新西兰）
- 阿穆尔隼（东北亚 → 南部非洲）、灰鹱（新西兰 → 北太平洋）
- 家燕（欧洲 → 南部非洲）、美洲鹤（加拿大 → 得克萨斯）
- 红喉北蜂鸟（北美 → 中美洲）、穗䳭（阿拉斯加 → 东非）

每一条路线以发光弧线 + 动态流动粒子呈现，支持交互切换。

### 📡 观鸟标记数据层

右下角观鸟标记面板集成了三大开放生态数据库：

| 数据源 | 数据量 | 特点 |
|--------|--------|------|
| **iNaturalist** | 每次 200 条 | 公民科学平台，含物种名、观测时间 |
| **GBIF** | 每次 300 条 | 全球生物多样性信息库，含个体计数 |
| **eBird** | 每次 100 条 | 康奈尔鸟类学实验室，含地点名 |

所有数据点通过 Canvas 覆盖层绘制为彩色圆点，无 AMap 覆盖物性能问题。

> ⚠️ eBird 需要 API Key，通过 `<meta name="ebird-key">` 配置。

### 🌤️ 实时气象

使用 Open-Meteo 免费 API 获取深圳湾实时天气：
- 温度、体感温度、湿度
- 风向（16 方位中文）、风力（蒲福风级）
- 天气状况（WMO 代码转中文 + emoji）
- 恶劣天气预警（6 级以上大风自动提示）

### 🎥 在线观鸟

一键跳转央视深圳湾候鸟直播，实时观察候鸟动态。

---

## 项目架构

```
/var/www/html/birds/
├── index.html              # 主入口 (Vue 3 SPA)
├── space.html              # 3D 迁徙地球 (Three.js)
├── assets/
│   ├── index-CBCtj4a_-v2.js    # 编译后的 Vue 3 应用
│   ├── index-DJNsTAI3.css      # 编译后的样式
│   ├── bird-data-BDCJr8YG.js   # 观鸟数据模块
│   └── textures/               # 地球贴图
├── bird-data-layer.js      # 观鸟数据整合层 (Canvas 覆盖层)
├── species-photos.js       # 物种照片注入
├── species-photos.css      # 照片样式
├── photo-ai-client.js      # 豆包 AI 识别客户端
├── photo-ai-bridge.js      # 豆包 API 桥接
├── photo-ai.css            # AI 识别面板样式
├── species-dock.css        # 底部物种栏样式
├── map-species-enhancements.css  # 地图增强样式
├── photos/                 # 物种真实照片
│   ├── black-faced-spoonbill.jpg
│   ├── great-egret.png
│   ├── black-headed-gull.jpeg
│   ├── common-kingfisher.png
│   ├── far-eastern-curlew.jpg
│   ├── red-necked-stint.png
│   ├── grey-heron.png
│   ├── ... and more (mangroves, crabs, mudskippers, etc.)
│   └── test/
└── data/                   # 服务端定时缓存 (JSON)
    ├── inaturalist.json
    ├── gbif.json
    └── ebird.json
```

---

## 关键技术决策

### 🚫 绕开 AMap 覆盖物卡死 Bug

高德地图 v2.0 的 `viewMode:"2D"` 模式下，创建 Marker / Polyline / MarkerClusterer 等覆盖物会导致地图拖拽和缩放卡死。

**解决方案：** 使用 Canvas 覆盖层完全替代 AMap 原生覆盖物。

```js
// 核心方法 — 将地理坐标转为屏幕像素
const pixel = map.lngLatToContainer(new AMap.LngLat(lng, lat));
// 然后在 Canvas 上直接用 ctx.arc() 绘制
```

Canvas 设置了 `pointer-events: none`，所有鼠标事件穿透到地图本身，彻底根除卡顿问题。

### 🎨 毛玻璃 (Glassmorphism) UI

全局应用 Apple 风格毛玻璃效果：`backdrop-filter: blur(12px)` + 半透明背景 + 细边框 + 暗色主题。

### 🌐 国内网络适配

- 所有依赖（npm 包、CDN 脚本）优先使用国内镜像
- iNaturalist / GBIF / eBird API 在中国大陆访问较慢，支持服务端定时缓存 JSON
- AMap JS API 使用国内 CDN

---

## 开发

### 本地启动

```bash
# 项目源码在 GitHub 仓库 HZ-CZY/Hongshuling
# 通过 gh-proxy.com 镜像克隆
git clone https://gh-proxy.com/github.com/HZ-CZY/Hongshuling.git
cd Hongshuling

# 安装依赖
npm install

# 开发服务器
npm run dev

# 生产构建
npm run build
```

### 构建配置

Vite 构建，输出到 `dist/`，部署到 nginx 的 `/birds/` 子路径。需要在 `vite.config.js` 中设置：

```js
base: '/birds/',
```

---

## 部署

当前部署于 Linux 服务器 (Debian 13)，通过 Nginx 反向代理提供服务：

```
https://czynavigation.iamczy.cn/birds/
```

子路径配置在 Nginx 的站点配置中，同时注入 ICP 备案信息。

---

## 数据来源与致谢

| 数据/服务 | 来源 |
|-----------|------|
| 高德地图 | [AMap JS API](https://lbs.amap.com/) |
| 气象数据 | [Open-Meteo](https://open-meteo.com/) |
| 观鸟数据 | [iNaturalist](https://www.inaturalist.org/), [GBIF](https://www.gbif.org/), [eBird](https://ebird.org/) |
| 迁徙路线资料 | Cornell Lab of Ornithology, RSPB, Wikipedia |
| 物种照片 | 互联网公开资源（仅供生态科普展示） |
| 3D 地球 | [Three.js](https://threejs.org/) |
| 直播流 | [CCTV 深圳湾候鸟直播](https://livechina.cctv.com/) |

迁徙路线基于公开科普资料描述的繁殖地、主要迁飞区域和越冬地绘制，并非实时卫星追踪轨迹，个体和年度之间会有差异。详见 [MIGRATION_SOURCES.md](MIGRATION_SOURCES.md)。

---

## 许可

- 代码部分：MIT License
- 数据和照片：仅供教育科普用途
- © 2026 刻忆间隔学习平台 by HZ-CZY (Don't Work Buddy)

---

## 相关项目

- [刻忆 (Keyi)](https://czynavigation.iamczy.cn/) — 间隔重复学习平台
- [诗云 (Shiyun)](https://czynavigation.iamczy.cn/poetry/) — 古诗词可视化
- [Eco-OS](https://czynavigation.iamczy.cn/eco-os/) — 智慧城市生态数据大屏
