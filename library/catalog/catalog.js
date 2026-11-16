/* The Ecosystemic Flâneur: the tool catalogs (16.11.2026).
   One record shape for every tool, two collections, one search and one recommender. Local only: no network, no AI.

   Where the content lives (the interface never holds content):
   - toolbox       ארגז הכלים של המשוטט = window.EF_TOOLKIT (library/catalog/toolbox-data.js)
                   + the short practices of repository A (window.IDEAS), shown as practices, read-only.
   - participatory כלים השתתפותיים     = window.TOOLS (library/tools-data.js), read through an adapter, nothing lost.

   A new tool is a new record in one of those files. Every field except id, name and essence is optional:
   a field that is not known (time, group size, materials, source) is simply left out and not shown.

   Record fields (all collections):
     id, collection, kind, name, subtitle?, en?, essence (short description), purpose? (methodological purpose),
     categories[] (ids from CATEGORIES[collection]), users[] ('solo' | 'group'), intents[] (ids from INTENTS),
     contexts[]? (when to offer it), size?, time?, materials?, parts? {title, note?, items[{name, en?, q, prompts[], w[]?}]},
     modes[]? [{name, text}], steps[]?, prompts[]?, outcomes[]?, principles[]?, hosting?, harvest?,
     related[]? (ids in any collection), tags[]?, keywords[]?, discover? (one line: what it can help discover), credit? */
