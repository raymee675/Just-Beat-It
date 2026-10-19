(() => {
  'use strict';
  const fx = window.JBI_FX; if (!fx) return;
  const t = fx.text;
  function gallery() {
    const strip = document.querySelector('.gallery'); if (!strip) return;
    const links = [...strip.querySelectorAll('[data-lightbox]')]; if (!links.length) return;
    const section = strip.closest('section');
    const viewer = section.querySelector('.cinema'); if (!viewer) return;
    const main = viewer.querySelector('.cinema-main'), img = main.querySelector('img');
    main.draggable = false;img.draggable = false;
    const wash = viewer.querySelector('.cinema-wash'), bar = viewer.querySelector('.cinema-progress');
    const [prev,next,pause] = viewer.querySelectorAll('button');
    const caption = viewer.querySelector('.cinema-caption');caption.setAttribute('aria-live','polite');
    viewer.classList.add('cinema-enhanced');
    strip.classList.add('filmstrip');
    let index = 0, progress = 0, paused = false, hovering = false, focused = false, touch = null, zoom = 0, switching = 0, suppressClickUntil = 0;
    const dialog = document.querySelector('#lightbox');
    function show(number, manual = false) {
      index = (number + links.length) % links.length; progress = 0; zoom = 0;
      const link = links[index], alt = link.querySelector('img').alt;
      img.src = link.href; img.alt = alt; main.href = link.href; main.setAttribute('aria-label', t('拡大：','Enlarge: ') + alt);
      caption.textContent = String(index + 1).padStart(2,'0') + ' / ' + String(links.length).padStart(2,'0') + ' — ' + alt;
      links.forEach((a, i) => { a.setAttribute('aria-current',String(i === index)); });
      main.classList.remove('switching');
      if (manual && fx.enabled) {
        // Force only the decorative overlay to restart; the image keeps its reserved ratio.
        void wash.offsetWidth; main.classList.add('switching');
        clearTimeout(switching); switching = setTimeout(() => main.classList.remove('switching'),fx.beat);
      }
      if (dialog && dialog.open) document.dispatchEvent(new CustomEvent('jbi:lightbox-image',{detail:{index, opener:main}}));
    }
    links.forEach((a,i) => a.addEventListener('click', event => {
      event.preventDefault();event.stopImmediatePropagation();show(i,true);
    },true));
    const open = event => {
      if (performance.now() < suppressClickUntil) { event.preventDefault();return; }
      if (!dialog || typeof dialog.showModal !== 'function') return;
      event.preventDefault(); document.dispatchEvent(new CustomEvent('jbi:lightbox-open',{detail:{index,opener:main}}));
    };
    main.addEventListener('click',open);
    prev.addEventListener('click',() => show(index - 1,true));next.addEventListener('click',() => show(index + 1,true));
    pause.addEventListener('click',() => { paused = !paused;pause.textContent = paused ? t('自動送りを再開','Resume slideshow') : t('自動送りを停止','Pause slideshow');pause.setAttribute('aria-pressed',String(paused)); });
    pause.setAttribute('aria-pressed','false');
    section.addEventListener('pointerenter',() => { hovering = true; });section.addEventListener('pointerleave',() => { hovering = false; });
    section.addEventListener('focusin',() => { focused = true; });section.addEventListener('focusout',event => { focused = section.contains(event.relatedTarget); });
    section.addEventListener('keydown',event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault();show(index + (event.key === 'ArrowLeft' ? -1 : 1),true); }
    });
    main.addEventListener('pointerdown',event => { touch = {x:event.clientX,y:event.clientY};main.setPointerCapture(event.pointerId); });
    main.addEventListener('pointerup',event => {
      if (!touch) return;
      const dx = event.clientX - touch.x, dy = event.clientY - touch.y; touch = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
        show(index + (dx < 0 ? 1 : -1),true);
        suppressClickUntil = performance.now() + 350;
      }
    });
    main.addEventListener('pointercancel',() => { touch = null; });
    fx.add(viewer, (time,dt,still) => {
      pause.disabled = !fx.enabled;
      const running = !still && !paused && !hovering && !focused && !(dialog && dialog.open);
      if (running) { progress += dt;zoom += dt; if (progress >= 6000) show(index + 1,true); }
      img.style.transform = still ? 'none' : 'scale(' + (1 + Math.min(zoom / 6000,1) * .035) + ')';
      bar.style.transform = 'scaleX(' + (still ? 0 : progress / 6000) + ')';
    });
    show(0);
  }

  function stages() {
    const list = document.querySelector('.stage-list');if (!list) return;
    const rows = [...list.children], section = list.closest('section'), panel = section.querySelector('.difficulty').parentElement;
    list.setAttribute('role','listbox');list.setAttribute('aria-label',t('ステージ選択','Select a stage'));
    list.setAttribute('aria-describedby','stage-instructions');list.tabIndex = 0;
    const marker = section.querySelector('.stage-marker');
    let selected = -1, difficulty = 1;
    const multipliers = ['×0.8','×1.0','×1.3'];
    const descriptions = [t('気軽に遊べる難易度','A relaxed challenge'),t('標準的な難易度','A balanced challenge'),t('上級者向けの高難易度','An extreme challenge')];
    const group = panel.querySelector('.difficulty-options');group.setAttribute('role','radiogroup');group.setAttribute('aria-label',t('難易度','Difficulty'));
    const detail = panel.querySelector('.difficulty-detail');detail.setAttribute('aria-live','polite');
    const selectedName = panel.querySelector('.selected-stage'); selectedName.setAttribute('aria-live','polite');
    const number = panel.querySelector('.stage-number');
    const buttons = [...group.querySelectorAll('button')];
    buttons.forEach((b,i) => { b.disabled = false;b.setAttribute('role','radio');b.addEventListener('click',() => setDifficulty(i)); });
    function setDifficulty(i, focus = false) {
      difficulty = (i + 3) % 3;
      buttons.forEach((b,j) => { b.setAttribute('aria-checked',String(j === difficulty));b.tabIndex = j === difficulty ? 0 : -1; });
      detail.replaceChildren();const factor = document.createElement('strong');factor.textContent = multipliers[difficulty];
      const label = document.createElement('span');label.textContent = descriptions[difficulty];detail.append(factor,label);
      if (focus) buttons[difficulty].focus();
    }
    function select(i) {
      const next = (i + rows.length) % rows.length, changed = selected !== next;
      selected = next;
      rows.forEach((row,j) => row.setAttribute('aria-selected',String(j === selected)));
      list.setAttribute('aria-activedescendant', rows[selected].id);
      selectedName.textContent = rows[selected].textContent;
      number.textContent = String(selected + 1).padStart(2,'0');
      if (changed && fx.enabled && number.animate) {
        number.animate([{transform:'perspective(400px) rotateX(-75deg)',opacity:.3},{transform:'perspective(400px) rotateX(0)',opacity:1}],{duration:fx.beat,easing:'cubic-bezier(.2,.8,.2,1)'});
        panel.classList.remove('stage-changing');void panel.offsetWidth;panel.classList.add('stage-changing');
      }
      marker.style.height = rows[selected].offsetHeight + 'px';
      marker.style.transform = 'translateY(' + (list.offsetTop + rows[selected].offsetTop) + 'px)';
    }
    rows.forEach((row,i) => {
      row.id = 'stage-' + (i + 1);row.setAttribute('role','option');
      row.addEventListener('pointerenter',event => { if (event.pointerType === 'mouse') select(i); });
      row.addEventListener('click',() => {select(i);list.focus({preventScroll:true});});
    });
    list.addEventListener('keydown',event => {
      if (['ArrowUp','ArrowDown','Home','End','ArrowLeft','ArrowRight'].includes(event.key)) event.preventDefault();
      if (event.key === 'ArrowUp') select(selected - 1);if (event.key === 'ArrowDown') select(selected + 1);
      if (event.key === 'Home') select(0);if (event.key === 'End') select(rows.length - 1);
      if (event.key === 'ArrowLeft') setDifficulty(difficulty - 1);if (event.key === 'ArrowRight') setDifficulty(difficulty + 1);
    });
    group.addEventListener('keydown',event => {
      const delta = {ArrowLeft:-1,ArrowUp:-1,ArrowRight:1,ArrowDown:1}[event.key];
      if (delta) { event.preventDefault();setDifficulty(difficulty + delta,true); }
    });
    new ResizeObserver(() => select(Math.max(0,selected))).observe(list);setDifficulty(1);select(0);
  }
  gallery();stages();
})();
