/**
 * 上传候鸟照片 → 推断物种与迁徙路线。
 *  - 配置了视觉 LLM（config.js LLM.VISION_MODEL + API_KEY）时调用真实识别；
 *  - 否则提供「从已知物种中选择」模式（前端无法真正"看"图，逻辑透明标注）。
 */
(function (global) {
  'use strict';
  const { el, toast, escapeHtml } = global.U;
  const { SPECIES, getById } = global.SPECIES_DATA;

  function fileToBase64(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  async function visionIdentify(file) {
    const cfg = global.APP_CONFIG.LLM;
    const b64 = await fileToBase64(file);
    const resp = await fetch(cfg.BASE_URL + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.API_KEY },
      body: JSON.stringify({
        model: cfg.VISION_MODEL,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: '这是一张候鸟照片。请从以下物种名中判断最可能是哪一个，只回复物种中文名：' + SPECIES.map(s => s.name).join('、') },
            { type: 'image_url', image_url: { url: b64 } },
          ],
        }],
        temperature: 0.2,
      }),
    });
    if (!resp.ok) throw new Error('Vision HTTP ' + resp.status);
    const json = await resp.json();
    const name = json.choices?.[0]?.message?.content || '';
    return SPECIES.find(s => name.includes(s.name)) || null;
  }

  function render() {
    const wrap = el('div', { class: 'photo-view' });
    const useLLM = global.APP_CONFIG.AI_MODE === 'llm' && global.APP_CONFIG.LLM.API_KEY;

    wrap.appendChild(el('div', { class: 'photo-head' }, [
      el('h3', { text: '📷 上传候鸟照片，猜它的迁徙路线' }),
      el('p', { class: 'photo-tip', text: useLLM
        ? '已接入视觉识别，上传照片后将自动识别物种并绘制迁徙路线。'
        : '未配置视觉 API：上传后可从已知物种中选择，系统将推断其迁徙路线（逻辑透明）。' }),
    ]));

    const preview = el('div', { class: 'photo-preview', text: '点击或拖拽照片到此处' });
    const fileInput = el('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });

    const onFile = (file) => {
      if (!file) return;
      const url = URL.createObjectURL(file);
      preview.style.backgroundImage = `url(${url})`;
      preview.textContent = '';
      preview.classList.add('has-img');
      // 选择模式 UI
      const picker = el('div', { class: 'photo-picker' }, [
        el('label', { text: '请选择你拍到的物种（或等待识别）：' }),
        (() => {
          const sel = el('select', { class: 'photo-select' },
            [el('option', { value: '', text: '— 请选择 —' })]
              .concat(SPECIES.map(s => el('option', { value: s.id, text: `${s.emoji} ${s.name}` }))));
          sel.addEventListener('change', () => {
            if (sel.value) confirmSpecies(getById(sel.value));
          });
          return sel;
        })(),
      ]);
      preview.parentNode.insertBefore(picker, preview.nextSibling);

      if (useLLM) {
        toast('正在识别…', 'info');
        visionIdentify(file).then(sp => {
          if (sp) { confirmSpecies(sp); toast('识别为：' + sp.name, 'success'); }
          else toast('未能识别，请手动选择', 'warn');
        }).catch(e => { toast('识别失败：' + e.message, 'error'); });
      }
    };

    fileInput.addEventListener('change', e => onFile(e.target.files[0]));
    preview.addEventListener('click', () => fileInput.click());
    preview.addEventListener('dragover', e => { e.preventDefault(); preview.classList.add('drag'); });
    preview.addEventListener('dragleave', () => preview.classList.remove('drag'));
    preview.addEventListener('drop', e => { e.preventDefault(); preview.classList.remove('drag'); onFile(e.dataTransfer.files[0]); });

    function confirmSpecies(sp) {
      const box = wrap.querySelector('.photo-result');
      if (box) box.remove();
      const result = el('div', { class: 'photo-result' }, [
        el('h4', { text: `${sp.emoji} 推断为：${sp.name}` }),
        el('p', { html: sp.category === 'bird'
          ? `迁徙路线：<b>${escapeHtml(sp.migrationRoute)}</b><br>${escapeHtml(sp.features)}`
          : `它是红树植物（不迁徙），为候鸟提供栖息地。${escapeHtml(sp.features)}` }),
        el('div', { class: 'photo-result-actions' }, [
          el('button', { class: 'ic-btn', text: '🗺️ 在地图绘制路线', onclick: () => global.App.drawSpeciesRoute(sp) }),
          el('button', { class: 'ic-btn ghost', text: '🔗 分享', onclick: () => global.Share.species(sp) }),
        ]),
      ]);
      wrap.appendChild(result);
    }

    wrap.appendChild(preview);
    wrap.appendChild(fileInput);
    return wrap;
  }

  global.PhotoFeature = { render };
})(window);
