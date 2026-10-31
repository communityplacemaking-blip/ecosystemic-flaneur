/* The living field: an organic circle that grows with the conversation.
   It only draws. Every answer becomes a point of light on its ring; the journey becomes an amber path.
   Same answers always draw the same shape (seeded by the text, not by chance). */
(function (root) {
  var NS = 'http://www.w3.org/2000/svg', C = 200;
  function el(n, a, p) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }
  function rng(seed) { var x = seed * 1e9 | 0 || 7; return function () { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 10000) / 10000; }; }
  function ringPath(R, k, ph) {
    var d = '';
    for (var i = 0; i <= 160; i++) {
      var t = i / 160 * Math.PI * 2;
      var r = R * (1 + .028 * Math.sin(3 * t + ph) + .018 * Math.sin(5 * t + ph * 1.7) + .01 * Math.sin(9 * t + k));
      d += (i ? 'L' : 'M') + (C + r * Math.cos(t)).toFixed(1) + ' ' + (C + r * Math.sin(t)).toFixed(1);
    }
    return d + 'Z';
  }
  var RINGS = [182, 150, 120, 92];

  function Field(svg) {
    this.svg = svg; this.dots = {};
    svg.setAttribute('viewBox', '0 0 400 400');
    var defs = el('defs', {}, svg);
    var g = el('radialGradient', { id: 'ef-core', cx: '50%', cy: '50%', r: '50%' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#060E1A' }, g);
    el('stop', { offset: '70%', 'stop-color': '#0B1A2E' }, g);
    el('stop', { offset: '100%', 'stop-color': '#0F2D4A' }, g);
    var gl = el('radialGradient', { id: 'ef-glow', cx: '50%', cy: '50%', r: '50%' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#E3A857', 'stop-opacity': '.9' }, gl);
    el('stop', { offset: '100%', 'stop-color': '#E3A857', 'stop-opacity': '0' }, gl);
    el('circle', { cx: C, cy: C, r: 198, fill: 'url(#ef-core)' }, svg);
    // a city at night: points and thin lines, drawn once
    var city = el('g', { 'class': 'ef-city' }, svg), r = rng(.4242), pts = [];
    for (var i = 0; i < 90; i++) {
      var a = r() * Math.PI * 2, d = 60 + Math.sqrt(r()) * 130;
      pts.push([C + d * Math.cos(a), C + d * Math.sin(a)]);
    }
    pts.forEach(function (p, i) {
      pts.forEach(function (q, j) {
        if (j <= i) return;
        var dx = p[0] - q[0], dy = p[1] - q[1];
        if (dx * dx + dy * dy < 900) el('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1] }, city);
      });
      el('circle', { cx: p[0], cy: p[1], r: (r() * 1.1 + .4).toFixed(2) }, city);
    });
    this.rings = el('g', { 'class': 'ef-rings' }, svg);
    var self = this;
    this.ringEls = RINGS.map(function (R, k) {
      var gg = el('g', { 'class': 'ef-ring r' + k }, self.rings);
      el('path', { d: ringPath(R, k, k * 1.3 + .5) }, gg);
      return gg;
    });
    this.links = el('g', { 'class': 'ef-links' }, svg);
    this.dotsG = el('g', { 'class': 'ef-dots' }, svg);
    this.route = el('g', { 'class': 'ef-route' }, svg);
    el('circle', { cx: C, cy: C, r: 70, 'class': 'ef-center' }, svg);
  }

  Field.prototype.focus = function (ring) {
    this.ringEls.forEach(function (g, k) { g.classList.toggle('on', k === ring); });
  };

  Field.prototype.set = function (key, ring, text) {
    var old = this.dots[key];
    if (old) { old.g.remove(); delete this.dots[key]; }
    if (!text) { this.drawLinks(); return; }
    var R = RINGS[ring], a = (hash(key + '|' + text) * 2 - 1) * Math.PI;
    var x = C + R * Math.cos(a), y = C + R * Math.sin(a);
    var g = el('g', { 'class': 'ef-dot' }, this.dotsG);
    el('circle', { cx: x, cy: y, r: 9, fill: 'url(#ef-glow)', 'class': 'halo' }, g);
    el('circle', { cx: x, cy: y, r: 3.2 }, g);
    this.dots[key] = { g: g, x: x, y: y, ring: ring, a: a };
    this.drawLinks();
  };

  Field.prototype.drawLinks = function () {
    while (this.links.firstChild) this.links.firstChild.remove();
    var ds = Object.keys(this.dots).map(function (k) { return this.dots[k]; }, this);
    ds.sort(function (p, q) { return q.ring - p.ring || p.a - q.a; });
    for (var i = 1; i < ds.length; i++) {
      var p = ds[i - 1], q = ds[i];
      var mx = (p.x + q.x) / 2 + (C - (p.x + q.x) / 2) * .25, my = (p.y + q.y) / 2 + (C - (p.y + q.y) / 2) * .25;
      el('path', { d: 'M' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + 'Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + q.x.toFixed(1) + ' ' + q.y.toFixed(1) }, this.links);
    }
  };

  // the journey emerges: a path of light through the centre, a station for each practice
  Field.prototype.emerge = function (n, seed) {
    while (this.route.firstChild) this.route.firstChild.remove();
    this.svg.classList.toggle('emerged', n > 0);
    if (!n) return;
    var r = rng(hash(seed || 'x') + .01), pts = [];
    for (var i = 0; i < n; i++) {
      var t = n === 1 ? .5 : i / (n - 1);
      var a = Math.PI * (1.15 - 1.3 * t) + (r() - .5) * .35, d = 40 + 105 * Math.abs(t - .5) * 2 + r() * 10;
      if (n === 1) d = 0;
      pts.push([C + d * Math.cos(a), C - d * Math.sin(a) * .8 + (t - .5) * 40]);
    }
    var dd = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var j = 1; j < pts.length; j++) {
      var p = pts[j - 1], q = pts[j];
      dd += 'C' + (p[0] + (q[0] - p[0]) * .2).toFixed(1) + ' ' + (p[1] + 40).toFixed(1) + ' ' + (q[0] - (q[0] - p[0]) * .2).toFixed(1) + ' ' + (q[1] - 40).toFixed(1) + ' ' + q[0].toFixed(1) + ' ' + q[1].toFixed(1);
    }
    if (n > 1) el('path', { d: dd, 'class': 'line' }, this.route);
    var self = this;
    pts.forEach(function (p, i) {
      el('circle', { cx: p[0], cy: p[1], r: 14, fill: 'url(#ef-glow)' }, self.route);
      el('circle', { cx: p[0], cy: p[1], r: 5.5, 'class': 'st' }, self.route);
      var t = el('text', { x: p[0], y: p[1] + 2.6, 'class': 'num' }, self.route); t.textContent = i + 1;
    });
  };

  Field.prototype.reset = function () {
    for (var k in this.dots) this.dots[k].g.remove();
    this.dots = {}; this.drawLinks(); this.emerge(0);
  };

  root.EF_Field = Field;
})(window);
