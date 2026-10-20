(() => {
  'use strict';
  const fx = window.JBI_FX; if (!fx) return;
  const image = name => new Promise((resolve, reject) => {
    const img = new Image(); img.onload = () => resolve(img); img.onerror = reject;
    img.src = new URL(name, fx.assets).href;
  });
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const sprite = (ctx, img, x, y, time, size = 128, frames = 8) => {
    ctx.drawImage(img, Math.floor(time / 100) % frames * 128, 0, 128, 128, Math.round(x - size / 2), Math.round(y - size / 2), size, size);
  };
  async function logo() {
    const fallback = document.querySelector('.hero-logo'); if (!fallback) return;
    const [vector, pixel] = await Promise.all(['logo-vector.png','logo-pixel-1x.png'].map(image));
    const holder = fallback.closest('.logo-stage'); if (!holder) return;
    const canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden', 'true'); holder.append(canvas);
    let ctx, width = 0, height = 0, scale = 1, start = null, skipped = !!fx.openingSkipped;
    const mask = document.createElement('canvas'); mask.width = 116; mask.height = 18;
    const m = mask.getContext('2d'); if (!m) return; m.imageSmoothingEnabled = false;m.drawImage(pixel,0,0);
    const pixels = m.getImageData(0,0,116,18).data, dots = [];
    for (let y = 0; y < 18; y++) for (let x = 0; x < 116; x++) if (pixels[(y * 116 + x) * 4 + 3] > 96) dots.push({x,y});
    function resize() {
      scale = Math.max(1, Math.min(5, Math.floor(holder.clientWidth / 116)));
      width = 116 * scale; height = 34 * scale;
      canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
      ctx = fx.canvas(canvas,width,height);
      fx.refresh(canvas);
    }
    new ResizeObserver(resize).observe(holder); resize(); if (!ctx) return;
    document.addEventListener('jbi:skip', () => { skipped = true; });
    fx.add(canvas, (time, dt, still) => {
      if (!ctx) return;
      if (start === null) start = time;
      const duration = fx.shortOpening ? fx.beat : fx.beat * 2.7;
      const progress = still || skipped ? 1 : clamp((time - start) / duration, 0, 1);
      ctx.clearRect(0,0,width,height);
      const frontier = progress * (width + 12 * scale);
      if (progress < 1) {
        ctx.save(); ctx.beginPath(); ctx.rect(frontier,0,width,height); ctx.clip();
        const vh = Math.round(width * vector.height / vector.width);
        ctx.drawImage(vector,0,Math.round((height - vh) / 2),width,vh); ctx.restore();
      }
      const glint = still ? -100 : ((time / fx.beat) % 4) * width / 2 - width * .15;
      dots.forEach(dot => {
        const x = dot.x * scale, y = (dot.y + 8) * scale;
        if (x > frontier) return;
        const edge = progress < 1 ? clamp((frontier - x) / (12 * scale),0,1) : 1;
        const noise = ((dot.x * 17 + dot.y * 31) % 13 - 6);
        ctx.fillStyle = Math.abs(x + y * .5 - glint) < scale * 2 ? '#22c2e0' : '#fff5fa';
        ctx.fillRect(x + Math.round((1 - edge) * noise) * scale, y + Math.round((1 - edge) * noise * 2) * scale,scale,scale);
      });
      holder.classList.add('logo-ready');
    });
  }

  async function steam() {
    const panel = document.querySelector('.steam-panel'); if (!panel) return;
    const fallback = panel.querySelector('.cta-player');
    const neutral = await image('player-neutral-sheet.png');
    const canvas = document.createElement('canvas');canvas.className = 'cta-player';canvas.setAttribute('aria-hidden','true');
    const ctx = fx.canvas(canvas,256,256);if (!ctx) return;
    fallback.replaceWith(canvas);
    fx.add(panel,(time,dt,still) => {
      ctx.clearRect(0,0,256,256);sprite(ctx,neutral,128,128,still ? 0 : time,256);
      const rect = panel.getBoundingClientRect();
      const offset = still ? 0 : clamp((innerHeight / 2 - rect.top - rect.height / 2) * .055,-32,32);
      panel.style.setProperty('--cta-parallax',offset + 'px');
      panel.style.setProperty('--glint',still ? '-50%' : (-50 + time % fx.beat / fx.beat * 220) + '%');
    });
  }

  function texture() {
    const canvas = document.createElement('canvas'); canvas.className = 'film-grain'; canvas.setAttribute('aria-hidden','true');
    const tile = document.createElement('canvas');tile.width = tile.height = 96;
    const ctx = tile.getContext('2d'); if (!ctx) return;
    const data = ctx.createImageData(96,96); let seed = 130;
    for (let i = 0; i < data.data.length; i += 4) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      data.data[i] = data.data[i+1] = data.data[i+2] = seed % 256; data.data[i+3] = 24;
    }
    ctx.putImageData(data,0,0);
    const paint = () => {
      const width = document.documentElement.clientWidth, height = innerHeight;
      const surface = fx.canvas(canvas,width,height);if (!surface) return;
      surface.fillStyle = surface.createPattern(tile,'repeat');surface.fillRect(0,0,width,height);
    };
    document.body.append(canvas);paint();addEventListener('resize',paint,{passive:true});
  }
  const init = () => { logo().catch(() => {}); steam().catch(() => {}); texture(); };
  if (document.readyState === 'complete') init(); else addEventListener('load', () => {
    if ('requestIdleCallback' in window) requestIdleCallback(init,{timeout:350}); else setTimeout(init,0);
  },{once:true});
})();
