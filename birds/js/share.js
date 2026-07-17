/**
 * 好友分享：物种 / 答题成果 / 留言 可一键分享。
 * 优先调用 Web Share API；不支持时生成 Canvas 卡片供下载 + 复制链接。
 */
(function (global) {
  'use strict';
  const { el, toast } = global.U;

  function appUrl() { return location.origin + location.pathname; }

  // 生成分享卡片（Canvas）
  function drawCard({ emoji, title, subtitle, footer }) {
    const c = document.createElement('canvas');
    c.width = 600; c.height = 800;
    const ctx = c.getContext('2d');
    // 背景渐变
    const g = ctx.createLinearGradient(0, 0, 0, 800);
    g.addColorStop(0, '#0a1f3c'); g.addColorStop(1, '#06243f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 600, 800);
    // 装饰圆环
    ctx.strokeStyle = 'rgba(0,200,200,0.25)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(300, 300, 150, 0, Math.PI * 2); ctx.stroke();
    // emoji
    ctx.font = '120px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 300, 290);
    // 标题
    ctx.fillStyle = '#fff'; ctx.font = 'bold 44px sans-serif';
    ctx.fillText(title, 300, 500);
    // 副标题
    ctx.fillStyle = 'rgba(224,240,255,0.8)'; ctx.font = '22px sans-serif';
    const lines = wrapText(ctx, subtitle, 460);
    lines.forEach((ln, i) => ctx.fillText(ln, 300, 560 + i * 32));
    // 页脚
    ctx.fillStyle = 'rgba(0,212,212,0.9)'; ctx.font = '20px sans-serif';
    ctx.fillText(footer || '羽迹·深湾 — 深圳湾候鸟与红树林科普', 300, 740);

    return c;
  }

  function wrapText(ctx, text, maxW) {
    const chars = text.split('');
    const lines = []; let cur = '';
    for (const ch of chars) {
      if (ctx.measureText(cur + ch).width > maxW) { lines.push(cur); cur = ch; }
      else cur += ch;
    }
    if (cur) lines.push(cur);
    return lines.slice(0, 4);
  }

  async function doShare({ emoji, title, subtitle, footer, shareText }) {
    const canvas = drawCard({ emoji, title, subtitle, footer });
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    const file = new File([blob], 'yujishenwan.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title, text: shareText });
        toast('已唤起系统分享', 'success'); return;
      } catch (e) { /* 用户取消，降级 */ }
    }
    if (navigator.share) {
      try { await navigator.share({ title, text: shareText, url: appUrl() }); return; }
      catch (e) {}
    }
    // 降级：弹窗提供下载 + 复制链接
    showFallback(canvas, blob, title, subtitle, shareText);
  }

  function showFallback(canvas, blob, title, subtitle, shareText) {
    const url = URL.createObjectURL(blob);
    const modal = el('div', { class: 'modal-mask' }, [
      el('div', { class: 'share-card-modal' }, [
        el('h3', { text: '分享给好友 🔗' }),
        el('img', { src: url, class: 'share-preview', alt: 'share card' }),
        el('div', { class: 'share-actions' }, [
          el('a', { class: 'ic-btn', href: url, download: 'yujishenwan.png', text: '⬇️ 保存图片' }),
          el('button', { class: 'ic-btn', text: '📋 复制文字', onclick: async () => {
            try { await navigator.clipboard.writeText(shareText); toast('已复制', 'success'); }
            catch (e) { toast('复制失败', 'error'); }
          } }),
          el('button', { class: 'ic-btn ghost', text: '关闭', onclick: () => modal.remove() }),
        ]),
      ]),
    ]);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
  }

  const Share = {
    species(sp) {
      return doShare({
        emoji: sp.emoji, title: sp.name, subtitle: sp.category === 'bird'
          ? `${sp.migrationRoute} · ${sp.protectionLevel}` : `${sp.protectionLevel} · 深圳湾红树林`,
        footer: '羽迹·深湾 — 扫码一起来认识它',
        shareText: `我在「羽迹·深湾」认识了${sp.name}（${sp.enName}）：${sp.funFact} ${appUrl()}`,
      });
    },
    result(sp, correct, total) {
      return doShare({
        emoji: '🏆', title: '答题达成！', subtitle: `我在「羽迹·深湾」答对 ${correct}/${total} 道关于${sp.name}的趣味题`,
        footer: '羽迹·深湾 — 快来挑战',
        shareText: `我在「羽迹·深湾」答对 ${correct}/${total} 道关于${sp.name}的题，你来试试？${appUrl()}`,
      });
    },
  };

  global.Share = Share;
})(window);
