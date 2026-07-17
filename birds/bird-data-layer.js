/**
 * 羽迹·深湾 — 观鸟数据整合层
 * 聚合 iNaturalist / GBIF / eBird 三大数据源
 * 以聚合标记（MarkerClusterer）叠加在地图上
 */

(function () {
  'use strict';

  // 配置
  const CFG = {
    // 中国大致边界（用于 API 过滤）
    CHINA_BBOX: { swlat: 18, swlng: 73, nelat: 54, nelng: 135 },
    // 颜色方案
    COLORS: {
      inaturalist: '#4CAF50',
      gbif: '#2196F3',
      ebird: '#FF9800',
      local: '#9C27B0',
    },
  };

  // ── 等待地图就绪 ──────────────────────────────────
  let map = null;
  let AMap = null;

  function waitForMap(maxWait = 15000) {
    return new Promise((resolve, reject) => {
      const check = () => {
        if (window.__birdsMap && window.__birdsAMap) {
          map = window.__birdsMap;
          AMap = window.__birdsAMap;
          resolve();
          return;
        }
        if (Date.now() - start > maxWait) {
          reject(new Error('地图加载超时'));
          return;
        }
        setTimeout(check, 200);
      };
      const start = Date.now();
      check();
    });
  }

  // ── 数据源管理 ────────────────────────────────────
  const sources = {};
  let markerClusterers = {};
  let currentVisible = {};

  function createSource(id, name, color, fetcher) {
    sources[id] = { id, name, color, fetcher, data: null, loaded: false };
    currentVisible[id] = false;
  }

  // ── 创建 UI 面板 ──────────────────────────────────
  function createPanel() {
    const panel = document.createElement('div');
    panel.id = 'bird-data-panel';
    panel.style.cssText = `
      position: fixed; bottom: 80px; right: 16px; z-index: 1000;
      display: flex; flex-direction: column; gap: 4px;
      background: rgba(8,18,35,0.75); backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px; padding: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
      font-size: 11px; color: #e0f0ff;
      min-width: 120px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.4);
      transition: all 0.3s;
    `;

    // 标题
    const title = document.createElement('div');
    title.textContent = '📡 观鸟数据源';
    title.style.cssText = 'font-size: 10px; opacity: 0.5; letter-spacing: 1px; padding: 2px 4px 4px; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 2px;';

    panel.appendChild(title);

    // 每个数据源一个按钮
    Object.values(sources).forEach(src => {
      const btn = document.createElement('div');
      btn.dataset.source = src.id;
      btn.style.cssText = `
        display: flex; align-items: center; gap: 6px;
        padding: 4px 8px; border-radius: 8px;
        cursor: pointer; transition: all 0.2s;
        background: transparent;
        border: 1px solid transparent;
        opacity: 0.5;
      `;
      btn.onmouseenter = () => { if (!currentVisible[src.id]) btn.style.background = 'rgba(255,255,255,0.04)'; };
      btn.onmouseleave = () => { if (!currentVisible[src.id]) btn.style.background = 'transparent'; };
      btn.onclick = () => toggleSource(src.id);

      const dot = document.createElement('span');
      dot.style.cssText = `
        width: 8px; height: 8px; border-radius: 50%;
        background: ${src.color}; flex-shrink: 0;
      `;

      const label = document.createElement('span');
      label.textContent = src.name;
      label.style.flex = '1';

      const badge = document.createElement('span');
      badge.id = `badge-${src.id}`;
      badge.textContent = '⋯';
      badge.style.cssText = 'font-size: 10px; opacity: 0.4;';

      btn.appendChild(dot);
      btn.appendChild(label);
      btn.appendChild(badge);
      panel.appendChild(btn);

      // 存引用
      src._btn = btn;
      src._badge = badge;
    });

    document.body.appendChild(panel);
  }

  // ── 切换数据源 ────────────────────────────────────
  async function toggleSource(id) {
    const src = sources[id];
    if (!src) return;

    currentVisible[id] = !currentVisible[id];

    if (currentVisible[id]) {
      // 激活
      src._btn.style.cssText = `
        display: flex; align-items: center; gap: 6px;
        padding: 4px 8px; border-radius: 8px;
        cursor: pointer; transition: all 0.2s;
        background: ${src.color}18;
        border: 1px solid ${src.color}44;
        opacity: 1;
      `;

      if (!src.loaded) {
        src._badge.textContent = '加载中...';
        try {
          const data = await src.fetcher();
          src.data = data;
          src.loaded = true;
          src._badge.textContent = data.length + ' 条';
          addMarkers(src);
        } catch (err) {
          src._badge.textContent = '❌ 失败';
          console.error(`[羽迹·数据层] ${src.name} 加载失败:`, err);
        }
      } else {
        showMarkers(src);
      }
    } else {
      // 关闭
      src._btn.style.cssText = `
        display: flex; align-items: center; gap: 6px;
        padding: 4px 8px; border-radius: 8px;
        cursor: pointer; transition: all 0.2s;
        background: transparent;
        border: 1px solid transparent;
        opacity: 0.5;
      `;
      hideMarkers(src);
    }
  }

  // ── 标记管理 ────────────────────────────────────
  function addMarkers(src) {
    if (markerClusterers[src.id]) {
      showMarkers(src);
      return;
    }
    if (!src.data || src.data.length === 0) return;

    // 创建 AMap 标记
    const markers = src.data.map(pt => {
      const marker = new AMap.Marker({
        position: [pt.lng, pt.lat],
        size: new AMap.Size(8, 8),
        offset: new AMap.Pixel(-4, -4),
        content: `<div style="
          width:10px;height:10px;border-radius:50%;
          background:${src.color};
          border:2px solid rgba(255,255,255,0.5);
          box-shadow:0 0 6px ${src.color}66;
        "></div>`,
        title: pt.label || '',
      });

      // 点击显示详情
      if (pt.label) {
        marker.on('click', () => {
          const info = new AMap.InfoWindow({
            content: `<div style="padding:6px 10px;font-size:12px;color:#333;max-width:240px;line-height:1.6">
              <strong>${pt.label}</strong>
              ${pt.date ? '<br>📅 ' + pt.date : ''}
              ${pt.count ? '<br>📊 数量: ' + pt.count : ''}
              ${pt.source ? '<br><span style="opacity:0.5;font-size:10px;">来源: ' + pt.source + '</span>' : ''}
            </div>`,
            offset: new AMap.Pixel(0, -10),
          });
          info.open(map, [pt.lng, pt.lat]);
        });
      }
      return marker;
    });

    if (markers.length === 0) return;

    // 使用 AMap 插件加载 MarkerClusterer
    AMap.plugin(['AMap.MarkerClusterer'], () => {
      markerClusterers[src.id] = new AMap.MarkerClusterer(map, markers, {
        gridSize: 60,
        minClusterSize: 2,
        maxZoom: 14,
        styles: [{
          url: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="18" fill="${src.color}" opacity="0.8" stroke="#fff" stroke-width="2"/></svg>`),
          size: new AMap.Size(40, 40),
          offset: new AMap.Pixel(-20, -20),
          textColor: '#fff',
          textSize: 12,
        }],
      });
    });
  }

  function showMarkers(src) {
    if (markerClusterers[src.id]) {
      markerClusterers[src.id].setMap(map);
    }
  }

  function hideMarkers(src) {
    if (markerClusterers[src.id]) {
      markerClusterers[src.id].setMap(null);
    }
  }

  // ── API 数据获取器 ──────────────────────────────
  const BBOX_CHINA = 'nelat=54&nelng=135&swlat=18&swlng=73';

  // iNaturalist — 鸟纲 (taxon_id=21255)
  async function fetchINaturalist() {
    const perPage = 200;
    // 获取近期的中国鸟类观测
    const url = `https://api.inaturalist.org/v1/observations?taxon_id=21255&per_page=${perPage}&order=desc&order_by=created_at&${BBOX_CHINA}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    return (json.results || []).map(obs => {
      const geo = obs.geojson?.coordinates;
      if (!geo) return null;
      const name = obs.taxon?.preferred_common_name || obs.taxon?.name || '未知';
      const user = obs.user?.login || '';
      return {
        lat: geo[1], lng: geo[0],
        label: name + (user ? ' (by ' + user + ')' : ''),
        date: (obs.observed_on_details?.date || '').replace(/-/g, '/'),
        source: 'iNaturalist',
        count: 1,
      };
    }).filter(Boolean);
  }

  // GBIF — 鸟纲 (taxonKey=21255), 中国 (country=CN)
  async function fetchGBIF() {
    const limit = 300;
    const url = `https://api.gbif.org/v1/occurrence/search?taxonKey=21255&country=CN&limit=${limit}&hasCoordinate=true`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    return (json.results || []).map(r => {
      if (r.decimalLatitude == null || r.decimalLongitude == null) return null;
      const name = r.vernacularName || r.species || r.kingdom || '未知';
      const date = r.eventDate ? r.eventDate.split('T')[0].replace(/-/g, '/') : '';
      return {
        lat: r.decimalLatitude, lng: r.decimalLongitude,
        label: name,
        date,
        source: 'GBIF',
        count: r.individualCount || 1,
      };
    }).filter(Boolean);
  }

  // eBird — 需要 API Key，用中国区域码 CN
  // 从 window.__EBIRD_API_KEY 读取，或在页面中设置 <meta name="ebird-key" content="xxx">
  async function fetchEbird() {
    const meta = document.querySelector('meta[name="ebird-key"]');
    const apiKey = window.__EBIRD_API_KEY || (meta ? meta.content : null);
    if (!apiKey) {
      console.warn('[羽迹·数据层] 未配置 eBird API Key。请在 index.html 添加 <meta name="ebird-key" content="你的key">');
      throw new Error('需要 eBird API Key（免费申请: https://ebird.org/api/keygen）');
    }
    const url = `https://api.ebird.org/v2/data/obs/CN/recent?maxResults=100`;
    const resp = await fetch(url, {
      headers: { 'X-eBirdApiToken': apiKey }
    });
    if (resp.status === 401) throw new Error('需要 eBird API Key');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    return (json || []).map(r => ({
      lat: r.lat, lng: r.lng,
      label: r.comName + (r.locName ? ' @ ' + r.locName : ''),
      date: r.obsDt || '',
      source: 'eBird',
      count: r.howMany || 1,
    }));
  }

  // ── 初始化 ──────────────────────────────────────
  async function init() {
    try {
      await waitForMap();
    } catch (e) {
      console.warn('[羽迹·数据层] 地图未就绪，跳过');
      return;
    }

    // 注册数据源（eBird 需要 API key，先注册但标记）
    createSource('inaturalist', 'iNaturalist', CFG.COLORS.inaturalist, fetchINaturalist);
    createSource('gbif', 'GBIF', CFG.COLORS.gbif, fetchGBIF);
    createSource('ebird', 'eBird', CFG.COLORS.ebird, fetchEbird);

    createPanel();

    // 自动加载本地数据源（已有的深圳湾采样数据）
    // 这里保持原有的 ObserationMarkers 组件运作，无需额外处理

    console.log('[羽迹·数据层] 初始化完成');
  }

  // 页面加载完成后启动
  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }
})();
