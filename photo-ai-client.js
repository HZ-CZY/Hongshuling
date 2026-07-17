(() => {
  const birds = [
    { species:'黑脸琵鹭', confidence:94, description:'黑色脸部和扁平匙状长喙是最醒目的特征，冬季常在深圳湾浅水区觅食。', protectionTips:'保持至少50米观察距离，不追逐、不投喂。' },
    { species:'红脚鹬', confidence:89, description:'腿呈鲜红或橙红色，嘴细长，常在潮间带快速行走寻找小型无脊椎动物。', protectionTips:'退潮觅食期间请勿靠近，让它们安心补充迁徙能量。' },
    { species:'白鹭', confidence:91, description:'全身白色、颈和腿细长，繁殖期头后会出现细长饰羽。', protectionTips:'不要惊扰湿地边缘的巢区，文明观鸟并带走垃圾。' },
    { species:'苍鹭', confidence:87, description:'体型较大，灰色背羽、白色头颈，眼后具有明显黑色羽冠。', protectionTips:'使用望远镜远距离观察，避免大声喧哗和突然靠近。' },
    { species:'反嘴鹬', confidence:86, description:'黑白相间的羽色十分醒目，细长鸟喙明显向上弯曲。', protectionTips:'保护浅滩和盐沼环境，不进入候鸟集中休息区域。' },
    { species:'普通鸬鹚', confidence:84, description:'体色深黑、颈较长，常潜水捕鱼，也常张开双翼晾晒羽毛。', protectionTips:'不投喂、不驱赶，让水鸟保持自然觅食习惯。' },
    { species:'黑翅长脚鹬', confidence:90, description:'具有特别修长的粉红色双腿、白色身体与黑色翅膀。', protectionTips:'繁殖季远离巢区，遛狗时请使用牵引绳。' },
    { species:'红嘴鸥', confidence:88, description:'冬羽头部偏白、耳后有深色斑点，嘴和腿通常呈红色。', protectionTips:'请勿用面包等食物投喂，避免改变其自然行为。' }
  ];
  let previousIndex = -1;
  const safe = value => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
  const chooseBird = () => {
    let index;
    do index = Math.floor(Math.random() * birds.length); while (birds.length > 1 && index === previousIndex);
    previousIndex = index;
    const result = { ...birds[index] };
    result.confidence = Math.max(76, Math.min(96, result.confidence + Math.floor(Math.random() * 7) - 3));
    return result;
  };
  function render(panel, data) {
    panel.querySelector('.doubao-results')?.remove();
    const box = document.createElement('div'); box.className = 'doubao-results';
    box.innerHTML = `<div class="doubao-heading">🌿 候鸟科普识别</div><article class="doubao-candidate"><div class="doubao-main"><strong>${safe(data.species)}</strong></div><span class="doubao-confidence">${data.confidence}%</span><p><b>典型特征：</b>${safe(data.description)}</p><p><b>保护贴士：</b>${safe(data.protectionTips)}</p></article><p class="doubao-notice">⚠️ 科普演示结果，并非真实图像识别，请勿用于物种调查或科研判断。</p>`;
    panel.appendChild(box);
  }
  document.addEventListener('click', async event => {
    const button = event.target.closest('.photo-actions .action-btn--primary'); if (!button) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const panel = button.closest('.photo-panel');
    if (!panel?.querySelector('input[type="file"]')?.files?.[0]) return;
    button.disabled = true; button.textContent = '🌿 正在匹配科普资料...';
    await new Promise(resolve => setTimeout(resolve, 700 + Math.random() * 700));
    panel.querySelector('.photo-actions')?.remove(); render(panel, chooseBird());
  }, true);
})();
