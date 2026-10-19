/* One clock and one motion policy for every page. No animation owns a timer. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const en = root.lang === 'en';
  const text = (ja, english) => en ? english : ja;
  let preference = true;
  try { preference = localStorage.getItem('jbi-motion') !== 'off'; } catch {}
  let enabled = preference && !reduced.matches;
  root.dataset.motion = enabled ? 'on' : 'off';
  const jobs = new Set();
  let frame = 0, last = 0, elapsed = 0;
  const visible = new WeakMap();
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => visible.set(entry.target, entry.isIntersecting));
    wake();
  }, {rootMargin: '40px'}) : null;
  function tick(time) {
    frame = 0;
    if (!enabled || document.hidden) { last = 0; return; }
    const dt = last ? Math.min(time - last, 64) : 16.67;
    last = time; elapsed += dt;
    let active = false;
    jobs.forEach(job => {
      if (visible.get(job.node) !== false) { active = true; job.draw(elapsed, dt, false); }
    });
    if (active) frame = requestAnimationFrame(tick); else last = 0;
  }
  function wake() {
    if (enabled && !document.hidden && !frame && jobs.size) frame = requestAnimationFrame(tick);
  }
  const fx = window.JBI_FX = {
    beat: 60000 / 130, text,
    assets: new URL('../img/', document.currentScript.src),
    get enabled() { return enabled; },
    refresh(node) { jobs.forEach(job => { if (job.node === node) job.draw(elapsed, 0, !enabled); }); },
    add(node, draw) {
      const job = {node, draw}; jobs.add(job);
      if (observer) observer.observe(node);
      draw(0, 0, !enabled); wake();
      return () => { jobs.delete(job); if (observer) observer.unobserve(node); };
    },
    canvas(canvas, width, height) {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false;
      return ctx;
    }
  };
  const toggles = [];
  [document.querySelector('.header .nav'),document.querySelector('.footer nav')].filter(Boolean).forEach(host => {
    const toggle = document.createElement('button');
    toggle.type = 'button';toggle.className = 'motion-toggle';host.append(toggle);toggles.push(toggle);
  });
  function apply() {
    enabled = preference && !reduced.matches;
    root.dataset.motion = enabled ? 'on' : 'off';
    toggles.forEach(toggle => {
      toggle.textContent = text('演出 ', 'FX ') + (enabled ? text('オン', 'ON') : text('オフ', 'OFF'));
      toggle.setAttribute('aria-pressed', String(enabled));
      toggle.setAttribute('aria-label', text('演出の切替', 'Toggle visual effects'));
      toggle.title = reduced.matches ? text('OS の「動きを減らす」設定により停止中', 'Paused by your reduced-motion preference') : '';
    });
    cancelAnimationFrame(frame); frame = 0; last = 0;
    if (!enabled) {
      if (document.getAnimations) document.getAnimations().forEach(animation => animation.cancel());
      jobs.forEach(job => job.draw(0, 0, true));
    } else wake();
    document.dispatchEvent(new CustomEvent('jbi:motion', {detail: enabled}));
  }
  toggles.forEach(toggle => toggle.addEventListener('click', () => {
    preference = !preference;
    try { localStorage.setItem('jbi-motion', preference ? 'on' : 'off'); } catch {}
    apply();
  }));
  reduced.addEventListener('change', apply);
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(frame); frame = 0; last = 0; wake();
  });
  apply();

  // Native navigation remains untouched; only browsers supporting this rule opt in.
  const transition = document.querySelector('#navigation-motion');
  const navigationMotion = () => {
    const rule = '@view-transition{navigation:' + (fx.enabled ? 'auto' : 'none') + '}';
    if (transition.textContent !== rule) transition.textContent = rule;
  };
  navigationMotion(); document.addEventListener('jbi:motion', navigationMotion);

  const header = document.querySelector('.header');
  const nav = header && header.querySelector('.nav');
  if (nav) {
    nav.id = 'main-navigation';
    const menu = header.querySelector('.menu-toggle');
    menu.disabled = false;
    menu.setAttribute('aria-controls', nav.id); menu.setAttribute('aria-expanded', 'false');
    let open = false;
    const setOpen = value => {
      open = value; menu.setAttribute('aria-expanded', String(open));
      header.classList.toggle('menu-open', open); document.body.classList.toggle('menu-is-open', open);
      document.querySelectorAll('main,.footer,.header .brand,.header .small,.header .languages').forEach(node => { node.inert = open; });
      if (open) nav.querySelector('a:not([hidden])').focus(); else menu.focus();
    };
    menu.addEventListener('click', () => setOpen(!open));
    document.addEventListener('keydown', event => {
      if (!open) return;
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
      if (event.key === 'Tab') {
        const links = [...nav.querySelectorAll('a:not([hidden]),button'), menu];
        const index = links.indexOf(document.activeElement);
        if (event.shiftKey && index <= 0) { event.preventDefault(); menu.focus(); }
        else if (!event.shiftKey && index === links.length - 1) { event.preventDefault(); links[0].focus(); }
      }
    });
    nav.addEventListener('click', event => { if (open && event.target.closest('a')) setOpen(false); });
    matchMedia('(min-width: 851px)').addEventListener('change', event => { if (event.matches && open) setOpen(false); });
    root.classList.add('has-menu');
  }
  let scrolling = false;
  function scroll() {
    scrolling = false;
    if (header) header.classList.toggle('compact', window.scrollY > 40);
    const layer = document.querySelector('.chevrons');
    if (layer) layer.style.setProperty('--parallax', fx.enabled ? Math.min(scrollY * .12, 100) + 'px' : '0px');
  }
  addEventListener('scroll', () => { if (!scrolling) { scrolling = true; requestAnimationFrame(scroll); } }, {passive:true});
  document.addEventListener('jbi:motion', scroll); scroll();

  let seen = false;
  try { seen = sessionStorage.getItem('jbi-opening') === 'seen'; sessionStorage.setItem('jbi-opening', 'seen'); } catch {}
  fx.shortOpening = seen;
  if (fx.enabled && !seen) {
    const curtain = document.createElement('div'); curtain.className = 'opening-wipe'; curtain.setAttribute('aria-hidden', 'true');
    document.body.append(curtain); root.classList.add('opening');
    let timer;
    const skip = () => {
      fx.openingSkipped = true;
      root.classList.remove('opening'); curtain.remove(); clearTimeout(timer);
      document.removeEventListener('pointerdown', skip); document.removeEventListener('keydown', skip);
      document.removeEventListener('jbi:motion', stop); document.dispatchEvent(new Event('jbi:skip'));
    };
    const stop = () => { if (!fx.enabled) skip(); };
    document.addEventListener('pointerdown', skip); document.addEventListener('keydown', skip);
    document.addEventListener('jbi:motion', stop); timer = setTimeout(skip, 1384);
  }

  // Content stays visible if JS/IO fails. Split only plain text headings.
  const targets = document.querySelectorAll('.section h2,.content h2,.page-title h1,.section .plate,.content .plate,.section .eyebrow');
  targets.forEach(node => {
    if (/^H[12]$/.test(node.tagName) && [...node.children].every(child => child.tagName === 'WBR')) {
      const label = node.textContent;
      const words = node.innerHTML.split(/<wbr\s*\/?>/i).map(part => {
        const decoder = document.createElement('span');decoder.innerHTML = part;return decoder.textContent;
      });
      node.setAttribute('aria-label', label); node.classList.add('letter-heading');
      node.textContent = '';
      let index = 0;
      const addLetter = (letter, parent) => {
        const span = document.createElement('span'); span.setAttribute('aria-hidden', 'true');
        span.className = 'letter';
        span.textContent = letter === ' ' ? '\u00a0' : letter;
        span.style.setProperty('--letter-delay', (index++ % 18) * (fx.beat / 16) + 'ms'); parent.append(span);
      };
      if (en) label.split(/(\s+)/).forEach(word => {
        if (/^\s+$/.test(word)) { node.append(document.createTextNode(' ')); return; }
        const group = document.createElement('span');group.className = 'heading-word';group.setAttribute('aria-hidden','true');
        Array.from(word).forEach(letter => addLetter(letter,group));node.append(group);
      });
      else words.forEach((word,i) => {
        if (i) node.append(document.createElement('wbr'));
        const group = document.createElement('span');group.className = 'heading-word';group.setAttribute('aria-hidden','true');
        Array.from(word).forEach(letter => addLetter(letter,group));node.append(group);
      });
    }
  });
  function reveal(node) {
    if (node.classList.contains('revealed')) return;
    node.classList.add('revealed');
    if (node.classList.contains('eyebrow') && /^\d{2}/.test(node.textContent)) {
      const original = node.textContent, target = Number(original.slice(0, 2));
      if (fx.enabled && node.animate) {
        const start = performance.now();
        const count = time => {
          const progress = fx.enabled ? Math.min((time - start) / fx.beat, 1) : 1;
          node.textContent = String(Math.round(target * progress)).padStart(2, '0') + original.slice(2);
          if (progress < 1 && !document.hidden) requestAnimationFrame(count); else node.textContent = original;
        };
        requestAnimationFrame(count);
      }
    }
  }
  if ('IntersectionObserver' in window) {
    const entrances = new Map();
    const entrance = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entrances.get(entry.target).forEach(reveal); entrance.unobserve(entry.target); }
    }), {threshold:.12});
    targets.forEach(node => {
      node.classList.add('reveal-ready');
      // Observe an unclipped frame: a fully clipped card has zero intersection area.
      const trigger = node.classList.contains('plate') ? node.parentElement : node;
      if (!entrances.has(trigger)) entrances.set(trigger, []);
      entrances.get(trigger).push(node);entrance.observe(trigger);
    });
    document.addEventListener('jbi:motion', () => { if (!fx.enabled) { targets.forEach(reveal); entrance.disconnect(); } });
    if (!fx.enabled) { targets.forEach(reveal); entrance.disconnect(); }
    document.addEventListener('focusin', event => {
      const card = event.target.closest('.reveal-ready'); if (card) reveal(card);
    });
  }
})();
