/**
 * 羽迹·深湾 — 观鸟数据整合层 v3
 * 1. 清除默认路线/标记，改为点击底部物种栏才显示
 * 2. 热力图通过 AMap.plugin 标准方式加载
 * 3. 点击物种显示其迁徙路线 + 标记
 */
(function () {
  'use strict';

  // ── 路线数据（与主应用同步） ──────────────────────
  const ROUTE_DATA = [
    {id:"black-faced-spoonbill",name:"黑脸琵鹭",color:"#FF6B6B",
      waypoints:[{lng:126.5,lat:38},{lng:125.2,lat:36.5},{lng:124,lat:34},{lng:122.5,lat:31.5},{lng:121,lat:29},{lng:119.8,lat:26.5},{lng:117.5,lat:24},{lng:113.95,lat:22.52}]},
    {id:"black-headed-gull",name:"红嘴鸥",color:"#4ECDC4",
      waypoints:[{lng:110,lat:48},{lng:112,lat:44},{lng:115,lat:40},{lng:117,lat:37},{lng:119,lat:33},{lng:120,lat:29},{lng:117.5,lat:25},{lng:113.95,lat:22.52}]},
    {id:"great-egret",name:"大白鹭",color:"#FFFFFF",
      waypoints:[{lng:118,lat:30},{lng:117.5,lat:28},{lng:116.5,lat:25.5},{lng:115,lat:24},{lng:113.95,lat:22.52}]},
    {id:"grey-heron",name:"苍鹭",color:"#95A5A6",
      waypoints:[{lng:120,lat:34},{lng:119.5,lat:31.5},{lng:119,lat:28.5},{lng:118,lat:26},{lng:116,lat:24},{lng:113.95,lat:22.52}]},
    {id:"eurasian-curlew",name:"白腰杓鹬",color:"#F39C12",
      waypoints:[{lng:115,lat:50},{lng:117,lat:45},{lng:118,lat:40},{lng:119.5,lat:35},{lng:120,lat:30},{lng:118,lat:26},{lng:115.5,lat:23.5},{lng:113.95,lat:22.52}]},
    {id:"red-necked-stint",name:"红颈滨鹬",color:"#3498DB",
      waypoints:[{lng:120,lat:65},{lng:122,lat:55},{lng:123,lat:45},{lng:122,lat:38},{lng:121,lat:32},{lng:119,lat:26},{lng:113.95,lat:22.52}]},
  ];

  const CFG = {
    CHINA_BBOX: 'nelat=54&nelng=135&swlat=18&swlng=73',
    COLORS: { inaturalist: '#4CAF50', gbif: '#2196F3', ebird: '#FF9800' },
    GRADIENTS: {
      inaturalist: {0.35:'rgba(76,175,80,0.01)',0.5:'#4CAF50',0.7:'#2E7D32',0.85:'#1B5E20',1.0:'#003300'},
      gbif:        {0.35:'rgba(33,150,243,0.01)',0.5:'#2196F3',0.7:'#1565C0',0.85:'#0D47A1',1.0:'#001a4d'},
      ebird:       {0.35:'rgba(255,152,0,0.01)',0.5:'#FF9800',0.7:'#E65100',0.85:'#BF360C',1.0:'#7f0000'},
    },
  };

  function log(...a) { console.log('[🌡️ 羽迹]', ...a); }
  function warn(...a) { console.warn('[🌡️ 羽迹]', ...a); }

  // ── 等待地图就绪 ──────────────────────────────────
  let map = null, AMap = null, currentVisible = {};
  let speciesOverlays = {}; // {speciesId: {polyline, markers}}

  function waitForMap(maxWait = 25000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = () => {
        if (window.__birdsMap && window.__birdsAMap) {
          map = window.__birdsMap; AMap = window.__birdsAMap;
          log('地图就绪');
          resolve(); return;
        }
        if (Date.now() - start > maxWait) { reject(new Error('超时')); return; }
        setTimeout(check, 300);
      };
      check();
    });
  }

  // ── 绘制物种路线（Canvas 覆盖层，避免 AMap 覆盖物卡顿）─
  let routeCanvas = null;
  let routeCtx = null;
  let routeData = null;
  let routeColor = '#FF6B6B';

  function drawSpeciesRoute(speciesId) {
    const route = ROUTE_DATA.find(r => r.id === speciesId);
    if (!route) return;
    routeColor = route.color;
    routeData = route;

    // 创建或获取 Canvas
    if (!routeCanvas) {
      routeCanvas = document.createElement('canvas');
      routeCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:51;';
      routeCanvas.width = 1;
      routeCanvas.height = 1;
      const container = map.getContainer();
      container.style.position = 'relative';
      container.appendChild(routeCanvas);
      routeCtx = routeCanvas.getContext('2d');
    }
    routeCanvas.style.display = 'block';

    // 绘制函数
    function drawRoute() {
      if (!routeCanvas || !routeCtx || !routeData) return;
      const container = map.getContainer();
      const rect = container.getBoundingClientRect();
      const w = rect.width, h = rect.height;
      if (routeCanvas.width !== w || routeCanvas.height !== h) {
        routeCanvas.width = w;
        routeCanvas.height = h;
      }
      const ctx = routeCtx;
      ctx.clearRect(0, 0, w, h);

      const points = routeData.waypoints;
      // 转换所有点到屏幕坐标
      const screenPts = points.map(p => {
        const px = map.lngLatToContainer(new AMap.LngLat(p.lng, p.lat));
        return px ? { x: px.getX(), y: px.getY() } : null;
      }).filter(p => p !== null);

      if (screenPts.length < 2) return;

      // 画迁徙路线（粗发光外管）
      ctx.beginPath();
      ctx.moveTo(screenPts[0].x, screenPts[0].y);
      for (let i = 1; i < screenPts.length; i++) {
        ctx.lineTo(screenPts[i].x, screenPts[i].y);
      }
      ctx.strokeStyle = routeColor;
      ctx.lineWidth = 8;
      ctx.globalAlpha = 0.2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      // 画迁徙路线（内管）
      ctx.beginPath();
      ctx.moveTo(screenPts[0].x, screenPts[0].y);
      for (let i = 1; i < screenPts.length; i++) {
        ctx.lineTo(screenPts[i].x, screenPts[i].y);
      }
      ctx.strokeStyle = routeColor;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.85;
      ctx.stroke();

      // 画方向箭头（间隔绘制）
      for (let i = 1; i < screenPts.length; i++) {
        const prev = screenPts[i - 1], curr = screenPts[i];
        const mx = (prev.x + curr.x) / 2, my = (prev.y + curr.y) / 2;
        const angle = Math.atan2(curr.y - prev.y, curr.x - prev.x);
        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-4, -5);
        ctx.lineTo(-4, 5);
        ctx.closePath();
        ctx.fillStyle = routeColor;
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.restore();
      }

      ctx.globalAlpha = 1;

      // 画途经点标记
      screenPts.forEach((pt, i) => {
        const size = (i === 0 || i === screenPts.length - 1) ? 12 : 7;
        const isEnd = i === screenPts.length - 1;
        const color = isEnd ? '#FFD700' : routeColor;
        const glow = isEnd ? '#FFD70088' : routeColor + '88';

        // 发光
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, size + 4, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.globalAlpha = 0.3;
        ctx.fill();

        // 实心圆
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.9;
        ctx.fill();

        // 边框
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // 起点标签
        if (i === 0) {
          ctx.fillStyle = 'white';
          ctx.font = '11px sans-serif';
          ctx.globalAlpha = 0.8;
          ctx.textAlign = 'center';
          ctx.fillText('🛫 出发', pt.x, pt.y - size - 6);
        }
        // 终点标签
        if (isEnd) {
          ctx.fillStyle = '#FFD700';
          ctx.font = 'bold 11px sans-serif';
          ctx.globalAlpha = 0.9;
          ctx.textAlign = 'center';
          ctx.fillText('📍 深圳湾', pt.x, pt.y - size - 6);
        }
        ctx.globalAlpha = 1;
      });
    }

    // 保存 handlers 以便移除
    if (routeCanvas._handlers) {
      routeCanvas._handlers.forEach((fn, evt) => map.off(evt, fn));
    }
    const moveHandler = () => drawRoute();
    map.on('moveend', moveHandler);
    map.on('zoomend', moveHandler);
    map.on('resize', moveHandler);
    routeCanvas._handlers = new Map([['moveend', moveHandler], ['zoomend', moveHandler], ['resize', moveHandler]]);

    setTimeout(drawRoute, 50);
  }

  function hideAllSpeciesRoutes() {
    if (routeCanvas) {
      routeCanvas.style.display = 'none';
      if (routeCanvas._handlers) {
        routeCanvas._handlers.forEach((fn, evt) => map.off(evt, fn));
        routeCanvas._handlers = null;
      }
      if (routeCtx) routeCtx.clearRect(0, 0, routeCanvas.width, routeCanvas.height);
    }
  }

  // ── 监听底部物种栏点击 ─────────────────────────────
  let currentSpeciesId = null;
  function watchSpeciesClicks() {
    // 改用直接事件委托，避免 MutationObserver 与 Vue 冲突
    document.addEventListener('click', (e) => {
      const item = e.target.closest('.strip-item');
      if (!item) return;
      const title = item.getAttribute('title');
      if (!title) return;
      const route = ROUTE_DATA.find(r => r.name === title);
      if (route && route.id !== currentSpeciesId) {
        currentSpeciesId = route.id;
        hideAllSpeciesRoutes();
        drawSpeciesRoute(route.id);
      } else if (!route) {
        // 没有迁徙路线的鸟，清除当前路径
        currentSpeciesId = null;
        hideAllSpeciesRoutes();
      }
    });
    log('物种栏点击监听已启动');
  }

  // ── 热力图 ──────────────────────────────────────────
  const sources = {};
  function createSource(id, name, color, fetcher) {
    sources[id] = { id, name, color, fetcher, data: null, loaded: false, hide: false };
    currentVisible[id] = false;
  }

  function createPanel() {
    const panel = document.createElement('div');
    panel.id = 'bird-data-panel';
    panel.style.cssText = `
      position:fixed;bottom:80px;right:16px;z-index:9999;
      display:flex;flex-direction:column;gap:4px;
      background:rgba(8,18,35,0.85);backdrop-filter:blur(12px);
      -webkit-backdrop-filter:blur(12px);
      border:1px solid rgba(255,255,255,0.08);border-radius:12px;
      padding:8px;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif;
      font-size:11px;color:#e0f0ff;min-width:130px;
      box-shadow:0 4px 24px rgba(0,0,0,0.4);`;

    const title = document.createElement('div');
    title.textContent = '📡 观鸟标记';
    title.style.cssText = 'font-size:10px;opacity:0.6;letter-spacing:1px;padding:2px 4px 6px;border-bottom:1px solid rgba(255,255,255,0.06);';
    panel.appendChild(title);

    Object.values(sources).forEach(src => {
      const row = document.createElement('div');
      const baseStyle = 'display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:8px;cursor:pointer;transition:all 0.2s;background:transparent;border:1px solid transparent;opacity:0.5;';
      row.style.cssText = baseStyle;
      row.onmouseenter = () => { if (!currentVisible[src.id]) row.style.background = 'rgba(255,255,255,0.06)'; };
      row.onmouseleave = () => { if (!currentVisible[src.id]) row.style.background = 'transparent'; };
      row.onclick = () => toggleSource(src.id);

      const dot = document.createElement('span');
      dot.style.cssText = `width:9px;height:9px;border-radius:50%;background:${src.color};flex-shrink:0;box-shadow:0 0 6px ${src.color}88;`;
      const label = document.createElement('span');
      label.textContent = src.name;
      label.style.cssText = 'flex:1;font-weight:500;';
      const badge = document.createElement('span');
      badge.id = `badge-${src.id}`;
      badge.textContent = '○';
      badge.style.cssText = 'font-size:10px;opacity:0.4;';

      row.appendChild(dot); row.appendChild(label); row.appendChild(badge);
      panel.appendChild(row);
      src._row = row; src._badge = badge; src._baseStyle = baseStyle;
    });

    const status = document.createElement('div');
    status.id = 'heatmap-status';
    status.style.cssText = 'font-size:9px;opacity:0.35;padding:4px 4px 0;text-align:center;border-top:1px solid rgba(255,255,255,0.05);margin-top:2px;';
    status.textContent = '点击加载热力图';
    panel.appendChild(status);
    document.body.appendChild(panel);
    log('面板已创建');
  }
  // ── 物种标记（Canvas 覆盖层）────────────────────
  let canvasLayers = {};
  
  async function toggleSource(id) {
    const src = sources[id]; if (!src) return;
    currentVisible[id] = !currentVisible[id];

    if (currentVisible[id]) {
      src._row.style.cssText = src._baseStyle + `background:${src.color}18!important;border-color:${src.color}44!important;opacity:1!important;`;
      if (!src.loaded) {
        src._badge.textContent = '⏳';
        document.getElementById('heatmap-status').textContent = `加载 ${src.name}...`;
        try {
          const data = await src.fetcher();
          src.data = data; src.loaded = true;
          src._badge.textContent = data.length + ' 条';
          document.getElementById('heatmap-status').textContent = `${src.name}: ${data.length} 条`;
          createCanvasLayer(src);
        } catch (err) {
          src._badge.textContent = '❌';
          document.getElementById('heatmap-status').textContent = `${src.name} 失败: ${err.message}`;
          warn(err);
        }
      } else { showCanvasLayer(src); }
    } else {
      src._row.style.cssText = src._baseStyle;
      hideCanvasLayer(src);
    }
  }

  function createCanvasLayer(src) {
    if (canvasLayers[src.id]) { showCanvasLayer(src); return; }
    if (!src.data || !src.data.length) return;

    log(`${src.name}: 创建 Canvas 覆盖层 (${src.data.length} 点)...`);

    // 创建 Canvas 元素
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:50;';
    canvas.width = 1;
    canvas.height = 1;

    // 获取地图容器
    const container = map.getContainer();
    container.style.position = 'relative';
    container.appendChild(canvas);

    // 保存数据
    canvasLayers[src.id] = { canvas, data: src.data, color: src.color, name: src.name };

    // 绘制函数
    function draw() {
      if (!canvas || !canvas.parentNode) return;
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      
      // 只在尺寸变化时重置 canvas 大小
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);

      const pts = src.data;
      // 限制绘制数量避免卡顿
      const max = Math.min(pts.length, 500);
      
      for (let i = 0; i < max; i++) {
        const p = pts[i];
        // 将经纬度转为屏幕坐标
        const pixel = map.lngLatToContainer(new AMap.LngLat(p.lng, p.lat));
        if (!pixel) continue;
        const x = pixel.getX();
        const y = pixel.getY();
        // 只绘制在视口内的点
        if (x < -10 || x > w + 10 || y < -10 || y > h + 10) continue;

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = src.color;
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // 首次绘制
    setTimeout(draw, 50);

    // 地图每次移动/缩放重新绘制
    const moveHandler = () => draw();
    map.on('moveend', moveHandler);
    map.on('zoomend', moveHandler);
    map.on('resize', moveHandler);

    canvasLayers[src.id]._handlers = { moveend: moveHandler, zoomend: moveHandler, resize: moveHandler };

    // 自动缩放
    const bounds = new AMap.Bounds();
    src.data.forEach(p => bounds.extend([p.lng, p.lat]));
    map.setBounds(bounds, { maxZoom: 10, padding: [40, 40] });

    document.getElementById('heatmap-status').textContent = `${src.name}: ✅ ${src.data.length} 点`;
    log(`${src.name}: Canvas 覆盖层创建成功`);
  }

  function showCanvasLayer(src) {
    const layer = canvasLayers[src.id];
    if (layer && layer.canvas) {
      layer.canvas.style.display = 'block';
      // 重新绘制（因为可能移动了地图）
      const container = map.getContainer();
      const rect = container.getBoundingClientRect();
      layer.canvas.width = rect.width;
      layer.canvas.height = rect.height;
      const ctx = layer.canvas.getContext('2d');
      ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
      const max = Math.min(layer.data.length, 500);
      for (let i = 0; i < max; i++) {
        const p = layer.data[i];
        const pixel = map.lngLatToContainer(new AMap.LngLat(p.lng, p.lat));
        if (!pixel) continue;
        const x = pixel.getX(), y = pixel.getY();
        if (x < -10 || x > layer.canvas.width + 10 || y < -10 || y > layer.canvas.height + 10) continue;
        const ctx2 = ctx;
        ctx2.beginPath();
        ctx2.arc(x, y, 5, 0, Math.PI * 2);
        ctx2.fillStyle = layer.color;
        ctx2.globalAlpha = 0.7;
        ctx2.fill();
        ctx2.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx2.lineWidth = 1.5;
        ctx2.stroke();
        ctx2.globalAlpha = 1;
      }
    }
  }
  function hideCanvasLayer(src) {
    const layer = canvasLayers[src.id];
    if (layer && layer.canvas) {
      layer.canvas.style.display = 'none';
    }
  }

  // ── API 获取器 ────────────────────────────────────
  const BBOX = CFG.CHINA_BBOX;

  async function fetchINaturalist() {
    const r = await fetch(`https://api.inaturalist.org/v1/observations?taxon_id=3&per_page=200&order=desc&order_by=created_at&${BBOX}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    return (j.results||[]).map(o => {
      const g = o.geojson?.coordinates; if (!g) return null;
      return { lat: g[1], lng: g[0], label: o.taxon?.preferred_common_name||o.taxon?.name||'?', date: (o.observed_on_details?.date||'').replace(/-/g,'/'), source:'iNaturalist', count:1 };
    }).filter(Boolean);
  }

  async function fetchGBIF() {
    const r = await fetch(`https://api.gbif.org/v1/occurrence/search?taxonKey=212&country=CN&limit=300&hasCoordinate=true`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    return (j.results||[]).map(o => {
      if (o.decimalLatitude==null||o.decimalLongitude==null) return null;
      return { lat: o.decimalLatitude, lng: o.decimalLongitude, label: o.vernacularName||o.species||'?', date: o.eventDate?.split('T')[0]?.replace(/-/g,'')||'', source:'GBIF', count: o.individualCount||1 };
    }).filter(Boolean);
  }

  async function fetchEbird() {
    const key = document.querySelector('meta[name="ebird-key"]')?.content||window.__EBIRD_API_KEY;
    if (!key) throw new Error('需要 eBird API Key');
    const r = await fetch('https://api.ebird.org/v2/data/obs/CN/recent?maxResults=100', { headers: {'X-eBirdApiToken': key} });
    if (r.status===401) throw new Error('Key 无效');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    return (j||[]).map(o => ({ lat: o.lat, lng: o.lng, label: o.comName+(o.locName?' @ '+o.locName:''), date: o.obsDt||'', source:'eBird', count: o.howMany||1 }));
  }

  // ── 在线观鸟 ──────────────────────────────────────
  function addLiveBirdButton() {
    const btn = document.createElement('div');
    btn.id = 'live-bird-btn';
    btn.textContent = '📺 在线观鸟';
    btn.title = '在新标签页打开 CCTV 深圳湾候鸟直播';
    btn.style.cssText = `
      position:fixed;bottom:80px;right:155px;z-index:9998;
      padding:6px 12px;border-radius:20px;
      background:rgba(8,18,35,0.8);backdrop-filter:blur(8px);
      border:1px solid rgba(255,255,255,0.1);
      font:11px -apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif;
      color:#e0f0ff;cursor:pointer;
      box-shadow:0 2px 12px rgba(0,0,0,0.3);
      transition:all 0.2s;
    `;
    btn.onmouseenter = () => { btn.style.background = 'rgba(0,200,200,0.2)'; btn.style.borderColor = 'rgba(0,200,200,0.3)'; };
    btn.onmouseleave = () => { btn.style.background = 'rgba(8,18,35,0.8)'; btn.style.borderColor = 'rgba(255,255,255,0.1)'; };
    btn.onclick = () => window.open('https://livechina.cctv.com/live_zb/LIVE5048.html?pageid=5048&tag=MicroLiveType', '_blank');
    document.body.appendChild(btn);
    log('在线观鸟按钮已创建');
  }

  // ── 本地数据加载器（服务端定时拉取缓存）────────────
  async function fetchLocal(name) {
    const resp = await fetch(`/birds/data/${name}.json`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  }

  // ── 初始化 ──────────────────────────────────────
  async function init() {
    log('初始化...');
    try { await waitForMap(); } catch(e) { warn('地图未就绪'); return; }

    // 启动物种点击监听
    setTimeout(() => { watchSpeciesClicks(); }, 500);

    // 注册数据源（使用本地缓存优先）
    createSource('inaturalist', 'iNaturalist', CFG.COLORS.inaturalist, () => fetchLocal('inaturalist'));
    createSource('gbif', 'GBIF', CFG.COLORS.gbif, () => fetchLocal('gbif'));
    createSource('ebird', 'eBird', CFG.COLORS.ebird, () => fetchLocal('ebird'));
    // 热力图面板暂时隐藏
    // createPanel();

    // 在线观鸟按钮
    addLiveBirdButton();
    log('✅ 初始化完成');
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
})();
