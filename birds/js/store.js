/**
 * 虚拟周边商城：电子徽章 / 科普卡牌 / 壁纸。
 *  - 科普币（mock 货币）通过答题赚取，用于验证付费意愿；
 *  - 徽章可由答题解锁自动获得，卡牌/壁纸可"购买"。
 * 说明：当前为前端模拟交易，生产环境需接入真实支付与库存。
 */
(function (global) {
  'use strict';
  const { el, toast, Store } = global.U;
  const { SPECIES } = global.SPECIES_DATA;

  // 商品目录
  const CATALOG = [];
  SPECIES.forEach(s => {
    CATALOG.push({
      id: 'badge-' + s.id, type: 'badge', emoji: s.emoji, name: s.name + '·认证',
      desc: '答对「' + s.name + '」全部趣味题即可获得', earn: 'quiz:' + s.id, price: 0,
    });
  });
  SPECIES.forEach(s => {
    CATALOG.push({
      id: 'card-' + s.id, type: 'card', emoji: '🃏', name: s.name + ' 科普卡',
      desc: '精美物种卡牌，收藏与分享', earn: null, price: 20,
    });
  });
  CATALOG.push(
    { id: 'wp-bay', type: 'wallpaper', emoji: '🖼️', name: '深圳湾晨曦壁纸', desc: '高清候鸟主题壁纸', earn: null, price: 30, download: true },
    { id: 'wp-night', type: 'wallpaper', emoji: '🌌', name: '深空迁徙壁纸', desc: '3D 地球迁徙航线壁纸', earn: null, price: 30, download: true },
    { id: 'wp-mangrove', type: 'wallpaper', emoji: '🌿', name: '红树林潮间带壁纸', desc: '红树植物生态壁纸', earn: null, price: 30, download: true },
  );

  const COIN_KEY = 'coins';
  const OWNED_KEY = 'owned';
  const AWARDED_KEY = 'awardedBadges';

  function coins() { return Store.get(COIN_KEY, 50); }
  function setCoins(n) { Store.set(COIN_KEY, Math.max(0, n)); }
  function owned() { return Store.get(OWNED_KEY, []); }
  function addOwned(id) { const o = owned(); if (!o.includes(id)) { o.push(id); Store.set(OWNED_KEY, o); } }
  function awarded() { return Store.get(AWARDED_KEY, []); }

  // 答题获得徽章
  function awardBadge(spId) {
    const bid = 'badge-' + spId;
    const a = awarded();
    if (!a.includes(bid)) {
      a.push(bid); Store.set(AWARDED_KEY, a);
      addOwned(bid);
      return CATALOG.find(c => c.id === bid);
    }
    return null;
  }

  function earn(n) { setCoins(coins() + n); }
  function canBuy(item) { return coins() >= item.price && !owned().includes(item.id); }

  function wallpaperCanvas(item) {
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1920;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 1920);
    g.addColorStop(0, '#0a1f3c'); g.addColorStop(1, '#06243f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, 1920);
    ctx.font = '300px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(item.emoji, 540, 800);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 72px sans-serif';
    ctx.fillText(item.name, 540, 1200);
    ctx.fillStyle = 'rgba(0,212,212,0.9)'; ctx.font = '36px sans-serif';
    ctx.fillText('羽迹·深湾', 540, 1320);
    return c;
  }

  function render() {
    const wrap = el('div', { class: 'store-view' });
    const coinBar = el('div', { class: 'store-coins', text: `🪙 科普币：${coins()}` });
    wrap.appendChild(coinBar);

    function rerender() {
      coinBar.textContent = `🪙 科普币：${coins()}`;
      grid.innerHTML = '';
      groups.forEach(([type, label]) => {
        const items = CATALOG.filter(c => c.type === type);
        if (!items.length) return;
        grid.appendChild(el('h4', { class: 'store-group', text: label }));
        const row = el('div', { class: 'store-row' });
        items.forEach(it => row.appendChild(itemCard(it)));
        grid.appendChild(row);
      });
    }

    function itemCard(it) {
      const isOwned = owned().includes(it.id);
      const card = el('div', { class: 'store-item' + (isOwned ? ' owned' : '') }, [
        el('div', { class: 'store-emoji', text: it.emoji }),
        el('div', { class: 'store-name', text: it.name }),
        el('div', { class: 'store-desc', text: it.desc }),
      ]);
      let action;
      if (it.earn && it.earn.startsWith('quiz:')) {
        const earned = awarded().includes(it.id);
        action = earned
          ? el('span', { class: 'store-tag ok', text: '✅ 已获得' })
          : el('span', { class: 'store-tag', text: '🎯 答题获取' });
      } else if (isOwned) {
        action = it.download
          ? el('button', { class: 'ic-btn ghost', text: '⬇️ 下载', onclick: () => {
              const c = wallpaperCanvas(it); c.toBlob(b => {
                const a = document.createElement('a'); a.href = URL.createObjectURL(b);
                a.download = it.id + '.png'; a.click();
              });
            } })
          : el('span', { class: 'store-tag ok', text: '✅ 已拥有' });
      } else {
        action = el('button', {
          class: 'ic-btn', text: `🪙 ${it.price}`,
          onclick: () => {
            if (coins() < it.price) { toast('科普币不足，去答题赚取吧', 'warn'); return; }
            setCoins(coins() - it.price); addOwned(it.id);
            toast('购买成功：' + it.name, 'success'); rerender();
          },
        });
      }
      card.appendChild(action);
      return card;
    }

    const groups = [['badge', '🏅 电子徽章'], ['card', '🃏 科普卡牌'], ['wallpaper', '🖼️ 数字壁纸']];
    const grid = el('div', { class: 'store-grid' });
    wrap.appendChild(grid);
    rerender();
    return wrap;
  }

  global.Store = {
    render, awardBadge, earn, coins, owned,
    onQuizMastered(spId, allCorrect) {
      if (!allCorrect) return null;
      const b = awardBadge(spId);
      if (b) { earn(10); return b; }
      return null;
    },
  };
})(window);
