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
  function instantMotion() { return root.classList.contains("calm") || window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
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
    var TICKER = ["JUST BEAT IT", "RHYTHM BULLET HELL", "10 STAGES", "10 SONGS", "DASH", "FREE DOWNLOAD", "WINDOWS / MAC"];
    $$("main > .section").forEach(function (s, i) {
      var t = zz("div", "zz-ticker zz-ticker--" + (i % 3));
      if (["about", "download", "howto", "credits"].indexOf(s.id) !== -1) t.classList.add("zz-ticker-light");
      var run = document.createElement("div");
      run.className = "zz-ticker-run";
      var words = TICKER.slice(i % TICKER.length).concat(TICKER.slice(0, i % TICKER.length));
      var html = words.map(function (w) { return "<span>" + w + "</span><i></i>"; }).join("");
      run.innerHTML = '<div class="zz-ticker-half">' + html.repeat(3) + '</div><div class="zz-ticker-half">' + html.repeat(3) + '</div>';
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
    // 04: 起動の警告の手順を、Windows・Mac それぞれの欄の下に写す（見出しを押すと開閉。最初は畳む）
    var subTitle = $("#download .sub-title");
    $$("#download .warn").forEach(function (det, k) {
      var card = $$("#download [data-dl]")[k];
      if (!card || !subTitle) return;
      var box = zz("div", "zz-warn");
      box.removeAttribute("aria-hidden");
      var c = det.cloneNode(true);
      c.open = false;
      c.className = "zz-warn-steps";
      $("summary", c).innerHTML = subTitle.innerHTML;
      var body = document.createElement("div");
      body.className = "zz-warn-body";
      $$("ol", c).forEach(function (ol) { body.appendChild(ol); });
      c.appendChild(body);
      var expanded = false, closeTimer, bodyFrame;
      function finishHeight() {
        clearTimeout(closeTimer);
        if (!expanded) c.open = false;
        body.style.height = "auto";
      }
      body.addEventListener("transitionend", function (ev) {
        if (ev.target === body && ev.propertyName === "height") finishHeight();
      });
      $("summary", c).addEventListener("click", function (ev) {
        ev.preventDefault();
        expanded = !expanded;
        clearTimeout(closeTimer);
        cancelAnimationFrame(bodyFrame);
        if (instantMotion()) {
          c.open = expanded;
          body.style.height = "auto";
          return;
        }
        var height = c.open ? body.getBoundingClientRect().height : 0;
        c.open = true;
        body.style.height = height + "px";
        void body.offsetHeight;
        bodyFrame = requestAnimationFrame(function () {
          body.style.height = (expanded ? body.scrollHeight : 0) + "px";
          closeTimer = setTimeout(finishHeight, 300);
        });
      });
      box.appendChild(c);
      card.appendChild(box);
    });
    var langBox = $(".header .lang");
    if (langBox) {
      // 狭い画面では、区画の一覧をメニューのボタンにまとめる（番号だけでは何か分からないため）
      var menuBtn = zz("button", "zz-menu-btn");
      menuBtn.type = "button";
      menuBtn.removeAttribute("aria-hidden");
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-controls", "zz-menu");
      menuBtn.innerHTML = '<i aria-hidden="true"></i><span class="zz-visually-hidden" lang="ja">メニュー</span><span class="zz-visually-hidden" lang="en">Menu</span>';
      var menu = zz("nav", "zz-menu");
      menu.id = "zz-menu";
      menu.removeAttribute("aria-hidden");
      menu.setAttribute("aria-label", "Menu");
      menu.hidden = true;
      $$("[data-nav] a").forEach(function (a) {
        var sec = $(a.getAttribute("href"));
        var en = sec && $(".section-en", sec);
        var m = document.createElement("a");
        m.href = a.getAttribute("href");
        m.innerHTML = a.innerHTML + (en ? '<em aria-hidden="true">' + en.textContent + '</em>' : "");
        menu.appendChild(m);
        dots.push(m);
      });
      var menuOpen = false, menuFrame, menuTimer, menuEnd;
      var setMenu = function (open) {
        menuOpen = open;
        cancelAnimationFrame(menuFrame);
        clearTimeout(menuTimer);
        if (menuEnd) menu.removeEventListener("transitionend", menuEnd);
        menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
        root.classList.toggle("zz-menu-open", open);
        menu.inert = !open;
        if (instantMotion()) {
          menu.hidden = !open;
          menu.classList.toggle("is-open", open);
        } else if (open) {
          menu.hidden = false;
          void menu.offsetHeight;
          menuFrame = requestAnimationFrame(function () { menu.classList.add("is-open"); });
        } else {
          menu.classList.remove("is-open");
          var finish = function () {
            if (!menuOpen) menu.hidden = true;
            clearTimeout(menuTimer);
            menu.removeEventListener("transitionend", menuEnd);
          };
          menuEnd = function (ev) { if (ev.target === menu && ev.propertyName === "opacity") finish(); };
          menu.addEventListener("transitionend", menuEnd);
          menuTimer = setTimeout(finish, 240);
        }
      };
      menuBtn.addEventListener("click", function (ev) { ev.stopPropagation(); setMenu(!menuOpen); });
      menu.addEventListener("click", function (ev) { if (ev.target.closest("a")) setMenu(false); });
      document.addEventListener("click", function (ev) { if (!menu.hidden && !menu.contains(ev.target)) setMenu(false); });
      document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && !menu.hidden) { setMenu(false); menuBtn.focus(); } });
      langBox.parentNode.appendChild(menuBtn);
      langBox.parentNode.appendChild(menu);
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

  // スマホの新しい見た目では「どんなゲームか → 遊び方 → ダウンロード」の順に読めるよう、遊び方をダウンロードの前へ移し、番号も付け替える
  (function () {
    var dl = $("#download"), how = $("#howto");
    if (!dl || !how) return;
    var mq = window.matchMedia("(max-width: 640px)");
    var NO = { download: ["04", "05"], howto: ["05", "04"] };
    function setNo(sec, no) {
      $(".section-no", sec).textContent = no;
      $$('a[href="#' + sec.id + '"] b').forEach(function (b) { b.textContent = no; });
      var code = $(".zz-code", sec);
      if (code) code.lastChild.textContent = "JBI-" + no + "/07 · SEC." + no;
      var coord = $(".zz-coord", sec);
      if (coord) coord.textContent = "TRACK " + no + " — BEAT SYNC ON · 4/4";
    }
    // a を b の前へ（区画の前の流れる帯もいっしょに動かす）
    function putBefore(a, b) {
      if (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) return;
      var at = a.previousElementSibling, bt = b.previousElementSibling;
      b.parentNode.insertBefore(at, bt);
      b.parentNode.insertBefore(a, bt);
    }
    function apply() {
      var sp = root.dataset.style === "new" && mq.matches;
      if (sp) putBefore(how, dl); else putBefore(dl, how);
      [dl, how].forEach(function (sec) { setNo(sec, NO[sec.id][sp ? 1 : 0]); });
      $$(".zz-menu").forEach(function (menu) {
        var a = $('a[href="#download"]', menu), b = $('a[href="#howto"]', menu);
        if (a && b) { if (sp) menu.insertBefore(b, a); else menu.insertBefore(a, b); }
      });
    }
    if (mq.addEventListener) mq.addEventListener("change", apply); else mq.addListener(apply);
    new MutationObserver(apply).observe(root, { attributes: true, attributeFilter: ["data-style"] });
    apply();
  })();

  // 札の実寸は言語・フォント・画面幅で変わる。見比べで切り替えた時も再計測する。
  (function () {
    var heads = $$(".section > .section-head");
    function measureTags() {
      if (root.dataset.style !== "new") return;
      heads.forEach(function (head) {
        head.parentNode.style.setProperty("--tag-h", head.getBoundingClientRect().height + "px");
      });
    }
    if ("ResizeObserver" in window) {
      var observer = new ResizeObserver(measureTags);
      heads.forEach(function (head) { observer.observe(head); });
    } else {
      window.addEventListener("resize", function () { requestAnimationFrame(measureTags); });
    }
    new MutationObserver(measureTags).observe(root, { attributes: true, attributeFilter: ["data-style", "data-lang"] });
    langHooks.push(measureTags);
    if (document.fonts) document.fonts.ready.then(measureTags);
    measureTags();
  })();

  // 元の一覧を保ったまま、新しい見た目だけ著作権者ごとにまとめる。
  (function () {
    var list = $("#credits .credit-list");
    if (!list) return;
    var groups = [];
    var names = $$("li", list).map(function (li) {
      var name = $("b", li).textContent;
      var notice = $("li > span", li).textContent
        .replace(/\s*\((?:https?:\/\/|www\.)[^)]+\)/g, "")
        .replace(/^Copyright(?: \(c\))?\s*/, "© ");
      var key = /^(Noto Serif JP|Noto Sans JP)$/.test(name) ? "noto" : notice;
      var group = groups.filter(function (g) { return g.key === key; })[0];
      if (!group) {
        group = { key: key, notice: key === "noto" ? "© 2014-2023 Adobe / The Noto Project Authors, with Reserved Font Name 'Source'." : notice, names: [] };
        groups.push(group);
      }
      group.names.push(name);
      return name;
    });
    // フォント名と「© 年」の途中では折り返さない
    var keep = function (s) { return s.replace(/ /g, " "); };
    names = names.map(keep);
    groups.forEach(function (g) {
      g.names = g.names.map(keep);
      g.notice = g.notice.replace(/^© (\S+) /, function (m, y) { return keep("© " + y + " "); });
    });
    var compact = document.createElement("div");
    compact.className = "zz-only zz-font-credits";
    var fonts = document.createElement("p");
    var notices = document.createElement("p");
    notices.className = "zz-font-notices";
    ["ja", "en"].forEach(function (l) {
      var nameSpan = document.createElement("span");
      nameSpan.lang = l;
      nameSpan.textContent = names.join(" / ");
      fonts.appendChild(nameSpan);
      var noticeSpan = document.createElement("span");
      noticeSpan.lang = l;
      noticeSpan.textContent = groups.map(function (g) { return g.notice + " (" + g.names.join(", ") + ")"; }).join(" / ");
      notices.appendChild(noticeSpan);
    });
    compact.appendChild(fonts);
    compact.appendChild(notices);
    list.classList.add("zz-font-original");
    list.parentNode.insertBefore(compact, list);
  })();

  // ---- オープニング ----
  if (root.dataset.style === "new") {
    // 16×16 のドット絵（# が塗るマス）。どちらも横 14 マスの中に収め、大きさをそろえる
    var OS_DOTS = {
      windows: [
        "", ".######..######", ".######..######", ".######..######", ".######..######", ".######..######", ".######..######", "", "",
        ".######..######", ".######..######", ".######..######", ".######..######", ".######..######", ".######..######"
      ],
      mac: [
        "..........##", ".........###", "........###", "",
        "...####..####", "..############", ".#############", ".############",
        ".###########", ".###########", ".############", ".#############",
        "..############", "..############", "...####..####", "....##....##"
      ]
    };
    function osIcon(os) {
      var d = "";
      (OS_DOTS[os] || []).forEach(function (row, y) {
        row.replace(/#+/g, function (run, x) { d += "M" + x + " " + y + "h" + run.length + "v1h-" + run.length + "z"; });
      });
      return '<svg class="zz-os-icon" viewBox="0 0 16 16" aria-hidden="true" shape-rendering="crispEdges" fill="currentColor"><path d="' + d + '"/></svg>';
    }
    $$(".hero-actions small").forEach(function (el) {
      el.innerHTML = '<span class="zz-visually-hidden">Windows / Mac</span>' + osIcon("windows") + osIcon("mac");
    });
    $$("#download [data-dl] h3").forEach(function (el) {
      var word = el.textContent;
      el.innerHTML = '<span class="zz-visually-hidden">' + word + '</span>' + osIcon(word.toLowerCase());
    });
    $$(".zz-sp-dl-icons").forEach(function (el) { el.innerHTML = osIcon("windows") + osIcon("mac"); });

    // スマホのダウンロード欄: パソコンで開いてもらうため、ページのリンクをコピーする
    var copyBtn = $("[data-copy-link]");
    if (copyBtn) {
      var copyLabel = $("[data-copy-label]", copyBtn);
      var copyStatus = $("[data-copy-status]");
      var copyUrl = function () { return location.origin + location.pathname + "#download"; };
      var copyTimer = 0;
      var copyIdle = function () {
        copyBtn.classList.remove("is-copied");
        copyLabel.textContent = lang() === "en" ? "Copy page link" : "ページのリンクをコピー";
      };
      var showUrl = function () { $("[data-copy-url]").textContent = copyUrl(); copyIdle(); };
      showUrl();
      langHooks.push(showUrl);
      var fallbackCopy = function (text) {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
        document.body.removeChild(ta);
        return ok;
      };
      var done = function (ok) {
        var en = lang() === "en";
        var msg = ok ? (en ? "Copied ✓" : "コピーしました ✓") : (en ? "Couldn't copy" : "コピーできませんでした");
        copyLabel.textContent = msg;
        copyStatus.textContent = msg;
        copyBtn.classList.toggle("is-copied", ok);
        clearTimeout(copyTimer);
        copyTimer = setTimeout(copyIdle, 2000);
      };
      copyBtn.addEventListener("click", function () {
        var text = copyUrl();
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
        } else {
          done(fallbackCopy(text));
        }
      });
    }
  }

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
      // 画面の中央で、ロゴのドットを左の列から 1 つずつ置いていく → 左の定位置へ動く → 背景と各要素が出る
      var timers = [];
      var introDone = false;
      var layer = document.createElement("div");
      layer.className = "zz-only zz-intro-layer";
      layer.setAttribute("aria-hidden", "true");
      var letters = document.createElement("div");
      letters.className = "zz-intro-letters";
      var dotCanvas = document.createElement("canvas");
      letters.appendChild(dotCanvas);
      layer.appendChild(letters);
      document.body.appendChild(layer);
      hero.classList.add("zz-intro");
      var COL_MS = 9, ROW_MS = 7, LEAD_MS = 300, FLASH_MS = 140;
      var FLASH = getComputedStyle(root).getPropertyValue("--magenta").trim() || "#dd007b";
      var src = new Image();
      src.onload = function () {
        var w = src.naturalWidth, h = src.naturalHeight;
        dotCanvas.width = w;
        dotCanvas.height = h;
        var g = dotCanvas.getContext("2d");
        g.drawImage(src, 0, 0);
        var px = g.getImageData(0, 0, w, h).data;
        var dots = [];
        for (var x = 0; x < w; x++) {
          for (var y = 0; y < h; y++) {
            var i = (y * w + x) * 4;
            if (px[i + 3] > 127) dots.push({ x: x, y: y, at: LEAD_MS + x * COL_MS + y * ROW_MS, c: "rgb(" + px[i] + "," + px[i + 1] + "," + px[i + 2] + ")" });
          }
        }
        var t0 = performance.now();
        (function draw(now) {
          if (introDone) return;
          var t = now - t0;
          g.clearRect(0, 0, w, h);
          var left = 0;
          for (var k = 0; k < dots.length; k++) {
            var d = dots[k];
            if (t < d.at) { left++; continue; }
            // 置いた瞬間だけマゼンタ、すぐ元の色（白）に
            g.fillStyle = t - d.at < FLASH_MS ? FLASH : d.c;
            g.fillRect(d.x, d.y, 1, 1);
          }
          if (left || t < LEAD_MS + w * COL_MS + h * ROW_MS + FLASH_MS) requestAnimationFrame(draw);
        })(t0);
      };
      src.src = $("img", logo).currentSrc || $("img", logo).src;
      function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
      function zzSkip() {
        if (introDone) return;
        introDone = true;
        timers.forEach(clearTimeout);
        layer.remove();
        hero.classList.remove("zz-intro", "zz-revealing");
        ["logo", "sub", "flank", "ready", "done"].forEach(onPhase);
        ["click", "keydown", "wheel", "touchmove", "scroll", "resize"].forEach(function (event) {
          window.removeEventListener(event, zzSkip);
        });
      }
      later(function () {
        var finalRect = logo.getBoundingClientRect();
        var initialRect = letters.getBoundingClientRect();
        letters.style.transformOrigin = "0 0";
        // ゆっくり動き出し、長めに減速してから止まる
        letters.style.transition = "transform 1300ms cubic-bezier(.55, 0, .15, 1)";
        letters.style.transform = "translate(" + (finalRect.left - initialRect.left) + "px," + (finalRect.top - initialRect.top) + "px) scale(" + (finalRect.width / initialRect.width) + ")";
      }, 1800);
      later(function () {
        layer.remove();
        hero.classList.add("zz-revealing");
        ["logo", "sub", "flank", "ready"].forEach(onPhase);
      }, 3150);
      later(zzSkip, 4200);
      ["click", "keydown", "wheel", "touchmove", "scroll", "resize"].forEach(function (event) {
        window.addEventListener(event, zzSkip, { passive: true });
      });
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
        if (off === -1) t.dataset.side = "prev"; else if (off === 1) t.dataset.side = "next"; else delete t.dataset.side;
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
    if (root.dataset.style === "new" && video) {
      video.removeAttribute("src");
      video.innerHTML = '<source src="assets/video/pv1-1080.mp4" type="video/mp4" media="(min-width: 1000px)"><source src="assets/video/pv1-720.mp4" type="video/mp4">';
      video.poster = "assets/img/poster-pv1.jpg";
      video.removeAttribute("muted");
      video.muted = false;
      video.defaultMuted = false;
      video.preload = "none";
    } else if (pv.youtubeId) {
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
