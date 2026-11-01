/* The Wanderer page: a city that reveals itself, a route that draws as you read, a compass that sways. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- hero map ---------- */
  var map = document.getElementById('citymap');
  if (map) {
    var lit = document.getElementById('citylit');
    lit.appendChild(document.querySelector('#cityfaint .city').cloneNode(true));
    var route = document.getElementById('hroute');
    var fig = document.getElementById('hfig');
    var lampA = document.getElementById('lampA');
    var lampB = document.getElementById('lampB');
    var L = route.getTotalLength();
    var stopAt = L * 0.62; // the walker pauses near the middle of the city
    var place = function (len, r) {
      var p = route.getPointAtLength(len);
      fig.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + (p.y - 4).toFixed(1) + ')');
      lampA.setAttribute('cx', p.x.toFixed(1));
      lampA.setAttribute('cy', p.y.toFixed(1));
      if (r != null) lampA.setAttribute('r', r.toFixed(1));
    };
    var finalR = fine ? 170 : 260;
    if (reduce) {
      place(stopAt, finalR);
    } else {
      var t0 = null, dur = 14000;
      place(0, 40);
      var step = function (t) {
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / dur);
        var e = 1 - Math.pow(1 - k, 2);
        place(stopAt * e, 40 + (finalR - 40) * e);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
    if (fine) {
      var pt = map.createSVGPoint();
      map.addEventListener('pointermove', function (ev) {
        pt.x = ev.clientX; pt.y = ev.clientY;
        var m = map.getScreenCTM(); if (!m) return;
        var q = pt.matrixTransform(m.inverse());
        lampB.setAttribute('cx', q.x.toFixed(1));
        lampB.setAttribute('cy', q.y.toFixed(1));
        lampB.setAttribute('r', '120');
      });
      map.addEventListener('pointerleave', function () { lampB.setAttribute('r', '0'); });
    }
  }

  /* ---------- constellation route ---------- */
  var wrap = document.getElementById('route');
  if (wrap) {
    var svg = wrap.querySelector('.route-svg');
    var base = svg.querySelector('.r-base');
    var draw = svg.querySelector('.r-draw');
    var walker = wrap.querySelector('.route-fig');
    var dots = [].slice.call(wrap.querySelectorAll('.dot'));
    var total = 0;

    var build = function () {
      var r0 = wrap.getBoundingClientRect();
      var pts = dots.map(function (d) {
        var r = d.getBoundingClientRect();
        return { x: r.left - r0.left + r.width / 2, y: r.top - r0.top + r.height / 2 };
      });
      if (!pts.length) return;
      var narrow = window.innerWidth <= 900;
      var w = narrow ? 14 : 70;
      var d = 'M' + pts[0].x.toFixed(1) + ' ' + (pts[0].y - 40).toFixed(1) + ' L' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1);
      for (var i = 1; i < pts.length; i++) {
        var a = pts[i - 1], b = pts[i], dy = b.y - a.y, s = (i % 2 ? 1 : -1) * w;
        d += ' C' + (a.x + s).toFixed(1) + ' ' + (a.y + dy * 0.35).toFixed(1) + ' ' + (b.x - s).toFixed(1) + ' ' + (b.y - dy * 0.35).toFixed(1) + ' ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1);
      }
      base.setAttribute('d', d);
      draw.setAttribute('d', d);
      total = draw.getTotalLength();
      draw.style.strokeDasharray = total + ' ' + total;
      progress();
    };

    var progress = function () {
      if (!total) return;
      var r = wrap.getBoundingClientRect();
      var vh = window.innerHeight;
      var k = (vh * 0.55 - r.top) / r.height;
      k = Math.max(0, Math.min(1, k));
      if (reduce) k = 1;
      draw.style.strokeDashoffset = (total * (1 - k)).toFixed(1);
      var p = draw.getPointAtLength(total * k);
      walker.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px) translate(-50%,-92%)';
    };

    var sts = [].slice.call(wrap.querySelectorAll('.stn'));
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('seen'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -18% 0px' });
      sts.forEach(function (s) { io.observe(s); });
    } else {
      sts.forEach(function (s) { s.classList.add('seen'); });
    }

    var raf = 0;
    window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; progress(); }); }, { passive: true });
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    window.addEventListener('load', build);
    build();
  }

  /* ---------- compass ---------- */
  var needle = document.getElementById('needle');
  if (needle) {
    needle.classList.add('idle');
    var pairs = [].slice.call(document.querySelectorAll('.pairs li'));
    var set = function (li) {
      pairs.forEach(function (x) { x.classList.toggle('on', x === li); });
      if (li) { needle.classList.remove('idle'); needle.style.setProperty('--a', li.getAttribute('data-a') + 'deg'); }
      else { needle.style.removeProperty('--a'); needle.classList.add('idle'); }
    };
    pairs.forEach(function (li) {
      li.addEventListener('mouseenter', function () { set(li); });
      li.addEventListener('focus', function () { set(li); });
      li.addEventListener('click', function () { set(li); });
      li.addEventListener('mouseleave', function () { set(null); });
      li.addEventListener('blur', function () { set(null); });
    });
  }
})();
