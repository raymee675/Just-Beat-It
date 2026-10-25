// サイト全体の動き: 言語の切り替え・オープニング・ナビ・ステージ選択・映像・ダウンロード・制作班。
(function () {
  "use strict";

  var root = document.documentElement;
  var config = window.JBI_CONFIG || {};
  var calm = root.classList.contains("calm");

  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function lang() { return root.dataset.lang === "en" ? "en" : "ja"; }
  function pick(v) { return v && typeof v === "object" ? (v[lang()] || v.ja || "") : (v || ""); }
  function store(kind, key, value) {
    try { (kind === "s" ? sessionStorage : localStorage).setItem(key, value); } catch (e) { /* 保存できなくても閲覧はできる */ }
  }
  function read(kind, key) {
    try { return (kind === "s" ? sessionStorage : localStorage).getItem(key); } catch (e) { return null; }
  }

  // ---- 言語 ----
  var langHooks = [];
  var ATTRS = ["alt", "aria-label", "title"];

  function applyLang(l, save) {
    root.lang = l;
    root.dataset.lang = l;
    if (save) {
      store("l", "jbi-lang", l);
      try {
        var u = new URL(location.href);
        u.searchParams.set("lang", l);
        history.replaceState(null, "", u.pathname + u.search + u.hash);
      } catch (e) { /* 古いブラウザでは URL を変えない */ }
    }
    ATTRS.forEach(function (attr) {
      $$("[data-" + attr + "-en]").forEach(function (el) {
        var jaKey = "data-" + attr + "-ja";
        if (!el.hasAttribute(jaKey)) el.setAttribute(jaKey, el.getAttribute(attr) || "");
        el.setAttribute(attr, el.getAttribute("data-" + attr + "-" + l));
      });
    });
    $$("[data-set-lang]").forEach(function (a) {
      var on = a.dataset.setLang === l;
      a.setAttribute("aria-current", on ? "true" : "false");
      a.classList.toggle("band-idle", !on);
    });
    langHooks.forEach(function (fn) { fn(); });
  }

  $$("[data-set-lang]").forEach(function (a) {
    a.addEventListener("click", function (ev) {
      ev.preventDefault();
      applyLang(a.dataset.setLang, true);
    });
  });

  // ---- 見た目の見比べ（?style= がある時だけ、左下に切り替えを出す） ----
  (function () {
    var q;
    try { q = new URLSearchParams(location.search).get("style"); } catch (e) { return; }
    if (q === null) return;
    var box = document.createElement("div");
    box.className = "style-switch";
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", "見た目");
    var buttons = [["now", "今の見た目"], ["new", "新しい見た目"]].map(function (p) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = p[1];
      b.addEventListener("click", function () {
        if (p[0] === "new") {
          root.dataset.style = "new";
          if (!document.getElementById("style-new-font")) {
            var f = document.createElement("link");
            f.id = "style-new-font";
            f.rel = "stylesheet";
            f.href = "https://fonts.googleapis.com/css2?family=Anton&family=M+PLUS+1:wght@800;900&family=Montserrat:wght@900&family=Noto+Sans+JP:wght@400;700&family=Silkscreen&display=swap";
            document.head.appendChild(f);
          }
        } else {
          delete root.dataset.style;
        }
        try {
          var u = new URL(location.href);
          u.searchParams.set("style", p[0]);
          history.replaceState(null, "", u.pathname + u.search + u.hash);
        } catch (e) { /* 古いブラウザでは URL を変えない */ }
        sync();
      });
      box.appendChild(b);
      return [p[0], b];
    });
    function sync() {
      var now = root.dataset.style === "new" ? "new" : "now";
      buttons.forEach(function (x) { x[1].setAttribute("aria-pressed", x[0] === now ? "true" : "false"); });
    }
    sync();
    document.body.appendChild(box);
  })();

  // ---- 試作の見た目の飾り（いつも置いておき、?style=new の時だけ CSS で出す） ----
  var dots = [];
  (function () {
    function zz(tag, cls, text) {
      var el = document.createElement(tag);
      el.className = "zz-only " + cls;
      if (text) el.textContent = text;
      el.setAttribute("aria-hidden", "true");
      return el;
    }
    // 区画の右上の大きな薄い英字
    $$("main > .section").forEach(function (s) {
      var en = $(".section-en", s);
      if (en) s.insertBefore(zz("span", "zz-ghost", en.textContent), s.firstChild);
    });
    // 区画のあいだを流れる英字の帯
    var TICKER = ["JUST BEAT IT", "RHYTHM BULLET HELL", "10 STAGES", "10 SONGS", "DASH", "GRAZE ×4", "FREE DOWNLOAD", "WINDOWS / MAC"];
    $$("main > .section").forEach(function (s, i) {
      var t = zz("div", "zz-ticker zz-ticker--" + (i % 3));
      var run = document.createElement("div");
      run.className = "zz-ticker-run";
      var words = TICKER.slice(i % TICKER.length).concat(TICKER.slice(0, i % TICKER.length));
      var html = words.map(function (w) { return "<span>" + w + "</span><i></i>"; }).join("");
      run.innerHTML = html + html;
      t.appendChild(run);
      s.parentNode.insertBefore(t, s);
    });
    // 区画の飾り: ドットの面・バーコード・十字の目印・小さな英字
    $$("main > .section").forEach(function (s, i) {
      var no = String(i + 1).padStart(2, "0");
      var d = zz("div", "zz-deco");
      d.innerHTML = '<i class="zz-dotfield"></i><i class="zz-cross zz-cross--a"></i><i class="zz-cross zz-cross--b"></i>' +
        '<span class="zz-code"><i class="zz-barcode"></i>JBI-' + no + '/07 · SEC.' + no + '</span>' +
        '<span class="zz-coord">TRACK ' + no + ' — BEAT SYNC ON · 4/4</span>';
      s.insertBefore(d, s.firstChild);
    });
    // 01: 敵のスプライトを並べた帯
    var row = $("[data-zz-enemies]");
    if (row) {
      var items = $$("[data-stage-list] [role=tab]").map(function (t, k) {
        return '<figure><img src="assets/img/enemy/' + t.dataset.stage + '.gif" width="128" height="128" alt="" loading="lazy">' +
          '<figcaption><b>' + String(k + 1).padStart(2, "0") + '</b>' + t.dataset.en.toUpperCase() + '</figcaption></figure>';
      }).join("");
      row.innerHTML = items + items;
    }
    // 04: 起動の警告の説明と手順を、Windows・Mac それぞれの欄の下に写す（最初は畳む）
    var subTitle = $("#download .sub-title");
    var warnNote = subTitle && subTitle.nextElementSibling;
    $$("#download .warn").forEach(function (det, k) {
      var card = $$("#download [data-dl]")[k];
      if (!card || !subTitle) return;
      var box = zz("div", "zz-warn");
      box.removeAttribute("aria-hidden");
      var h = document.createElement("h4");
      h.innerHTML = subTitle.innerHTML;
      box.appendChild(h);
      if (warnNote) box.appendChild(warnNote.cloneNode(true));
      var c = det.cloneNode(true);
      c.open = false;
      c.className = "zz-warn-steps";
      $("summary", c).innerHTML = '<span lang="ja">開き方の手順</span><span lang="en">How to open it</span>';
      box.appendChild(c);
      card.appendChild(box);
    });
    // ヘッダーのダウンロードのボタン
    var langBox = $(".header .lang");
    if (langBox) {
      var dl = zz("a", "zz-dl");
      dl.href = "#download";
      dl.removeAttribute("aria-hidden");
      dl.innerHTML = '<span lang="ja">無料ダウンロード</span><span lang="en">Download</span>';
      langBox.parentNode.insertBefore(dl, langBox);
    }
    // 右端の区画のドット（上のナビと同じ行き先なので、読み上げとキー操作からは外す）
    var nav = zz("nav", "zz-dots");
    $$("[data-nav] a").forEach(function (a) {
      var d = document.createElement("a");
      d.href = a.getAttribute("href");
      d.tabIndex = -1;
      nav.appendChild(d);
      dots.push(d);
    });
    document.body.appendChild(nav);
  })();

  // ---- オープニング ----
  var hero = $("[data-hero]");
  var opening = null;

  function finishOpening() { root.classList.add("opened"); }

  if (hero) {
    var canvas = $("[data-opening-canvas]", hero);
    var logo = $(".hero-logo", hero);
    var phaseClass = { logo: "is-logo", sub: "is-sub", flank: "is-flank", ready: "is-ready", done: "is-done" };
    var onPhase = function (name) {
      hero.classList.add(phaseClass[name]);
      if (name === "ready") finishOpening();
      if (name === "done") store("s", "jbi-opened", "1");
    };

    if (calm || !window.JBI_OPENING || !canvas.getContext) {
      Object.keys(phaseClass).forEach(onPhase);
    } else if (root.dataset.style === "new") {
      // ロゴが白く光りながら左から現れる → 色が付いてきらめく → 背景の CG と各要素が出る
      var steps = [["zz-s1", 250], ["zz-s2", 1550], ["zz-s3", 2250], ["ready", 2700], ["done", 3600]];
      var timers = [];
      var introDone = false;
      hero.classList.add("zz-intro");
      var step = function (name) {
        if (name === "ready" || name === "done") {
          ["logo", "sub", "flank", name].forEach(onPhase);
          if (name === "done") { introDone = true; hero.classList.remove("zz-intro"); }
        } else hero.classList.add(name);
      };
      steps.forEach(function (st) { timers.push(setTimeout(function () { step(st[0]); }, st[1])); });
      var zzSkip = function () {
        if (introDone) return;
        timers.forEach(clearTimeout);
        steps.forEach(function (st) { step(st[0]); });
      };
      $("[data-skip-opening]").addEventListener("click", zzSkip);
      hero.addEventListener("click", function () { if (!root.classList.contains("opened")) zzSkip(); });
      window.addEventListener("keydown", function (ev) {
        if (!root.classList.contains("opened") && (ev.key === "Escape" || ev.key === "Enter" || ev.key === " ")) zzSkip();
      });
      window.addEventListener("scroll", function onScroll() {
        if (window.scrollY > 40) { zzSkip(); window.removeEventListener("scroll", onScroll); }
      }, { passive: true });
    } else {
      opening = window.JBI_OPENING.create(canvas, logo, onPhase);
      opening.play(read("s", "jbi-opened") === "1");
      var skip = function () { if (opening) opening.skip(); };
      $("[data-skip-opening]").addEventListener("click", skip);
      window.addEventListener("keydown", function (ev) {
        if (!root.classList.contains("opened") && (ev.key === "Escape" || ev.key === "Enter" || ev.key === " ")) skip();
      });
      window.addEventListener("scroll", function onScroll() {
        if (window.scrollY > 40) { skip(); window.removeEventListener("scroll", onScroll); }
      }, { passive: true });
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          opening.setVisible(entries[0].isIntersecting && !document.hidden);
        }).observe(hero);
      }
      document.addEventListener("visibilitychange", function () {
        opening.setVisible(!document.hidden);
      });
    }
  } else {
    finishOpening();
  }

  // ---- 試作の見た目: トップの CG は止めたまま、スクロールに合わせて動かす ----
  if (hero) {
    var zzHero = $("[data-zz-hero]");
    var ticking = false;
    var paint = function () {
      ticking = false;
      if (root.dataset.style !== "new") return;
      var p = Math.max(0, Math.min(1.5, window.scrollY / Math.max(1, window.innerHeight)));
      hero.style.setProperty("--hp", p.toFixed(4));
      if (zzHero) zzHero.style.visibility = p >= 1.45 ? "hidden" : "";
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(paint); }
    }, { passive: true });
    window.addEventListener("resize", paint);
    paint();
  }

  // ---- ナビ: いま見ている区画 ----
  var navLinks = $$("[data-nav] a");
  if ("IntersectionObserver" in window && navLinks.length) {
    var current = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) current = en.target.id;
      });
      navLinks.forEach(function (a) {
        var on = a.getAttribute("href") === "#" + current;
        a.classList.toggle("is-current", on);
        if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      });
      dots.forEach(function (d) { d.classList.toggle("is-current", d.getAttribute("href") === "#" + current); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main > section[id]").forEach(function (s) { io.observe(s); });
  }

  // ---- 出てくる時の動き ----
  if (!calm && "IntersectionObserver" in window) {
    var targets = $$(".section .plate, .section-head");
    targets.forEach(function (el) { el.classList.add("reveal"); });
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); rio.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (el) { rio.observe(el); });
  }

  // ---- ステージ選択 ----
  var stages = $("[data-stages]");
  if (stages) {
    var tabs = $$("[data-stage-list] [role=tab]", stages);
    var panel = $("[data-stage-panel]", stages);
    var bgA = $("[data-stage-bg]", stages);
    var bgB = $("[data-stage-bg-next]", stages);
    var enemyBox = $(".stage-enemy", panel);
    var enemy = $("[data-stage-enemy]", panel);
    var nameBox = $(".stage-name", panel);
    var selected = 0;

    panel.id = "stage-panel";
    tabs.forEach(function (tab, i) {
      tab.id = "stage-tab-" + tab.dataset.stage;
      tab.setAttribute("aria-controls", "stage-panel");
    });

    var restart = function (el) {
      el.classList.remove("is-enter");
      void el.offsetWidth;
      el.classList.add("is-enter");
    };

    var swapBg = function (src) {
      if (bgA.getAttribute("src") === src) return;
      var img = new Image();
      img.onload = function () {
        bgB.src = src;
        bgB.style.opacity = "1";
        setTimeout(function () {
          bgA.src = src;
          bgB.style.opacity = "0";
        }, calm ? 0 : 720);
      };
      img.src = src;
    };

    var select = function (i, focus) {
      selected = (i + tabs.length) % tabs.length;
      var tab = tabs[selected];
      var d = tab.dataset;
      tabs.forEach(function (t, k) {
        var on = k === selected;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        // 試作の見た目では、選んでいる物を真ん中に前後 2 つずつ出す（ぐるっと回る）
        var n = tabs.length;
        var off = ((k - selected) % n + n) % n;
        if (off > n / 2) off -= n;
        t.style.setProperty("--pos", String(off));
        if (Math.abs(off) > 2) t.setAttribute("data-far", ""); else t.removeAttribute("data-far");
        if (Math.abs(off) === 1) t.setAttribute("data-near", ""); else t.removeAttribute("data-near");
      });
      if (focus) {
        tab.focus();
        if (tab.scrollIntoView && window.matchMedia("(max-width: 820px)").matches) {
          tab.scrollIntoView({ block: "nearest", inline: "center", behavior: calm ? "auto" : "smooth" });
        }
      }
      panel.setAttribute("aria-labelledby", tab.id);
      panel.style.setProperty("--stage", d.color);
      stages.style.setProperty("--stage", d.color);
      $("[data-stage-no]", panel).textContent = String(selected + 1).padStart(2, "0");
      var ruby = $("[data-stage-name-ja]", panel);
      ruby.firstChild.nodeValue = d.ja;
      $("[data-stage-ruby]", panel).textContent = d.ruby;
      $("[data-stage-name-en]", panel).textContent = d.en;
      var ghost = $(".zz-ghost", stages);
      if (ghost) ghost.textContent = d.en;
      enemy.src = "assets/img/enemy/" + d.stage + ".gif";
      updateEnemyAlt();
      swapBg("assets/img/stage-" + d.stage + ".jpg");
      if (!calm) { restart(enemyBox); restart(nameBox); }
    };

    var updateEnemyAlt = function () {
      var d = tabs[selected].dataset;
      enemy.alt = lang() === "en" ? "The enemy waiting at the " + d.en : d.ja + "で待ちかまえる敵";
    };
    langHooks.push(updateEnemyAlt);

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(i, false); });
      tab.addEventListener("keydown", function (ev) {
        var next = null;
        if (ev.key === "ArrowDown" || ev.key === "ArrowRight") next = selected + 1;
        else if (ev.key === "ArrowUp" || ev.key === "ArrowLeft") next = selected - 1;
        else if (ev.key === "Home") next = 0;
        else if (ev.key === "End") next = tabs.length - 1;
        if (next !== null) { ev.preventDefault(); select(next, true); }
      });
    });
    $$("[data-stage-step]", stages).forEach(function (b) {
      b.addEventListener("click", function () { select(selected + Number(b.dataset.stageStep), false); });
    });
    select(0, false);

    // 画像を前もって読んでおく
    var preload = function () {
      tabs.forEach(function (t) {
        new Image().src = "assets/img/stage-" + t.dataset.stage + ".jpg";
        new Image().src = "assets/img/enemy/" + t.dataset.stage + ".gif";
      });
    };
    if ("requestIdleCallback" in window) requestIdleCallback(preload, { timeout: 4000 }); else setTimeout(preload, 2500);
  }

  // ---- 映像 ----
  var movie = $("[data-movie]");
  var video = $("[data-movie-video]");
  var pv = config.pv || {};
  var startYouTube = null;
  if (movie) {
    if (pv.youtubeId) {
      var id = encodeURIComponent(pv.youtubeId);
      movie.innerHTML = "";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "movie-poster";
      btn.style.cssText = "position:relative;display:block;width:100%;height:100%;padding:0;border:0;cursor:pointer;background:#000 center/cover no-repeat url(https://i.ytimg.com/vi/" + id + "/maxresdefault.jpg)";
      btn.innerHTML = '<span class="band band-action band-big" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)">▶ <span lang="ja">再生</span><span lang="en">Play</span></span>';
      btn.setAttribute("aria-label", "PV");
      movie.appendChild(btn);
      startYouTube = function () {
        var f = document.createElement("iframe");
        f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
        f.title = "Just Beat It PV";
        f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
        f.allowFullscreen = true;
        movie.innerHTML = "";
        movie.appendChild(f);
      };
      btn.addEventListener("click", startYouTube);
      $("[data-movie-note]").hidden = true;
    } else if (pv.mp4 && video) {
      video.innerHTML = "";
      video.src = pv.mp4;
      video.muted = false;
      $("[data-movie-note]").hidden = true;
    }
  }
  $$("[data-play-pv]").forEach(function (a) {
    a.addEventListener("click", function () {
      if (startYouTube) { startYouTube(); return; }
      if (video) {
        var p = video.play();
        if (p && p.catch) p.catch(function () { /* 自動再生が止められたら、利用者が再生ボタンを押す */ });
      }
    });
  });
  // 画面から外れた映像は止める
  if (video && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting && !video.paused) video.pause();
    }).observe(video);
  }

  // ---- ダウンロード ----
  var dlConfig = config.download || {};
  function renderDownloads() {
    $$("[data-dl]").forEach(function (card) {
      var c = dlConfig[card.dataset.dl] || {};
      $$("[data-dl-field]", card).forEach(function (dd) {
        var v = pick(c[dd.dataset.dlField]);
        dd.textContent = v || (lang() === "en" ? "TBA" : "未定");
      });
      var b = $("[data-dl-button]", card);
      if (c.url) {
        b.href = c.url;
        b.classList.remove("band-idle", "is-disabled");
        b.classList.add("band-action");
        b.removeAttribute("aria-disabled");
        var size = c.size ? "<small>" + escapeHtml(c.size) + "</small>" : "";
        b.innerHTML = lang() === "en" ? "Download" + size : "ダウンロード" + size;
      }
    });
  }
  langHooks.push(renderDownloads);

  // ---- 制作班 ----
  function renderTeam() {
    var name = pick(config.team) || "筑駒縁日 Just Beat It 制作班";
    $$("[data-team-name]").forEach(function (el) { el.textContent = name; });
    var list = $("[data-members]");
    if (!list) return;
    var members = config.members || [];
    list.innerHTML = "";
    members.forEach(function (m) {
      var li = document.createElement("li");
      li.className = "plate";
      var b = document.createElement("b");
      b.textContent = m.handle || "";
      var s = document.createElement("span");
      s.textContent = pick(m.role);
      li.appendChild(b);
      li.appendChild(s);
      list.appendChild(li);
    });
    $("[data-members-empty]").hidden = members.length > 0;
  }
  langHooks.push(renderTeam);

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  applyLang(lang(), false);
})();
