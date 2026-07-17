/**
 * 羽迹·深湾 — 观鸟数据整合层 v2
 * 聚合 iNaturalist / GBIF / eBird 三大数据源
 * 以热力图（AMap.HeatmapLayer）叠加在地图上
 */
(function () {
  'use strict';

  const CFG = {
    CHINA_BBOX: 'nelat=54&nelng=135&swlat=18&swlng=73',
    COLORS: {
      inaturalist: '#4CAF50',
      gbif: '#2196F3',
      ebird: '#FF9800',
    },
    GRADIENTS: {
      inaturalist: {0.4:'rgba(76,175,80,0.3)', 0.6:'#2E7D32', 0.8:'#1B5E20', 1.0:'#003300'},
      gbif:        {0.4:'rgba(33,150,243,0.3)', 0.6:'#1565C0', 0.8:'#0D47A1', 1.0:'#001a4d'},
      ebird:       {0.4:'rgba(255,152,0,0.3)',  0.6:'#E65100', 0.8:'#BF360C', 1.0:'#7f0000'},
    },
  };

  // ── 日志 ────────────────────────────────────────
  function log(...args) { console.log('[🌡️ 羽迹·热力图]', ...args); }
  function warn(...args) { console.warn('[🌡️ 羽迹·热力图]', ...args); }

  // ── 等待地图就绪 ──────────────────────────────────
  let map = null, AMap = null;

  function waitForMap(maxWait = 20000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = () => {
        if (window.__birdsMap && window.__birdsAMap) {
          map = window.__birdsMap;
          AMap = window.__birdsAMap;
          log('地图已就绪, AMap类型:', typeof AMap, 'Map类型:', typeof map);
          // 验证 AMap 有 plugin 方法
          if (typeof AMap.plugin !== 'function') {
            warn('AMap.plugin 不是函数! AMap键:', Object.keys(AMap).slice(0,10));
          }
          resolve();
          return;
        }
        if (Date.now() - start > maxWait) {
          warn('地图等待超时, __birdsMap=', !!window.__birdsMap, '__birdsAMap=', !!window.__birdsAMap);
          reject(new Error('地图加载超时'));
          return;
        }
        setTimeout(check, 300);
      };
      check();
    });
  }

  // ── 数据源管理 ────────────────────────────────────
  const sources = {};
  const heatmaps = {};    // {id: heatmapLayer}
  const clickMarkers = {}; // {id: [markers]} for click interaction
  const currentVisible = {};

  function createSource(id, name, color, fetcher) {
    sources[id] = { id, name, color, fetcher, data: null, loaded: false };
    currentVisible[id] = false;
  }

  // ── 创建 UI 面板 ──────────────────────────────────
  function createPanel() {
    const panel = document.createElement('div');
    panel.id = 'bird-data-panel';
    panel.style.cssText = `
      position: fixed; bottom: 80px; right: 16px; z-index: 9999;
      display: flex; flex-direction: column; gap: 4px;
      background: rgba(8,18,35,0.85); backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px; padding: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
      font-size: 11px; color: #e0f0ff;
      min-width: 130px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.4);
    `;

    const title = document.createElement('div');
    title.textContent = '📡 观鸟热力图';
    title.style.cssText = 'font-size: 10px; opacity: 0.6; letter-spacing: 1px; padding: 2px 4px 6px; border-bottom: 1px solid rgba(255,255,255,0.06);';

    panel.appendChild(title);

    Object.values(sources).forEach(src => {
      const row = document.createElement('div');
      row.dataset.source = src.id;

      const baseStyle = `display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:8px;cursor:pointer;transition:all 0.2s;background:transparent;border:1px solid transparent;opacity:0.5;`;

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
      badge.style.cssText = 'font-size:10px;opacity:0.4;transition:all 0.3s;';

      row.appendChild(dot);
      row.appendChild(label);
      row.appendChild(badge);
      panel.appendChild(row);
      src._row = row;
      src._badge = badge;
      src._baseStyle = baseStyle;
    });

    // 状态栏
    const status = document.createElement('div');
    status.id = 'heatmap-status';
    status.style.cssText = 'font-size:9px;opacity:0.35;padding:4px 4px 0;text-align:center;border-top:1px solid rgba(255,255,255,0.05);margin-top:2px;';
    status.textContent = '点击加载数据';
    panel.appendChild(status);

    document.body.appendChild(panel);
    log('面板已创建');
  }

  // ── 切换数据源 ────────────────────────────────────
  async function toggleSource(id) {
    const src = sources[id];
    if (!src) return;

    currentVisible[id] = !currentVisible[id];

    if (currentVisible[id]) {
      // 激活
      src._row.style.cssText = src._baseStyle +
        `background:${src.color}18!important;border-color:${src.color}44!important;opacity:1!important;`;

      if (!src.loaded) {
        src._badge.textContent = '⏳';
        document.getElementById('heatmap-status').textContent = `正在加载 ${src.name} 数据...`;
        try {
          log(`开始获取 ${src.name} 数据...`);
          const data = await src.fetcher();
          src.data = data;
          src.loaded = true;
          src._badge.textContent = data.length + ' 条';
          src._row.title = `${data.length} 条观测记录`;
          document.getElementById('heatmap-status').textContent = `${src.name}: ${data.length} 条, 渲染热力图...`;

          log(`${src.name} 数据获取成功: ${data.length} 条`);
          // 验证数据格式
          if (data.length > 0) {
            log('第一条数据样本:', JSON.stringify(data[0]));
          }

          addHeatmap(src);
        } catch (err) {
          src._badge.textContent = '❌';
          src._row.title = '加载失败: ' + err.message;
          document.getElementById('heatmap-status').textContent = `${src.name} 加载失败`;
          warn(`${src.name} 加载失败:`, err.message);
        }
      } else {
        showHeatmap(src);
        document.getElementById('heatmap-status').textContent = `${src.name}: ${src.data.length} 条, 热力图已显示`;
      }
    } else {
      // 关闭
      src._row.style.cssText = src._baseStyle;
      hideHeatmap(src);
      document.getElementById('heatmap-status').textContent = `${src.name} 已关闭`;
    }
  }

  // ── 热力图管理 ────────────────────────────────────
  function addHeatmap(src) {
    if (heatmaps[src.id]) {
      showHeatmap(src);
      return;
    }
    if (!src.data || src.data.length === 0) {
      warn(`${src.name} 无数据`);
      document.getElementById('heatmap-status').textContent = `${src.name}: 无数据`;
      return;
    }

    // 等待 AMap.HeatmapLayer 可用（插件已通过主AMap脚本加载）
    const waitForLayer = (cb) => {
      if (typeof AMap.HeatmapLayer === 'function') {
        cb();
        return;
      }
      log('等待 HeatmapLayer 就绪...');
      let tries = 0;
      const check = () => {
        tries++;
        if (typeof AMap.HeatmapLayer === 'function') { cb(); return; }
        if (tries > 50) { // ~10s timeout
          warn('HeatmapLayer 加载超时');
          document.getElementById('heatmap-status').textContent = `${src.name} ❌ 插件加载超时`;
          return;
        }
        setTimeout(check, 200);
      };
      check();
    };

    waitForLayer(() => {
      try {
        // 准备热力图数据
        const heatData = src.data.map(pt => ({
          lng: pt.lng,
          lat: pt.lat,
          count: pt.count || 1,
        }));
        const maxCount = Math.max(...heatData.map(d => d.count), 1);
        log(`${src.name} 热力图数据: ${heatData.length} 点, max=${maxCount}`);

        // 自动缩放地图到数据范围
        const bounds = new AMap.Bounds();
        heatData.forEach(p => bounds.extend([p.lng, p.lat]));
        map.setBounds(bounds, { maxZoom: 10, padding: [40, 40] });
        log(`自动适配视野: ${bounds.toString()}`);

        // 创建热力图
        const heatmap = new AMap.HeatmapLayer(map, {
          radius: 20,
          opacity: [0, 0.6],
          gradient: CFG.GRADIENTS[src.id] || CFG.GRADIENTS.inaturalist,
          zooms: [3, 18],
        });

        heatmap.setDataSet({
          data: heatData,
          max: maxCount,
        });

        heatmaps[src.id] = heatmap;
        log(`${src.name} 热力图创建成功`);

        // 创建不可见点击标记
        createClickMarkers(src);

        document.getElementById('heatmap-status').textContent =
          `${src.name}: ✅ 热力图已渲染 (${heatData.length} 点)`;
      } catch (e) {
        warn(`${src.name} 热力图创建失败:`, e);
        document.getElementById('heatmap-status').textContent =
          `${src.name} ❌ 渲染失败: ${e.message}`;
      }
    });
  }

  function createClickMarkers(src) {
    // 清理旧标记
    if (clickMarkers[src.id]) {
      clickMarkers[src.id].forEach(m => m.setMap(null));
    }
    clickMarkers[src.id] = [];

    // 最多创建 200 个点击标记，避免性能问题
    const points = src.data.slice(0, 200);
    const markers = points.map(pt => {
      const marker = new AMap.Marker({
        position: [pt.lng, pt.lat],
        zIndex: 100,
        content: '<div style="width:1px;height:1px;background:transparent"></div>',
        offset: new AMap.Pixel(0, 0),
      });

      const infoContent = `
        <div style="padding:8px 12px;font-size:12px;color:#333;line-height:1.6;max-width:260px">
          <strong>${pt.label || '未知物种'}</strong>
          ${pt.date ? '<br>📅 ' + pt.date : ''}
          ${pt.count ? '<br>📊 数量: ' + pt.count : ''}
          <br><span style="opacity:0.4;font-size:10px;">来源: ${pt.source || src.name}</span>
        </div>
      `;

      marker.on('click', () => {
        const info = new AMap.InfoWindow({
          content: infoContent,
          offset: new AMap.Pixel(0, -10),
          closeWhenClickMap: true,
        });
        info.open(map, [pt.lng, pt.lat]);
      });

      return marker;
    });

    // 不将标记添加到地图（只保留用于点击），或者设置到地图上
    // 让它们不可见但可点击
    markers.forEach(m => m.setMap(map));
    // 让它们透明
    markers.forEach(m => {
      const dom = m.getContent();
      if (dom) dom.style.opacity = '0.01';
    });

    clickMarkers[src.id] = markers;
    log(`${src.name} 点击标记创建: ${markers.length} 个`);
  }

  function showHeatmap(src) {
    const h = heatmaps[src.id];
    if (h) {
      h.setMap(map);
      log(`${src.name} 热力图已显示`);
    }
    // 显示点击标记
    if (clickMarkers[src.id]) {
      clickMarkers[src.id].forEach(m => m.setMap(map));
    }
  }

  function hideHeatmap(src) {
    const h = heatmaps[src.id];
    if (h) {
      h.setMap(null);
    }
    if (clickMarkers[src.id]) {
      clickMarkers[src.id].forEach(m => m.setMap(null));
    }
  }

  // ── API 数据获取器 ──────────────────────────────
  const BBOX = CFG.CHINA_BBOX;

  async function fetchINaturalist() {
    const url = `https://api.inaturalist.org/v1/observations?taxon_id=3&per_page=200&order=desc&order_by=created_at&${BBOX}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`iNaturalist HTTP ${resp.status}`);
    const json = await resp.json();
    return (json.results || []).map(obs => {
      const geo = obs.geojson?.coordinates;
      if (!geo) return null;
      return {
        lat: geo[1], lng: geo[0],
        label: obs.taxon?.preferred_common_name || obs.taxon?.name || '未知',
        date: (obs.observed_on_details?.date || '').replace(/-/g, '/'),
        source: 'iNaturalist',
        count: 1,
      };
    }).filter(Boolean);
  }

  async function fetchGBIF() {
    const url = `https://api.gbif.org/v1/occurrence/search?taxonKey=212&country=CN&limit=300&hasCoordinate=true`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`GBIF HTTP ${resp.status}`);
    const json = await resp.json();
    return (json.results || []).map(r => {
      if (r.decimalLatitude == null || r.decimalLongitude == null) return null;
      return {
        lat: r.decimalLatitude, lng: r.decimalLongitude,
        label: r.vernacularName || r.species || '未知',
        date: r.eventDate ? r.eventDate.split('T')[0].replace(/-/g, '/') : '',
        source: 'GBIF',
        count: r.individualCount || 1,
      };
    }).filter(Boolean);
  }

  async function fetchEbird() {
    const meta = document.querySelector('meta[name="ebird-key"]');
    const apiKey = window.__EBIRD_API_KEY || (meta ? meta.content : null);
    if (!apiKey) throw new Error('请配置 eBird API Key');
    const url = `https://api.ebird.org/v2/data/obs/CN/recent?maxResults=100`;
    const resp = await fetch(url, {
      headers: { 'X-eBirdApiToken': apiKey }
    });
    if (resp.status === 401) throw new Error('eBird API Key 无效');
    if (!resp.ok) throw new Error(`eBird HTTP ${resp.status}`);
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
    log('初始化开始...');
    log('__birdsMap:', !!window.__birdsMap, '__birdsAMap:', !!window.__birdsAMap);
    try {
      await waitForMap();
    } catch (e) {
      warn('地图未就绪，跳过');
      document.body.innerHTML += '<div style="position:fixed;top:10px;left:10px;z-index:99999;background:red;color:white;padding:10px;font-size:14px;">❌ 地图未就绪，请刷新</div>';
      return;
    }

    createSource('inaturalist', 'iNaturalist', CFG.COLORS.inaturalist, fetchINaturalist);
    createSource('gbif', 'GBIF', CFG.COLORS.gbif, fetchGBIF);
    createSource('ebird', 'eBird', CFG.COLORS.ebird, fetchEbird);

    createPanel();
    log('✅ 初始化完成');
  }

  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
    // 备用: 如果页面长时间不触发 load
    setTimeout(() => {
      if (!window.__birdsInitialized) init();
    }, 5000);
  }
})();
