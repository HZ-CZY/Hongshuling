/**
 * 留言墙（UGC）：按物种存储用户留言，支持浏览、发布、点赞。
 * 说明：当前使用 localStorage 持久化，生产环境应替换为后端 API + 内容审核。
 */
(function (global) {
  'use strict';
  const { el, toast, escapeHtml, timeAgo, Store } = global.U;

  function key(spId) { return 'msgs:' + spId; }
  function load(spId) { return Store.get(key(spId), []); }
  function save(spId, list) { Store.set(key(spId), list); }

  function renderWall(sp) {
    const wrap = el('div', { class: 'msg-view' });
    const list = el('div', { class: 'msg-list' });

    function refresh() {
      const msgs = load(sp.id);
      list.innerHTML = '';
      if (!msgs.length) {
        list.appendChild(el('div', { class: 'msg-empty', text: '还没有留言，来做第一个和' + sp.name + '说话的人吧 💬' }));
      }
      msgs.slice().reverse().forEach(m => {
        const item = el('div', { class: 'msg-item' }, [
          el('div', { class: 'msg-meta' }, [
            el('span', { class: 'msg-name', text: m.name }),
            el('span', { class: 'msg-time', text: timeAgo(m.ts) }),
          ]),
          el('div', { class: 'msg-text', text: m.text }),
          el('button', {
            class: 'msg-like' + (m.liked ? ' liked' : ''),
            text: (m.liked ? '❤️ ' : '🤍 ') + m.likes,
            onclick: () => {
              m.likes += m.liked ? -1 : 1; m.liked = !m.liked;
              save(sp.id, msgs); refresh();
            },
          }),
        ]);
        list.appendChild(item);
      });
    }

    const input = el('textarea', { class: 'msg-input', placeholder: '说点什么吧，分享你和' + sp.name + '的故事…', rows: '2' });
    const nameInput = el('input', { class: 'msg-name-input', placeholder: '昵称（可空）', value: Store.get('nickname', '') });
    const send = el('button', {
      class: 'ic-btn', text: '发布留言',
      onclick: () => {
        const text = input.value.trim();
        if (!text) { toast('留言不能为空', 'warn'); return; }
        const nick = (nameInput.value || '').trim() || '匿名游客';
        Store.set('nickname', nick);
        const msgs = load(sp.id);
        msgs.push({ id: Date.now(), name: nick, text, ts: Date.now(), likes: 0, liked: false });
        save(sp.id, msgs);
        input.value = '';
        refresh();
        toast('留言已发布', 'success');
      },
    });

    wrap.appendChild(el('div', { class: 'msg-head', text: '💬 ' + sp.name + ' 的留言墙' }));
    wrap.appendChild(list);
    wrap.appendChild(el('div', { class: 'msg-compose' }, [nameInput, input, send]));
    refresh();
    return wrap;
  }

  global.MessageWall = { renderWall };
})(window);
