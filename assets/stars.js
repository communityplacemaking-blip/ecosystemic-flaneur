/* /academy/: the gold line travels between scattered stations, right to left, and opens each one (brief 13.11). */
(function () {
  'use strict';
  var root = document.getElementById('vc'); if (!root) return;
  var H = document.documentElement, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var NS = 'http://www.w3.org/2000/svg', segs = [];
  var lane = root.querySelector('.lane'), svg = root.querySelector('.trail'), end = root.querySelector('.sj-end');
  $$('.tog', root).forEach(function (b) {
    b.addEventListener('click', function () {
      var st = b.closest('.star'), o = !st.classList.contains('open');
      st.classList.toggle('open', o); b.setAttribute('aria-expanded', o ? 'true' : 'false'); b.textContent = o ? 'לקפל' : 'להמשיך לקרוא';
      setTimeout(layout, 650);
    });
  });
  function layout() {
    var L = lane.getBoundingClientRect(), W = L.width, Hh = lane.offsetHeight, mob = innerWidth < 760;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + Hh); svg.innerHTML = ''; segs = [];
    var stars = $$('.star', lane);
    var edgeR = W + (mob ? 4 : 40), edgeL = mob ? -4 : -40, amp = mob ? 40 : 110;
    function seg(d, a, b, target) {
      var p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); svg.appendChild(p);
      var len = p.getTotalLength(); p.style.strokeDasharray = len + ' ' + (len + 10); p.style.strokeDashoffset = len;
      var dot = document.createElementNS(NS, 'circle'); dot.setAttribute('r', mob ? 3.5 : 4.5); dot.style.opacity = 0; svg.appendChild(dot);
      segs.push({ p: p, len: len, dot: dot, y0: a, y1: b, target: target });
    }
    var prev = { x: W * 0.55, y: 0 };
    stars.forEach(function (st, i) {
      var q = st.getBoundingClientRect(), r = { l: q.left - L.left, r: q.right - L.left, t: q.top - L.top, b: q.bottom - L.top };
      var tx = Math.max(r.l + 30, Math.min(r.r - 40, r.r - (r.r - r.l) * 0.18)), ty = r.t + 2;
      st.style.setProperty('--cx', (tx - r.l) + 'px');
      var y0 = prev.y, gy = ty - y0, d = 'M' + prev.x + ' ' + y0, outY = y0 + gy * 0.28;
      d += ' C' + prev.x + ' ' + (y0 + gy * 0.12) + ' ' + edgeR + ' ' + (outY - gy * 0.12) + ' ' + edgeR + ' ' + outY;
      var mx = mob ? W * 0.45 : Math.min(W * 0.5, Math.max(W * 0.25, (tx + edgeL) / 2 + W * 0.15)), my = y0 + gy * 0.62;
      if (i % 2 === 1) {  // a loop on the way: the line hesitates, turns around itself, and goes on
        d += ' C' + edgeR + ' ' + (outY + gy * 0.2) + ' ' + (mx + amp) + ' ' + (my + amp * 0.15) + ' ' + mx + ' ' + my;
        d += ' C' + (mx - amp * 0.9) + ' ' + (my - amp * 0.05) + ' ' + (mx - amp * 0.55) + ' ' + (my - amp * 0.95) + ' ' + (mx + amp * 0.05) + ' ' + (my - amp * 0.7);
        d += ' C' + (mx + amp * 0.5) + ' ' + (my - amp * 0.5) + ' ' + (mx + amp * 0.1) + ' ' + (my + amp * 0.25) + ' ' + (mx - amp * 0.4) + ' ' + (my + amp * 0.3);
        d += ' C' + (edgeL + amp * 0.2) + ' ' + (my + amp * 0.4) + ' ' + (tx + amp * 0.1) + ' ' + (ty - gy * 0.1) + ' ' + tx + ' ' + ty;
      } else {  // a long sweep right to left that overshoots, then drops back onto the station
        d += ' C' + edgeR + ' ' + (outY + gy * 0.25) + ' ' + (edgeL + amp * 0.2) + ' ' + (my - gy * 0.05) + ' ' + (edgeL + amp * 0.6) + ' ' + (my + gy * 0.12);
        d += ' C' + (edgeL + amp * 1.1) + ' ' + (my + gy * 0.25) + ' ' + (tx + amp * 0.5) + ' ' + (ty - gy * 0.14) + ' ' + tx + ' ' + ty;
      }
      seg(d, y0, ty, st);
      prev = { x: Math.max(r.l + 40, Math.min(r.r - 40, (r.l + r.r) / 2 - (r.r - r.l) * 0.15)), y: r.b - 2 };
    });
    var endY = Hh, gy = endY - prev.y;  // the last journey runs to the invitation
    seg('M' + prev.x + ' ' + prev.y + ' C' + prev.x + ' ' + (prev.y + gy * 0.3) + ' ' + edgeR + ' ' + (prev.y + gy * 0.2) + ' ' + (W * 0.7) + ' ' + (prev.y + gy * 0.55) + ' S' + (W * 0.5) + ' ' + (endY - gy * 0.15) + ' ' + (W * 0.5) + ' ' + endY, prev.y, endY, end);
    tick();
  }
  function tick() {
    if (!segs.length) return;
    var eye = innerHeight * 0.72 - lane.getBoundingClientRect().top, ok = true;
    segs.forEach(function (s) {
      var f = Math.min(1, Math.max(0, (eye - s.y0) / Math.max(1, s.y1 - s.y0)));
      if (reduce) f = 1;
      if (!ok) f = 0;  // the line never skips ahead of a station it has not reached
      s.p.style.strokeDashoffset = s.len * (1 - f);
      var pt = s.p.getPointAtLength(s.len * f); s.dot.setAttribute('cx', pt.x); s.dot.setAttribute('cy', pt.y); s.dot.style.opacity = (f > 0 && f < 1) ? 1 : 0;
      if (f >= 0.999) { if (s.target && !s.target.classList.contains('lit')) { s.target.classList.add('lit'); var t = s.target; setTimeout(function () { t.classList.add('done'); }, 1300); } }
      else ok = false;
    });
  }
  var raf = 0, rt;
  addEventListener('scroll', function () { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; tick(); }); }, { passive: true });
  addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layout, 120); });
  if ('ResizeObserver' in window) new ResizeObserver(function () { clearTimeout(rt); rt = setTimeout(layout, 80); }).observe(lane);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  addEventListener('load', layout); layout();
  // a link straight to a station (e.g. #roots) opens the way up to it
  if (location.hash) setTimeout(function () { var t = document.getElementById(location.hash.slice(1)); if (t && lane.contains(t)) t.scrollIntoView({ block: 'center' }); tick(); }, 300);
})();
