/* One world, two ways of experiencing it: by day and by night.
   The choice is kept across pages; switching never reloads, so place and progress stay. */
(function () {
  'use strict';
  var H = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var I18N = window.EF_I18N || {};  /* the English and French home pages bring their own words */
  function T(w) { return I18N[w] || w; }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- day / night ---------- */
  function setSky(sky, silent) {
    H.setAttribute('data-sky', sky);
    H.setAttribute('data-theme', sky === 'day' ? 'light' : 'dark');
    if (!silent) store('ef-sky', sky);
    $$('.sky').forEach(function (b) {
      b.setAttribute('aria-pressed', sky === 'night' ? 'true' : 'false');
      var l = $('.sky-l', b); if (l) l.textContent = sky === 'day' ? T('לילה') : T('יום');
      b.setAttribute('aria-label', sky === 'day' ? T('לעבור לשוטטות בלילה') : T('לעבור לשוטטות ביום'));
    });
    if (!silent) document.dispatchEvent(new CustomEvent('worlds:sky', { detail: sky }));
  }
  var veil;
  function crossTo(sky) {
    if (reduce) { setSky(sky); return; }
    if (!veil) { veil = document.createElement('div'); veil.className = 'dusk'; veil.setAttribute('aria-hidden', 'true'); document.body.appendChild(veil); }
    veil.className = 'dusk ' + (sky === 'night' ? 'to-night' : 'to-day');
    void veil.offsetWidth;
    veil.classList.add('on');
    setTimeout(function () { setSky(sky); veil.classList.add('off'); }, 620);
    setTimeout(function () { veil.className = 'dusk'; }, 1500);
  }
  setSky(H.getAttribute('data-sky') || 'night', true);
  var fresh = !store('ef-sky');  /* a first-time visitor: the way to the day glows softly, a few times */
  $$('.sky').forEach(function (b) {
    if (fresh) { b.classList.add('beckon'); b.addEventListener('animationend', function () { b.classList.remove('beckon'); }); }
    b.addEventListener('click', function () { b.classList.remove('beckon'); crossTo(H.getAttribute('data-sky') === 'day' ? 'night' : 'day'); });
  });

  /* ---------- the threshold: choose the hour in which to enter ---------- */
  var th = $('.threshold');
  if (th) {
    var force = /[?&]enter=1/.test(location.search);
    if (force || !store('ef-sky-chosen')) {
      th.hidden = false; H.classList.add('at-threshold');
      var first = $('[data-enter="night"]', th) || $('button', th); if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 60);
    }
    function enter(sky) {
      store('ef-sky-chosen', '1');
      th.classList.add('go-' + sky);
      setSky(sky); store('ef-sky', sky);
      setTimeout(function () { th.hidden = true; H.classList.remove('at-threshold'); var h1 = $('h1'); if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); } }, reduce ? 0 : 900);
    }
    $$('[data-enter]', th).forEach(function (b) { b.addEventListener('click', function () { enter(b.getAttribute('data-enter')); }); });
    th.addEventListener('keydown', function (e) { if (e.key === 'Escape') enter(H.getAttribute('data-sky')); });
  }

  /* ---------- the territories: one map of the whole world ---------- */
  var map = $('.terr'), opener = null;
  function openMap(b) {
    if (!map) return; opener = b; map.hidden = false; H.classList.add('map-open');
    $$('.terr-btn').forEach(function (x) { x.setAttribute('aria-expanded', 'true'); });
    var cur = $('.t-node[aria-current]', map) || $('a', map); if (cur) cur.focus();
  }
  function closeMap() {
    if (!map || map.hidden) return; map.hidden = true; H.classList.remove('map-open');
    $$('.terr-btn').forEach(function (x) { x.setAttribute('aria-expanded', 'false'); });
    if (opener) opener.focus();
  }
  $$('.terr-btn').forEach(function (b) { b.addEventListener('click', function () { map && map.hidden ? openMap(b) : closeMap(); }); });
  if (map) {
    $$('.terr-close', map).forEach(function (b) { b.addEventListener('click', closeMap); });
    map.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMap();
      if (e.key === 'Tab') { var f = $$('a,button', map), i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
    });
    map.addEventListener('click', function (e) { if (e.target === map) closeMap(); });
  }

  /* ---------- the living fields ---------- */
  function fields() {
    $$('[data-field]').forEach(function (el) {
      if (el._f || !window.EcoField) return;
      var lab = el.getAttribute('data-labels'), an = el.getAttribute('data-anchor');
      el._f = new EcoField(el, {
        seed: el.getAttribute('data-field') || 'city',
        labels: lab ? lab.split('|') : [],
        density: parseFloat(el.getAttribute('data-density') || '1'),
        anchor: an ? an.split(',').map(Number) : null,
        listen: el.closest('[data-listen]') || el
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fields); else fields();

  /* ---------- sections light up as you walk through them ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: .08 });
    $$('.rv, .sec').forEach(function (el) { io.observe(el); });
    var sp = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var id = e.target.id; if (!id) return;
        var m = $('.spine a[href="#' + id + '"]'); if (m) m.classList.toggle('here', e.isIntersecting);
      });
    }, { rootMargin: '-40% 0px -50% 0px' });
    $$('.sec[id]').forEach(function (el) { sp.observe(el); });
  } else $$('.rv, .sec').forEach(function (el) { el.classList.add('in'); });

  /* ---------- tabs of small explorable models (movements, insights, lights) ---------- */
  $$('[data-pick]').forEach(function (group) {
    var bs = $$('button[data-k]', group), out = $(group.getAttribute('data-pick'));
    function pick(b) {
      bs.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      if (out) { out.querySelector('.pk-n').textContent = b.getAttribute('data-name') || b.textContent.trim(); out.querySelector('.pk-d').textContent = b.getAttribute('data-d') || ''; }
      group.setAttribute('data-on', b.getAttribute('data-k'));
    }
    bs.forEach(function (b) { b.addEventListener('click', function () { pick(b); }); });
    var on = bs.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0] || bs[0]; if (on) pick(on);
  });

  /* ---------- the journey between worlds (home) ---------- */
  var web = $('#web');
  if (web) {
    var svg = $('svg.links', web), NS = 'http://www.w3.org/2000/svg';
    var EDGES = [['eco', 'flaneur'], ['eco', 'thesis'], ['eco', 'jester'], ['eco', 'debono'], ['eco', 'aoh'], ['eco', 'theoryu'], ['eco', 'dragon'], ['eco', 'place'], ['eco', 'walks'],
      ['flaneur', 'thesis'], ['flaneur', 'jester'], ['flaneur', 'walks'], ['thesis', 'walks'], ['jester', 'debono'], ['debono', 'aoh'], ['aoh', 'theoryu'], ['theoryu', 'dragon'], ['aoh', 'dragon'], ['dragon', 'place'], ['place', 'walks'], ['place', 'aoh']];
    var nodes = {}; $$('.wn', web).forEach(function (b) { nodes[b.dataset.n] = b; });
    var paths = EDGES.map(function (e) { var p = document.createElementNS(NS, 'path'); p.dataset.a = e[0]; p.dataset.b = e[1]; svg.appendChild(p); return p; });
    var seen = {};
    function c(el) { var r = el.getBoundingClientRect(), w = web.getBoundingClientRect(); var d = $('.d', el) || el, q = d.getBoundingClientRect(); return { x: q.left + q.width / 2 - w.left, y: q.top + q.height / 2 - w.top }; }
    function draw() {
      var w = web.getBoundingClientRect(); svg.setAttribute('viewBox', '0 0 ' + w.width + ' ' + w.height);
      paths.forEach(function (p, i) { var a = c(nodes[p.dataset.a]), b = c(nodes[p.dataset.b]), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y, k = (i % 2 ? .2 : -.2);
        p.setAttribute('d', 'M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + ' Q' + (mx - dy * k).toFixed(1) + ' ' + (my + dx * k).toFixed(1) + ' ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1)); });
    }
    function ties(id) { var o = []; EDGES.forEach(function (e) { if (e[0] === id) o.push(e[1]); else if (e[1] === id) o.push(e[0]); }); return o; }
    function show(id, focus) {
      seen[id] = 1;
      $$('.wn', web).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.n === id ? 'true' : 'false'); b.classList.toggle('lnk', ties(id).indexOf(b.dataset.n) >= 0); b.classList.toggle('seen', !!seen[b.dataset.n]); });
      // relations walked once stay faintly visible: the visitor's own map of the journey
      paths.forEach(function (p) { var on = p.dataset.a === id || p.dataset.b === id; p.classList.toggle('on', on); if (seen[p.dataset.a] && seen[p.dataset.b]) p.classList.add('known'); });
      $$('.story').forEach(function (s) { s.classList.toggle('on', s.id === 's-' + id); });
      var st = document.getElementById('s-' + id), box = $('.ties', st);
      if (!box) { box = document.createElement('p'); box.className = 'ties'; st.appendChild(box); }
      box.innerHTML = '<span>' + T('מתחבר אל:') + '</span>';
      ties(id).forEach(function (x) { var b = document.createElement('button'); b.type = 'button'; b.textContent = $('b', nodes[x]).textContent; b.addEventListener('click', function () { show(x, true); }); box.appendChild(b); });
      var cnt = $('#web-count'); if (cnt) { var n = Object.keys(seen).length; cnt.textContent = n + T(' מתוך ') + Object.keys(nodes).length; }
      if (focus && innerWidth < 960) st.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
    }
    Object.keys(nodes).forEach(function (k) { nodes[k].addEventListener('click', function () { show(k, true); }); });
    draw(); show('flaneur', false);
    addEventListener('resize', draw); if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw); addEventListener('load', draw);
  }

  /* ---------- library: ideas as a field of places ---------- */
  var lib = $('#ideas');
  if (lib && window.IDEAS) {
    var KIND = { practice: 'תרגול', lens: 'עדשה' }, PL = { all: 'כל מרחב', city: 'עיר ורחוב', hood: 'שכונה', nature: 'טבע או גינה', inst: 'מוסד' };
    var list = $('.idea-list', lib), q = $('#idea-q'), f = 'all', s = '';
    function render() {
      list.innerHTML = '';
      var shown = 0;
      IDEAS.forEach(function (it, i) {
        var hay = (it.name + ' ' + (it.invite || '')).toLowerCase();
        if (f !== 'all' && it.kind !== f) return;
        if (s && hay.indexOf(s) < 0) return;
        shown++;
        var li = document.createElement('li'); li.className = 'idea'; li.id = 'pr-' + it.id; li.style.setProperty('--i', i);
        li.innerHTML = '<button type="button" aria-expanded="false"><span class="d" aria-hidden="true"></span><b></b><small></small></button><div class="idea-body" hidden><p class="inv"></p><p class="src"></p></div>';
        $('b', li).textContent = it.name;
        var ph = (it.slots || []).map(function (x) { return x === 'entry' ? 'לפני השוטטות' : (x === 'trace' || x === 'return') ? 'אחרי' : 'במהלך השוטטות'; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(' / ');
        $('small', li).textContent = (KIND[it.kind] || '') + (ph ? ' · ' + ph : '') + (it.min ? ' · ' + it.min + ' דק׳' : '');
        $('.inv', li).textContent = it.invite || '';
        $('.src', li).textContent = it.src ? 'מקור: ' + it.src : '';
        var btn = $('button', li), body = $('.idea-body', li);
        btn.addEventListener('click', function () { var o = body.hidden; body.hidden = !o; btn.setAttribute('aria-expanded', o ? 'true' : 'false'); li.classList.toggle('open', o); });
        list.appendChild(li);
      });
      var c = $('#idea-n'); if (c) c.textContent = shown + ' מתוך ' + IDEAS.length;
    }
    $$('[data-kind]', lib).forEach(function (b) { b.addEventListener('click', function () { f = b.dataset.kind; $$('[data-kind]', lib).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); render(); }); });
    if (q) q.addEventListener('input', function () { s = q.value.trim().toLowerCase(); render(); });
    render();
    // every practice has its own address, #pr-<id>: it opens there (word field suggestions, 12.11)
    var go = function () { if (!/^#pr-/.test(location.hash)) return; var li = document.getElementById(location.hash.slice(1)); if (!li) return;
      var b = $('button', li); if (b.getAttribute('aria-expanded') !== 'true') b.click(); li.scrollIntoView({ block: 'center' }); b.focus({ preventScroll: true }); };
    setTimeout(go, 0); addEventListener('hashchange', go);
  }
})();
