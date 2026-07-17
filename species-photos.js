(() => {
  const photos = {
    '黑脸琵鹭': ['black-faced-spoonbill.jpg','https://commons.wikimedia.org/wiki/File:Black_faced_spoonbill_at_Niigata.JPG'],
    '大白鹭': ['great-egret.jpg','https://commons.wikimedia.org/wiki/File:Great_Egret_(Ardea_alba)_in_Breeding_Plumage,_Cape_May_County,_New_Jersey,_USA_(cropped).png'],
    '红嘴鸥': ['black-headed-gull.jpg','https://commons.wikimedia.org/wiki/File:Chroicocephalus_ridibundus_2012a.jpg'],
    '普通翠鸟': ['common-kingfisher.jpg','https://commons.wikimedia.org/wiki/File:Alcedo_atthis_-England-8_(cropped).jpg'],
    '白腰杓鹬': ['far-eastern-curlew.jpg','https://commons.wikimedia.org/wiki/File:Far_Eastern_Curlew_cairns_RWD2.jpg'],
    '秋茄': ['kandelia.jpg','https://commons.wikimedia.org/wiki/File:Kandelia_obovata_Reserve_Park_in_Shenzhen.jpg'],
    '白骨壤': ['avicennia.jpg','https://commons.wikimedia.org/wiki/File:Avicennia_marina_(grey_mangrove).JPG'],
    '鲎': ['horseshoe-crab.jpg','https://commons.wikimedia.org/wiki/File:Tachypleus_tridentatus.jpg'],
    '弹涂鱼': ['mudskipper.jpg','https://commons.wikimedia.org/wiki/File:Periophthalmus_modestus.jpg'],
    '招潮蟹': ['fiddler-crab.jpg','https://commons.wikimedia.org/wiki/File:Tubuca_arcuata.jpg'],
    '苍鹭': ['grey-heron.jpg','https://commons.wikimedia.org/wiki/File:Ardea_cinerea_-_Pak_Thale.jpg'],
    '红颈滨鹬': ['red-necked-stint.jpg','https://commons.wikimedia.org/wiki/File:Calidris_ruficollis_-_Marion_Bay.jpg'],
    '互花米草': ['smooth-cordgrass.jpg','https://commons.wikimedia.org/wiki/File:Spartina_alterniflora.jpg']
  };
  const addPhoto = panel => {
    const name = panel.querySelector('h2')?.textContent?.trim(); const item = photos[name]; if (!item) return;
    let figure = panel.querySelector('.species-real-photo');
    if (!figure) { figure = document.createElement('figure'); figure.className='species-real-photo'; panel.querySelector('.species-header')?.after(figure); }
    if (figure.dataset.species === name) return;
    figure.dataset.species = name;
    figure.innerHTML=`<img src="/birds/assets/species/${item[0]}" alt="${name}真实照片" loading="eager"><figcaption>图片：Wikimedia Commons · <a href="${item[1]}" target="_blank" rel="noreferrer">查看来源与许可</a></figcaption>`;
  };
  const scan = () => document.querySelectorAll('.species-panel').forEach(addPhoto);
  new MutationObserver(scan).observe(document.body,{childList:true,subtree:true,characterData:true}); scan();
})();