(function (root) {
  var C = {};

  C.COLLECTIONS = {
    toolbox: { id: 'toolbox', name: 'ארגז הכלים של המשוטט', en: 'The Wanderer’s Toolbox', path: 'library/toolbox/',
      who: 'לבד או בקבוצה' },
    participatory: { id: 'participatory', name: 'כלים השתתפותיים', en: 'Participatory Tools', path: 'library/participatory/',
      who: 'לקבוצה' }
  };

  /* Categories. Toolbox: the families named in the 16.11 brief. Participatory: the author's six central purposes
     (the same PURPOSES as library/tools-data.js, kept in their order). Categories with no record yet are not shown. */
  C.CATEGORIES = {
    toolbox: [
      { id: 'observe', name: 'התבוננות ותפיסה' },
      { id: 'perspective', name: 'נקודות מבט' },
      { id: 'think', name: 'חשיבה ורפלקציה' },
      { id: 'place', name: 'חקירת מקומות' },
      { id: 'patterns', name: 'דפוסים וסיפורים נסתרים' },
      { id: 'inquiry', name: 'חקירה אישית ומשותפת' }
    ]
  };
  Object.defineProperty(C.CATEGORIES, 'participatory', { enumerable: true,
    get: function () { return (root.PURPOSES || []).map(function (p, i) { return { id: 'p' + i, name: p }; }); } });

  C.KINDS = {
    framework: 'מסגרת התבוננות', practice: 'תרגול קצר', lens: 'עדשה', method: 'מתודולוגיה', tool: 'כלי'
  };
  C.USERS = { solo: 'לבד', group: 'בקבוצה' };

  /* Intentions: what a person may be looking for. Each intention names, in a person's words, a need a tool can serve.
     The words are matched against what the person wrote in the journey, after the same light Hebrew normalization
     the engine uses. A tool is offered only when at least two of the person's own words point to its intentions. */
  C.INTENTS = [
    { id: 'notice', name: 'לשים לב למה שקורה', w: ['לשים', 'לראות', 'רואה', 'רואים', 'להתבונן', 'התבוננות', 'פרטים', 'פרט', 'מוכר', 'מוכרת', 'מוכרים', 'שגרה', 'שגרתי', 'רגיל', 'רגילה', 'קורה', 'קורים', 'מתעלם', 'מפספס', 'חושים', 'תשומת', 'להבחין', 'הבחנה', 'שקוף', 'שקופה'] },
    { id: 'perspective', name: 'לשנות נקודת מבט', w: ['נקודת', 'נקודות', 'זווית', 'זוויות', 'פרספקטיבה', 'מבט', 'מבטים', 'אחרת', 'מחדש', 'תקוע', 'תקועה', 'תקועים', 'להסתכל', 'מסתכל', 'מסתכלים'] },
    { id: 'interpret', name: 'לבחון הנחות ופרשנות', w: ['הנחות', 'הנחה', 'ציפיות', 'ציפייה', 'פרשנות', 'לפרש', 'דעות', 'מוקדמת', 'מוקדמות', 'רקע', 'תרבות', 'תרבותי', 'זיכרונות', 'השלכה', 'סטריאוטיפ', 'סטריאוטיפים'] },
    { id: 'hidden', name: 'לגלות את מה שנסתר', w: ['נסתר', 'נסתרת', 'נסתרים', 'נסתרות', 'סמוי', 'סמויים', 'מוסתר', 'חבוי', 'חבויים', 'נשכח', 'נשכחים', 'דפוס', 'דפוסים', 'מתחת', 'לגלות', 'לזהות'] },
    { id: 'complex', name: 'לבחון סוגיה מכמה כיוונים', w: ['אתגר', 'אתגרים', 'בעיה', 'בעיות', 'מורכב', 'מורכבת', 'מורכבות', 'סוגיה', 'סוגיות', 'קושי', 'קשיים', 'דילמה', 'לבחון', 'צדדים', 'כיוונים', 'סיכון', 'סיכונים', 'קונפליקט', 'מחלוקת'] },
    { id: 'create', name: 'להפוך גילוי לידע וליצירה', w: ['לתעד', 'תיעוד', 'לצלם', 'צילום', 'לצייר', 'ציור', 'לכתוב', 'כתיבה', 'מיפוי', 'למפות', 'ליצור', 'יצירה', 'השראה', 'סיפור', 'משמעות'] },
    { id: 'gather', name: 'לכנס אנשים סביב עניין משותף', w: ['תושבים', 'תושב', 'תושבות', 'שכנים', 'קהילה', 'קהילתי', 'קהילתית', 'לכנס', 'להפגיש', 'לחבר', 'ביחד', 'יחד', 'משותף', 'משותפת', 'משותפים', 'קבוצה', 'מפגש', 'שיתוף', 'השתתפות'] },
    { id: 'listen', name: 'להקשיב ולשוחח', w: ['הקשבה', 'להקשיב', 'מקשיבים', 'שיחה', 'שיחות', 'שיח', 'דיאלוג', 'קולות', 'להשמיע', 'נשמע', 'נשמעים'] },
    { id: 'assets', name: 'לזהות נכסים וצרכים', w: ['נכסים', 'נכס', 'משאבים', 'חוזקות', 'כוחות', 'צרכים', 'צורך', 'פוטנציאל', 'הזדמנויות', 'הזדמנות', 'אוצרות', 'לזהות'] },
    { id: 'initiative', name: 'לפתח רעיונות ויוזמות', w: ['יוזמה', 'יוזמות', 'רעיון', 'רעיונות', 'פרויקט', 'לפתח', 'פיתוח', 'לתכנן', 'תוכנית', 'חלום', 'חלומות', 'פעולה', 'להוביל'] },
    { id: 'decide', name: 'להחליט יחד', w: ['להחליט', 'החלטה', 'החלטות', 'הסכמה', 'להסכים', 'לבחור', 'עדיפויות', 'לתעדף'] },
    { id: 'learn', name: 'ללמוד זה מזה', w: ['ללמוד', 'למידה', 'ניסיון', 'עמיתים', 'ללמד', 'ידע'] }
  ];
  var INTENT = {}; C.INTENTS.forEach(function (x) { INTENT[x.id] = x; });

  /* ---------- light Hebrew normalization (the same rule as journey/engine.js) ---------- */
  var PREFIX = /^(וה|וב|ול|ומ|וש|שה|שב|של|מה|בה|לה|כש|ה|ו|ב|ל|מ|ש|כ)(?=[א-ת]{3,})/;
  function norm(w) {
    w = String(w).replace(/[֑-ׇ]/g, '').replace(/[^א-תa-z0-9]/gi, '').toLowerCase();
    if (w.length > 3) w = w.replace(PREFIX, '');
    if (w.length > 4) w = w.replace(/(ים|ות)$/, '');
    return w;
  }
  function tokens(text) {
    return String(text || '').split(/[\s,.;:!?()"'״׳\-–\/]+/).filter(Boolean).map(function (raw) { return { raw: raw, n: norm(raw) }; })
      .filter(function (t) { return t.n.length >= 3; });
  }
  C.norm = norm;
  /* Matching keeps the listed words as written, and tries the person's word with and without one or two
     leading particles (ה, ו, ב, ל, מ, ש, כ) and a plural ending, so "בשכונה המוכרת" meets "מוכרת". */
  function clean(w) { return String(w).replace(/[\u0591-\u05C7]/g, '').replace(/[^א-תa-z0-9]/gi, '').toLowerCase(); }
  function unplural(w) { return w.length > 4 ? w.replace(/(ים|ות)$/, '') : w; }
  var ONE = /^[הובלמשכ](?=[א-ת]{3,})/;
  function forms(w) {
    var c = clean(w), out = [c, unplural(c)], r = c;
    for (var k = 0; k < 2 && ONE.test(r); k++) { r = r.replace(ONE, ''); out.push(r, unplural(r)); }
    return out;
  }
  function listForms(list) { var o = []; list.forEach(function (w) { var c = clean(w); o.push(c, unplural(c)); }); return o; }
  var INTENT_N = {};
  C.INTENTS.forEach(function (x) { INTENT_N[x.id] = listForms(x.w); });
  function wordHits(ws, list) {   // which of the person's words meet a word list (same form, or a longer form of a 4+ letter word)
    var out = [];
    ws.forEach(function (t) {
      if (out.indexOf(t.raw) > -1) return;
      var f = t.f || (t.f = forms(t.raw));
      for (var i = 0; i < list.length; i++) {
        var w = list[i];
        for (var j = 0; j < f.length; j++) if (f[j] === w || (w.length >= 4 && f[j].length > w.length && f[j].indexOf(w) === 0)) { out.push(t.raw); return; }
      }
    });
    return out;
  }

  /* ---------- the records ---------- */
  function fromParticipatory(t) {
    return {
      id: t.id, collection: 'participatory', kind: t.kind, core: !!t.core, name: t.name, en: t.en, essence: t.essence,
      purpose: t.purpose, categories: (t.purposes || []).map(function (i) { return 'p' + i; }), users: t.users || ['group'],
      intents: t.intents || [], contexts: t.contexts, size: t.size, time: t.time, materials: t.materials,
      steps: t.steps, principles: t.principles, hosting: t.hosting, harvest: t.harvest, outcomes: t.outcomes,
      related: (t.contains || []).concat(t.related || []), tags: t.tags, keywords: t.keywords, discover: t.discover, credit: t.credit, from: t.from,
      stepsTitle: t.kind === 'method' ? 'המהלך' : 'איך עושים את זה', relTitle: t.kind === 'method' ? 'כלים שבתוכה' : 'קשור ל'
    };
  }
  var SLOT_WHEN = { entry: 'לפני השוטטות', move: 'במהלך השוטטות', discern: 'במהלך השוטטות', trace: 'אחרי', 'return': 'אחרי' };
  var PLACE = { all: 'כל מרחב', city: 'עיר ורחוב', neighborhood: 'שכונה', nature: 'טבע או גינה', institution: 'מוסד' };
  function fromIdea(r) {
    var when = (r.slots || []).map(function (s) { return SLOT_WHEN[s]; }).filter(function (v, i, a) { return v && a.indexOf(v) === i; });
    var pl = r.places === 'all' || !r.places ? null : r.places.map(function (p) { return PLACE[p] || p; }).join(' · ');
    return {
      id: r.id, collection: 'toolbox', kind: r.kind === 'lens' ? 'lens' : 'practice', practice: true, name: r.name.replace(/^עדשה: /, ''),
      essence: r.invite || '', categories: [], users: [], intents: [], when: when.join(' / '), place: pl,
      time: r.min ? 'כ־' + r.min + ' דקות' : null, hosting: r.note, credit: r.credit, src: r.src
    };
  }
  C.all = function (collection) {
    var out = [];
    if (!collection || collection === 'toolbox') {
      (root.EF_TOOLKIT || []).forEach(function (t) { out.push(Object.assign({ collection: 'toolbox' }, t)); });
      (root.IDEAS || []).forEach(function (r) { out.push(fromIdea(r)); });
    }
    if (!collection || collection === 'participatory') (root.TOOLS || []).forEach(function (t) { out.push(fromParticipatory(t)); });
    return out;
  };
  C.find = function (id) {
    var all = C.all();
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  };
  C.intentName = function (id) { return INTENT[id] ? INTENT[id].name : id; };
  C.categoryName = function (collection, id) {
    var c = (C.CATEGORIES[collection] || []).filter(function (x) { return x.id === id; })[0];
    return c ? c.name : id;
  };

  /* ---------- search: name, description, purpose, intention, context, keywords, parts ---------- */
  function hay(r) {
    var parts = r.parts ? r.parts.items.map(function (p) { return [p.name, p.en, p.q].concat(p.prompts || []).join(' '); }).join(' ') : '';
    return [r.name, r.subtitle, r.en, r.essence, r.purpose, r.discover, r.when, r.place, r.credit,
      (r.categories || []).map(function (c) { return C.categoryName(r.collection, c); }).join(' '),
      (r.intents || []).map(C.intentName).join(' '), (r.contexts || []).join(' '), (r.tags || []).join(' '),
      (r.keywords || []).join(' '), (r.outcomes || []).join(' '), parts].join(' ');
  }
  C.matches = function (r, q) {
    if (!q) return true;
    var h = hay(r).replace(/[֑-ׇ]/g, '').toLowerCase();
    var hn = ' ' + tokens(h).map(function (t) { return t.n; }).join(' ') + ' ';
    return String(q).toLowerCase().split(/\s+/).filter(Boolean).every(function (w) {
      w = w.replace(/[֑-ׇ]/g, '');
      if (h.indexOf(w) > -1) return true;
      var n = norm(w);
      return n.length >= 2 && hn.indexOf(' ' + n) > -1;
    });
  };
  C.search = function (collection, o) {
    o = o || {};
    return C.all(collection).filter(function (r) {
      if (o.kind && o.kind !== 'all' && !(o.kind === 'practice' ? r.practice : o.kind === 'tools' ? !r.practice : r.kind === o.kind)) return false;
      if (o.category && o.category !== 'all' && (r.categories || []).indexOf(o.category) < 0) return false;
      if (o.users && o.users !== 'all' && (r.users || []).indexOf(o.users) < 0) return false;
      return C.matches(r, o.q);
    });
  };

  /* ---------- recommend: from the person's own words, inside the journey ---------- */
  function focusParts(r, ws) {
    if (!r.parts) return [];
    return r.parts.items.filter(function (p) { return p.w && wordHits(ws, listForms(p.w)).length; }).map(function (p) { return p.name; });
  }
  function scoreTool(r, ws, purposes) {
    var seen = [], why = [];
    (r.intents || []).forEach(function (id) {
      var hits = wordHits(ws, INTENT_N[id] || []).filter(function (x) { return seen.indexOf(x) < 0; });
      if (!hits.length) return;
      seen = seen.concat(hits);
      why.push({ intent: id, name: INTENT[id].name, words: hits });
    });
    var pur = (purposes || []).filter(function (p) { return (r.categories || []).indexOf('p' + p) > -1; });
    return { r: r, s: seen.length + (pur.length ? 1 + pur.length * .5 : 0) + (r.core ? .1 : 0), words: seen.length, why: why, purposes: pur };
  }
  function present(x, ws) {
    var why = x.why.map(function (w) { return 'המילים שכתבתם, "' + w.words.slice(0, 3).join('", "') + '", מתחברות אל: ' + w.name + '.'; });
    if (x.purposes.length) why.push('מתאים למטרה שבחרתם: ' + x.purposes.map(function (p) { return (root.PURPOSES || [])[p]; }).filter(Boolean).join(', ') + '.');
    return { id: x.r.id, collection: x.r.collection, name: x.r.name, subtitle: x.r.subtitle, essence: x.r.essence,
      discover: x.r.discover || '', why: why, focus: focusParts(x.r, ws), href: C.COLLECTIONS[x.r.collection].path + '#t-' + x.r.id };
  }
  C.MIN_WORDS = 2;
  /* text: everything the person wrote. o.mode: 'solo' | 'group'. o.purposes: the purposes chosen for a group.
     Individual wandering: up to two tools from the toolbox. Participatory: one from the toolbox, two participatory.
     Nothing is offered when fewer than two of the person's words point to a tool: no tool is better than a forced one. */
  C.recommend = function (text, o) {
    o = o || {};
    var ws = tokens(text), group = o.mode === 'group';
    function ranked(col) {
      return C.all(col).filter(function (r) { return !r.practice && (r.users || []).indexOf(group ? 'group' : 'solo') > -1; })
        .map(function (r, i) { var x = scoreTool(r, ws, []); x.i = i; return x; })
        .filter(function (x) { return x.words >= C.MIN_WORDS; })
        .sort(function (a, b) { return b.s - a.s || a.i - b.i; });
    }
    var out = ranked('toolbox').slice(0, group ? 1 : 2);
    if (group) out = out.concat(ranked('participatory').slice(0, 2));
    return out.map(function (x) { return present(x, ws); });
  };
  /* The participatory tool for each meeting of a group journey: first by the purposes the facilitator chose,
     then by the facilitator's own words. With no purpose and no clear words, no tool is chosen. */
  C.forMeetings = function (text, purposes, n) {
    var ws = tokens(text);
    var list = C.all('participatory').map(function (r, i) { var x = scoreTool(r, ws, purposes); x.i = i; return x; })
      .filter(function (x) { return x.purposes.length || x.words >= C.MIN_WORDS; })
      .sort(function (a, b) { return b.s - a.s || a.i - b.i; });
    var out = [];
    for (var m = 0; m < n; m++) {
      var x = list[m];
      out.push(x ? [present(x, ws)].concat(list.slice(n + m * 2, n + m * 2 + 2).map(function (y) { return present(y, ws); })) : []);
    }
    return out;
  };

  root.EF_CATALOG = C;
  if (typeof module !== 'undefined') module.exports = C;
})(typeof window !== 'undefined' ? window : globalThis);
