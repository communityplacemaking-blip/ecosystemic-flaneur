/* Library B: renders TOOLS (tools-data.js) as an open shelf, filtered by purpose, kind and search. */
(function () {
  var sec = document.getElementById('tools');
  if (!sec || !window.TOOLS) return;
  var list = sec.querySelector('.tool-list'), q = document.getElementById('tool-q'), n = document.getElementById('tool-n');
  var st = { p: 'all', k: 'all', s: '' };
  var KIND = { method: 'מתודולוגיה', tool: 'כלי' };
  var byId = {}; TOOLS.forEach(function (t) { byId[t.id] = t; });

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function block(body, label, node) { var d = el('div', 'tl-f'); d.appendChild(el('h4', null, label)); d.appendChild(node); body.appendChild(d); }
  function para(t) { return el('p', null, t); }
  function items(arr, ordered) { var o = el(ordered ? 'ol' : 'ul'); arr.forEach(function (x) { o.appendChild(el('li', null, x)); }); return o; }

  function open(li, on) {
    var b = li.querySelector('button.tl-h'), body = li.querySelector('.tl-body');
    body.hidden = !on; b.setAttribute('aria-expanded', on ? 'true' : 'false'); li.classList.toggle('open', on);
  }
  function jump(id) {
    if (st.p !== 'all' || st.k !== 'all' || st.s) { st = { p: 'all', k: 'all', s: '' }; if (q) q.value = ''; sync(); render(); }
    var li = document.getElementById('tl-' + id); if (!li) return;
    open(li, true); li.scrollIntoView({ behavior: 'smooth', block: 'start' }); li.querySelector('button.tl-h').focus({ preventScroll: true });
  }

  function card(t) {
    var li = el('li', 'tl' + (t.kind === 'method' ? ' is-method' : '')); li.id = 'tl-' + t.id;
    var b = el('button', 'tl-h'); b.type = 'button'; b.setAttribute('aria-expanded', 'false');
    var top = el('span', 'tl-k', KIND[t.kind]); if (t.core) top.appendChild(el('em', null, 'בלב העבודה'));
    b.appendChild(top);
    b.appendChild(el('b', null, t.name));
    b.appendChild(el('small', null, t.en));
    b.appendChild(el('span', 'tl-e', t.essence));
    li.appendChild(b);

    var body = el('div', 'tl-body'); body.hidden = true;
    var meta = el('p', 'tl-meta');
    t.purposes.forEach(function (i) { meta.appendChild(el('span', 'tl-chip', PURPOSES[i])); });
    body.appendChild(meta);
    var facts = el('dl', 'tl-facts');
    [['משתתפים', t.size], ['זמן', t.time]].forEach(function (r) { if (!r[1]) return; var d = el('div'); d.appendChild(el('dt', null, r[0])); d.appendChild(el('dd', null, r[1])); facts.appendChild(d); });
    body.appendChild(facts);
    block(body, t.kind === 'method' ? 'המהלך' : 'איך עושים את זה', items(t.steps, true));
    if (t.principles) block(body, 'עקרונות', items(t.principles, false));
    if (t.hosting) block(body, 'להנחיה', para(t.hosting));
    if (t.harvest) block(body, 'מה נשאר לקציר', para(t.harvest));
    var rel = (t.contains || []).filter(function (id) { return byId[id]; });
    var parents = TOOLS.filter(function (x) { return (x.contains || []).indexOf(t.id) >= 0; });
    function links(arr) { var p = el('p', 'tl-links'); arr.forEach(function (x) { var a = el('button', 'tl-link', x.name); a.type = 'button'; a.addEventListener('click', function () { jump(x.id); }); p.appendChild(a); }); return p; }
    if (rel.length) block(body, t.kind === 'method' ? 'כלים שבתוכה' : 'קשור ל', links(rel.map(function (id) { return byId[id]; })));
    if (parents.length) block(body, 'חלק מ', links(parents));
    body.appendChild(el('p', 'tl-src', t.credit));
    li.appendChild(body);
    b.addEventListener('click', function () { open(li, body.hidden); });
    return li;
  }

  function render() {
    list.innerHTML = '';
    var shown = 0;
    TOOLS.forEach(function (t) {
      if (st.k !== 'all' && t.kind !== st.k) return;
      if (st.p !== 'all' && t.purposes.indexOf(+st.p) < 0) return;
      if (st.s && (t.name + ' ' + t.en + ' ' + t.essence).toLowerCase().indexOf(st.s) < 0) return;
      shown++; list.appendChild(card(t));
    });
    if (!shown) list.appendChild(el('li', 'tl-none', 'אין כלי שמתאים לבחירה הזו.'));
    if (n) n.textContent = shown + ' מתוך ' + TOOLS.length;
  }
  function sync() {
    [].forEach.call(sec.querySelectorAll('[data-p]'), function (x) { x.setAttribute('aria-pressed', x.dataset.p === st.p ? 'true' : 'false'); });
    [].forEach.call(sec.querySelectorAll('[data-tk]'), function (x) { x.setAttribute('aria-pressed', x.dataset.tk === st.k ? 'true' : 'false'); });
  }
  [].forEach.call(sec.querySelectorAll('[data-p]'), function (b) { b.addEventListener('click', function () { st.p = b.dataset.p; sync(); render(); }); });
  [].forEach.call(sec.querySelectorAll('[data-tk]'), function (b) { b.addEventListener('click', function () { st.k = b.dataset.tk; sync(); render(); }); });
  if (q) q.addEventListener('input', function () { st.s = q.value.trim().toLowerCase(); render(); });
  render();
  if (/^#tl-/.test(location.hash)) jump(location.hash.slice(4));
})();
