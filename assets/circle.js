/* The living circle of the mechanism.
   Same contract as journey/field.js (focus, set, drawLinks, emerge, reset): the mechanism's logic,
   steps and routing are untouched; only the drawing changes.
   Inside the circle: orbital layers that breathe, lights that travel along them, a city at three depths,
   threads that flicker between places. Every answer anchors a point of light on its ring and gathers
   the nearby city around it. The journey appears as a path that is drawn through the field. */
(function (root) {
  'use strict';
  var TAU = Math.PI * 2, C = 200, RINGS = [182, 150, 120, 92];
  var reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }
  function rng(seed) { var x = seed * 1e9 | 0 || 7; return function () { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 10000) / 10000; }; }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')'; }
  function key() { var h = document.documentElement; return (h.getAttribute('data-dir') || 'w') + '-' + (h.getAttribute('data-sky') || 'night'); }
  var DISC = {
    'w-night': ['#123555', '#0C243D', '#071A2D'],
    'w-day': ['#FFFDF8', '#F5EEDF', '#E6EBF0'],
    'b-day': ['#FBF6EA', '#F3EAD6', '#E9DCC2'],
    'b-night': ['#17304A', '#12273D', '#0C1C2E']
  };
  function ringR(R, k, a, t) { return R * (1 + .026 * Math.sin(3 * a + k * 1.3 + t * .35) + .017 * Math.sin(5 * a + k * 2.1 - t * .27) + .009 * Math.sin(9 * a + k + t * .5)); }

  function Field(svg) {
    this.svg = svg; this.dots = {}; this.focusRing = -1; this.route = null; this.t = 0;
    var wrap = svg.parentNode;
    var cv = this.cv = document.createElement('canvas');
    cv.className = 'lc-cv'; cv.setAttribute('aria-hidden', 'true');
    wrap.insertBefore(cv, svg);
    svg.setAttribute('viewBox', '0 0 400 400');
    this.ctx = cv.getContext('2d');
    // the city inside the circle, at three depths
    var r = rng(.4242), pts = [];
    for (var i = 0; i < 150; i++) {
      var a = r() * TAU, d = 34 + Math.sqrt(r()) * 158, z = i % 3;
      pts.push({ a: a, d: d, z: z, ph: r() * TAU, b: .3 + r() * .7, sp: (z === 0 ? .004 : z === 1 ? -.007 : .011) * (r() * .5 + .75), lit: 0, x: 0, y: 0 });
    }
    this.city = pts;
    this.travellers = RINGS.map(function (R, k) { var n = 4 + k * 2, out = []; for (var j = 0; j < n; j++) out.push({ a: r() * TAU, sp: (.05 + r() * .09) * (k % 2 ? -1 : 1), s: .6 + r() * .8 }); return out; });
    this.flick = []; this.pointer = null; this.ripples = [];
    var self = this;
    this.resize();
    if (root.ResizeObserver) new ResizeObserver(function () { self.resize(); self.draw(); }).observe(wrap);
    wrap.addEventListener('pointermove', function (e) { self.pt(e); });
    wrap.addEventListener('pointerdown', function (e) { self.pt(e); if (reduce) self.draw(); });
    wrap.addEventListener('pointerleave', function () { self.pointer = null; if (reduce) self.draw(); });
    document.addEventListener('worlds:sky', function () { self.bg = null; self.draw(); });
    this.visible = true;
    if ('IntersectionObserver' in root) new IntersectionObserver(function (es) { self.visible = es[0].isIntersecting; if (self.visible) self.start(); }).observe(wrap);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) self.start(); });
    if (reduce) this.draw(); else this.start();
  }
  Field.prototype.pt = function (e) {
    var b = this.cv.getBoundingClientRect(), k = 400 / b.width;
    var x = (e.clientX - b.left) * k, y = (e.clientY - b.top) * k;
    if ((x - C) * (x - C) + (y - C) * (y - C) > 200 * 200) { this.pointer = null; return; }
    this.pointer = { x: x, y: y, at: this.t };
  };
  Field.prototype.resize = function () {
    var b = this.svg.parentNode.getBoundingClientRect(), dpr = Math.min(2, root.devicePixelRatio || 1), S = Math.max(160, Math.round(b.width));
    if (S === this.S) return;
    this.S = S; this.dpr = dpr; this.cv.width = this.cv.height = Math.round(S * dpr); this.bg = null;
  };

  /* --- the contract the mechanism uses --- */
  Field.prototype.focus = function (ring) { this.focusRing = ring; if (reduce) this.draw(); };
  Field.prototype.set = function (key, ring, text) {
    delete this.dots[key];
    if (text) {
      var a = (hash(key + '|' + text) * 2 - 1) * Math.PI;
      this.dots[key] = { ring: ring, a: a, born: this.t };
      this.ripples.push({ ring: ring, a: a, t0: this.t });
    }
    this.drawLinks();
  };
  Field.prototype.drawLinks = function () { if (reduce) this.draw(); };
  Field.prototype.emerge = function (n, seed) {
    if (!n) { this.route = null; if (reduce) this.draw(); return; }
    var r = rng(hash(seed || 'x') + .01), pts = [];
    for (var i = 0; i < n; i++) {
      var t = n === 1 ? .5 : i / (n - 1);
      var a = Math.PI * (1.15 - 1.3 * t) + (r() - .5) * .35, d = 40 + 105 * Math.abs(t - .5) * 2 + r() * 10;
      if (n === 1) d = 0;
      pts.push([C + d * Math.cos(a), C - d * Math.sin(a) * .8 + (t - .5) * 40]);
    }
    if (n === 1) pts[0] = [C, C + 62]; // one station: just below the walker, so both stay visible
    this.route = { pts: pts, t0: this.t };
    if (reduce) this.draw();
  };
  Field.prototype.reset = function () { this.dots = {}; this.route = null; this.ripples = []; if (reduce) this.draw(); };

  Field.prototype.anchor = function (d) { var R = RINGS[d.ring], rr = ringR(R, d.ring, d.a, this.t); return [C + rr * Math.cos(d.a), C + rr * Math.sin(d.a)]; };

  Field.prototype.paintBg = function (P, k) {
    var s = this.S * this.dpr, c = document.createElement('canvas'); c.width = c.height = s;
    var x = c.getContext('2d'), u = s / 400; x.scale(u, u);
    var D = DISC[k], g = x.createRadialGradient(C, C * .92, 10, C, C, 200);
    g.addColorStop(0, D[0]); g.addColorStop(.7, D[1]); g.addColorStop(1, D[2]);
    x.fillStyle = g; x.beginPath(); x.arc(C, C, 198, 0, TAU); x.fill();
    var r = rng(.77);
    if (P.dust) for (var i = 0; i < 260; i++) { var a = r() * TAU, d = Math.sqrt(r()) * 194; x.fillStyle = rgba(P.dust, P.glow ? .05 + r() * .22 : .04 + r() * .08); x.beginPath(); x.arc(C + d * Math.cos(a), C + d * Math.sin(a), r() * .7 + .15, 0, TAU); x.fill(); }
    x.strokeStyle = rgba(P.line, P.glow ? .16 : .22); x.lineWidth = .8; x.beginPath(); x.arc(C, C, 198, 0, TAU); x.stroke();
    this.bg = c; this.bgKey = k;
  };

  Field.prototype.step = function (dt) {
    var t = (this.t += dt), self = this;
    this.city.forEach(function (p) { p.a += p.sp * dt; var br = 1 + .012 * Math.sin(t * .8 + p.z); p.x = C + p.d * br * Math.cos(p.a); p.y = C + p.d * br * Math.sin(p.a); p.lit = Math.max(0, p.lit - dt * .5); });
    this.travellers.forEach(function (ts, k) { ts.forEach(function (q) { q.a += q.sp * dt * (k === self.focusRing ? 2.2 : 1); }); });
    // chaos: threads that appear between places and vanish
    if (Math.random() < dt * 6) {
      var i = (Math.random() * this.city.length) | 0, j = (Math.random() * this.city.length) | 0, A = this.city[i], B = this.city[j];
      if (i !== j && Math.hypot(A.x - B.x, A.y - B.y) < 70) this.flick.push({ a: i, b: j, life: .5 + Math.random() * 1.4 });
    }
    this.flick = this.flick.filter(function (f) { f.life -= dt; return f.life > 0; });
    // what the visitor brings gathers the city around it
    var anchors = Object.keys(this.dots).map(function (k) { return self.anchor(self.dots[k]); });
    if (this.pointer && t - this.pointer.at < 2) anchors.push([this.pointer.x, this.pointer.y]);
    this.city.forEach(function (p) { anchors.forEach(function (a) { var d = Math.hypot(p.x - a[0], p.y - a[1]); if (d < 62) p.lit = Math.min(1, p.lit + dt * 2 * (1 - d / 62)); }); });
    if (this.route) this.city.forEach(function (p) { self.route.pts.forEach(function (q) { if (Math.hypot(p.x - q[0], p.y - q[1]) < 40) p.lit = Math.min(1, p.lit + dt); }); });
  };

  Field.prototype.draw = function () {
    var k = key(), P = (root.EcoPAL || {})[k], x = this.ctx, S = this.S, dpr = this.dpr, t = this.t, dir = k.charAt(0), self = this;
    if (!P) return;
    if (reduce && !this._warm) { this._warm = 1; for (var w = 0; w < 40; w++) this.step(.05); this.flick = []; }
    if (!this.bg || this.bgKey !== k) this.paintBg(P, k);
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, S * dpr, S * dpr);
    var breath = 1 + .008 * Math.sin(t * .9), u = S * dpr / 400;
    x.drawImage(this.bg, 0, 0);
    x.setTransform(u * breath, 0, 0, u * breath, C * u * (1 - breath), C * u * (1 - breath));
    x.save(); x.beginPath(); x.arc(C, C, 197, 0, TAU); x.clip();

    // topography of the living map (B): contour rings that breathe around the centre
    if (P.cont) {
      for (var c = 0; c < 9; c++) {
        var R0 = 24 + c * 21;
        x.strokeStyle = rgba(P.cont, c % 3 === 2 ? .17 : .085); x.lineWidth = .7;
        x.beginPath();
        for (var i = 0; i <= 90; i++) { var a = i / 90 * TAU, rr = R0 * (1 + .07 * Math.sin(2 * a + c * .9 + t * .12) + .04 * Math.sin(5 * a - c + t * .2)); var px = C + rr * Math.cos(a), py = C + rr * Math.sin(a) * .96; if (i) x.lineTo(px, py); else x.moveTo(px, py); }
        x.stroke();
      }
    }
    // the core: a breathing light around the walker
    var core = x.createRadialGradient(C, C, 0, C, C, 86);
    var pulse = .55 + .25 * Math.sin(t * 1.1);
    core.addColorStop(0, rgba(P.gold, (P.glow ? .32 : .2) * pulse)); core.addColorStop(1, rgba(P.gold, 0));
    x.fillStyle = core; x.beginPath(); x.arc(C, C, 86, 0, TAU); x.fill();
    // ripples from the centre: what happens in the middle travels outward
    var per = 5.5, ph = (t % per) / per;
    if (!reduce) for (var q = 0; q < 2; q++) { var p2 = (ph + q * .5) % 1; x.strokeStyle = rgba(dir === 'b' ? P.line : P.gold, (1 - p2) * (P.glow ? .22 : .2)); x.lineWidth = .8; x.beginPath(); x.arc(C, C, 40 + p2 * 150, 0, TAU); x.stroke(); }

    // the city, far to near
    if (P.glow) x.globalCompositeOperation = 'lighter';
    this.city.forEach(function (p) {
      var bl = .5 + .5 * Math.sin(t * (.6 + p.b) + p.ph), al = (.12 + .35 * bl * p.b) * (.55 + p.z * .25) + p.lit * .6;
      var rad = (.45 + p.z * .35) * (1 + p.lit * .8);
      if (p.lit > .2) { var g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, 7 * (1 + p.lit)); g.addColorStop(0, rgba(P.gold, .35 * p.lit)); g.addColorStop(1, rgba(P.gold, 0)); x.fillStyle = g; x.beginPath(); x.arc(p.x, p.y, 7 * (1 + p.lit), 0, TAU); x.fill(); }
      x.fillStyle = rgba(p.lit > .3 ? P.gold : P.node, al);
      x.beginPath(); x.arc(p.x, p.y, rad, 0, TAU); x.fill();
    });
    x.globalCompositeOperation = 'source-over';
    // flickering threads
    x.lineWidth = .45;
    this.flick.forEach(function (f) { var A = self.city[f.a], B = self.city[f.b]; x.strokeStyle = rgba(P.line, Math.min(1, f.life) * .22); x.beginPath(); x.moveTo(A.x, A.y); x.lineTo(B.x, B.y); x.stroke(); });
    // constellations that form where attention gathers
    var lit = this.city.filter(function (p) { return p.lit > .35; });
    x.lineWidth = .6;
    for (var i2 = 0; i2 < lit.length; i2++) for (var j2 = i2 + 1; j2 < lit.length; j2++) {
      var A = lit[i2], B = lit[j2], d = Math.hypot(A.x - B.x, A.y - B.y);
      if (d < 46) { x.strokeStyle = rgba(dir === 'b' ? P.terra : P.line, Math.min(A.lit, B.lit) * .5); x.beginPath(); x.moveTo(A.x, A.y); x.lineTo(B.x, B.y); x.stroke(); }
    }

    // the orbital layers
    RINGS.forEach(function (R, kk) {
      var on = kk === self.focusRing;
      x.strokeStyle = on ? rgba(P.gold, P.glow ? .75 : .85) : rgba(kk % 2 ? P.teal : P.line, P.glow ? .2 + kk * .02 : .22);
      x.lineWidth = on ? 1.6 : .8;
      if (dir === 'b' && !on) x.setLineDash([1.5, 4]); else x.setLineDash([]);
      x.beginPath();
      for (var i3 = 0; i3 <= 140; i3++) { var a3 = i3 / 140 * TAU, rr3 = ringR(R, kk, a3, t); var px = C + rr3 * Math.cos(a3), py = C + rr3 * Math.sin(a3); if (i3) x.lineTo(px, py); else x.moveTo(px, py); }
      x.closePath(); x.stroke();
      x.setLineDash([]);
      // lights / walkers travelling along the orbit
      self.travellers[kk].forEach(function (q) {
        var rr4 = ringR(R, kk, q.a, t), px = C + rr4 * Math.cos(q.a), py = C + rr4 * Math.sin(q.a);
        if (dir === 'b' && !P.glow) {
          x.strokeStyle = rgba(on ? P.gold : P.node, on ? .95 : .55); x.lineWidth = 1.6; x.lineCap = 'round';
          var a5 = q.a + .035 * Math.sign(q.sp), rr5 = ringR(R, kk, a5, t);
          x.beginPath(); x.moveTo(px, py); x.lineTo(C + rr5 * Math.cos(a5), C + rr5 * Math.sin(a5)); x.stroke();
        } else {
          var g = x.createRadialGradient(px, py, 0, px, py, 6 * q.s);
          g.addColorStop(0, rgba(on ? P.gold : P.node, P.glow ? .85 : .6)); g.addColorStop(1, rgba(on ? P.gold : P.node, 0));
          x.fillStyle = g; x.beginPath(); x.arc(px, py, 6 * q.s, 0, TAU); x.fill();
        }
      });
    });
    x.setLineDash([]);

    // what you brought: anchored lights, each gathering its part of the city
    var ds = Object.keys(this.dots).map(function (kk) { return self.dots[kk]; });
    ds.sort(function (p, q) { return q.ring - p.ring || p.a - q.a; });
    var an = ds.map(function (d) { return self.anchor(d); });
    x.lineWidth = 1; x.strokeStyle = rgba(P.gold, P.glow ? .5 : .6);
    for (var m = 1; m < an.length; m++) {
      var p = an[m - 1], q2 = an[m], mx = (p[0] + q2[0]) / 2 + (C - (p[0] + q2[0]) / 2) * .3, my = (p[1] + q2[1]) / 2 + (C - (p[1] + q2[1]) / 2) * .3;
      x.beginPath(); x.moveTo(p[0], p[1]); x.quadraticCurveTo(mx, my, q2[0], q2[1]); x.stroke();
    }
    ds.forEach(function (d, i) {
      var p = an[i], age = Math.min(1, (t - d.born) / 1.2), pr = 1 + .15 * Math.sin(t * 2 + i);
      // tethers to the three nearest places
      var near = self.city.slice().sort(function (u, v) { return Math.hypot(u.x - p[0], u.y - p[1]) - Math.hypot(v.x - p[0], v.y - p[1]); }).slice(0, 3);
      x.strokeStyle = rgba(P.teal, .45 * age); x.lineWidth = .7;
      near.forEach(function (n) { x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(n.x, n.y); x.stroke(); });
      var g = x.createRadialGradient(p[0], p[1], 0, p[0], p[1], 14 * pr);
      g.addColorStop(0, rgba(P.gold, .9 * age)); g.addColorStop(1, rgba(P.gold, 0));
      x.fillStyle = g; x.beginPath(); x.arc(p[0], p[1], 14 * pr, 0, TAU); x.fill();
      x.fillStyle = rgba(P.glow ? [255, 248, 228] : P.gold, age); x.beginPath(); x.arc(p[0], p[1], 3.4, 0, TAU); x.fill();
      if (dir === 'b') { x.strokeStyle = rgba(P.line, .7 * age); x.lineWidth = 1; x.beginPath(); x.arc(p[0], p[1], 6.5, 0, TAU); x.stroke(); }
    });
    // a new answer ripples along its ring
    this.ripples = this.ripples.filter(function (rp) {
      var e = (t - rp.t0) / 1.8; if (e > 1) return false;
      var R = RINGS[rp.ring], span = e * Math.PI * .9;
      x.strokeStyle = rgba(P.gold, (1 - e) * .8); x.lineWidth = 2;
      x.beginPath();
      for (var s = -1; s <= 1; s += .05) { var a6 = rp.a + s * span, rr6 = ringR(R, rp.ring, a6, t), px = C + rr6 * Math.cos(a6), py = C + rr6 * Math.sin(a6); if (s === -1) x.moveTo(px, py); else x.lineTo(px, py); }
      x.stroke(); return true;
    });

    // the journey: a path drawn through the field, station by station
    if (this.route) {
      var pts = this.route.pts, prog = reduce ? 1 : Math.min(1, (t - this.route.t0) / 2.6);
      if (pts.length > 1) {
        var segs = [];
        for (var j3 = 1; j3 < pts.length; j3++) { var pA = pts[j3 - 1], pB = pts[j3]; segs.push([pA, [pA[0] + (pB[0] - pA[0]) * .2, pA[1] + 40], [pB[0] - (pB[0] - pA[0]) * .2, pB[1] - 40], pB]); }
        var total = segs.length * prog;
        x.strokeStyle = rgba(P.gold, .95); x.lineWidth = 2.2; x.lineCap = 'round';
        if (dir === 'b') x.setLineDash([2, 6]);
        if (P.glow) { x.shadowColor = rgba(P.gold, .8); x.shadowBlur = 10; }
        x.beginPath(); x.moveTo(pts[0][0], pts[0][1]);
        segs.forEach(function (sg, si) {
          var f = Math.max(0, Math.min(1, total - si)); if (f <= 0) return;
          for (var s2 = .05; s2 <= f + 1e-6; s2 += .05) { var u2 = 1 - s2; x.lineTo(u2 * u2 * u2 * sg[0][0] + 3 * u2 * u2 * s2 * sg[1][0] + 3 * u2 * s2 * s2 * sg[2][0] + s2 * s2 * s2 * sg[3][0], u2 * u2 * u2 * sg[0][1] + 3 * u2 * u2 * s2 * sg[1][1] + 3 * u2 * s2 * s2 * sg[2][1] + s2 * s2 * s2 * sg[3][1]); }
        });
        x.stroke(); x.setLineDash([]); x.shadowBlur = 0;
      }
      pts.forEach(function (p, i) {
        var on = pts.length === 1 ? prog : Math.max(0, Math.min(1, (pts.length - 1) * prog - i + 1));
        if (on <= 0) return;
        var g = x.createRadialGradient(p[0], p[1], 0, p[0], p[1], 18); g.addColorStop(0, rgba(P.gold, .55 * on)); g.addColorStop(1, rgba(P.gold, 0));
        x.fillStyle = g; x.beginPath(); x.arc(p[0], p[1], 18, 0, TAU); x.fill();
        x.fillStyle = rgba(P.glow ? [16, 26, 46] : [255, 251, 242], on); x.strokeStyle = rgba(P.gold, on); x.lineWidth = 1.6;
        x.beginPath(); x.arc(p[0], p[1], 7.5, 0, TAU); x.fill(); x.stroke();
        x.fillStyle = rgba(P.glow ? [255, 240, 205] : P.line, on); x.font = '600 9px Heebo'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText(String(i + 1), p[0], p[1] + .5);
      });
    }
    // the pointer: a lens of attention
    if (this.pointer && t - this.pointer.at < 2) {
      x.strokeStyle = rgba(P.line, .2 * (1 - (t - this.pointer.at) / 2)); x.setLineDash([2, 5]); x.lineWidth = .8;
      x.beginPath(); x.arc(this.pointer.x, this.pointer.y, 62, 0, TAU); x.stroke(); x.setLineDash([]);
    }
    x.restore();
  };

  Field.prototype.start = function () {
    if (reduce || this.running) return;
    this.running = true; var self = this, last = performance.now();
    function loop(now) {
      if (!self.visible || document.hidden) { self.running = false; return; }
      var dt = Math.min(.05, (now - last) / 1000); last = now;
      self.step(dt); self.draw(); requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  };

  root.EF_Field = Field;
  root.LivingCircle = Field;
})(window);
