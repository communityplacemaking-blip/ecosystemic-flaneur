/* The Ecosystemic Flâneur, adaptive mechanism prototype: the engine.
   Local and explainable. No network, no AI. Same answers always give the same journey.
   understand(answers)  -> what the engine understood, in the person's own words
   compose(profile, answers, ideas) -> a journey built from repository A, repository B and a template */
(function (root) {
  var K = root.EF_K || (typeof require !== 'undefined' ? require('./knowledge.js') : null);
  var E = {};

  var PREFIX = /^(וה|וב|ול|ומ|וש|שה|שב|של|מה|בה|לה|כש|ה|ו|ב|ל|מ|ש|כ)(?=[א-ת]{3,})/;
  function norm(w) {
    w = w.replace(/[֑-ׇ]/g, '').replace(/[^א-תa-z0-9]/gi, '');
    if (w.length > 3) w = w.replace(PREFIX, '');
    if (w.length > 4) w = w.replace(/(ים|ות)$/, '');
    return w;
  }
  var STOP = { 'אני': 1, 'אנחנו': 1, 'הוא': 1, 'היא': 1, 'זה': 1, 'זאת': 1, 'את': 1, 'של': 1, 'על': 1, 'עם': 1, 'גם': 1, 'כל': 1, 'מה': 1, 'איך': 1, 'יש': 1, 'אין': 1, 'לא': 1, 'כן': 1, 'או': 1, 'אם': 1, 'כי': 1, 'רק': 1, 'עוד': 1, 'שם': 1, 'פה': 1, 'כאן': 1, 'הרבה': 1, 'מאוד': 1, 'אבל': 1, 'אותו': 1, 'אותה': 1, 'להם': 1, 'לנו': 1, 'לי': 1, 'שלנו': 1, 'שלי': 1, 'היום': 1, 'דבר': 1, 'דברים': 1, 'משהו': 1, 'אפשר': 1, 'רוצה': 1, 'רוצים': 1, 'מקום': 1, 'ומה': 1, 'שלא': 1, 'וגם': 1, 'כמו': 1, 'אחר': 1, 'אחרת': 1, 'בין': 1, 'אצל': 1, 'אחד': 1, 'אחת': 1, 'לכל': 1, 'כך': 1, 'אלה': 1, 'אלו': 1, 'שלו': 1, 'שלה': 1, 'שלהם': 1, 'אותם': 1, 'אתם': 1, 'אתן': 1, 'הם': 1, 'הן': 1 };
  function words(text) {
    var out = [], seen = {};
    String(text || '').split(/[\s,.;:!?()"'״׳\-–\/]+/).forEach(function (raw) {
      if (!raw || STOP[raw]) return;
      var n = norm(raw);
      if (n.length < 3 || STOP[n] || seen[n]) return;
      seen[n] = 1; out.push({ raw: raw, n: n });
    });
    return out;
  }
  E.words = words;

  function recWords(r) { return words(r.name + ' ' + (r.invite || '')); }

  /* 1. Understanding: keep the person's words, propose themes they can remove. */
  E.understand = function (a) {
    var text = [a.place, a.magic, a.challenge, a.curiosity, a.people, a.forces, a.purpose].join(' ');
    var ws = words(text), set = {};
    ws.forEach(function (w) { set[w.n] = w.raw; });
    var themes = [];
    K.THEMES.forEach(function (t) {
      var hit = null;
      t.w.forEach(function (x) { var n = norm(x); if (!hit && set[n]) hit = set[n]; });
      if (hit) themes.push({ id: t.id, name: t.name, because: hit });
    });
    return { words: ws, themes: themes };
  };

  function themeWords(ids) {
    var out = [];
    K.THEMES.forEach(function (t) { if (ids.indexOf(t.id) > -1) t.w.forEach(function (x) { out.push(norm(x)); }); });
    return out;
  }

  /* 2. Candidates and score. Every point has a reason the person can read. */
  function placeOk(r, place) { return r.places === 'all' || !place || place === 'other' || (r.places || []).indexOf(place) > -1; }
  function score(r, ctx) {
    var s = 0, why = [];
    var rw = recWords(r), rset = {};
    rw.forEach(function (w) { rset[w.n] = w.raw; });
    var hits = [];
    ctx.words.forEach(function (w) { if (rset[w.n] && hits.indexOf(w.raw) < 0) hits.push(w.raw); });
    if (hits.length) { s += 3 * hits.length; why.push('המילים שלכם "' + hits.slice(0, 3).join('", "') + '" מופיעות גם בהזמנה של הרעיון'); }
    var th = [];
    ctx.themeWords.forEach(function (n) { if (rset[n] && hits.indexOf(rset[n]) < 0 && th.indexOf(rset[n]) < 0) th.push(rset[n]); });
    if (th.length) { s += Math.min(th.length, 2) * 1.5; why.push('בהזמנה מופיע "' + th[0] + '", קרוב לנושאים שאישרתם'); }
    if (ctx.place && ctx.place !== 'other' && r.places !== 'all' && (r.places || []).indexOf(ctx.place) > -1) { s += 2; why.push('מתאים במיוחד ל' + ctx.placeName); }
    if (r.doc === 'workshop') { s += 1; why.push('נוסה בסדנה'); }
    else if (r.doc === 'chapter') { s += 1; why.push('מתועד בפרק "איך משוטטים"'); }
    if (ctx.mode === 'group' && r.note) { s += 2; why.push('יש לו הערה למנחה'); }
    return { s: s, why: why };
  }

  function pick(role, ctx, used, budget, n) {
    var c = ctx.ideas.filter(function (r) {
      return r.kind === 'practice' && (r.slots || []).indexOf(role) > -1 && used.indexOf(r.id) < 0 &&
        placeOk(r, ctx.place) && (r.min || 0) <= budget;
    }).map(function (r, i) { var sc = score(r, ctx); return { r: r, s: sc.s, why: sc.why, i: i }; });
    c.sort(function (x, y) { return y.s - x.s || x.i - y.i; });
    return c.slice(0, n || 3);
  }

  var ROLE_NAME = { entry: 'פתיחה', move: 'יציאה לדרך', discern: 'הבחנה', trace: 'עקבה', 'return': 'חזרה' };
  E.ROLE_NAME = ROLE_NAME;

  /* Which stations each level composes (individual). Proposal, 31.10: depth changes, the method doesn't. */
  var SOLO_PLAN = {
    l1: ['move'],
    l2: ['entry', 'move', 'return'],
    l3: ['entry', 'move', 'discern', 'trace', 'return'],
    l4: ['entry', 'move', 'discern', 'trace', 'return']
  };
  E.SOLO_PLAN = SOLO_PLAN;

  function station(role, ctx, used, budget, level, extra) {
    var cands = pick(role, ctx, used, budget, level === 'l4' ? 3 : 3);
    if (!cands.length) return null;
    var main = cands[0];
    used.push(main.r.id);
    return Object.assign({ role: role, roleName: ROLE_NAME[role], rec: main.r, why: main.why,
      alts: cands.slice(1).map(function (c) { return { rec: c.r, why: c.why }; }),
      choose: level === 'l4' }, extra || {});
  }

  E.compose = function (p, a, ideas) {
    var level = p.level || 'l2', mode = p.mode || 'solo';
    var lv = K.LEVELS.filter(function (l) { return l.id === level; })[0];
    var place = a.placeType || '';
    var placeName = (K.PLACES.filter(function (x) { return x.id === place; })[0] || {}).name || '';
    var u = E.understand(a);
    var themes = (a.themes || u.themes.map(function (t) { return t.id; }));
    var ctx = { ideas: ideas, words: u.words, themeWords: themeWords(themes), place: place, placeName: placeName, mode: mode };
    var J = { level: lv, mode: mode, place: a.place || '', placeName: placeName, intention: a.curiosity || '',
      magic: a.magic || '', challenge: a.challenge || '', boundaries: a.boundaries || '', stations: [], meetings: [], notes: [] };

    if (mode === 'solo') {
      var total = Number(a.minutes) || 45, used = [], left = total;
      var plan = SOLO_PLAN[level];
      // the walk itself gets the larger share of the time
      var share = { entry: .15, move: .5, discern: .35, trace: .1, 'return': .25 };
      plan.forEach(function (role) {
        var cap = plan.length === 1 ? left : Math.max(5, Math.round(total * share[role]));
        var st = station(role, ctx, used, Math.min(cap, left), level);
        if (!st && role === 'move') st = station(role, ctx, used, left, level);
        if (st) { J.stations.push(st); left -= (st.rec.min || 5); }
      });
      if (level === 'l3' || level === 'l4') {
        J.lenses = ideas.filter(function (r) { return r.kind === 'lens'; });
      }
      J.minutes = J.stations.reduce(function (t, s) { return t + (s.rec.min || 5); }, 0);
      J.budget = total;
      J.template = 'adaptive-solo';
    } else {
      var n = Math.max(1, Math.min(4, Number(a.meetings) || 2));
      var len = Number(a.meetingMinutes) || 90;
      var usedG = [];
      var deep = level === 'l3' || level === 'l4';
      for (var m = 0; m < n; m++) {
        var roles = n === 1 ? ['entry', 'move', 'return'] :
          m === 0 ? ['entry', 'move'] : m === n - 1 ? ['discern', 'return'] : ['move', 'discern'];
        if (!deep) roles = [n === 1 || m === 0 ? 'move' : m === n - 1 ? 'return' : 'discern'];
        var ideasHere = [];
        roles.forEach(function (role) {
          var st = station(role, ctx, usedG, Math.round(len / 2), level);
          if (st) ideasHere.push(st);
        });
        J.meetings.push({ n: m + 1, minutes: len, ideas: ideasHere,
          tool: { purposes: (a.purposes || []).slice(), found: K.TOOLS.filter(function (t) {
            return (a.purposes || []).some(function (p) { return (t.purposes || []).indexOf(p) > -1; });
          }) },
          harvestAfter: m < n - 1 });
      }
      J.template = 'participatory-dialogue';
    }
    J.depthQ = lv.depthQ;
    J.celebration = K.CELEBRATION;
    return J;
  };

  root.EF_E = E;
  if (typeof module !== 'undefined') module.exports = E;
})(typeof window !== 'undefined' ? window : globalThis);
