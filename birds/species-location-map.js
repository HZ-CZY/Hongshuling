(function () {
  'use strict';

  // Representative habitat/observation areas rather than real-time animal GPS.
  // Place coordinates were checked against AMap place data on 2026-07-18.
  const locations = [
    { id: 'black-faced-spoonbill', name: '黑脸琵鹭', emoji: '🕊️', original: [113.948, 22.518], coords: [114.040247, 22.491717], site: '米埔自然保护区', habitat: '冬季觅食泥滩' },
    { id: 'great-egret', name: '大白鹭', emoji: '🦢', original: [113.94, 22.526], coords: [114.023921, 22.519196], site: '福田红树林自然保护区', habitat: '红树林浅水区' },
    { id: 'black-headed-gull', name: '红嘴鸥', emoji: '🕊️', original: [113.958, 22.51], coords: [113.972245, 22.519190], site: '深圳湾公园白鹭坡', habitat: '开阔水面与岸线' },
    { id: 'common-kingfisher', name: '普通翠鸟', emoji: '🐦', original: [113.9355, 22.531], coords: [113.981088, 22.526312], site: '华侨城国家湿地公园', habitat: '淡水塘与水道' },
    { id: 'eurasian-curlew', name: '白腰杓鹬', emoji: '🦆', original: [113.952, 22.514], coords: [113.971402, 22.489428], site: '深圳湾（后海湾）', habitat: '潮间带泥滩' },
    { id: 'kandelia', name: '秋茄', emoji: '🌿', original: [113.941, 22.525], coords: [113.998082, 22.522076], site: '红树林海滨生态公园', habitat: '红树林群落' },
    { id: 'avicennia', name: '白骨壤', emoji: '🌳', original: [113.938, 22.528], coords: [114.039644, 22.509273], site: '福田红树林生态公园', habitat: '潮间带外缘' },
    { id: 'horseshoe-crab', name: '鲎', emoji: '🦀', original: [113.944, 22.52], coords: [113.951704, 22.495397], site: '深圳湾潮汐湿地公园', habitat: '浅水沙泥滩' },
    { id: 'mudskipper', name: '弹涂鱼', emoji: '🐟', original: [113.945, 22.522], coords: [113.952314, 22.499063], site: '深圳湾公园日出剧场岸线', habitat: '退潮泥滩' },
    { id: 'fiddler-crab', name: '招潮蟹', emoji: '🦞', original: [113.943, 22.524], coords: [113.953650, 22.505557], site: '弯月山谷公园岸线', habitat: '红树林泥滩' },
    { id: 'grey-heron', name: '苍鹭', emoji: '🦩', original: [113.95, 22.516], coords: [114.047224, 22.485037], site: '米埔湿地', habitat: '鱼塘与浅水湿地' },
    { id: 'red-necked-stint', name: '红颈滨鹬', emoji: '🐧', original: [113.955, 22.509], coords: [114.013096, 22.466486], site: '香港湿地公园', habitat: '迁徙停歇湿地' },
    { id: 'spartina', name: '互花米草', emoji: '🌾', original: [113.937, 22.529], coords: [113.951988, 22.488257], site: '深圳湾观桥公园潮滩', habitat: '受治理潮滩区域' }
  ];

  function markerPosition(marker) {
    const position = marker.getPosition?.();
    if (!position) return null;
    return [
      typeof position.getLng === 'function' ? position.getLng() : position.lng,
      typeof position.getLat === 'function' ? position.getLat() : position.lat
    ];
  }

  function isSamePosition(position, expected) {
    return position && Math.abs(position[0] - expected[0]) < 0.00001 &&
      Math.abs(position[1] - expected[1]) < 0.00001;
  }

  function addLocationTooltip(content, location) {
    content.dataset.speciesId = location.id;
    content.dataset.speciesName = location.name;
    content.dataset.locationName = location.site;
    content.setAttribute('aria-label', `${location.name}，代表栖息地：${location.site}`);

    if (content.querySelector('.marker-location-tooltip')) return;
    const tooltip = document.createElement('span');
    tooltip.className = 'marker-location-tooltip';
    tooltip.innerHTML = `<strong>${location.name}</strong><small>📍 ${location.site}</small><em>${location.habitat}</em>`;
    content.appendChild(tooltip);
  }

  function focusVerifiedArea(map) {
    const zoom = window.innerWidth < 600 ? 12 : 13;
    map.setZoomAndCenter(zoom, [114.0005, 22.4975]);
  }

  function addMapNote(map) {
    if (document.querySelector('.species-location-note')) return;
    const note = document.createElement('button');
    note.type = 'button';
    note.className = 'species-location-note';
    note.title = '回到深圳湾代表栖息地视图';
    note.innerHTML = '<span>📍</span><span><strong>物种代表栖息地</strong><small>依据地图地点与生境资料，非实时定位 · 点击返回</small></span>';
    note.addEventListener('click', () => focusVerifiedArea(map));
    document.querySelector('.home')?.appendChild(note);
  }

  function applyVerifiedLocations() {
    const map = window.__birdsMap;
    const AMap = window.__birdsAMap;
    if (!map || !AMap || typeof map.getAllOverlays !== 'function') return false;

    const markers = (map.getAllOverlays('marker') || []).filter(marker => {
      const content = marker.getContent?.();
      return content instanceof HTMLElement && content.classList.contains('custom-species-marker');
    });
    if (markers.length < locations.length) return false;

    let updated = 0;
    locations.forEach(location => {
      const marker = markers.find(candidate => isSamePosition(markerPosition(candidate), location.original));
      if (!marker) return;
      marker.setPosition(location.coords);
      marker.setOffset(new AMap.Pixel(-23, -46));
      const content = marker.getContent();
      content.classList.add('verified-species-marker');
      addLocationTooltip(content, location);
      updated += 1;
    });

    if (updated !== locations.length) return false;
    window.__verifiedSpeciesLocations = locations;
    addMapNote(map);
    focusVerifiedArea(map);
    return true;
  }

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (applyVerifiedLocations() || attempts >= 100) window.clearInterval(timer);
  }, 200);
})();
