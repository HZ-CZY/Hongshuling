/**
 * 物种信息卡：系统展示物种特征 / 习性 / 保护等级 / 趣闻 / 来深时间 / 迁徙路线。
 */
(function (global) {
  'use strict';
  const { el, escapeHtml } = global.U;

  function row(label, value, cls) {
    return el('div', { class: 'ic-row' + (cls ? ' ' + cls : '') }, [
      el('span', { class: 'ic-label', text: label }),
      el('span', { class: 'ic-value', html: value }),
    ]);
  }

  function render(sp) {
    const isBird = sp.category === 'bird';
    const catBadge = isBird ? '候鸟' : '红树植物';

    const head = el('div', { class: 'ic-head' }, [
      el('div', { class: 'ic-emoji', style: { background: sp.color + '22', color: sp.color }, text: sp.emoji }),
      el('div', { class: 'ic-title' }, [
        el('h3', { text: sp.name }),
        el('div', { class: 'ic-sub', text: `${sp.enName} · ${catBadge}` }),
      ]),
    ]);

    const body = el('div', { class: 'ic-body' }, [
      row('保护等级', `<span class="badge-level">${escapeHtml(sp.protectionLevel)}</span>`),
      row('特征', escapeHtml(sp.features)),
      row('习性', escapeHtml(sp.habits)),
      row('保护现状', escapeHtml(sp.conservation)),
      row('趣闻', '💡 ' + escapeHtml(sp.funFact)),
      row(isBird ? '来深时间' : '可见季节', escapeHtml(sp.arrivesShenzhenBay)),
    ]);

    if (isBird) {
      body.appendChild(row('迁徙路线', escapeHtml(sp.migrationRoute)));
      if (sp.routeWaypoints && sp.routeWaypoints.length) {
        const btn = el('button', {
          class: 'ic-btn', text: '🗺️ 在地图上绘制迁徙路线',
          onclick: () => { global.App.drawSpeciesRoute(sp); },
        });
        body.appendChild(el('div', { class: 'ic-route-action' }, btn));
      }
    }

    return el('div', { class: 'info-card-view' }, [head, body]);
  }

  global.InfoCard = { render };
})(window);
