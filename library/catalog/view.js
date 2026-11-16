/* The tool catalogs: one view for both collections (16.11.2026).
   The page says which collection it shows: <div data-catalog="toolbox|participatory">. All content comes from
   library/catalog/catalog.js, so a new record appears here with no change to this file.
   Each tool has its own address, #t-<id>; the older addresses #pr-<id> (practices) and #tl-<id> (participatory tools) open too. */
(function () {
  var C = window.EF_CATALOG, box = document.querySelector('[data-catalog]');
  if (!C || !box) return;
  var col = box.dataset.catalog, COL = C.COLLECTIONS[col];
  var st = { q: '', kind: 'all', cat: 'all', users: 'all' };
  var listEl = box.querySelector('.cv-list'), countEl = box.querySelector('.cv-n'), q = box.querySelector('.cv-q');
  var browse = box.querySelector('.cv-browse'), detailEl = box.querySelector('.cv-detail');
  var lastY = 0;

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function folder(c) { return C.COLLECTIONS[c].path.split('/')[1]; }
  function href(r) { return (r.collection === col ? '' : '../' + folder(r.collection) + '/') + '#t-' + r.id; }
  function who(r) {
    if (r.practice) return r.when || '';
    var u = r.users || [];
    return u.length === 2 ? 'לבד או בקבוצה' : u[0] === 'group' ? 'לקבוצה' : u[0] === 'solo' ? 'לבד' : '';
  }

  /* ---------- filters (built from the data: a category with no tool is not shown) ---------- */
  function chipRow(sel, key, items) {
    var row = box.querySelector(sel); if (!row) return;
    row.textContent = '';
    items.forEach(function (it) {
      var b = el('button', null, it.name); b.type = 'button'; b.dataset.v = it.id;
      b.setAttribute('aria-pressed', st[key] === it.id ? 'true' : 'false');
      b.addEventListener('click', function () { st[key] = it.id; sync(); render(); });
      row.appendChild(b);
    });
    row.hidden = items.length < 3;
  }
  var all = C.all(col);
  function present(field, list) { return list.filter(function (x) { return all.some(function (r) { return (r[field] || []).indexOf(x.id) > -1; }); }); }
  var kinds = col === 'toolbox'
    ? [{ id: 'all', name: 'הכול' }, { id: 'tools', name: 'כלים ומסגרות' }, { id: 'practice', name: 'תרגולים קצרים' }]
    : [{ id: 'all', name: 'הכול' }, { id: 'method', name: 'מתודולוגיות' }, { id: 'tool', name: 'כלים' }];
  var cats = [{ id: 'all', name: col === 'participatory' ? 'כל המטרות' : 'כל התחומים' }].concat(present('categories', C.CATEGORIES[col] || []));
  var users = [{ id: 'all', name: 'לבד ובקבוצה' }].concat(present('users', [{ id: 'solo', name: 'לבד' }, { id: 'group', name: 'בקבוצה' }]));
  function sync() {
    [['.cv-kinds', 'kind'], ['.cv-cats', 'cat'], ['.cv-users', 'users']].forEach(function (p) {
      [].forEach.call(box.querySelectorAll(p[0] + ' button'), function (b) { b.setAttribute('aria-pressed', b.dataset.v === st[p[1]] ? 'true' : 'false'); });
    });
  }
  chipRow('.cv-kinds', 'kind', kinds); chipRow('.cv-cats', 'cat', cats);
  if (col === 'toolbox') chipRow('.cv-users', 'users', users); else { var u = box.querySelector('.cv-users'); if (u) u.hidden = true; }

  /* ---------- cards ---------- */
  function card(r) {
    var li = el('li', 'cv' + (r.practice ? ' is-practice' : '') + (r.kind === 'framework' || r.kind === 'method' ? ' is-major' : ''));
    li.id = 'c-' + r.id;
    var a = el('a', 'cv-h'); a.href = '#t-' + r.id;
    var top = el('span', 'cv-k', C.KINDS[r.kind] || '');
    var w = who(r); if (w) top.appendChild(el('em', null, w));
    if (r.core) top.appendChild(el('em', 'cv-core', 'בלב העבודה'));
    a.appendChild(top);
    a.appendChild(el('b', null, r.name));
    if (r.subtitle || r.en) a.appendChild(el('small', r.subtitle ? null : 'ltr', r.subtitle || r.en));
    a.appendChild(el('span', 'cv-e', r.essence));
    if ((r.categories || []).length) {
      var ch = el('span', 'cv-cats-line');
      r.categories.slice(0, 3).forEach(function (c) { ch.appendChild(el('i', null, C.categoryName(col, c))); });
      a.appendChild(ch);
    }
    a.appendChild(el('span', 'cv-open', 'לכלי המלא'));
    li.appendChild(a);
    return li;
  }
  function render() {
    var res = C.search(col, { q: st.q, kind: st.kind, category: st.cat, users: st.users });
    listEl.textContent = '';
    res.forEach(function (r) { listEl.appendChild(card(r)); });
    if (!res.length) {
      var none = el('li', 'cv-none');
      none.appendChild(el('span', null, 'לא נמצא כלי שמתאים לחיפוש הזה. אפשר לנסות מילה אחרת, '));
      var other = col === 'toolbox' ? 'participatory' : 'toolbox';
      var x = el('a', null, 'לחפש ב' + C.COLLECTIONS[other].name); x.href = '../' + folder(other) + '/';
      none.appendChild(x);
      listEl.appendChild(none);
    }
    countEl.textContent = res.length + ' מתוך ' + all.length;
  }
  if (q) q.addEventListener('input', function () { st.q = q.value.trim(); render(); });

  /* ---------- the full tool ---------- */
  function sec(body, title, node, cls) {
    var s = el('section', 'cv-f' + (cls ? ' ' + cls : '')); if (title) s.appendChild(el('h3', null, title)); s.appendChild(node); body.appendChild(s); return s;
  }
  function items(arr, ordered) { var o = el(ordered ? 'ol' : 'ul'); arr.forEach(function (x) { o.appendChild(el('li', null, x)); }); return o; }
  function detail(r) {
    detailEl.textContent = '';
    var back = el('a', 'cv-back', 'לכל ' + (col === 'toolbox' ? 'ארגז הכלים' : 'הכלים ההשתתפותיים')); back.href = '#catalog';
    back.addEventListener('click', function (e) { e.preventDefault(); history.pushState(null, '', location.pathname + location.search); route(); });
    detailEl.appendChild(back);
    var head = el('header', 'cv-dh');
    head.appendChild(el('p', 'kick', (C.KINDS[r.kind] || '') + (who(r) ? ' · ' + who(r) : '')));
    var h = el('h2', null, r.name); h.id = 'cv-title'; h.tabIndex = -1; head.appendChild(h);
    if (r.subtitle) head.appendChild(el('p', 'cv-sub', r.subtitle));
    if (r.en) head.appendChild(el('p', 'cv-en ltr', r.en));
    head.appendChild(el('p', 'lead', r.essence));
    detailEl.appendChild(head);

    var body = el('div', 'cv-db');
    if (r.purpose) sec(body, 'המטרה המתודולוגית', el('p', null, r.purpose));
    var facts = el('dl', 'cv-facts');
    [['למי', who(r) && !r.practice ? who(r) : ''], ['מתי בשוטטות', r.practice ? r.when : ''], ['מרחב', r.place], ['משתתפים', r.size], ['זמן', r.time], ['חומרים', r.materials]]
      .forEach(function (x) { if (!x[1]) return; var d = el('div'); d.appendChild(el('dt', null, x[0])); d.appendChild(el('dd', null, x[1])); facts.appendChild(d); });
    if (facts.children.length) body.appendChild(facts);
    if ((r.contexts || []).length) sec(body, 'מתי להציע אותו', items(r.contexts));
    if ((r.intents || []).length || (r.categories || []).length) {
      var chips = el('p', 'cv-chips');
      (r.categories || []).forEach(function (c) { chips.appendChild(el('span', 'cv-chip', C.categoryName(r.collection, c))); });
      (r.intents || []).forEach(function (c) { chips.appendChild(el('span', 'cv-chip in', C.intentName(c))); });
      sec(body, r.collection === 'participatory' ? 'מטרות וכוונות' : 'תחומים וכוונות', chips);
    }
    if (r.parts) {
      var wrap = el('div');
      if (r.parts.note) wrap.appendChild(el('p', 'cv-note', r.parts.note));
      var ol = el('ol', 'cv-parts');
      r.parts.items.forEach(function (p) {
        var li = el('li');
        var t = el('div', 'cv-pt'); t.appendChild(el('b', null, p.name)); if (p.en) t.appendChild(el('small', 'ltr', p.en));
        li.appendChild(t);
        li.appendChild(el('p', 'cv-pq', p.q));
        if ((p.prompts || []).length) li.appendChild(items(p.prompts));
        ol.appendChild(li);
      });
      wrap.appendChild(ol);
      sec(body, r.parts.title, wrap, 'cv-partsec');
    }
    if (r.practice && r.essence) { /* the invitation is the lead; nothing more to add */ }
    if ((r.modes || []).length) {
      var dl = el('dl', 'cv-modes');
      r.modes.forEach(function (m) { var d = el('div'); d.appendChild(el('dt', null, m.name)); d.appendChild(el('dd', null, m.text)); dl.appendChild(d); });
      sec(body, 'אופני שימוש', dl);
    }
    if ((r.steps || []).length) sec(body, r.stepsTitle || 'איך עושים את זה', items(r.steps, true));
    if ((r.prompts || []).length) sec(body, 'שאלות והזמנות', items(r.prompts));
    if ((r.principles || []).length) sec(body, 'עקרונות', items(r.principles));
    if (r.hosting) sec(body, r.practice ? 'הערה למנחה' : 'להנחיה', el('p', null, r.hosting));
    if (r.harvest) sec(body, 'מה נשאר לקציר', el('p', null, r.harvest));
    if ((r.outcomes || []).length) sec(body, 'מה אפשר לצפות שיצמח', items(r.outcomes));
    if (r.discover) sec(body, 'מה הכלי יכול לעזור לגלות', el('p', null, r.discover));
    var rel = (r.related || []).map(C.find).filter(Boolean);
    var parents = C.all().filter(function (x) { return x.id !== r.id && (x.related || []).indexOf(r.id) > -1 && rel.indexOf(x) < 0; });
    function links(arr) {
      var p = el('p', 'cv-links');
      arr.forEach(function (x) { var a = el('a', 'cv-link', x.name); a.href = href(x); if (x.collection !== col) a.appendChild(el('small', null, ' · ' + C.COLLECTIONS[x.collection].name)); p.appendChild(a); });
      return p;
    }
    if (rel.length) sec(body, r.relTitle || 'כלים ותרגולים קשורים', links(rel));
    if (parents.length) sec(body, r.collection === 'participatory' ? 'חלק מ' : 'מופיע גם ב', links(parents));
    var src = [r.credit, r.src ? 'מקור: ' + r.src : ''].filter(Boolean).join(' · ');
    if (src) body.appendChild(el('p', 'cv-src', src));
    var go = el('p', 'cv-go');
    var j = el('a', 'more', 'לבנות מסע שוטטות שהכלי הזה יכול להשתלב בו'); j.href = '../../journey/';
    go.appendChild(j);
    body.appendChild(go);
    detailEl.appendChild(body);
  }

  /* ---------- the address decides what is shown ---------- */
  function route() {
    var m = /^#(t|pr|tl|c)-([^?&]+)/.exec(location.hash), r = m ? C.find(decodeURIComponent(m[2])) : null;
    if (r && r.collection !== col) { location.replace('../' + folder(r.collection) + '/#t-' + r.id); return; }
    if (r && m[1] !== 'c') {
      if (!browse.hidden) lastY = scrollY;
      browse.hidden = true; detailEl.hidden = false; detail(r);
      document.title = r.name + ' | ' + COL.name + ' | המשוטט';
      var t = document.getElementById('cv-title');
      box.scrollIntoView({ block: 'start' }); if (t) t.focus({ preventScroll: true });
    } else {
      var was = !detailEl.hidden;
      detailEl.hidden = true; browse.hidden = false; document.title = baseTitle;
      if (was) { scrollTo(0, lastY); }
    }
  }
  var baseTitle = document.title;
  addEventListener('hashchange', route);
  addEventListener('popstate', route);
  render();
  route();
})();
