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
  let map = null, AMap = null, heatmapLayers = {}, clickMarkers = {}, currentVisible = {};
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

  // ── 清除默认标记 ├─────────────────────────────────
  function clearDefaultOverlays() {
    try {
      map.clearMap();
      log('默认标记已清除');
    } catch(e) { warn('清除标记失败:', e); }
  }

  // ── 绘制物种路线 ├─────────────────────────────────
  function drawSpeciesRoute(speciesId) {
    // 清除之前绘制的
    if (speciesOverlays[speciesId]) {
      showSpeciesRoute(speciesId);
      return;
    }

    const route = ROUTE_DATA.find(r => r.id === speciesId);
    if (!route) return;

    const points = route.waypoints.map(w => [w.lng, w.lat]);
    const color = route.color;

    // 迁徙路线（折线）
    const polyline = new AMap.Polyline({
      path: points,
      strokeColor: color,
      strokeWeight: 3,
      strokeOpacity: 0.7,
      lineJoin: 'round',
      lineCap: 'round',
      strokeStyle: 'solid',
      showDir: true,
      dirColor: color,
      dirImg: 'https://webapi.amap.com/theme/v1.3/direction_arrow.png',
    });
    polyline.setMap(map);

    // 起终点标记
    const startMarker = createDotMarker(points[0], color, '●', 10);
    const endMarker = createDotMarker(points[points.length-1], color, '⬤', 14);

    // 途经点标记
    const viaMarkers = points.slice(1, -1).map(p => createDotMarker(p, color, '·', 6));

    speciesOverlays[speciesId] = { polyline, startMarker, endMarker, viaMarkers };

    // 自适应视野（延迟执行避免交互卡顿）
    setTimeout(() => {
      const bounds = new AMap.Bounds();
      points.forEach(p => bounds.extend(p));
      map.setBounds(bounds, { maxZoom: 10, padding: [60, 60] });
      // 确保交互可用
      map.setStatus({ dragEnable: true, zoomEnable: true });
    }, 100);
  }

  function createDotMarker(pos, color, symbol, size) {
    const m = new AMap.Marker({
      position: pos,
      content: `<div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:${color};border:2px solid rgba(255,255,255,0.6);
        box-shadow:0 0 8px ${color}88;
        display:flex;align-items:center;justify-content:center;
        font-size:${size-4}px;color:white;font-weight:bold;
      ">${symbol}</div>`,
      offset: new AMap.Pixel(-size/2, -size/2),
    });
    m.setMap(map);
    return m;
  }

  function showSpeciesRoute(speciesId) {
    const o = speciesOverlays[speciesId];
    if (!o) return;
    o.polyline.setMap(map);
    o.startMarker.setMap(map);
    o.endMarker.setMap(map);
    o.viaMarkers.forEach(m => m.setMap(map));
  }

  function hideAllSpeciesRoutes() {
    Object.values(speciesOverlays).forEach(o => {
      o.polyline.setMap(null);
      o.startMarker.setMap(null);
      o.endMarker.setMap(null);
      o.viaMarkers.forEach(m => m.setMap(null));
    });
  }

  // ── 监听底部物种栏点击 ─────────────────────────────
  let currentSpeciesId = null;
  function watchSpeciesClicks() {
    const observer = new MutationObserver(() => {
      const active = document.querySelector('.strip-item--active');
      if (!active) return;
      const title = active.getAttribute('title');
      if (!title) return;
      const route = ROUTE_DATA.find(r => r.name === title);
      if (route && route.id !== currentSpeciesId) {
        currentSpeciesId = route.id;
        hideAllSpeciesRoutes();
        drawSpeciesRoute(route.id);
      }
    });
    const strip = document.querySelector('.bottom-strip, [class*="strip"]');
    if (strip) {
      observer.observe(strip, { attributes: true, subtree: true, attributeFilter: ['class'] });
      log('物种栏监听已启动');
    } else {
      // 轮询等待
      const wait = setInterval(() => {
        const s = document.querySelector('.bottom-strip, [class*="strip"]');
        if (s) {
          clearInterval(wait);
          observer.observe(s, { attributes: true, subtree: true, attributeFilter: ['class'] });
          log('物种栏监听已启动（延迟）');
        }
      }, 500);
    }
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
    title.textContent = '📡 观鸟热力图';
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
          createHeatmap(src);
        } catch (err) {
          src._badge.textContent = '❌';
          document.getElementById('heatmap-status').textContent = `${src.name} 失败: ${err.message}`;
          warn(err);
        }
      } else { showHeatmap(src); }
    } else {
      src._row.style.cssText = src._baseStyle;
      hideHeatmap(src);
    }
  }

  function createHeatmap(src) {
    if (heatmapLayers[src.id]) { showHeatmap(src); return; }
    if (!src.data || !src.data.length) return;

    const heatData = src.data.map(p => ({ lng: p.lng, lat: p.lat, count: p.count || 1 }));
    const maxC = Math.max(...heatData.map(d => d.count), 1);

    // 使用 AMap.plugin 标准方式加载热力图插件
    log(`${src.name}: 加载 HeatmapLayer 插件...`);
    try {
      AMap.plugin(['AMap.HeatmapLayer'], () => {
        if (typeof AMap.HeatmapLayer !== 'function') {
          warn(`${src.name}: HeatmapLayer 插件加载后仍不可用`);
          document.getElementById('heatmap-status').textContent = `${src.name} ❌ 热力图插件不可用`;
          return;
        }
        log(`${src.name}: HeatmapLayer 插件就绪`);
        try {
          const h = new AMap.HeatmapLayer(map, {
            radius: 25,
            opacity: [0, 0.55],
            gradient: CFG.GRADIENTS[src.id] || CFG.GRADIENTS.inaturalist,
            zooms: [3, 18],
          });
          h.setDataSet({ data: heatData, max: maxC });
          heatmapLayers[src.id] = h;

          // 自动缩放
          const bounds = new AMap.Bounds();
          heatData.forEach(p => bounds.extend([p.lng, p.lat]));
          map.setBounds(bounds, { maxZoom: 10, padding: [40, 40] });

          document.getElementById('heatmap-status').textContent = `${src.name}: ✅ ${heatData.length} 点`;
          log(`${src.name}: 热力图创建成功`);
        } catch(e) {
          warn(`${src.name}: 热力图创建失败`, e);
          document.getElementById('heatmap-status').textContent = `${src.name} ❌ 渲染失败`;
        }
      });
    } catch(e) {
      warn(`${src.name}: AMap.plugin 调用失败`, e);
      document.getElementById('heatmap-status').textContent = `${src.name} ❌ 插件加载失败`;
    }
  }

  function showHeatmap(src) {
    const h = heatmapLayers[src.id];
    if (h) { h.setMap(map); log(`${src.name} 热力图已显示`); }
  }
  function hideHeatmap(src) {
    const h = heatmapLayers[src.id];
    if (h) { h.setMap(null); }
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

  // ── 初始化 ──────────────────────────────────────
  async function init() {
    log('初始化...');
    try { await waitForMap(); } catch(e) { warn('地图未就绪'); return; }

    // 清除默认路线/标记
    setTimeout(() => {
      // Do not call map.clearMap() here: it removes every clickable species
      // marker that the main application has just rendered.
      // 监听物种点击
      watchSpeciesClicks();
    }, 1500);

    // 注册热力图数据源
    createSource('inaturalist', 'iNaturalist', CFG.COLORS.inaturalist, fetchINaturalist);
    createSource('gbif', 'GBIF', CFG.COLORS.gbif, fetchGBIF);
    createSource('ebird', 'eBird', CFG.COLORS.ebird, fetchEbird);
    createPanel();

    log('✅ 初始化完成');
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
})();
