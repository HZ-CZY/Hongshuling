(() => {
  const commonsImage = fileName =>
    `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(fileName)}`;

  const photos = {
    '黑脸琵鹭': ['Black_faced_spoonbill_at_Niigata.JPG', 'https://commons.wikimedia.org/wiki/File:Black_faced_spoonbill_at_Niigata.JPG'],
    '大白鹭': ['Great_Egret_(Ardea_alba)_in_Breeding_Plumage,_Cape_May_County,_New_Jersey,_USA_(cropped).png', 'https://commons.wikimedia.org/wiki/File:Great_Egret_(Ardea_alba)_in_Breeding_Plumage,_Cape_May_County,_New_Jersey,_USA_(cropped).png'],
    '红嘴鸥': ['Chroicocephalus_ridibundus_2012a.jpg', 'https://commons.wikimedia.org/wiki/File:Chroicocephalus_ridibundus_2012a.jpg'],
    '普通翠鸟': ['Alcedo_atthis_-England-8_(cropped).jpg', 'https://commons.wikimedia.org/wiki/File:Alcedo_atthis_-England-8_(cropped).jpg'],
    '白腰杓鹬': ['Far_Eastern_Curlew_cairns_RWD2.jpg', 'https://commons.wikimedia.org/wiki/File:Far_Eastern_Curlew_cairns_RWD2.jpg'],
    '秋茄': ['Kandelia_obovata_Reserve_Park_in_Shenzhen.jpg', 'https://commons.wikimedia.org/wiki/File:Kandelia_obovata_Reserve_Park_in_Shenzhen.jpg'],
    '白骨壤': ['Avicennia_marina_(grey_mangrove).JPG', 'https://commons.wikimedia.org/wiki/File:Avicennia_marina_(grey_mangrove).JPG'],
    '鲎': ['Tachypleus_tridentatus.jpg', 'https://commons.wikimedia.org/wiki/File:Tachypleus_tridentatus.jpg'],
    '弹涂鱼': ['Periophthalmus_modestus.jpg', 'https://commons.wikimedia.org/wiki/File:Periophthalmus_modestus.jpg'],
    '招潮蟹': ['Tubuca_arcuata.jpg', 'https://commons.wikimedia.org/wiki/File:Tubuca_arcuata.jpg'],
    '苍鹭': ['Ardea_cinerea_-_Pak_Thale.jpg', 'https://commons.wikimedia.org/wiki/File:Ardea_cinerea_-_Pak_Thale.jpg'],
    '红颈滨鹬': ['Calidris_ruficollis_-_Marion_Bay.jpg', 'https://commons.wikimedia.org/wiki/File:Calidris_ruficollis_-_Marion_Bay.jpg'],
    '互花米草': ['Spartina_alterniflora.jpg', 'https://commons.wikimedia.org/wiki/File:Spartina_alterniflora.jpg']
  };

  const addPhoto = panel => {
    const name = panel.querySelector('.species-name, h2')?.textContent?.trim();
    const item = photos[name];
    if (!item) return;

    let figure = panel.querySelector('.species-real-photo');
    if (!figure) {
      figure = document.createElement('figure');
      figure.className = 'species-real-photo';
      panel.querySelector('.species-header')?.after(figure);
    }
    if (figure.dataset.species === name) return;

    figure.dataset.species = name;
    figure.innerHTML = `
      <img src="${commonsImage(item[0])}" alt="${name}真实照片" loading="eager" referrerpolicy="no-referrer">
      <figcaption>图片：Wikimedia Commons · <a href="${item[1]}" target="_blank" rel="noreferrer">查看来源与许可</a></figcaption>`;
  };

  const scan = () => document.querySelectorAll('.species-panel').forEach(addPhoto);
  new MutationObserver(scan).observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
  scan();
})();
