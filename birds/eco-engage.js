/*
 * eco-engage.js — 「羽迹·深湾」互动增强层
 * 在 HZ-CZY/Hongshuling 现有地图/物种卡/照片AI/商城之上,补齐「互动 + 社交」能力:
 *   1) 物种问答 + 解锁机制(答对解锁下一物种,科普币激励)
 *   2) 物种留言墙 UGC(本地持久化 + 点赞)
 *   3) 对话式 AI 助手(基于知识库的关键词应答)
 *   4) 好友分享(Web Share API + Canvas 卡片兜底)
 * 通过右下角浮动停靠栏进入,复用 EcoKnowledge(eco-knowledge.js)。
 */
(function () {
  'use strict';
  var K = window.EcoKnowledge;
  if (!K) { console.error('[eco-engage] EcoKnowledge 未加载,请确认 eco-knowledge.js 先于本文件引入'); return; }
  var SPECIES = K.SPECIES, byId = K.byId, Store = K.Store, Unlock = K.Unlock,
      el = K.el, escapeHtml = K.escapeHtml, timeAgo = K.timeAgo, toast = K.toast, localAnswer = K.localAnswer;

  var currentId = (Unlock.all()[0]) || (SPECIES[0] && SPECIES[0].id);
  var masteredCount = function () { return Store.get('mastered', []).length; };
  var unlockedCount = function () { return Unlock.all().length; };

  // ---------- 模态根 ----------
  function getRoot() {
    var r = document.getElementById('eng-root');
    if (!r) { r = el('div', { id: 'eng-root' }); document.body.appendChild(r); }
    return r;
  }
  function closePanel() { var r = document.getElementById('eng-root'); if (r) r.innerHTML = ''; }
  function openPanel(node) {
    var r = getRoot(); r.innerHTML = '';
    r.appendChild(el('div', { class: 'eng-backdrop', onclick: closePanel }));
    r.appendChild(el('section', { class: 'eng-panel eng-panel--center' }, node));
  }
  function head(title, sub) {
    return el('div', { class: 'eng-head' }, [
      el('div', {}, [
        el('span', { class: 'eng-eyebrow' }, 'ENGAGE'),
        el('h2', {}, title),
        el('p', {}, sub || '')
      ]),
      el('button', { class: 'eng-close', onclick: closePanel }, '×')
    ]);
  }

  // ---------- 物种选择器(锁定物种不可选) ----------
  function renderPicker(onChange) {
    var wrap = el('div', { class: 'eng-species-pick' });
    SPECIES.forEach(function (sp) {
      var unlocked = Unlock.has(sp.id);
      wrap.appendChild(el('button', {
        class: (sp.id === currentId ? 'active ' : '') + (unlocked ? '' : 'locked'),
        onclick: function () {
          if (!unlocked) { toast('该物种尚未解锁,先完成前面的问答 🔒'); return; }
          currentId = sp.id; if (onChange) onChange();
        }
      }, (unlocked ? (sp.emoji + ' ' + sp.name) : ('🔒 ' + sp.name))));
    });
    return wrap;
  }

  // ---------- 1) 问答 + 解锁 ----------
  function quizPanel() {
    var sp = byId(currentId);
    var node = el('div');
    var idx = 0, correctCount = 0;

    function render() {
      node.innerHTML = '';
      node.appendChild(head('🧠 物种问答 · 解锁机制', sp.name + ' · 全部答对即可解锁下一物种'));
      node.appendChild(renderPicker(render));
      if (!sp.quiz || !sp.quiz.length) {
        node.appendChild(el('div', { class: 'eng-empty' }, '该物种暂未配置问答题目。'));
        return;
      }
      node.appendChild(el('div', { class: 'eng-quiz-meta' }, [
        el('span', {}, ['进度 ', el('b', {}, (idx + 1) + '/' + sp.quiz.length)]),
        el('span', {}, ['已掌握 ', el('b', {}, Unlock.mastered(sp.id) ? '✓' : '—')])
      ]));
      var q = sp.quiz[idx];
      node.appendChild(el('div', { class: 'eng-question' }, (idx + 1) + '. ' + q.q));
      var opts = el('div', { class: 'eng-options' });
      q.options.forEach(function (opt, i) {
        opts.appendChild(el('button', { class: 'eng-option', onclick: function () { answer(i, opts, q); } }, opt));
      });
      node.appendChild(opts);
    }

    function answer(i, opts, q) {
      if (opts._done) return; opts._done = true;
      Array.prototype.forEach.call(opts.children, function (o, oi) {
        if (oi === q.answer) o.classList.add('correct');
        else if (oi === i) o.classList.add('wrong');
        o.disabled = true;
      });
      if (i === q.answer) correctCount++;
      node.appendChild(el('div', { class: 'eng-feedback' },
        (i === q.answer ? '✅ 答对了!' : ('❌ 正确答案:' + q.options[q.answer]))));
      node.appendChild(el('button', {
        class: 'eng-btn', style: { marginTop: '14px' },
        onclick: function () { idx++; if (idx < sp.quiz.length) render(); else finish(); }
      }, (idx < sp.quiz.length - 1 ? '下一题' : '查看成绩')));
    }

    function finish() {
      node.innerHTML = '';
      node.appendChild(head('🧠 答题完成', sp.name));
      var allRight = correctCount === sp.quiz.length;
      if (allRight) {
        Unlock.master(sp.id);
        var i = SPECIES.findIndex(function (s) { return s.id === sp.id; });
        var unlockedNew = false, nextSp = null;
        if (i >= 0 && i + 1 < SPECIES.length) {
          nextSp = SPECIES[i + 1];
          if (!Unlock.has(nextSp.id)) { Unlock.unlock(nextSp.id); unlockedNew = true; }
        }
        var coins = Store.get('coins', 0) + 10; Store.set('coins', coins);
        var children = [
          el('div', { class: 'eng-emoji' }, '🎉'),
          el('h2', {}, '全部答对!'),
          el('p', {}, ['获得 ', el('span', { class: 'eng-coin' }, '+10 科普币'), ' 当前 ' + coins + ' 币']),
          unlockedNew
            ? el('p', { style: { color: 'var(--eng-green)', marginTop: '8px' } }, '🔓 已解锁新物种:' + nextSp.name + '!')
            : el('p', {}, '已是最后的物种,继续巩固吧!')
        ];
        node.appendChild(el('div', { class: 'eng-quiz-done' }, children));
      } else {
        node.appendChild(el('div', { class: 'eng-quiz-done' }, [
          el('div', { class: 'eng-emoji' }, '💪'),
          el('h2', {}, '还差一点'),
          el('p', {}, '本次答对 ' + correctCount + '/' + sp.quiz.length + ' 题,全部答对才能解锁下一物种哦。')
        ]));
      }
      node.appendChild(el('div', { style: { textAlign: 'center', marginTop: '16px' } }, [
        el('button', { class: 'eng-btn eng-btn--ghost', onclick: function () { idx = 0; correctCount = 0; render(); } }, '再答一次'),
        el('button', { class: 'eng-btn', style: { marginLeft: '10px' }, onclick: closePanel }, '完成')
      ]));
      refreshBadge();
    }

    render();
    return node;
  }

  // ---------- 2) 留言墙 UGC ----------
  function messagesPanel() {
    var sp = byId(currentId);
    var node = el('div');
    function load() { return Store.get('msg:' + sp.id, []); }
    function save(list) { Store.set('msg:' + sp.id, list); }

    function render() {
      node.innerHTML = '';
      node.appendChild(head('💬 物种留言墙', sp.name + ' · 分享你的观察与感悟'));
      node.appendChild(renderPicker(render));
      var form = el('form', { class: 'eng-msg-form', onsubmit: function (e) { e.preventDefault(); post(); } });
      var input = el('input', { type: 'text', placeholder: '说点什么…(如:今天在深圳湾看到它觅食!)', maxlength: '120' });
      form.appendChild(input);
      form.appendChild(el('button', { class: 'eng-btn', type: 'submit' }, '发布'));
      node.appendChild(form);

      var list = el('div', { class: 'eng-msg-list' });
      var msgs = load().slice().reverse();
      if (!msgs.length) list.appendChild(el('div', { class: 'eng-empty' }, '还没有留言,来做第一个吧 🐾'));
      msgs.forEach(function (m) {
        var liked = !!Store.get('liked', {})[sp.id + ':' + m.id];
        list.appendChild(el('div', { class: 'eng-msg' }, [
          el('div', { class: 'eng-msg-top' }, [
            el('div', { class: 'eng-msg-avatar' }, m.avatar || '🐾'),
            el('div', { class: 'eng-msg-name' }, m.name || '匿名观察者'),
            el('div', { class: 'eng-msg-time' }, timeAgo(m.ts))
          ]),
          el('div', { class: 'eng-msg-body' }, m.text),
          el('div', { class: 'eng-msg-actions' }, [
            el('button', { class: 'eng-like' + (liked ? ' liked' : ''), onclick: function (ev) { toggleLike(ev, m.id); } },
              (liked ? '❤️ ' : '🤍 ') + (m.likes || 0) + ' 赞')
          ])
        ]));
      });
      node.appendChild(list);
    }

    function post() {
      var input = node.querySelector('.eng-msg-form input');
      var text = (input.value || '').trim();
      if (!text) { toast('写点内容再发布~'); return; }
      var list = load();
      list.push({ id: Date.now(), name: '我', avatar: '🌟', text: text, ts: Date.now(), likes: 0 });
      save(list); render(); toast('发布成功 🎉');
    }
    function toggleLike(ev, id) {
      var likedMap = Store.get('liked', {}); var key = sp.id + ':' + id;
      var list = load(); var m = list.find(function (x) { return x.id === id; }); if (!m) return;
      if (likedMap[key]) { delete likedMap[key]; m.likes = Math.max(0, (m.likes || 0) - 1); }
      else { likedMap[key] = true; m.likes = (m.likes || 0) + 1; }
      Store.set('liked', likedMap); save(list); render();
    }

    render();
    return node;
  }

  // ---------- 3) AI 对话助手 ----------
  function aiPanel() {
    var node = el('div', { class: 'eng-chat' });
    node.appendChild(head('🤖 物种 AI 助手', '基于物种知识库的个性化问答'));
    node.appendChild(renderPicker(function () { initChat(); }));
    var log = el('div', { class: 'eng-chat-log' });
    var input = el('input', { type: 'text', placeholder: '问问它:几月来深湾?和谁区别?保护等级?' });
    var inputRow = el('div', { class: 'eng-chat-input' }, [
      input, el('button', { class: 'eng-btn', onclick: send }, '发送')
    ]);
    var chips = el('div', { class: 'eng-chips' }, [
      '它几月来深湾?', '和黑脸琵鹭有什么区别?', '保护等级是?', '迁徙路线是?'
    ].map(function (c) {
      return el('button', { class: 'eng-chip', onclick: function () { input.value = c; send(); } }, c);
    }));
    node.appendChild(log); node.appendChild(inputRow); node.appendChild(chips);

    function addBubble(text, who) {
      log.appendChild(el('div', { class: 'eng-bubble eng-bubble--' + who }, text));
      log.scrollTop = log.scrollHeight;
    }
    function ask(q) {
      var cur = byId(currentId);
      addBubble(q, 'user');
      var a = localAnswer(cur, q) || ('这个问题我暂时还不会,试试问我「' + cur.name + '几月来深湾」「保护等级」「迁徙路线」~');
      setTimeout(function () { addBubble(a, 'bot'); }, 260);
    }
    function send() {
      var q = (input.value || '').trim(); if (!q) return;
      input.value = ''; ask(q);
    }
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });
    function initChat() {
      log.innerHTML = '';
      var cur = byId(currentId);
      addBubble('你好!我是' + cur.name + '的科普助手 🤖 可以问我它几月来深湾、和谁有什么区别、保护等级、迁徙路线等。', 'bot');
    }
    initChat();
    return node;
  }

  // ---------- 4) 好友分享 ----------
  function sharePanel() {
    var sp = byId(currentId);
    var node = el('div');
    function renderSelf() {
      node.innerHTML = '';
      node.appendChild(head('📤 好友分享', '把深圳湾的精彩分享给朋友'));
      node.appendChild(renderPicker(renderSelf));
      node.appendChild(el('div', { class: 'eng-share-preview' }, [
        el('div', { class: 'big' }, sp.emoji),
        el('div', { class: 'ttl' }, sp.name),
        el('div', { class: 'sub' }, ((sp.intro || '').slice(0, 40)) + '…')
      ]));
      node.appendChild(el('div', { class: 'eng-share-grid' }, [
        el('div', { class: 'eng-share-card', onclick: function () { doShareSpecies(sp); } }, [el('span', { class: 'emoji' }, '🐦'), '分享物种']),
        el('div', { class: 'eng-share-card', onclick: doShareQuiz }, [el('span', { class: 'emoji' }, '🧠'), '分享答题成果']),
        el('div', { class: 'eng-share-card', onclick: function () { doShareMessage(sp); } }, [el('span', { class: 'emoji' }, '💬'), '分享留言墙'])
      ]));
      node.appendChild(el('p', { style: { color: 'var(--eng-muted)', fontSize: '12px', textAlign: 'center' } },
        '支持系统分享面板,不支持时自动生成卡片图片下载。'));
    }
    renderSelf();
    return node;
  }

  async function webShare(title, text, url) {
    try {
      if (navigator.share) { await navigator.share({ title: title, text: text, url: url }); return true; }
    } catch (e) { if (e && e.name === 'AbortError') return true; }
    return false;
  }
  function doShareSpecies(sp) {
    var text = '我在「羽迹·深湾」认识了' + sp.name + '(' + sp.enName + ')——' + (sp.facts[0] || '') + ' ' + sp.status + '。一起关注深圳湾候鸟与红树林吧!';
    webShare('羽迹·深湾 · ' + sp.name, text, location.href).then(function (ok) {
      if (!ok) downloadCard(sp.name, [sp.enName || '', (sp.facts[0] || ''), sp.status || '']);
    });
  }
  function doShareQuiz() {
    var total = SPECIES.length;
    var text = '我在「羽迹·深湾」答对了 ' + masteredCount() + ' 个物种的科普问答,已解锁 ' + unlockedCount() + '/' + total + ' 种!来挑战你的自然知识 🧠';
    webShare('羽迹·深湾 · 答题成果', text, location.href).then(function (ok) {
      if (!ok) downloadCard('答题成果', [masteredCount() + ' 个物种已掌握', '已解锁 ' + unlockedCount() + '/' + total + ' 种', '科普币 ' + Store.get('coins', 0)]);
    });
  }
  function doShareMessage(sp) {
    var list = Store.get('msg:' + sp.id, []);
    var last = list[list.length - 1];
    var text = last ? ('「' + sp.name + '」留言墙:' + last.text + ' ——来自羽迹·深湾') : ('「' + sp.name + '」留言墙还空着,来写下你的观察 🐾');
    webShare('羽迹·深湾 · 留言', text, location.href).then(function (ok) {
      if (!ok) downloadCard(sp.name + ' 留言墙', [last ? last.text.slice(0, 30) : '还没有留言', '来羽迹·深湾分享观察']);
    });
  }
  function downloadCard(title, lines) {
    var c = document.createElement('canvas'); c.width = 600; c.height = 320;
    var x = c.getContext('2d');
    x.fillStyle = '#071521'; x.fillRect(0, 0, 600, 320);
    x.fillStyle = 'rgba(94,234,181,.18)'; x.fillRect(0, 0, 600, 8);
    x.fillStyle = '#5eeab5'; x.font = 'bold 16px sans-serif'; x.fillText('羽迹·深湾 YUJI SHENWAN', 28, 50);
    x.fillStyle = '#eaf7f2'; x.font = 'bold 34px sans-serif'; x.fillText(title, 28, 112);
    x.fillStyle = '#94aaa7'; x.font = '17px sans-serif';
    var y = 162; lines.forEach(function (l) { x.fillText(l, 28, y); y += 30; });
    x.fillStyle = '#5eeab5'; x.font = '14px sans-serif'; x.fillText('关注深圳湾候鸟与红树林 · #保护迁飞区', 28, 300);
    c.toBlob(function (blob) {
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'yujishenwan-' + (title || 'share') + '.png'; a.click();
      toast('已生成分享卡片图片 ⬇️');
    });
  }

  // ---------- 停靠栏 ----------
  function refreshBadge() {
    var b = document.getElementById('eng-badge-问答解锁');
    if (b) b.textContent = String(masteredCount());
  }
  function mountDock() {
    if (document.getElementById('eng-dock')) return;
    var dock = el('div', { id: 'eng-dock' });
    var btns = [
      { emoji: '🧠', label: '问答解锁', badge: masteredCount, onClick: function () { openPanel(quizPanel()); } },
      { emoji: '💬', label: '留言墙', onClick: function () { openPanel(messagesPanel()); } },
      { emoji: '🤖', label: 'AI 助手', onClick: function () { openPanel(aiPanel()); } },
      { emoji: '📤', label: '分享', onClick: function () { openPanel(sharePanel()); } }
    ];
    btns.forEach(function (b) {
      dock.appendChild(el('button', { class: 'eng-dock-btn', onclick: b.onClick, 'aria-label': b.label }, [
        b.emoji,
        el('span', { class: 'eng-dock-label' }, b.label),
        b.badge ? el('span', { class: 'eng-badge', id: 'eng-badge-' + b.label }, String(b.badge())) : null
      ]));
    });
    document.body.appendChild(dock);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountDock);
  else mountDock();
})();
