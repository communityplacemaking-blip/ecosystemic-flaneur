/* The living field: a city as a living system.
   At first: points that blink in and out, threads that appear between unrelated places.
   Hidden in it: streets, orbits and districts that nobody drew.
   Attention (the pointer, a tap, the walker that wanders by itself) makes relations visible.
   What is discovered stays for a while, then loosens again. Order is temporary; chaos never leaves. */
(function (root) {
  'use strict';
  var TAU = Math.PI * 2;
  var reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rng(seed) {
    var s = 0; seed = String(seed);
    for (var i = 0; i < seed.length; i++) s = (Math.imul(31, s) + seed.charCodeAt(i)) | 0;
    s = s || 9; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')'; }

  var PAL = {
    /* one world: the same city, lit by night, drawn as a map by day */
    'w-night': { glow: true, node: [255, 243, 210], gold: [222, 176, 60], teal: [109, 184, 175], terra: [217, 139, 100], line: [214, 224, 236], label: [247, 242, 232], dust: [214, 226, 250], cont: [214, 224, 236], contA: .45 },
    'w-day':   { glow: false, node: [15, 45, 74], gold: [196, 152, 34], teal: [47, 127, 120], terra: [154, 78, 44], line: [15, 45, 74], label: [15, 45, 74], dust: [15, 45, 74], cont: [15, 45, 74], contA: .85 },
    'b-day':   { glow: false, node: [17, 43, 72], gold: [196, 146, 44], teal: [58, 132, 128], terra: [186, 96, 63], line: [17, 43, 72], label: [17, 43, 72], dust: null, cont: [17, 43, 72] },
    'b-night': { glow: true, node: [244, 232, 206], gold: [228, 180, 84], teal: [110, 184, 176], terra: [224, 146, 112], line: [241, 232, 214], label: [241, 232, 214], dust: null, cont: [241, 232, 214] }
  };
  function key(el) { var h = (el && el.closest && el.closest('[data-dir][data-sky]')) || document.documentElement; return (h.getAttribute('data-dir') || 'w') + '-' + (h.getAttribute('data-sky') || 'night'); }

  /* value noise for contour lines */
  function noise2(r) {
    var G = 12, g = [];
    for (var i = 0; i < (G + 1) * (G + 1); i++) g.push(r());
    function v(x, y) { var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; xi = ((xi % G) + G) % G; yi = ((yi % G) + G) % G;
      var x1 = (xi + 1) % G, y1 = (yi + 1) % G, s = function (t) { return t * t * (3 - 2 * t); };
      var a = g[yi * G + xi], b = g[yi * G + x1], c = g[y1 * G + xi], d = g[y1 * G + x1];
      return lerp(lerp(a, b, s(xf)), lerp(c, d, s(xf)), s(yf)); }
    return function (x, y) { return v(x, y) * .62 + v(x * 2.1 + 5, y * 2.1 + 3) * .28 + v(x * 4.3 + 1, y * 4.3 + 7) * .1; };
  }

  function Field(host, opt) {
    opt = opt || {};
    this.host = host; this.opt = opt;
    this.seed = opt.seed || 'city';
    this.labels = opt.labels || [];
    this.density = opt.density || 1;
    this.anchor = opt.anchor || null; // where the walker starts, in 0..1 of the canvas
    var c = this.cv = document.createElement('canvas');
    c.className = 'eco-cv'; c.setAttribute('aria-hidden', 'true');
    host.appendChild(c);
    this.ctx = c.getContext('2d');
    this.pointer = null; this.pulses = []; this.ripples = []; this.flick = [];
    this.t = 0; this.last = 0; this.running = false; this.visible = true;
    var self = this;
    this.resize();
    if (root.ResizeObserver) new ResizeObserver(function () { self.resize(); self.draw(); }).observe(host);
    var tgt = opt.listen || host;
    tgt.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') self.point(e, false); });
    tgt.addEventListener('pointerleave', function () { self.pointer = null; });
    tgt.addEventListener('pointerdown', function (e) { self.point(e, true); });
    document.addEventListener('worlds:sky', function () { self.repaint(); });
    if ('IntersectionObserver' in root) new IntersectionObserver(function (es) { self.visible = es[0].isIntersecting; if (self.visible) self.start(); }, { rootMargin: '80px' }).observe(host);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) self.start(); });
    if (reduce) { this.simulate(7); this.draw(); } else this.start();
  }

  Field.prototype.point = function (e, tap) {
    var r = this.cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (x < 0 || y < 0 || x > r.width || y > r.height) return;
    if (tap) { this.pulses.push({ x: x, y: y, life: 2.4, R: Math.max(110, Math.min(r.width, r.height) * .28) }); if (reduce) { this.attend(x, y, 170, 3); this.step(0.05); this.draw(); } }
    else this.pointer = { x: x, y: y, at: this.t };
  };

  Field.prototype.resize = function () {
    var r = this.host.getBoundingClientRect(), dpr = Math.min(2, root.devicePixelRatio || 1);
    var W = Math.max(200, Math.round(r.width)), H = Math.max(160, Math.round(r.height));
    if (W === this.W && H === this.H) return;
    this.W = W; this.H = H; this.dpr = dpr;
    this.cv.width = W * dpr; this.cv.height = H * dpr;
    this.cv.style.width = W + 'px'; this.cv.style.height = H + 'px';
    this.build();
  };

  /* the hidden city: streets / orbits, districts, and scattered points */
  Field.prototype.build = function () {
    var r = rng(this.seed), W = this.W, H = this.H, dir = key(this.host).charAt(0);
    var area = W * H, N = Math.round(Math.min(260, Math.max(80, area / 4300)) * this.density);
    var nodes = [], groups = [], i, j;
    var nThreads = W < 600 ? 3 : 5, nDist = W < 600 ? 2 : 4;
    for (i = 0; i < nThreads; i++) {
      var g = { kind: 'thread', nodes: [], edges: [], coh: 0, label: null, pts: [] };
      if (dir === 'w' && i % 2 === 0) {
        // an orbital arc: part of an ellipse whose centre may lie beyond the screen
        var cx = W * (r() * 1.4 - .2), cy = H * (r() * 1.4 - .2), rx = Math.max(W, H) * (.35 + r() * .5), ry = rx * (.45 + r() * .4), rot = r() * TAU, a0 = r() * TAU, span = 1.4 + r() * 2.2;
        for (j = 0; j <= 40; j++) { var a = a0 + span * j / 40, ex = rx * Math.cos(a), ey = ry * Math.sin(a);
          g.pts.push([cx + ex * Math.cos(rot) - ey * Math.sin(rot), cy + ex * Math.sin(rot) + ey * Math.cos(rot)]); }
      } else {
        // a street: a soft curve that crosses the field and continues beyond it
        var side = r(), p0, p3;
        if (side < .5) { p0 = [-.08 * W, r() * H]; p3 = [1.08 * W, r() * H]; } else { p0 = [r() * W, -.08 * H]; p3 = [r() * W, 1.08 * H]; }
        var p1 = [r() * W, r() * H], p2 = [r() * W, r() * H];
        for (j = 0; j <= 40; j++) { var t = j / 40, u = 1 - t;
          g.pts.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); }
      }
      groups.push(g);
    }
    for (i = 0; i < nDist; i++) {
      var R0 = Math.min(W, H) * (.08 + r() * .07);
      groups.push({ kind: 'district', nodes: [], edges: [], coh: 0, label: null, cx: W * (.12 + r() * .76), cy: H * (.14 + r() * .72), R: R0 });
    }
    var self = this;
    function add(x, y, gi) {
      if (x < -20 || y < -20 || x > W + 20 || y > H + 20) return;
      nodes.push({ x: x, y: y, hx: x, hy: y, z: r(), ph: r() * TAU, fq: .3 + r() * .9, g: gi, seen: 0, life: r(), blink: gi < 0 ? .15 + r() * .35 : .03 + r() * .06, calm: 0 });
      if (gi >= 0) groups[gi].nodes.push(nodes.length - 1);
    }
    var share = Math.round(N * .5 / Math.max(1, nThreads + nDist));
    groups.forEach(function (g, gi) {
      if (g.kind === 'thread') {
        for (var k = 0; k < share; k++) { var p = g.pts[Math.floor((k + r() * .6) / share * 40)]; add(p[0] + (r() - .5) * 16, p[1] + (r() - .5) * 16, gi); }
      } else {
        for (var m = 0; m < share; m++) { var a = r() * TAU, d = Math.sqrt(r()) * g.R; add(g.cx + d * Math.cos(a), g.cy + d * Math.sin(a) * .8, gi); }
      }
    });
    while (nodes.length < N) add(r() * W, r() * H, -1);
    // edges that belong to the hidden order: neighbours along a street, near ones inside a district
    groups.forEach(function (g) {
      var ns = g.nodes.slice();
      if (g.kind === 'thread') {
        ns.sort(function (p, q) { return self.along(g, nodes[p]) - self.along(g, nodes[q]); });
        for (var k = 1; k < ns.length; k++) g.edges.push({ a: ns[k - 1], b: ns[k], s: 0 });
      } else {
        ns.forEach(function (p, k) {
          var best = ns.filter(function (q) { return q !== p; }).sort(function (u, v) { return dist(nodes[p], nodes[u]) - dist(nodes[p], nodes[v]); }).slice(0, 2);
          best.forEach(function (q) { if (!g.edges.some(function (e) { return (e.a === q && e.b === p); })) g.edges.push({ a: p, b: q, s: 0 }); });
        });
      }
    });
    // a word for some of the patterns, when they become visible
    var L = this.labels.slice();
    groups.forEach(function (g, gi) { if (L.length && (gi % 2 === 0 || g.kind === 'district')) g.label = L.shift(); });
    this.nodes = nodes; this.groups = groups; this.bridges = []; this.flick = []; this.ripples = [];
    var a = this.anchor || [.5, .7];
    this.walker = { x: a[0] * W, y: a[1] * H, vx: 0, vy: 0, tgt: null, trail: [], pause: 1.2 };
    this.bg = null;
  };
  function dist(p, q) { var dx = p.x - q.x, dy = p.y - q.y; return Math.sqrt(dx * dx + dy * dy); }
  Field.prototype.along = function (g, n) {
    var best = 0, bd = 1e9;
    g.pts.forEach(function (p, i) { var d = (p[0] - n.x) * (p[0] - n.x) + (p[1] - n.y) * (p[1] - n.y); if (d < bd) { bd = d; best = i; } });
    return best;
  };

  /* background layer: contour lines (living map) or distant dust (night city), drawn once */
  Field.prototype.paintBg = function (P) {
    var W = this.W, H = this.H, dpr = this.dpr, c = document.createElement('canvas');
    c.width = W * dpr; c.height = H * dpr;
    var x = c.getContext('2d'); x.scale(dpr, dpr);
    var r = rng(this.seed + 'bg');
    if (P.cont) {
      var nz = noise2(r), S = 9, cols = Math.ceil(W / S) + 1, rows = Math.ceil(H / S) + 1, f = [], i, j, k;
      for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) f.push(nz(i * S / 260, j * S / 260));
      x.lineWidth = .8;
      for (k = 1; k < 11; k++) {
        var lv = .22 + k * .055;
        x.strokeStyle = rgba(P.cont, (k % 4 === 0 ? .16 : .075) * (P.contA || 1));
        x.beginPath();
        for (j = 0; j < rows - 1; j++) for (i = 0; i < cols - 1; i++) {
          var a = f[j * cols + i], b = f[j * cols + i + 1], cc = f[(j + 1) * cols + i + 1], d = f[(j + 1) * cols + i];
          var X = i * S, Y = j * S, e = [];
          if ((a < lv) !== (b < lv)) e.push([X + S * (lv - a) / (b - a), Y]);
          if ((b < lv) !== (cc < lv)) e.push([X + S, Y + S * (lv - b) / (cc - b)]);
          if ((d < lv) !== (cc < lv)) e.push([X + S * (lv - d) / (cc - d), Y + S]);
          if ((a < lv) !== (d < lv)) e.push([X, Y + S * (lv - a) / (d - a)]);
          if (e.length >= 2) { x.moveTo(e[0][0], e[0][1]); x.lineTo(e[1][0], e[1][1]); if (e.length === 4) { x.moveTo(e[2][0], e[2][1]); x.lineTo(e[3][0], e[3][1]); } }
        }
        x.stroke();
      }
    }
    if (P.dust) {
      var n = Math.round(W * H / 2200);
      for (var q = 0; q < n; q++) {
        x.fillStyle = rgba(P.dust, P.glow ? .08 + r() * .3 : .05 + r() * .12);
        x.beginPath(); x.arc(r() * W, r() * H, r() * .9 + .2, 0, TAU); x.fill();
      }
    }
    this.bg = c; this.bgKey = key(this.host);
  };

  Field.prototype.sprite = function (col, P) {
    this.sprites = this.sprites || {};
    var k = col.join(',') + (P.glow ? 'g' : 'f');
    if (this.sprites[k]) return this.sprites[k];
    var c = document.createElement('canvas'), s = 64; c.width = c.height = s;
    var x = c.getContext('2d'), g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, rgba(col, P.glow ? .9 : .55)); g.addColorStop(.25, rgba(col, P.glow ? .32 : .18)); g.addColorStop(1, rgba(col, 0));
    x.fillStyle = g; x.fillRect(0, 0, s, s);
    return (this.sprites[k] = c);
  };

  Field.prototype.attend = function (x, y, R, k) {
    var R2 = R * R;
    this.nodes.forEach(function (n) {
      var dx = n.x - x, dy = n.y - y, d2 = dx * dx + dy * dy;
      if (d2 < R2) n.seen = Math.min(1.6, n.seen + k * (1 - d2 / R2));
    });
  };

  Field.prototype.step = function (dt) {
    var self = this, W = this.W, H = this.H, t = (this.t += dt), nodes = this.nodes;
    // the walker wanders by itself: from place to place, curious about what is not yet seen
    var w = this.walker;
    if (w.pause > 0) w.pause -= dt;
    else {
      if (!w.tgt || dist(w, w.tgt) < 14) {
        var cands = nodes.filter(function (n) { var d = dist(w, n); return d > 60 && d < Math.max(W, H) * .4; });
        cands.sort(function (p, q) { return (p.seen + Math.random() * .9) - (q.seen + Math.random() * .9); });
        w.tgt = cands[0] || nodes[(Math.random() * nodes.length) | 0];
        if (Math.random() < .25) w.pause = .8 + Math.random() * 1.6;
      }
      var dx = w.tgt.x - w.x, dy = w.tgt.y - w.y, d = Math.sqrt(dx * dx + dy * dy) || 1, sp = 26;
      w.vx = lerp(w.vx, dx / d * sp, dt * 1.4) + Math.sin(t * 1.3) * .6; w.vy = lerp(w.vy, dy / d * sp, dt * 1.4) + Math.cos(t * 1.1) * .6;
      w.x += w.vx * dt; w.y += w.vy * dt;
      var last = w.trail[w.trail.length - 1];
      if (!last || Math.abs(last[0] - w.x) + Math.abs(last[1] - w.y) > 4) { w.trail.push([w.x, w.y, t]); if (w.trail.length > 260) w.trail.shift(); }
    }
    this.attend(w.x, w.y, 90, dt * 1.1);
    if (this.pointer && t - this.pointer.at < 2.5) this.attend(this.pointer.x, this.pointer.y, 130, dt * 2.6);
    this.pulses = this.pulses.filter(function (p) { p.life -= dt; self.attend(p.x, p.y, p.R, dt * 2.2); return p.life > 0; });
    // attention fades slowly: what is not looked at loosens again
    nodes.forEach(function (n) {
      n.seen = Math.max(0, n.seen - dt * .05);
      n.life += dt * n.blink;
      var calm = n.calm = lerp(n.calm, Math.min(1, n.seen), dt * .8);
      var amp = 7 * (1 - calm * .8) * (.5 + n.z);
      n.x = n.hx + Math.sin(t * n.fq * .5 + n.ph) * amp; n.y = n.hy + Math.cos(t * n.fq * .4 + n.ph * 1.3) * amp;
    });
    // hidden relations are discovered where attention dwells on both ends
    this.groups.forEach(function (g) {
      var on = 0;
      g.edges.forEach(function (e) {
        var A = nodes[e.a], B = nodes[e.b];
        if (A.seen > .55 && B.seen > .55 && e.s < .2) { e.s = 1; if (Math.random() < .5) self.ripples.push({ x: (A.x + B.x) / 2, y: (A.y + B.y) / 2, r: 2, life: 1 }); }
        else if (A.seen > .55 && B.seen > .55) e.s = Math.min(1, e.s + dt * .5);
        else e.s = Math.max(0, e.s - dt * .028);
        if (e.s > .3) on++;
      });
      g.coh = lerp(g.coh, g.edges.length ? on / g.edges.length : 0, dt * .9);
    });
    // between two patterns that both became visible, an unexpected path may appear
    if (Math.random() < dt * .5) {
      var vis = this.groups.filter(function (g) { return g.coh > .35; });
      if (vis.length > 1) {
        var g1 = vis[(Math.random() * vis.length) | 0], g2 = vis[(Math.random() * vis.length) | 0];
        if (g1 !== g2) {
          var a = g1.nodes[(Math.random() * g1.nodes.length) | 0], best = null, bd = 1e9;
          g2.nodes.forEach(function (b) { var d = dist(nodes[a], nodes[b]); if (d < bd) { bd = d; best = b; } });
          if (best != null && bd < Math.max(W, H) * .45 && this.bridges.length < 6) this.bridges.push({ a: a, b: best, s: 0, grow: 1, life: 14 + Math.random() * 10 });
        }
      }
    }
    this.bridges = this.bridges.filter(function (b) { b.life -= dt; b.s = b.life > 3 ? Math.min(1, b.s + dt * .6) : Math.max(0, b.life / 3); return b.life > 0; });
    // the chaos layer: brief threads between places that seem unrelated
    if (Math.random() < dt * 13) {
      var p = (Math.random() * nodes.length) | 0, q = (Math.random() * nodes.length) | 0;
      if (p !== q && dist(nodes[p], nodes[q]) < Math.max(W, H) * .22) this.flick.push({ a: p, b: q, life: .8 + Math.random() * 2.2, max: 0 });
    }
    this.flick = this.flick.filter(function (f) { f.life -= dt; return f.life > 0; });
    this.ripples = this.ripples.filter(function (r) { r.life -= dt * .45; r.r += dt * 38; return r.life > 0; });
  };

  Field.prototype.simulate = function (sec) { for (var s = 0; s < sec * 30; s++) this.step(1 / 30); this.flick = []; this.ripples = []; };

  Field.prototype.repaint = function () { this.bg = null; this.sprites = {}; this.draw(); };

  Field.prototype.draw = function () {
    if (!this.nodes) return;
    var x = this.ctx, W = this.W, H = this.H, dpr = this.dpr, K = key(this.host), P = PAL[K] || PAL['w-night'], nodes = this.nodes, t = this.t, dir = K.charAt(0);
    if (!this.bg || this.bgKey !== K) this.paintBg(P);
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.clearRect(0, 0, W, H);
    x.drawImage(this.bg, 0, 0, W, H);
    // patterns that became legible: streets, orbits, districts
    this.groups.forEach(function (g, gi) {
      if (g.coh < .06) return;
      var a = Math.min(1, g.coh * 1.4);
      x.save();
      if (g.kind === 'thread') {
        x.beginPath(); g.pts.forEach(function (p, i) { if (i) x.lineTo(p[0], p[1]); else x.moveTo(p[0], p[1]); });
        if (dir === 'b') { x.setLineDash([2, 6]); x.lineCap = 'round'; x.strokeStyle = rgba(gi % 2 ? P.teal : P.gold, a * .9); x.lineWidth = 2.2; }
        else { x.strokeStyle = rgba(gi % 2 ? P.teal : P.gold, a * (P.glow ? .5 : .55)); x.lineWidth = P.glow ? 1.1 : 1.2; if (P.glow) { x.shadowColor = rgba(P.gold, .6); x.shadowBlur = 8; } }
        x.stroke();
      } else {
        var rr = g.R * (1.18 + .03 * Math.sin(t * .6 + gi));
        if (dir === 'b') {
          x.strokeStyle = rgba(P.terra, a * .55); x.lineWidth = 1.1;
          for (var k = 0; k < 3; k++) { x.beginPath(); wobble(x, g.cx, g.cy, rr * (1 + k * .22), rr * .8 * (1 + k * .22), gi + k, t * .2); x.stroke(); }
        } else {
          x.strokeStyle = rgba(P.teal, a * .5); x.lineWidth = .8;
          x.beginPath(); x.ellipse(g.cx, g.cy, rr * 1.25, rr * .62, (gi * .7 + t * .03) % TAU, 0, TAU); x.stroke();
          x.strokeStyle = rgba(P.gold, a * .32);
          x.beginPath(); x.ellipse(g.cx, g.cy, rr * .8, rr * 1.05, (gi * 1.3 - t * .02) % TAU, 0, TAU); x.stroke();
        }
      }
      x.restore();
    });
    // chaos: brief threads
    x.lineWidth = .7;
    this.flick.forEach(function (f) {
      var A = nodes[f.a], B = nodes[f.b], al = Math.min(1, f.life) * (P.glow ? .3 : .22);
      x.strokeStyle = rgba(P.line, al);
      x.beginPath(); x.moveTo(A.x, A.y);
      if (dir === 'b') x.quadraticCurveTo((A.x + B.x) / 2 + (A.y - B.y) * .15, (A.y + B.y) / 2 + (B.x - A.x) * .15, B.x, B.y); else x.lineTo(B.x, B.y);
      x.stroke();
    });
    // discovered relations
    this.groups.forEach(function (g) {
      g.edges.forEach(function (e) {
        if (e.s < .03) return;
        var A = nodes[e.a], B = nodes[e.b];
        x.strokeStyle = rgba(g.kind === 'district' ? P.terra : P.line, e.s * (P.glow ? .55 : .5));
        x.lineWidth = dir === 'b' ? 1.1 : .9;
        x.beginPath(); x.moveTo(A.x, A.y);
        if (dir === 'b') x.quadraticCurveTo((A.x + B.x) / 2 + (A.y - B.y) * .1, (A.y + B.y) / 2 + (B.x - A.x) * .1, B.x, B.y); else x.lineTo(B.x, B.y);
        x.stroke();
      });
    });
    // unexpected bridges between patterns
    this.bridges.forEach(function (b) {
      var A = nodes[b.a], B = nodes[b.b], mx = (A.x + B.x) / 2 + (A.y - B.y) * .25, my = (A.y + B.y) / 2 + (B.x - A.x) * .25;
      x.save(); x.strokeStyle = rgba(P.teal, b.s * .75); x.lineWidth = 1.3; if (dir === 'b') x.setLineDash([5, 5]);
      x.beginPath(); x.moveTo(A.x, A.y); x.quadraticCurveTo(mx, my, B.x, B.y); x.stroke(); x.restore();
    });
    // the walker's trace
    var tr = this.walker.trail;
    if (tr.length > 2) {
      x.save(); x.lineCap = 'round';
      if (dir === 'b') { x.setLineDash([1.5, 5.5]); x.lineWidth = 2.2; }
      else x.lineWidth = 1.4;
      for (var i = 1; i < tr.length; i++) {
        var age = (t - tr[i][2]); var al = Math.max(0, 1 - age / 26) * (dir === 'b' ? .85 : .7);
        if (al <= 0) continue;
        x.strokeStyle = rgba(P.gold, al);
        x.beginPath(); x.moveTo(tr[i - 1][0], tr[i - 1][1]); x.lineTo(tr[i][0], tr[i][1]); x.stroke();
      }
      x.restore();
    }
    // the points of the city
    if (P.glow) x.globalCompositeOperation = 'lighter';
    var self = this;
    nodes.forEach(function (n) {
      var bl = n.g < 0 ? (Math.sin(n.life * TAU) * .5 + .5) : (Math.sin(n.life * TAU) * .25 + .75);
      var seen = Math.min(1, n.seen);
      var al = (.18 + .5 * bl * (.4 + .6 * n.z)) * (1 - seen * .2) + seen * .6;
      var col = n.g >= 0 && seen > .5 ? (self.groups[n.g].kind === 'district' ? P.terra : P.gold) : P.node;
      var s = (1 + n.z * 1.6) * (1 + seen * .7);
      if (P.glow || seen > .4) { var sp = self.sprite(col, P), hs = s * (P.glow ? 9 : 6) * (.5 + seen); x.globalAlpha = Math.min(1, al * (P.glow ? .9 : .5)); x.drawImage(sp, n.x - hs / 2, n.y - hs / 2, hs, hs); x.globalAlpha = 1; }
      if (dir === 'b' && !P.glow) {
        x.strokeStyle = rgba(col, Math.min(1, al + .2)); x.lineWidth = 1;
        x.beginPath(); x.arc(n.x, n.y, s * 1.3, 0, TAU);
        if (seen > .5) { x.fillStyle = rgba(col, .85); x.fill(); } else x.stroke();
      } else {
        x.fillStyle = rgba(col, Math.min(1, al + .15));
        x.beginPath(); x.arc(n.x, n.y, s * .8, 0, TAU); x.fill();
      }
    });
    x.globalCompositeOperation = 'source-over';
    // the walker itself: a small light / an ink mark moving through the city
    var w = this.walker;
    x.drawImage(this.sprite(P.gold, P), w.x - 14, w.y - 14, 28, 28);
    x.fillStyle = rgba(P.gold, 1); x.beginPath(); x.arc(w.x, w.y, 2.6, 0, TAU); x.fill();
    // discoveries ripple outward
    this.ripples.forEach(function (r) { x.strokeStyle = rgba(dir === 'b' ? P.line : P.gold, r.life * .45); x.lineWidth = 1; x.beginPath(); x.arc(r.x, r.y, r.r, 0, TAU); x.stroke(); });
    // pointer lens: a soft circle of attention
    if (this.pointer && t - this.pointer.at < 2.5) {
      var pa = Math.max(0, 1 - (t - this.pointer.at) / 2.5);
      x.strokeStyle = rgba(P.line, .12 * pa); x.setLineDash([2, 6]); x.beginPath(); x.arc(this.pointer.x, this.pointer.y, 130, 0, TAU); x.stroke(); x.setLineDash([]);
    }
    // a word for each pattern that became legible
    x.font = (dir === 'b' ? '500 13px Heebo' : '400 14.5px Heebo'); x.textAlign = 'center'; x.direction = 'rtl';
    this.groups.forEach(function (g) {
      if (!g.label || g.coh < .3) return;
      var px, py;
      if (g.kind === 'district') { px = g.cx; py = g.cy - g.R * 1.35; }
      else { var mid = g.pts[20]; px = mid[0]; py = mid[1] - 12; }
      if (px < 40 || px > W - 40 || py < 20 || py > H - 10) return;
      var a = Math.min(1, (g.coh - .3) * 3);
      if (dir === 'b') { x.fillStyle = rgba(P.label === P.node ? P.label : P.label, a * .9); }
      else x.fillStyle = rgba(P.label, a * .85);
      x.fillText(g.label, px, py);
    });
  };

  function wobble(x, cx, cy, rx, ry, seed, ph) {
    for (var i = 0; i <= 64; i++) {
      var a = i / 64 * TAU, k = 1 + .05 * Math.sin(3 * a + seed) + .03 * Math.sin(5 * a + seed * 2 + ph);
      var px = cx + rx * k * Math.cos(a), py = cy + ry * k * Math.sin(a);
      if (i) x.lineTo(px, py); else x.moveTo(px, py);
    }
  }

  Field.prototype.start = function () {
    if (reduce || this.running) return;
    this.running = true; this.last = performance.now();
    var self = this;
    function loop(now) {
      if (!self.visible || document.hidden) { self.running = false; return; }
      var dt = Math.min(.05, (now - self.last) / 1000); self.last = now;
      self.step(dt); self.draw();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  };

  root.EcoField = Field;
  root.EcoPAL = PAL;
  root.EcoKey = key;
})(window);
