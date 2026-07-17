/**
 * AI 助手：对话式物种问答。
 *  - local 模式：内置知识匹配引擎，离线可用，覆盖常见个性化提问。
 *  - llm 模式：调用兼容 OpenAI 的接口（见 config.js LLM 配置）。
 */
(function (global) {
  'use strict';
  const { el, toast, escapeHtml } = global.U;
  const { SPECIES, getById } = global.SPECIES_DATA;

  function findSpeciesMention(text) {
    for (const s of SPECIES) {
      if (text.includes(s.name) || (s.enName && text.toLowerCase().includes(s.enName.toLowerCase()))) return s;
    }
    return null;
  }

  // 本地知识匹配引擎
  function localAnswer(question, ctxSp) {
    const q = question.toLowerCase();
    const sp = ctxSp;

    if (/你好|您好|hi|hello|在吗|你是谁|介绍下你/.test(question)) {
      return '我是「羽迹·深湾」AI 科普助手 🤖 可以问我关于深圳湾候鸟与红树林的任何问题，比如"它几月来深圳湾""和黑脸琵鹭有什么区别""它吃什么"。';
    }
    if (!sp) {
      return '请先在地图上点选一个物种，或告诉我你想了解哪种鸟/红树植物，我来为你讲解～';
    }

    // 对比类
    const cmp = question.match(/和(.+?)(有|的|区别|不同|比|呢|？|\?)/) || question.match(/(.+?)和(.+?)(区别|不同)/);
    const mention = findSpeciesMention(question.replace(sp.name, ''));
    if ((/区别|不同|对比|差异|比/.test(question)) && mention && mention.id !== sp.id) {
      return compare(sp, mention);
    }

    if (/几月|什么时候|何时|季节|来深圳湾|来深|越冬|繁殖/.test(question)) {
      return `${sp.name}在深圳湾的出现时间：${sp.arrivesShenzhenBay}。`;
    }
    if (/保护|级别|濒危|几级|珍稀|受保护/.test(question)) {
      return `${sp.name}的保护等级：${sp.protectionLevel}。`;
    }
    if (/迁徙|路线|迁飞|飞[到去]|来回|公里|多远|从哪/.test(question)) {
      const extra = sp.category === 'bird'
        ? ` 主要沿「${sp.migrationRoute}」迁徙。`
        : ` 它是红树植物，不迁徙，四季常绿，为候鸟提供栖息地。`;
      return `${sp.name}的迁徙信息：${extra}`;
    }
    if (/吃|食物|觅食|捕食|吃什么/.test(question)) {
      return `关于${sp.name}的食性与习性：${sp.habits}`;
    }
    if (/特征|长什么|识别|辨认|样子|外形|颜色/.test(question)) {
      return `${sp.name}的识别特征：${sp.features}`;
    }
    if (/习性|生活|行为|喜欢/.test(question)) {
      return `${sp.name}的生活习性：${sp.habits}`;
    }
    if (/趣闻|冷知识|有趣|故事|小知识/.test(question)) {
      return `关于${sp.name}的趣闻：${sp.funFact}`;
    }
    if (/红树林|栖息地|住哪|哪里|环境|生境/.test(question)) {
      return sp.category === 'bird'
        ? `${sp.name}依赖深圳湾的红树林与滩涂湿地作为觅食、停歇和越冬的栖息地。红树林为底栖生物提供家园，是候鸟的食物来源。`
        : `${sp.name}是红树植物，生于深圳湾潮间带泥滩，耐盐、抗风浪，并为候鸟提供食物与庇护。`;
    }
    // 兜底
    return `我是基于物种知识库回答的本地助手。关于${sp.name}：它${sp.features} 更多信息可查看「信息卡」。更复杂的个性化问题可接入 LLM（见 config.js 的 AI_MODE）。`;
  }

  function compare(a, b) {
    const rows = [
      ['类别', a.category === 'bird' ? '候鸟' : '红树植物', b.category === 'bird' ? '候鸟' : '红树植物'],
      ['保护等级', a.protectionLevel, b.protectionLevel],
      ['特征', a.features, b.features],
      ['习性', a.habits, b.habits],
      ['来深/可见', a.arrivesShenzhenBay, b.arrivesShenzhenBay],
    ];
    let txt = `🆚 ${a.name} vs ${b.name}：\n`;
    rows.forEach(([k, va, vb]) => { txt += `· ${k}：${a.name} ${va}；${b.name} ${vb}\n`; });
    return txt;
  }

  // LLM 调用（可插拔）
  async function llmAnswer(question, ctxSp, history) {
    const cfg = global.APP_CONFIG.LLM;
    const sys = `你是「羽迹·深湾」鸟类与红树林科普助手。当前语境物种：${ctxSp ? ctxSp.name + '（' + ctxSp.features + '；' + ctxSp.habits + '；保护等级：' + ctxSp.protectionLevel + '；来深时间：' + ctxSp.arrivesShenzhenBay + '）' : '未指定'}。请基于事实简洁回答。`;
    const messages = [{ role: 'system', content: sys },
      ...history.map(h => ({ role: h.from === 'user' ? 'user' : 'assistant', content: h.text })),
      { role: 'user', content: question }];
    const resp = await fetch(cfg.BASE_URL + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.API_KEY },
      body: JSON.stringify({ model: cfg.CHAT_MODEL, messages, temperature: 0.6 }),
    });
    if (!resp.ok) throw new Error('LLM HTTP ' + resp.status);
    const json = await resp.json();
    return json.choices?.[0]?.message?.content || '（无内容）';
  }

  class AIAssistant {
    constructor(sp) { this.sp = sp; this.history = []; }

    render() {
      const wrap = el('div', { class: 'ai-view' });
      wrap.appendChild(el('div', { class: 'ai-head', text: '🤖 AI 科普助手' + (this.sp ? ' · ' + this.sp.name : '') }));

      const box = el('div', { class: 'ai-box' });
      const input = el('input', { class: 'ai-input', placeholder: '问问它：比如"它几月来深圳湾？"' });
      const send = el('button', { class: 'ic-btn', text: '发送' });

      const pushMsg = (from, text) => {
        const m = el('div', { class: 'ai-msg ' + from }, [
          el('div', { class: 'ai-bubble', html: escapeHtml(text).replace(/\n/g, '<br>') }),
        ]);
        box.appendChild(m); box.scrollTop = box.scrollHeight;
      };

      const ask = async () => {
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        pushMsg('user', text);
        this.history.push({ from: 'user', text });
        const thinking = el('div', { class: 'ai-msg ai waiting' }, el('div', { class: 'ai-bubble', text: '思考中…' }));
        box.appendChild(thinking);

        let ans;
        try {
          if (global.APP_CONFIG.AI_MODE === 'llm' && global.APP_CONFIG.LLM.API_KEY) {
            ans = await llmAnswer(text, this.sp, this.history);
          } else {
            ans = await Promise.resolve(localAnswer(text, this.sp));
          }
        } catch (e) {
          ans = '（调用失败，已切换本地回答）' + localAnswer(text, this.sp);
        }
        thinking.remove();
        pushMsg('ai', ans);
        this.history.push({ from: 'ai', text: ans });
      };
      send.onclick = ask;
      input.addEventListener('keydown', e => { if (e.key === 'Enter') ask(); });

      wrap.appendChild(box);
      wrap.appendChild(el('div', { class: 'ai-compose' }, [input, send]));
      // 预置欢迎语
      setTimeout(() => pushMsg('ai', this.sp
        ? `你好！我是${this.sp.name}的 AI 讲解员 🤖 想了解它的迁徙、习性还是保护现状？`
        : '你好！点选一个物种后，我可以回答关于它的个性化问题～'), 100);
      return wrap;
    }
  }

  global.AIAssistant = AIAssistant;
})(window);
