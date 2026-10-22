// トップのオープニング: 真っ黒 → 各ステージの色の弾が拍に合わせて中央へ集まる → 光ってロゴ → きらめき。
// main.js が JBI_OPENING.start() を呼び、段階（logo / sub / flank / ready / done）を受け取ってクラスを付ける。
(function () {
  "use strict";

  var COLORS = ["#ff2d78", "#8a4dff", "#7ce03a", "#ffd21e", "#a7a7d6", "#d63cff", "#22b8e8", "#ff4a3a", "#2ee6d6", "#3a7bff"];
  var BEAT = 60 / 130;           // タイトル曲に近い 130 BPM
  var LEAD = 0.45;               // 真っ黒の間
  var WAVE_GAP = BEAT / 2;       // 弾の波は半拍ごと
  var PER_WAVE = 12;
  var MEET = LEAD + COLORS.length * WAVE_GAP + BEAT * 1.25;   // 弾が中央で出会う時刻
  // 出会ってからの段階（秒）
  var PHASES = [["logo", 0], ["sub", 0.9], ["flank", 1.35], ["ready", 1.95], ["done", 2.8]];

  function easeIn(x) { return x * x * x; }

  function Opening(canvas, logo, onPhase) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.logo = logo;
    this.onPhase = onPhase;
    this.bullets = [];
    this.sparks = [];
    this.rings = [];
    this.dust = [];
    this.fired = {};
    this.start = 0;
    this.offset = 0;
    this.running = false;
    this.visible = true;
    this.lastSpark = 0;
    this.resize = this.resize.bind(this);
    this.frame = this.frame.bind(this);
    window.addEventListener("resize", this.resize);
    this.resize();
    for (var i = 0; i < 26; i++) this.dust.push(this.makeDust(true));
  }

  Opening.prototype.resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.w = w; this.h = h; this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  Opening.prototype.center = function () {
    var r = this.logo.getBoundingClientRect();
    var c = this.canvas.getBoundingClientRect();
    return { x: r.left - c.left + r.width / 2, y: r.top - c.top + r.height / 2, w: r.width, h: r.height };
  };

  Opening.prototype.spawnWaves = function () {
    var reach = Math.hypot(this.w, this.h) * 0.62;
    for (var k = 0; k < COLORS.length; k++) {
      var t0 = LEAD + k * WAVE_GAP;
      var base = k * 0.61;
      for (var i = 0; i < PER_WAVE; i++) {
        this.bullets.push({
          t0: t0,
          a: base + i * Math.PI * 2 / PER_WAVE,
          spin: (k % 2 ? 1 : -1) * (0.7 + Math.random() * 0.4),
          r0: reach * (0.9 + Math.random() * 0.25),
          size: 3.5 + Math.random() * 3,
          color: COLORS[k]
        });
      }
    }
  };

  Opening.prototype.makeDust = function (anywhere) {
    return {
      x: Math.random() * this.w,
      y: anywhere ? Math.random() * this.h : this.h + 10,
      v: 6 + Math.random() * 14,
      size: 1 + Math.random() * 2.2,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      phase: Math.random() * 6.28
    };
  };

  Opening.prototype.burst = function (c) {
    for (var i = 0; i < 34; i++) this.sparks.push(this.makeSpark(c, true));
    this.rings.push({ t: this.now, x: c.x, y: c.y, color: "#ffffff", max: Math.max(this.w, this.h) * 0.7, life: 0.9, width: 3 });
  };

  Opening.prototype.makeSpark = function (c, near) {
    var spread = near ? 0.62 : 0.75;
    return {
      t: this.now + (near ? Math.random() * 0.5 : 0),
      x: c.x + (Math.random() - 0.5) * c.w * spread * 1.6,
      y: c.y + (Math.random() - 0.5) * c.h * spread * 2.2,
      size: 4 + Math.random() * (near ? 10 : 7),
      life: 0.6 + Math.random() * 0.7,
      color: Math.random() < 0.7 ? "#ffffff" : COLORS[(Math.random() * COLORS.length) | 0]
    };
  };

  Opening.prototype.play = function (quick) {
    // quick: このタブで 2 回目以降は弾の集まりを省いてロゴから
    this.offset = quick ? MEET - 0.15 : 0;
    if (!quick) this.spawnWaves();
    this.start = performance.now();
    this.running = true;
    requestAnimationFrame(this.frame);
  };

  Opening.prototype.skip = function () {
    if (this.skipped) return;
    this.skipped = true;
    this.bullets = [];
    for (var i = 0; i < PHASES.length; i++) this.fire(PHASES[i][0]);
    this.offset = MEET + 3 - (performance.now() - this.start) / 1000;
  };

  Opening.prototype.fire = function (name) {
    if (this.fired[name]) return;
    this.fired[name] = true;
    this.onPhase(name);
  };

  Opening.prototype.setVisible = function (v) {
    var was = this.visible;
    this.visible = v;
    if (v && !was && this.running) requestAnimationFrame(this.frame);
  };

  Opening.prototype.frame = function (ts) {
    if (!this.running || !this.visible) return;
    var t = (ts - this.start) / 1000 + this.offset;
    var dt = Math.min(0.05, this.prev ? t - this.prev : 0.016);
    this.prev = t;
    this.now = t;
    var ctx = this.ctx, w = this.w, h = this.h;
    var c = this.center();

    // 残像を残しながら暗くする
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = t < MEET ? "rgba(0,0,0,0.32)" : "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";

    // 漂う小さな弾（背景）
    if (t > MEET) {
      for (var d = 0; d < this.dust.length; d++) {
        var p = this.dust[d];
        p.y -= p.v * dt;
        if (p.y < -10) this.dust[d] = p = this.makeDust(false);
        ctx.globalAlpha = 0.18 + 0.12 * Math.sin(t * 2 + p.phase);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // 拍ごとに中央から薄い輪
    if (t < MEET) {
      var beatNo = Math.floor((t - LEAD) / WAVE_GAP);
      if (beatNo >= 0 && beatNo < COLORS.length && this.lastBeat !== beatNo) {
        this.lastBeat = beatNo;
        this.rings.push({ t: t, x: c.x, y: c.y, color: COLORS[beatNo], max: Math.min(w, h) * 0.32, life: 0.5, width: 2 });
      }
    }

    // 集まる弾
    for (var i = 0; i < this.bullets.length; i++) {
      var b = this.bullets[i];
      if (t < b.t0) continue;
      var q = Math.min(1, (t - b.t0) / (MEET - b.t0));
      var e = easeIn(q);
      var r = b.r0 * (1 - e);
      var a = b.a + b.spin * e;
      var x = c.x + Math.cos(a) * r * 1.25;
      var y = c.y + Math.sin(a) * r * 0.8;
      ctx.globalAlpha = Math.min(1, (t - b.t0) * 4);
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(x, y, b.size * (1 - e * 0.5), 0, 6.283); ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    if (t >= MEET && !this.fired.logo) {
      this.bullets = [];
      this.burst(c);
    }
    for (var k = 0; k < PHASES.length; k++) {
      if (t >= MEET + PHASES[k][1]) this.fire(PHASES[k][0]);
    }

    // 出会った瞬間の白い光
    var since = t - MEET;
    if (since >= 0 && since < 0.7) {
      var g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, Math.max(w, h) * 0.6);
      var al = 1 - since / 0.7;
      g.addColorStop(0, "rgba(255,255,255," + (0.95 * al) + ")");
      g.addColorStop(0.35, "rgba(255,230,250," + (0.35 * al) + ")");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    // 輪
    for (var n = this.rings.length - 1; n >= 0; n--) {
      var ring = this.rings[n];
      var rp = (t - ring.t) / ring.life;
      if (rp >= 1) { this.rings.splice(n, 1); continue; }
      ctx.globalAlpha = (1 - rp) * 0.6;
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = ring.width;
      ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.max * (0.15 + rp * 0.85), 0, 6.283); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // きらめき
    if (since > 0.4 && t - this.lastSpark > 0.22) {
      this.lastSpark = t;
      this.sparks.push(this.makeSpark(c, false));
    }
    for (var s = this.sparks.length - 1; s >= 0; s--) {
      var sp = this.sparks[s];
      var life = (t - sp.t) / sp.life;
      if (life < 0) continue;
      if (life >= 1) { this.sparks.splice(s, 1); continue; }
      var k2 = Math.sin(life * Math.PI);
      drawStar(ctx, sp.x, sp.y, sp.size * k2, sp.color, k2);
    }
    ctx.globalCompositeOperation = "source-over";

    requestAnimationFrame(this.frame);
  };

  function drawStar(ctx, x, y, s, color, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.quadraticCurveTo(x, y, x + s * 0.32, y);
    ctx.quadraticCurveTo(x, y, x, y + s);
    ctx.quadraticCurveTo(x, y, x - s * 0.32, y);
    ctx.quadraticCurveTo(x, y, x, y - s);
    ctx.moveTo(x - s * 0.7, y);
    ctx.quadraticCurveTo(x, y, x, y - s * 0.22);
    ctx.quadraticCurveTo(x, y, x + s * 0.7, y);
    ctx.quadraticCurveTo(x, y, x, y + s * 0.22);
    ctx.quadraticCurveTo(x, y, x - s * 0.7, y);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  window.JBI_OPENING = {
    create: function (canvas, logo, onPhase) { return new Opening(canvas, logo, onPhase); }
  };
})();
