/* Echoes of the five insights: choose an insight and its echoes light up around it.
   Relations between insights appear only once both have been opened. */
(function () {
  'use strict';
  var D = window.ECHO, K = window.ECHO_KIND, st = document.querySelector('.echo-stage'), panel = document.getElementById('ep');
  if (!D || !st || !panel) return;
  var ins = [].slice.call(st.querySelectorAll('.ins')), ech = [].slice.call(st.querySelectorAll('.ech')),
      rays = [].slice.call(st.querySelectorAll('.ray')), ties = [].slice.call(st.querySelectorAll('.tie')),
      notes = [].slice.call(document.querySelectorAll('.echo-map .tie-note')), opened = {};
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function render(i, j) {
    var d = D[i], h = '<p class="kick">' + esc(K.ours) + '</p><h3 class="ep-t">' + esc(d.title) + '</h3><p class="ep-ours">' + esc(d.text) + '</p><ol class="ep-list">';
    d.echoes.forEach(function (e, k) {
      h += '<li class="ep-e k-' + e.kind + (k === j ? ' hi' : '') + '" id="e-' + i + '-' + k + '"><span class="tag">' + esc(K[e.kind]) + '</span>' +
        '<b class="nm">' + esc(e.name) + '</b><span class="wk">' + esc(e.work) + ' · ' + esc(e.when) + '</span>' +
        (e.quote ? '<blockquote>' + esc(e.quote) + '</blockquote>' : '') + '<p>' + esc(e.text) + '</p>' +
        (e.wanderer ? '<a class="more" href="../the-wanderer/#constellation">גם אור בעמוד המשוטט</a>' : '') + '</li>';
    });
    panel.innerHTML = h + '</ol>';
    panel.classList.remove('in'); void panel.offsetWidth; panel.classList.add('in');
  }
  function open(i, j) {
    opened[i] = 1;
    ins.forEach(function (b) { var on = +b.dataset.i === i; b.setAttribute('aria-pressed', on ? 'true' : 'false'); if (opened[b.dataset.i]) b.classList.add('seen'); });
    ech.forEach(function (b) { var k = +b.dataset.i; b.classList.toggle('lit', k === i); b.classList.toggle('known', !!opened[k] && k !== i); b.classList.toggle('hi', k === i && +b.dataset.j === j); });
    rays.forEach(function (r) { var k = +r.dataset.i; r.classList.toggle('lit', k === i); r.classList.toggle('known', !!opened[k] && k !== i); });
    ties.forEach(function (t) { if (opened[t.dataset.a] && opened[t.dataset.b]) t.classList.add('on'); });
    notes.forEach(function (n) { if (opened[n.dataset.a] && opened[n.dataset.b] && n.hidden) { n.hidden = false; n.classList.add('fresh'); setTimeout(function () { n.classList.remove('fresh'); }, 2400); } });
    st.classList.add('started');
    render(i, j);
    if (j != null) { var el = document.getElementById('e-' + i + '-' + j); if (el && window.innerWidth < 900) el.scrollIntoView({ block: 'nearest' }); }
  }
  ins.forEach(function (b) { b.addEventListener('click', function () { open(+b.dataset.i); }); });
  ech.forEach(function (b) { b.addEventListener('click', function () { open(+b.dataset.i, +b.dataset.j); }); });
})();
