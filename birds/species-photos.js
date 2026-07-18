(() => {
  const photos = {
    '黑脸琵鹭': ['black-faced-spoonbill.webp', 'https://commons.wikimedia.org/wiki/File:Black_faced_spoonbill_at_Niigata.JPG', 'Wikimedia Commons'],
    '大白鹭': ['great-egret.webp', 'https://commons.wikimedia.org/wiki/File:Great_Egret_(Ardea_alba)_in_Breeding_Plumage,_Cape_May_County,_New_Jersey,_USA_(cropped).png', 'Wikimedia Commons'],
    '红嘴鸥': ['black-headed-gull.webp', 'https://commons.wikimedia.org/wiki/File:Chroicocephalus_ridibundus_2012a.jpg', 'Wikimedia Commons'],
    '普通翠鸟': ['common-kingfisher.webp', 'https://commons.wikimedia.org/wiki/File:Alcedo_atthis_-England-8_(cropped).jpg', 'Wikimedia Commons'],
    '白腰杓鹬': ['far-eastern-curlew.webp', 'https://commons.wikimedia.org/wiki/File:Far_Eastern_Curlew_cairns_RWD2.jpg', 'Wikimedia Commons'],
    '秋茄': ['kandelia.webp', 'https://commons.wikimedia.org/wiki/File:Kandelia_obovata_Reserve_Park_in_Shenzhen.jpg', 'Wikimedia Commons'],
    '白骨壤': ['avicennia.webp', 'https://commons.wikimedia.org/wiki/File:Avicennia_marina_(grey_mangrove).JPG', 'Wikimedia Commons'],
    '鲎': ['horseshoe-crab.webp', 'https://commons.wikimedia.org/wiki/File:Tachypleus_tridentatus.jpg', 'Wikimedia Commons'],
    '弹涂鱼': ['mudskipper.webp', 'https://commons.wikimedia.org/wiki/File:Periophthalmus_modestus.jpg', 'Wikimedia Commons'],
    '招潮蟹': ['fiddler-crab.webp', 'https://commons.wikimedia.org/wiki/File:Tubuca_arcuata.jpg', 'Wikimedia Commons'],
    '苍鹭': ['grey-heron.webp', 'https://commons.wikimedia.org/wiki/File:Ardea_cinerea_-_Pak_Thale.jpg', 'Wikimedia Commons'],
    '红颈滨鹬': ['red-necked-stint.webp', 'https://commons.wikimedia.org/wiki/File:Calidris_ruficollis_-_Marion_Bay.jpg', 'Wikimedia Commons'],
    '互花米草': ['smooth-cordgrass.webp', 'https://baike.baidu.com/item/互花米草', '百度百科']
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
      <img src="/birds/assets/species/${item[0]}" alt="${name}真实照片" loading="eager">
      <figcaption>图片来源：${item[2]} · <a href="${item[1]}" target="_blank" rel="noreferrer">查看来源与许可</a></figcaption>`;
  };

  const scan = () => document.querySelectorAll('.species-panel').forEach(addPhoto);
  new MutationObserver(scan).observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
  scan();
})();
