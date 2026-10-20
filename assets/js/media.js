/* Silent footage follows the site's motion policy and the user's data preference. */
(() => {
  'use strict';
  const fx = window.JBI_FX;
  if (!fx) return;
  const connection = navigator.connection;
  const allowed = () => fx.enabled && !connection?.saveData;
  const hero = document.querySelector('[data-hero-video]');
  const button = document.querySelector('[data-video-toggle]');
  const states = [...document.querySelectorAll('[data-hero-video],[data-story-video]')].map(video => ({
    video, near: false, visible: false, userPaused: false, failed: false
  }));
  const byVideo = new Map(states.map(state => [state.video, state]));
  const shouldPlay = state => allowed() && state.visible && !document.hidden && !state.userPaused && !state.failed;
  function updateButton() {
    if (!button) return;
    const state = byVideo.get(hero);
    const paused = state.userPaused || state.failed || hero.paused;
    button.disabled = !allowed();
    button.setAttribute('aria-pressed', String(paused));
    button.textContent = !allowed() ? fx.text('映像は静止表示中', 'Video is paused')
      : paused ? fx.text('映像を再生', 'Play video') : fx.text('映像を一時停止', 'Pause video');
  }
  function sync(state) {
    const video = state.video;
    if (!allowed()) {
      video.pause();
      // load() with no source restores the poster, even after playback has started.
      if (video.hasAttribute('src')) { video.removeAttribute('src'); video.load(); }
      state.failed = false;
    } else if (state.near && !document.hidden) {
      if (!video.hasAttribute('src')) {
        video.muted = true;
        video.src = video === hero && (innerWidth >= 1280 || devicePixelRatio > 1)
          ? video.dataset.srcHd : video.dataset.src;
        video.load();
      }
      if (shouldPlay(state)) {
        const attempt = video.play();
        if (attempt) attempt.catch(error => {
          if (error.name !== 'AbortError' && shouldPlay(state)) state.failed = true;
          updateButton();
        });
      } else video.pause();
    } else video.pause();
    updateButton();
  }
  const syncAll = () => states.forEach(sync);
  states.forEach(state => {
    // Source assignment must not start native autoplay before visibility is known.
    state.video.autoplay = false;
    state.video.addEventListener('play', () => {
      // A pending play promise must not restart a hidden/disabled video.
      if (!shouldPlay(state)) state.video.pause();
      updateButton();
    });
    state.video.addEventListener('pause', updateButton);
  });
  if ('IntersectionObserver' in window) {
    const near = new IntersectionObserver(entries => entries.forEach(entry => {
      const state = byVideo.get(entry.target); state.near = entry.isIntersecting; sync(state);
    }), {rootMargin: '240px'});
    const visible = new IntersectionObserver(entries => entries.forEach(entry => {
      const state = byVideo.get(entry.target); state.visible = entry.isIntersecting;
      if (state.visible) state.near = true;
      sync(state);
    }), {threshold: 0});
    states.forEach(({video}) => { near.observe(video); visible.observe(video); });
  } else {
    // Keep the decorative story posters when intersection tracking is unavailable.
    const locate = () => {
      if (!hero) return;
      const rect = hero.getBoundingClientRect(), state = byVideo.get(hero);
      state.visible = rect.bottom > 0 && rect.top < innerHeight;
      state.near = state.visible; sync(state);
    };
    addEventListener('scroll', locate, {passive:true}); addEventListener('resize', locate); locate();
  }
  if (button) {
    button.hidden = false;
    button.addEventListener('click', () => {
      const state = byVideo.get(hero);
      state.userPaused = !hero.paused;
      state.failed = false;
      sync(state);
    });
  }
  document.addEventListener('jbi:motion', syncAll);
  document.addEventListener('visibilitychange', syncAll);
  connection?.addEventListener('change', syncAll);
  syncAll();

  // Native details remain usable without JavaScript. Animate the reserved height
  // while keeping the requested open/closed state independent of rapid clicks.
  const finishers = [];
  document.querySelectorAll('.support-faq details').forEach(details => {
    const summary = details.querySelector('summary');
    let animation, wanted = details.open;
    function finish() {
      if (animation) { animation.onfinish = null; animation.cancel(); animation = null; }
      details.open = wanted;
      details.style.height = ''; details.style.overflow = '';
    }
    finishers.push(finish);
    summary.addEventListener('click', event => {
      if (!allowed() || !details.animate) { finish(); wanted = !details.open; return; }
      event.preventDefault();
      const start = details.getBoundingClientRect().height;
      wanted = !wanted;
      if (animation) { animation.onfinish = null; animation.cancel(); }
      details.style.height = ''; details.open = true;
      const end = wanted ? details.getBoundingClientRect().height
        : summary.getBoundingClientRect().height + 2;
      details.style.overflow = 'hidden';
      animation = details.animate([{height:start+'px'}, {height:end+'px'}], {
        duration:300, easing:'cubic-bezier(.2,.8,.2,1)'
      });
      animation.onfinish = finish;
    });
    details.addEventListener('toggle', () => { if (!animation) wanted = details.open; });
  });
  document.addEventListener('jbi:motion', () => { if (!fx.enabled) finishers.forEach(finish => finish()); });
})();
