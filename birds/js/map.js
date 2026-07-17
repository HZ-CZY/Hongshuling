/**
 * 地图视图：优先使用高德 AMap（需配置 Key），失败或无 Key 时降级为示意地图。
 * 统一接口：addMarkers / drawRoute / clearRoutes / focusShenzhenBay
 */
(function (global) {
  'use strict';

  // 示意地图投影所用中国边界框（WGS84）
  const CN_BBOX = { minLng: 73, maxLng: 135, minLat: 18, maxLat: 54 };

  function project(lng, lat, w, h, bbox = CN_BBOX) {
    const x = (lng - bbox.minLng) / (bbox.maxLng - bbox.minLng) * w;
    const y = (bbox.maxLat - lat) / (bbox.maxLat - bbox.minLat) * h;
    return { x, y };
  }

  class MapView {
    constructor() {
      this.mode = 'pending';      // 'amap' | 'fallback'
      this.container = null;
      this.map = null;            // AMap instance
      this.markers = [];
      this.routeOverlays = [];
      this.onSelect = null;
      this._amap = null;
    }

    async init(container, onSelect) {
      this.container = container;
      this.onSelect = onSelect;
      const key = global.APP_CONFIG && global.APP_CONFIG.AMAP_KEY;

      if (key) {
        try {
          await this._loadAMap(key);
          this._initAMap();
          this.mode = 'amap';
          global.U.toast('高德地图已加载', 'success');
          return;
        } catch (e) {
          console.warn('[MapView] AMap 加载失败，降级示意地图:', e);
        }
      }
      this._initFallback();
      this.mode = 'fallback';
      if (!key) global.U.toast('未配置高德 Key，已使用示意地图', 'warn');
    }

    _loadAMap(key) {
      return new Promise((resolve, reject) => {
        if (global.AMap) return resolve();
        const s = document.createElement('script');
        s.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}&plugin=AMap.HeatMap,AMap.Scale,AMap.ToolBar`;
        s.onload = () => (global.AMap ? resolve() : reject(new Error('AMap undefined')));
        s.onerror = () => reject(new Error('script error'));
        document.head.appendChild(s);
        setTimeout(() => reject(new Error('timeout')), 8000);
      });
    }

    _initAMap() {
      const AMap = global.AMap;
      this._amap = AMap;
      this.map = new AMap.Map(this.container, {
        zoom: 12, center: [113.95, 22.52], mapStyle: 'amap://styles/whitesmoke',
      });
      this.map.addControl(new AMap.Scale());
      this.map.addControl(new AMap.ToolBar({ position: 'RB' }));
    }

    _initFallback() {
      const c = this.container;
      c.classList.add('map-fallback');
      c.innerHTML = `
        <div class="fb-sea"></div>
        <div class="fb-land"></div>
        <div class="fb-label">深圳湾 · 示意地图</div>
        <div class="fb-hint">（未配置高德 Key 的离线示意模式）</div>
        <svg class="fb-routes" preserveAspectRatio="none"></svg>
        <div class="fb-markers"></div>`;
      this._fbMarkers = c.querySelector('.fb-markers');
      this._fbRoutes = c.querySelector('.fb-routes');
    }

    addMarkers(speciesList) {
      speciesList.forEach(sp => {
        const m = this._makeMarker(sp);
        this.markers.push(m);
      });
    }

    _makeMarker(sp) {
      if (this.mode === 'amap') {
        const AMap = this._amap;
        const marker = new AMap.Marker({
          position: [sp.marker.lng, sp.marker.lat],
          anchor: 'center',
          content: `<div class="map-pin" style="--c:${sp.color}" title="${sp.name}">
                      <span>${sp.emoji}</span></div>`,
          offset: new AMap.Pixel(-18, -18),
        });
        marker.on('click', () => this.onSelect && this.onSelect(sp));
        this.map.add(marker);
        return marker;
      }
      // fallback
      const { x, y } = project(sp.marker.lng, sp.marker.lat, this._fbMarkers.clientWidth, this._fbMarkers.clientHeight);
      const pin = global.U.el('div', {
        class: 'map-pin', style: { left: x + 'px', top: y + 'px', '--c': sp.color },
        title: sp.name,
        onclick: () => this.onSelect && this.onSelect(sp),
      }, global.U.el('span', { text: sp.emoji }));
      this._fbMarkers.appendChild(pin);
      return pin;
    }

    clearRoutes() {
      this.routeOverlays.forEach(o => o.remove ? o.remove() : o.parentNode && o.parentNode.removeChild(o));
      this.routeOverlays = [];
      if (this._fbRoutes) this._fbRoutes.innerHTML = '';
    }

    drawRoute(waypoints, color, name) {
      if (!waypoints || waypoints.length < 2) return;
      if (this.mode === 'amap') {
        const AMap = this._amap;
        const line = new AMap.Polyline({
          path: waypoints.map(p => [p.lng, p.lat]),
          strokeColor: color, strokeWeight: 4, strokeOpacity: 0.8, showDir: true,
          lineJoin: 'round', map: this.map,
        });
        this.routeOverlays.push(line);
        this.map.setFitView();
        return;
      }
      // fallback: SVG polyline
      const w = this._fbRoutes.clientWidth, h = this._fbRoutes.clientHeight;
      this._fbRoutes.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const pts = waypoints.map(p => {
        const { x, y } = project(p.lng, p.lat, w, h);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
      const ns = 'http://www.w3.org/2000/svg';
      const poly = document.createElementNS(ns, 'polyline');
      poly.setAttribute('points', pts);
      poly.setAttribute('fill', 'none');
      poly.setAttribute('stroke', color);
      poly.setAttribute('stroke-width', '3');
      poly.setAttribute('stroke-opacity', '0.85');
      poly.setAttribute('stroke-dasharray', '6 4');
      this._fbRoutes.appendChild(poly);
      const label = document.createElementNS(ns, 'text');
      const first = project(waypoints[0].lng, waypoints[0].lat, w, h);
      label.setAttribute('x', first.x); label.setAttribute('y', Math.max(12, first.y - 6));
      label.setAttribute('fill', color); label.setAttribute('font-size', '11');
      label.textContent = name || '';
      this._fbRoutes.appendChild(label);
      this.routeOverlays.push(poly);
    }

    focusShenzhenBay() {
      if (this.mode === 'amap') this.map.setZoomAndCenter(12, [113.95, 22.52]);
    }

    resize() {
      if (this.mode === 'amap') this.map && this.map.resize && this.map.resize();
    }
  }

  global.MapView = MapView;
})(window);
