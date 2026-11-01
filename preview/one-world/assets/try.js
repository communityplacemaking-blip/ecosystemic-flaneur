/* A ten-minute wandering: three steps, one card at a time. Nothing is stored or sent. */
(function () {
  var D = window.TRY, root = document.getElementById('try');
  if (!D || !root) return;
  var cards = root.querySelectorAll('.try-card'), dots = root.querySelectorAll('.try-steps li');
  var ex = document.getElementById('try-ex'), q = document.getElementById('try-q'), g = document.getElementById('try-g');
  var a = Math.floor(Math.random() * D.attn.length), step = 0;
  function attn() { ex.textContent = D.attn[a].text; }
  function show(n) {
    step = n;
    cards.forEach(function (c, i) { c.hidden = i !== n; });
    dots.forEach(function (d, i) { d.classList.toggle('on', i === n); d.classList.toggle('done', i < n); });
    var qq = q.value.trim(), qv = qq === 'כיצד' ? '' : qq;
    if (n === 2) { var e = document.getElementById('try-q-echo'); e.hidden = !qv; e.textContent = qv; }
    if (n === 3) {
      var sq = document.getElementById('sum-q'), sg = document.getElementById('sum-g');
      sq.hidden = !qv; sq.querySelector('dd').textContent = qv;
      sg.hidden = !g.value.trim(); sg.querySelector('dd').textContent = g.value.trim();
    }
    var h = cards[n].querySelector('h2'); h.setAttribute('tabindex', '-1');
    root.scrollIntoView({ behavior: 'smooth', block: 'start' }); h.focus({ preventScroll: true });
  }
  root.addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t) return;
    if (t.hasAttribute('data-next')) show(step + 1);
    else if (t.hasAttribute('data-back')) show(step - 1);
    else if (t.id === 'try-other') { a = (a + 1) % D.attn.length; attn(); }
    else if (t.id === 'try-again') { q.value = 'כיצד '; g.value = ''; a = (a + 1) % D.attn.length; attn(); show(0); }
  });
  attn();
})();
