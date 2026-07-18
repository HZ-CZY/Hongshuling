(function () {
  'use strict';

  const birdEmojis = new Set(['🕊️', '🦢', '🐦', '🦆', '🦩', '🐧']);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function addPointerTilt(element) {
    if (reduceMotion) return;
    element.addEventListener('pointermove', event => {
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      element.style.setProperty('--tilt-x', `${(-y * 15).toFixed(2)}deg`);
      element.style.setProperty('--tilt-y', `${(x * 18).toFixed(2)}deg`);
      element.style.setProperty('--shine-x', `${((x + 0.5) * 100).toFixed(1)}%`);
      element.style.setProperty('--shine-y', `${((y + 0.5) * 100).toFixed(1)}%`);
    }, { passive: true });

    element.addEventListener('pointerleave', () => {
      element.style.removeProperty('--tilt-x');
      element.style.removeProperty('--tilt-y');
      element.style.removeProperty('--shine-x');
      element.style.removeProperty('--shine-y');
    }, { passive: true });
  }

  function makeKeyboardClickable(element) {
    element.setAttribute('role', 'button');
    element.tabIndex = 0;
    element.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      element.click();
    });
  }

  function enhanceMapMarker(marker, index) {
    if (marker.dataset.depthEnhanced === 'true') return;
    const face = marker.querySelector('.marker-emoji');
    if (!face) return;

    const emoji = face.textContent.trim();
    marker.dataset.depthEnhanced = 'true';
    marker.style.setProperty('--marker-index', index);
    marker.classList.add(birdEmojis.has(emoji) ? 'species-marker--bird' : 'species-marker--wildlife');
    marker.setAttribute('aria-label', `${emoji} 地图物种标记`);
    makeKeyboardClickable(marker);

    face.textContent = '';
    const creature = document.createElement('span');
    creature.className = 'marker-creature';
    creature.textContent = emoji;
    creature.setAttribute('aria-hidden', 'true');
    face.appendChild(creature);

    const orbit = document.createElement('span');
    orbit.className = 'marker-orbit';
    orbit.setAttribute('aria-hidden', 'true');
    marker.appendChild(orbit);
    addPointerTilt(marker);
  }

  function enhanceDockItem(item, index) {
    if (item.dataset.depthEnhanced === 'true') return;
    const emoji = item.querySelector('.strip-emoji')?.textContent?.trim() || '';
    item.dataset.depthEnhanced = 'true';
    item.style.setProperty('--dock-index', index);
    item.classList.add(birdEmojis.has(emoji) ? 'strip-item--bird' : 'strip-item--wildlife');
    makeKeyboardClickable(item);
    addPointerTilt(item);
  }

  function scan() {
    document.querySelectorAll('.custom-species-marker').forEach(enhanceMapMarker);
    document.querySelectorAll('.bottom-strip .strip-item').forEach(enhanceDockItem);
  }

  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  scan();
})();
