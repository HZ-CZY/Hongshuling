# 🕊️ 羽迹·深湾 — 候鸟栖息地地图

深圳湾候鸟迁徙可视化平台。

## 内容

- **`/birds/`** — 2D 生态地图（Vue3 + 高德地图 AMap）
  - 候鸟物种信息、迁徙路线、观测数据、气象站
- **`/birds/space.html`** — 3D 深空迁徙视图（Three.js）
  - 立体地球、6条迁徙路线动画

## 技术栈

- 2D: Vue 3 + Vite + 高德地图 JS API 2.0
- 3D: Three.js + CSS2DRenderer
- 部署: nginx 静态托管
