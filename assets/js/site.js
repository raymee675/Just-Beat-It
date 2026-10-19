(() => {
  'use strict';
  const en = document.documentElement.lang === 'en';
  const t = (ja, english) => en ? english : ja;
  const config = window.JBI_CONFIG || {};
  const httpsUrl = value => {
    try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url : null; }
    catch { return null; }
  };
  const steam = httpsUrl(config.steamUrl);
  if (steam) document.querySelectorAll('[data-steam]').forEach(a => { a.href = steam.href; });
  const contact = httpsUrl(config.contactFormUrl);
  if (contact && ['docs.google.com', 'forms.gle'].includes(contact.hostname)) {
    document.querySelectorAll('[data-contact]').forEach(a => {
      a.href = contact.href; a.removeAttribute('aria-disabled'); a.removeAttribute('tabindex');
      a.textContent = t('Google フォームで問い合わせる', 'Contact us via Google Forms');
    });
  }
  const iso = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? Date.parse(value) : NaN;
  const override = iso(new URLSearchParams(window.location.search).get('now'));
  const openedAt = Date.now();
  // プレビュー時も経過時間は進める。無効な ?now は実時刻へフォールバック。
  const now = () => Number.isFinite(override) ? override + Date.now() - openedAt : Date.now();
  const free = config.freeDownload || {};
  const start = iso(free.startsAt), end = iso(free.endsAt);
  const downloadUrl = httpsUrl(free.url);
  const valid = Number.isFinite(start) && Number.isFinite(end) && start < end && downloadUrl
    && downloadUrl.hostname === 'github.com' && /^\/[^/]+\/[^/]+\/releases\/download\/[^/]+\/.+\.zip$/i.test(downloadUrl.pathname);
  const date = value => new Intl.DateTimeFormat(en ? 'en-US' : 'ja-JP', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: en ? 'long' : 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).format(new Date(value)) + ' JST (UTC+09:00)';
  const setText = (selector, value) => document.querySelectorAll(selector).forEach(node => { node.textContent = value; });
  let previousState;
  function countdown(value, label) {
    document.querySelectorAll('[data-countdown]').forEach(node => {
      if (!value) { node.replaceChildren(); delete node.dataset.length; node.removeAttribute('aria-label'); return; }
      node.setAttribute('aria-label', label + value);
      node.setAttribute('role', 'timer');
      const digits = Array.from(value);
      if (node.dataset.length !== String(digits.length)) {
        node.replaceChildren();
        const title = document.createElement('span'); title.className = 'countdown-label'; title.setAttribute('aria-hidden','true'); node.append(title);
        digits.forEach(char => {
          const span = document.createElement('span');span.className = /\d/.test(char) ? 'flip-digit' : 'flip-separator';
          span.setAttribute('aria-hidden','true');span.textContent = char;node.append(span);
        });
        node.dataset.length = String(digits.length);
      }
      node.firstElementChild.textContent = label;
      digits.forEach((char,index) => {
        const digit = node.children[index + 1];
        if (digit.textContent !== char) {
          digit.textContent = char;
          if (window.JBI_FX && window.JBI_FX.enabled && !document.hidden && digit.animate) digit.animate([
            {transform:'perspective(100px) rotateX(-75deg)',color:'#fff'},
            {transform:'perspective(100px) rotateX(0)',color:'#ffe16a'}
          ],{duration:230,easing:'cubic-bezier(.2,.8,.2,1)'});
        }
      });
    });
  }
  function render() {
    const time = now();
    const state = !valid ? 'none' : time < start ? 'upcoming' : time < end ? 'active' : 'ended';
    document.documentElement.dataset.freeState = state;
    if (state !== previousState) {
      document.querySelectorAll('[data-free-nav]').forEach(node => { node.hidden = state !== 'active'; });
      document.querySelectorAll('[data-free-banner]').forEach(node => { node.hidden = state !== 'active' && state !== 'upcoming'; });
      document.querySelectorAll('[data-free-active]').forEach(node => { node.hidden = state !== 'active'; });
      setText('[data-free-title]', state === 'active' ? t('期間限定・無料配布中', 'Free download — limited time') : t('無料配布の予告', 'Free download coming soon'));
      setText('[data-free-message]', state === 'none' ? t('現在配布していません。Steam でゲームをご覧ください。', 'No free download is available at the moment. Find the game on Steam.')
        : state === 'upcoming' ? t('無料配布は次の日時に始まります：', 'The free download starts on:') + ' ' + date(start)
        : state === 'active' ? t('配布終了：', 'Available until:') + ' ' + date(end)
        : t('無料配布は終了しました。Steam でゲームをご覧ください。', 'The free download has ended. Find the game on Steam.'));
      setText('[data-free-schedule]', state === 'upcoming' ? date(start) : state === 'active' ? t('配布終了：', 'Ends:') + ' ' + date(end) : '');
      document.querySelectorAll('[data-download-link]').forEach(a => {
        if (state === 'active') { a.href = downloadUrl.href; a.removeAttribute('aria-disabled'); a.removeAttribute('tabindex'); }
        else { a.removeAttribute('href'); a.setAttribute('aria-disabled', 'true'); a.setAttribute('tabindex', '-1'); }
      });
      setText('[data-free-version]', free.version || t('未記載', 'Not specified'));
      setText('[data-free-size]', free.sizeLabel || t('未記載', 'Not specified'));
      setText('[data-free-sha]', /^[a-f0-9]{64}$/i.test(free.sha256 || '') ? free.sha256 : t('未掲載', 'Not provided'));
      previousState = state;
    }
    if (state === 'active' || state === 'upcoming') {
      const seconds = Math.max(0, Math.ceil(((state === 'active' ? end : start) - time) / 1000));
      const days = Math.floor(seconds / 86400);
      const hours = String(Math.floor(seconds % 86400 / 3600)).padStart(2, '0');
      const minutes = String(Math.floor(seconds % 3600 / 60)).padStart(2, '0');
      const secs = String(seconds % 60).padStart(2, '0');
      countdown(days + t('日 ', 'd ') + hours + ':' + minutes + ':' + secs,
        state === 'active' ? t('残り ', 'Time left: ') : t('開始まで ', 'Starts in: '));
    } else countdown('', '');
  }
  render();
  window.setInterval(render, 1000);
  // 外部ウィジェットは利用者が選んだ時だけロード。通常閲覧では外部 Cookie を要求しない。
  document.querySelectorAll('[data-load-widget]').forEach(button => button.addEventListener('click', () => {
    const frame = document.querySelector('[data-steam-widget]');
    frame.src = 'https://store.steampowered.com/widget/5429530/' + (en ? '?l=english' : '?l=japanese');
    frame.hidden = false; button.hidden = true;
  }));
  const dialog = document.querySelector('#lightbox');
  if (dialog && typeof dialog.showModal === 'function') {
    const img = dialog.querySelector('img'), caption = dialog.querySelector('p');
    let opener, current = 0;
    const links = [...document.querySelectorAll('[data-lightbox]')];
    const previous = document.createElement('button'), next = document.createElement('button');
    previous.type = next.type = 'button'; previous.textContent = '←'; next.textContent = '→';
    previous.className = 'lightbox-prev'; next.className = 'lightbox-next';
    previous.setAttribute('aria-label',t('前の画像','Previous screenshot'));next.setAttribute('aria-label',t('次の画像','Next screenshot'));
    dialog.append(previous,next);caption.setAttribute('aria-live','polite');
    function show(index, source) {
      current = (index + links.length) % links.length; if (source) opener = source;
      img.src = links[current].href;img.alt = links[current].querySelector('img').alt;
      caption.textContent = (current + 1) + ' / ' + links.length + ' — ' + img.alt;
    }
    const open = (index, source) => { show(index,source);if (!dialog.open) dialog.showModal();document.body.classList.add('modal-open'); };
    document.querySelectorAll('[data-lightbox]').forEach(a => a.addEventListener('click', event => {
      event.preventDefault(); open(links.indexOf(a),a);
    }));
    document.addEventListener('jbi:lightbox-open',event => open(event.detail.index,event.detail.opener));
    document.addEventListener('jbi:lightbox-image',event => show(event.detail.index,event.detail.opener));
    previous.addEventListener('click',() => show(current - 1));next.addEventListener('click',() => show(current + 1));
    dialog.addEventListener('keydown',event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {event.preventDefault();show(current + (event.key === 'ArrowLeft' ? -1 : 1));}
    });
    dialog.querySelector('button').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); if (opener) opener.focus(); });
  }
})();
