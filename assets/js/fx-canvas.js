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
  // The same full-size projectiles are used in the demo and feature diagrams.
  // All angles follow velocity: zero points right, PI / 2 points down.
  const chevron = (ctx, x, y, angle, length = 64) => {
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(angle);
    const stride = length / 4, h = length * .3;
    for (let i = 0; i < 4; i++) {
      const tip = length / 2 - i * stride;
      ctx.fillStyle = i === 0 ? '#fff9fc' : '#f01b46';
      ctx.beginPath(); ctx.moveTo(tip - stride, -h); ctx.lineTo(tip - stride * .6, -h);
      ctx.lineTo(tip, 0); ctx.lineTo(tip - stride * .6, h);
      ctx.lineTo(tip - stride, h); ctx.lineTo(tip - stride * .4, 0); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  };
  const orb = (ctx, x, y, angle, radius = 21) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    const alpha = ctx.globalAlpha;
    for (let i = 8; i > 0; i--) {
      ctx.globalAlpha = alpha * (1 - i / 9) * .55;
      ctx.fillStyle = '#e7c9ff'; ctx.beginPath();
      ctx.arc(-i * radius * .55, 0, radius * (1 - i / 10), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = alpha; ctx.fillStyle = '#9b1fe8';
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d581ff'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
  };
  const pellet = (ctx, x, y, radius = 6) => {
    ctx.fillStyle = '#fffbff'; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  };
  const laser = (ctx, x, y, angle) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = i === 0 ? '#f9ddff' : '#a81cef';
      ctx.globalAlpha *= i === 9 ? .4 : 1;
      ctx.fillRect(-i * 11, -5, 8, 10);
    }
    ctx.restore();
  };
  const projectile = (ctx, b) => {
    if (b.mode === 0) chevron(ctx,b.x,b.y,b.angle,b.size);
    else if (b.mode === 1) orb(ctx,b.x,b.y,b.angle,b.size);
    else if (b.mode === 2) pellet(ctx,b.x,b.y,b.size);
    else laser(ctx,b.x,b.y,b.angle);
  };
  const star = (ctx, x, y, age) => {
    ctx.strokeStyle = '#ffe16a'; ctx.globalAlpha *= Math.max(0, 1 - age);
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3, distance = 4 + age * 26;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * distance, y + Math.sin(a) * distance);
      ctx.lineTo(x + Math.cos(a) * (distance + 5), y + Math.sin(a) * (distance + 5)); ctx.stroke();
    }
    ctx.font = 'bold 11px monospace'; ctx.fillStyle = '#ffe16a'; ctx.fillText('+100', x + 12, y - 12 - age * 20);
  };

  async function hero() {
    const host = document.querySelector('.hero'); if (!host) return;
    const [neutral, left, right, boss] = await Promise.all(['player-neutral-sheet.png','player-left-sheet.png','player-right-sheet.png','boss-captain-idle-sheet.png'].map(image));
    const canvas = document.createElement('canvas'); canvas.className = 'bullet-demo'; canvas.setAttribute('aria-hidden', 'true'); host.prepend(canvas);
    const control = document.createElement('button'); control.type = 'button'; control.className = 'demo-control';
    control.textContent = fx.text('自機を誘導 / 矢印キー・ドラッグ', 'PILOT / ARROWS · DRAG');
    control.setAttribute('aria-label', fx.text('弾幕デモ。フォーカス中は矢印キーで自機を移動。Esc で自動回避', 'Bullet demo. Arrow keys steer while focused. Escape resumes autopilot'));
    host.append(control);
    let ctx, width, height, bullets = [], sparks = [], lastBeat = -1, quality = 1, slow = 0, staticScene = false;
    let player = {x:0, y:0}, pointer = null, keyboard = false, steering = false, lastGraze = -1000;
    let readZone = {left:0, right:0, top:0, bottom:0};
    function resize() {
      width = host.clientWidth; height = host.clientHeight; ctx = fx.canvas(canvas, width, height);
      if (!ctx) { canvas.remove(); control.remove(); return; }
      player.x = width * .78; player.y = height * .78;
      const rect = host.getBoundingClientRect(), copy = host.querySelector('.hero-content').getBoundingClientRect();
      const lastCopy = host.querySelector('.free-banner:not([hidden])') || host.querySelector('.hero .actions');
      readZone = {left:copy.left - rect.left, right:copy.left - rect.left + Math.min(copy.width, 670), top:copy.top - rect.top, bottom:lastCopy.getBoundingClientRect().bottom - rect.top + 16};
      fx.refresh(canvas);
    }
    const ro = new ResizeObserver(resize); ro.observe(host); resize(); if (!ctx) return;
    const locate = event => {
      const rect = host.getBoundingClientRect(); pointer = {x:clamp(event.clientX - rect.left, 24, width - 24), y:clamp(event.clientY - rect.top, height * .35, height - 36)};
    };
    host.addEventListener('pointerdown', event => {
      if (!fx.enabled || (event.target.closest('a,button') && event.target !== control)) return;
      steering = true; keyboard = false; locate(event);
      host.setPointerCapture(event.pointerId);
    });
    host.addEventListener('pointermove', event => { if (steering) locate(event); });
    ['pointerup','pointercancel','lostpointercapture'].forEach(type => host.addEventListener(type, () => { steering = false; if (!keyboard) pointer = null; }));
    control.addEventListener('keydown', event => {
      if (event.key === 'Escape') { pointer = null; keyboard = false; return; }
      const delta = {ArrowLeft:[-26,0],ArrowRight:[26,0],ArrowUp:[0,-26],ArrowDown:[0,26]}[event.key];
      if (!delta || !fx.enabled) return; event.preventDefault(); keyboard = true;
      pointer = pointer || {...player}; pointer.x = clamp(pointer.x + delta[0], 24, width - 24); pointer.y = clamp(pointer.y + delta[1], height * .35, height - 36);
    });
    control.addEventListener('blur', () => { keyboard = false; pointer = null; });
    const arena = () => ({x:width * .79, y:width <= 850 ? height - 345 : height * .2, bottom:height - 140});
    function spawn(beat) {
      const mode = Math.floor(beat / 16) % 3;
      const downbeat = beat % 4 === 0, origin = arena();
      const max = Math.round(84 * quality);
      const count = Math.max(3, Math.round((downbeat ? 9 : 3) * quality));
      for (let i = 0; i < count && bullets.length < max; i++) {
        if (mode === 2) {
          // Parallel rows retain a regular lattice as they travel.
          for (let row = 0; row < (downbeat ? 3 : 1) && bullets.length < max; row++) {
            bullets.push({x:width * (width <= 850 ? .12 : .55) + i * (width * (width <= 850 ? .8 : .42) / (count - 1)), y:origin.y + row * 30, vx:0,vy:125,mode,angle:Math.PI / 2,size:6});
          }
        } else {
          const angle = Math.PI * (.12 + i / (count - 1) * .76) + (beat % 4) * .07;
          const speed = mode === 1 ? 135 : 175;
          const ring = mode === 1 ? 46 : 30;
          bullets.push({x:origin.x + Math.cos(angle) * ring,y:origin.y + Math.sin(angle) * ring,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,mode,angle,size:mode === 1 ? 16 + i % 3 * 5 : 56 + i % 3 * 10});
        }
      }
      if (downbeat && mode !== 0) [-.55,.55].forEach(offset => {
        const angle = Math.PI / 2 + offset;
        bullets.push({x:origin.x,y:origin.y,vx:Math.cos(angle)*190,vy:Math.sin(angle)*190,mode:3,angle});
      });
    }
    function stillFrame() {
      const a = arena(), top = a.y + 65, span = a.bottom - top;
      bullets = [];
      [0,1,2].forEach(i => {
        bullets.push({x:width * (.46 + i * .21),y:top + span * (.2 + i * .17),mode:0,angle:1.1 + i * .45,size:66,vx:0,vy:0});
        bullets.push({x:width * (.36 + i * .23),y:top + span * (.7 - i * .2),mode:1,angle:1.15,size:18 + i * 3,vx:0,vy:0});
      });
      for (let i = 0; i < 7; i++) bullets.push({x:width * (.48 + i * .075),y:top + span * .85,mode:2,size:6,vx:0,vy:0});
      bullets.push({x:width * .91,y:top + span * .65,mode:3,angle:1.1,vx:0,vy:0});
    }
    fx.add(canvas, (time, dt, still) => {
      if (!ctx) return;
      const origin = arena();
      if (still) { stillFrame(); staticScene = true; sparks = []; lastBeat = -1; player = {x:width * .72,y:origin.bottom}; }
      else if (staticScene) { bullets = []; staticScene = false; lastBeat = -1; }
      const beat = Math.floor(time / fx.beat);
      if (!still && beat !== lastBeat) { spawn(beat); lastBeat = beat; }
      if (dt > 26) slow++; else slow = Math.max(0, slow - 1);
      if (slow > 35) { quality = Math.max(.4, quality * .8); slow = 0; }
      ctx.clearRect(0, 0, width, height);
      const step = Math.floor(time / (fx.beat * 2)) % 8;
      const autoX = width * (width < 700 ? .69 : .79) + [-.3,.8,-.7,.4,-.9,.7,0,-.5][step] * Math.min(110, width * .16);
      let tx = pointer ? pointer.x : autoX, ty = pointer ? pointer.y : origin.bottom + [0,-22,16,-8][step % 4];
      if (!pointer && !still) {
        // Repel from predicted bullet positions, then ease toward the safe route.
        bullets.forEach(b => {
          const dx = player.x - (b.x + b.vx * .3), dy = player.y - (b.y + b.vy * .3), distance = Math.hypot(dx, dy);
          if (distance < 92 && distance > .1) { tx += dx / distance * (92 - distance) * 1.5; ty += dy / distance * (92 - distance) * .6; }
        });
      }
      tx = clamp(tx, width < 700 ? width * .4 : width * .58, width - 32); ty = clamp(ty, height * .5, height - 120);
      if (pointer) { tx = pointer.x; ty = pointer.y; }
      const dx = (tx - player.x) * Math.min(1, dt / 105);
      if (!still) { player.x += dx; player.y += (ty - player.y) * Math.min(1, dt / 105); }
      bullets = bullets.filter(b => b.x > -120 && b.x < width + 120 && b.y > -120 && b.y < height + 120);
      bullets.forEach(b => {
        if (!still) { b.x += b.vx * dt / 1000; b.y += b.vy * dt / 1000; }
        const underText = b.x > readZone.left && b.x < readZone.right && b.y > readZone.top && b.y < readZone.bottom;
        ctx.globalAlpha = underText ? .25 : 1;
        projectile(ctx,b);
        const distance = Math.hypot(player.x - b.x, player.y - b.y);
        if (!still && !b.grazed && distance < 37 && distance > 9 && time - lastGraze > 130) {
          b.grazed = true; lastGraze = time; sparks.push({x:player.x,y:player.y,born:time});
        }
      });
      ctx.globalAlpha = 1; sprite(ctx, boss, origin.x, origin.y, still ? 0 : time, 256, 4);
      // Charge ring grows over the final 150ms before each volley.
      const charge = (time % fx.beat - (fx.beat - 150)) / 150;
      if (!still && charge > 0) {
        ctx.strokeStyle = beat % 4 === 3 ? '#fff4fa' : '#c38be6';ctx.lineWidth = beat % 4 === 3 ? 3 : 1.5;
        ctx.globalAlpha = charge;ctx.beginPath();ctx.arc(origin.x,origin.y,22 + charge * 36,0,Math.PI*2);ctx.stroke();
      }
      ctx.globalAlpha = 1; sprite(ctx, dx < -.6 ? left : dx > .6 ? right : neutral, player.x, player.y, still ? 0 : time,256);
      ctx.fillStyle = '#efffff'; ctx.fillRect(Math.round(player.x - 1),Math.round(player.y - 1),3,3);
      sparks = sparks.filter(s => time - s.born < fx.beat);
      sparks.forEach(s => { ctx.save(); star(ctx,s.x,s.y,(time - s.born) / fx.beat); ctx.restore(); });
      ctx.globalAlpha = 1;
    });
    host.classList.add('demo-ready');
  }

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

  async function diagrams() {
    const cards = [...document.querySelectorAll('#game .grid .plate')]; if (!cards.length) return;
    const neutral = await image('player-neutral-sheet.png');
    cards.forEach((card, type) => {
      const canvas = document.createElement('canvas'); canvas.className = 'feature-canvas';
      canvas.setAttribute('role','img');
      canvas.setAttribute('aria-label', [fx.text('無敵のダッシュで弾の壁を抜ける図', 'Invincible dash through a bullet wall'),fx.text('グレイズで100点を獲得する図','A close graze earns 100 points'),fx.text('拍に同期したリング弾幕の図','Bullet rings synchronized to a beat')][type]);
      const slot = card.querySelector('.feature-slot'); if (!slot) return;
      slot.append(canvas); card.classList.add('feature-card'); card.tabIndex = 0;
      let cw = slot.clientWidth, ctx = fx.canvas(canvas,cw,cw * 9 / 16); if (!ctx) return;
      new ResizeObserver(() => { cw = slot.clientWidth;ctx = fx.canvas(canvas,cw,cw * 9 / 16);fx.refresh(canvas); }).observe(slot);
      fx.add(canvas, (time, dt, still) => {
        ctx.clearRect(0,0,cw,cw * 9 / 16);ctx.save();ctx.scale(cw / 320,cw / 320);
        ctx.strokeStyle = '#24304b'; ctx.lineWidth = 1;
        for (let x = 16; x < 320; x += 32) { ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,180);ctx.stroke(); }
        const phase = still ? .55 : (time % (fx.beat * 4)) / (fx.beat * 4);
        ctx.globalAlpha = 1;
        if (type === 0) {
          for (let y = 42; y < 180; y += 53) chevron(ctx,165,y,Math.PI / 2,56);
          const dash = phase > .28 && phase < .53;
          const x = phase < .28 ? 55 : phase < .53 ? 55 + (phase - .28) / .25 * 210 : 265;
          if (dash || still) for (let i = 1; i < 5; i++) { ctx.globalAlpha = .3 / i; sprite(ctx,neutral,(still ? 235 : x) - i * 22,105,still ? 0 : time,128); }
          ctx.globalAlpha = dash && Math.floor(time / 70) % 2 ? .2 : 1;
          sprite(ctx,neutral,still ? 235 : x,105,still ? 0 : time);
          if (dash) { ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = '#fff9'; ctx.fillRect(x - 25,55,50,50);ctx.globalCompositeOperation = 'source-over'; }
        } else if (type === 1) {
          sprite(ctx,neutral,158,118,still ? 0 : time);
          const bx = still ? 175 : 30 + phase * 280;
          chevron(ctx,bx,64,0,66);
          if (still || (phase > .42 && phase < .72)) { ctx.save(); star(ctx,168,96,still ? .25 : (phase - .42) / .3);ctx.restore(); }
          for (let x = 36; x < 320; x += 48) pellet(ctx,x,158,5);
        } else {
          const pulse = still ? .55 : time / fx.beat % 1;
          for (let i = 0; i < 5; i++) {
            const angle = i / 5 * Math.PI * 2 + .4, r = 40 + pulse * 40;
            orb(ctx,160 + Math.cos(angle) * r,96 + Math.sin(angle) * r,angle,16);
          }
          laser(ctx,278,136,Math.PI / 2);ctx.fillStyle = '#ffe16a'; ctx.fillRect(14,174,292 * (1 - pulse),2);
        }
        ctx.globalAlpha = 1; ctx.fillStyle = '#a8b8cd';ctx.font = '10px monospace';ctx.fillText(['01 / DASH','02 / GRAZE +100','03 / 130 BPM'][type],12,18);ctx.restore();
      });
      if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
        card.addEventListener('pointermove', event => {
          if (!fx.enabled) return;
          const r = card.getBoundingClientRect();
          card.style.setProperty('--rx', ((.5 - (event.clientY - r.top) / r.height) * 3) + 'deg');
          card.style.setProperty('--ry', (((event.clientX - r.left) / r.width - .5) * 3) + 'deg');
        });
        card.addEventListener('pointerleave', () => { card.style.setProperty('--rx','0deg');card.style.setProperty('--ry','0deg'); });
      }
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
  const init = () => { hero().catch(() => {}); logo().catch(() => {}); diagrams().catch(() => {}); steam().catch(() => {}); texture(); };
  if (document.readyState === 'complete') init(); else addEventListener('load', () => {
    if ('requestIdleCallback' in window) requestIdleCallback(init,{timeout:350}); else setTimeout(init,0);
  },{once:true});
})();
