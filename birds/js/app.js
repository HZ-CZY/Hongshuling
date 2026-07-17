/**
 * 主应用：应用外壳、底部导航、物种面板（弹窗）、解锁进度、地图联动。
 */
(function (global) {
  'use strict';
  const { el, toast, Store } = global.U;
  const { SPECIES, getById } = global.SPECIES_DATA;

  const UNLOCK_KEY = 'unlocked';
  const MASTER_KEY = 'mastered';

  function unlocked() { return Store.get(UNLOCK_KEY, [SPECIES[0].id]); }
  function setUnlocked(arr) { Store.set(UNLOCK_KEY, arr); }
  function isUnlocked(sp) { return unlocked().includes(sp.id); }
  function mastered() { return Store.get(MASTER_KEY, []); }

  function unlockNextAfter(spId) {
    const u = unlocked().slice();
    const idx = SPECIES.findIndex(s => s.id === spId);
    for (let i = idx + 1; i < SPECIES.length; i++) {
      if (!u.includes(SPECIES[i].id)) { u.push(SPECIES[i].id); break; }
    }
    setUnlocked(u);
  }

  const App = {
    map: null,
    current: null,

    async init() {
      this._buildShell();
      this.map = new global.MapView();
      await this.map.init(document.getElementById('map'), (sp) => this.openPanel(sp));
      this.map.addMarkers(SPECIES);
      this._renderSpeciesList();
      this._bindNav();
      console.log('[羽迹·深湾] 应用初始化完成'); // 调试日志
    },

    _buildShell() {
      const app = document.getElementById('app');
      app.innerHTML = `
        <header class="topbar">
          <div class="brand">🕊️ 羽迹·深湾</div>
          <nav class="nav">
            <button data-view="map" class="active">🗺️ 地图</button>
            <button data-view="photo">📷 识别</button>
            <button data-view="store">🛍️ 商城</button>
            <button data-view="me">👤 我的</button>
            <a class="nav-link" href="./space.html" target="_blank" title="深空三维地球">🌌 3D</a>
          </nav>
        </header>
        <main class="layout">
          <aside class="species-list" id="speciesList"></aside>
          <section class="map-area" id="mapArea"><div id="map"></div>
            <button class="list-toggle" id="listToggle">🐾 物种</button>
          </section>
          <section class="feature-area" id="featureArea" hidden></section>
        </main>`;
    },

    _bindNav() {
      document.querySelectorAll('.nav button').forEach(btn => {
        btn.addEventListener('click', () => this._switchView(btn.dataset.view));
      });
      document.getElementById('listToggle').addEventListener('click', () => {
        document.getElementById('speciesList').classList.toggle('open');
      });
      window.addEventListener('resize', () => this.map && this.map.resize());
    },

    _switchView(view) {
      document.querySelectorAll('.nav button').forEach(b => b.classList.toggle('active', b.dataset.view === view));
      const mapArea = document.getElementById('mapArea');
      const feat = document.getElementById('featureArea');
      const list = document.getElementById('speciesList');
      if (view === 'map') {
        mapArea.hidden = false; feat.hidden = true; list.style.display = '';
        this.map.resize();
      } else {
        mapArea.hidden = true; feat.hidden = false; list.style.display = 'none';
        feat.innerHTML = '';
        if (view === 'photo') feat.appendChild(global.PhotoFeature.render());
        else if (view === 'store') feat.appendChild(global.Store.render());
        else if (view === 'me') feat.appendChild(this._renderMe());
      }
    },

    _renderSpeciesList() {
      const box = document.getElementById('speciesList');
      box.innerHTML = '';
      box.appendChild(el('div', { class: 'sl-title', text: '🌿 红树林与候鸟' }));
      SPECIES.forEach(sp => {
        const locked = !isUnlocked(sp);
        const done = mastered().includes(sp.id);
        const item = el('div', {
          class: 'sl-item' + (locked ? ' locked' : '') + (done ? ' done' : ''),
          onclick: () => this.openPanel(sp),
        }, [
          el('span', { class: 'sl-emoji', style: { color: sp.color }, text: sp.emoji }),
          el('span', { class: 'sl-name', text: sp.name }),
          el('span', { class: 'sl-flag', text: done ? '✅' : (locked ? '🔒' : '') }),
        ]);
        box.appendChild(item);
      });
    },

    openPanel(sp) {
      this.current = sp;
      const mask = el('div', { class: 'modal-mask species-mask' });
      const panel = el('div', { class: 'species-panel' });
      mask.appendChild(panel);
      mask.addEventListener('click', e => { if (e.target === mask) mask.remove(); });

      const header = el('div', { class: 'sp-header' }, [
        el('div', { class: 'sp-title' }, [
          el('span', { class: 'sp-emoji', style: { color: sp.color }, text: sp.emoji }),
          el('div', {}, [
            el('h3', { text: sp.name }),
            el('span', { class: 'sp-en', text: sp.enName + ' · ' + (sp.category === 'bird' ? '候鸟' : '红树植物') }),
          ]),
        ]),
        el('div', { class: 'sp-actions' }, [
          el('button', { class: 'sp-share', text: '🔗', title: '分享', onclick: () => global.Share.species(sp) }),
          el('button', { class: 'sp-close', text: '✕', onclick: () => mask.remove() }),
        ]),
      ]);

      const tabs = el('div', { class: 'sp-tabs' }, [
        this._tab('info', '📋 信息卡'),
        this._tab('quiz', '🎯 问答'),
        this._tab('msg', '💬 留言'),
        this._tab('ai', '🤖 AI'),
      ]);
      const content = el('div', { class: 'sp-content' });
      panel.appendChild(header); panel.appendChild(tabs); panel.appendChild(content);

      const renderTab = (tab) => {
        tabs.querySelectorAll('.sp-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
        content.innerHTML = '';
        if (tab === 'info') content.appendChild(global.InfoCard.render(sp));
        else if (tab === 'quiz') content.appendChild(this._quizTab(sp));
        else if (tab === 'msg') content.appendChild(global.MessageWall.renderWall(sp));
        else if (tab === 'ai') content.appendChild(new global.AIAssistant(sp).render());
      };
      tabs.querySelectorAll('.sp-tab').forEach(t => t.addEventListener('click', () => renderTab(t.dataset.tab)));
      renderTab('info');

      document.body.appendChild(mask);
    },

    _tab(id, label) { return el('button', { class: 'sp-tab', 'data-tab': id, text: label }); },

    _quizTab(sp) {
      if (!isUnlocked(sp)) {
        const prev = SPECIES[SPECIES.findIndex(s => s.id === sp.id) - 1];
        return el('div', { class: 'quiz-locked' }, [
          el('p', { text: '🔒 该物种尚未解锁' }),
          el('p', { class: 'quiz-locked-hint', text: prev ? `先完成「${prev.name}」的问答即可解锁～` : '' }),
        ]);
      }
      const onComplete = (s, allCorrect, correct, total) => {
        const m = mastered().slice();
        if (!m.includes(s.id)) m.push(s.id);
        Store.set(MASTER_KEY, m);
        let msg = `答题完成：${correct}/${total} 正确`;
        const badge = global.Store.onQuizMastered(s.id, allCorrect);
        if (allCorrect) {
          unlockNextAfter(s.id);
          this._renderSpeciesList();
          msg += ' 🎉 已解锁新物种 + 徽章！';
          if (badge) msg += `（${badge.emoji}${badge.name}）`;
          // 答题成果分享
          const shareBtn = el('button', { class: 'ic-btn', text: '🔗 分享成绩', onclick: () => global.Share.result(s, correct, total) });
          setTimeout(() => { document.querySelector('.quiz-view') && document.querySelector('.quiz-view').appendChild(shareBtn); }, 50);
        }
        toast(msg, allCorrect ? 'success' : 'info');
      };
      return new global.QuizPanel(sp, onComplete).render();
    },

    drawSpeciesRoute(sp) {
      this.map.clearRoutes();
      if (sp.category !== 'bird' || !sp.routeWaypoints || !sp.routeWaypoints.length) {
        toast(sp.name + ' 是红树植物，不迁徙～', 'info');
        return;
      }
      this.map.drawRoute(sp.routeWaypoints, sp.color, sp.name + ' · ' + sp.migrationRoute);
      toast('已在地图绘制 ' + sp.name + ' 的迁徙路线', 'success');
    },

    _renderMe() {
      const wrap = el('div', { class: 'me-view' });
      const u = unlocked(), m = mastered(), owned = global.Store.owned();
      const coins = global.Store.coins();
      wrap.appendChild(el('h3', { text: '👤 我的深湾' }));
      wrap.appendChild(el('div', { class: 'me-stats' }, [
        this._stat('🪙 科普币', coins),
        this._stat('✅ 已掌握', m.length + '/' + SPECIES.length),
        this._stat('🔓 已解锁', u.length + '/' + SPECIES.length),
        this._stat('🏅 徽章', owned.filter(id => id.startsWith('badge-')).length),
      ]));
      wrap.appendChild(el('p', { class: 'me-tip', text: '在地图上点选物种，完成问答可解锁新物种并赚取科普币。' }));
      wrap.appendChild(el('button', { class: 'ic-btn ghost', text: '重置进度', onclick: () => {
        ['unlocked', 'mastered', 'owned', 'awardedBadges', 'coins'].forEach(k => Store.del(k));
        toast('进度已重置', 'info'); this._renderSpeciesList(); this._switchView('me');
      } }));
      return wrap;
    },
    _stat(label, val) {
      return el('div', { class: 'me-stat' }, [
        el('div', { class: 'me-stat-val', text: String(val) }),
        el('div', { class: 'me-stat-label', text: label }),
      ]);
    },
  };

  global.App = App;
  document.addEventListener('DOMContentLoaded', () => App.init());
})(window);
