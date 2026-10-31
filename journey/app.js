/* The adaptive mechanism prototype: the conversation.
   One question at a time. Answers stay in this page's memory only: nothing is stored or sent. */
(function () {
  var K = window.EF_K, E = window.EF_E, IDEAS = window.IDEAS || [];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function byId(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }

  var S = {
    step: 'path', back: [], ret: null, path: null, level: null, mode: null, intro: 0,
    a: { place: '', placeType: '', magic: '', challenge: '', curiosity: '', minutes: 45, boundaries: '',
      people: '', groupSize: '', forces: '', purposes: [], purpose: '', done: '', meetings: 2, meetingMinutes: 90 },
    themes: null, journey: null, fruits: [], swaps: {}
  };

  var panel = $('#panel'), trail = $('#trail'), out = $('#out'), center = $('#f-center');
  var field = new window.EF_Field($('#field'));

  /* -------- the steps -------- */
  var SOLO = ['place', 'magic', 'challenge', 'curiosity', 'conditions'];
  var GROUP = ['place', 'magic', 'challenge', 'people', 'forces', 'purpose', 'done', 'gconditions'];
  function flow() {
    var f = ['path'];
    if (S.path === 'meet') f.push('intro');
    f.push('level', 'mode');
    f = f.concat(S.mode === 'group' ? GROUP : SOLO);
    f.push('reflect');
    return f;
  }
  var RING = { path: 0, intro: 0, level: 0, mode: 0, place: 1, magic: 1, challenge: 1, people: 1, forces: 1,
    curiosity: 2, purpose: 2, done: 2, conditions: 3, gconditions: 3, reflect: 3 };
  var SHORT = { path: 'מאיפה מתחילים', intro: 'להכיר את המשוטט', level: 'דרגת השוטטות', mode: 'אופן השוטטות',
    place: 'המקום', magic: 'הקסם', challenge: 'האתגר', curiosity: 'מה מושך', conditions: 'התנאים',
    people: 'האנשים', forces: 'הכוחות והקשרים', purpose: 'המטרה', done: 'מה כבר נעשה', gconditions: 'התנאים', reflect: 'מה הבנתי' };

  function guide(text) {
    // guidance adapts to the level: always for l1, on touch for l2, never in the way for l3–l4
    if (!text) return null;
    if (S.level === 'l1') return h('p', { 'class': 'q-help' }, [text]);
    if (S.level === 'l2') return h('details', { 'class': 'q-more' }, [h('summary', { text: 'דוגמה' }), h('p', { text: text })]);
    return null;
  }

  function ask(o) {
    // o: {q, sub, key, area, example, chips:[{v,t}], chipKey, multi, skip}
    var box = h('div', { 'class': 'q' });
    box.appendChild(h('p', { 'class': 'q-k', text: o.kicker || SHORT[S.step] }));
    box.appendChild(h('h2', { 'class': 'q-t', id: 'q-t', tabindex: '-1', text: o.q }));
    if (o.sub) box.appendChild(h('p', { 'class': 'q-sub', text: o.sub }));
    var g = guide(o.example); if (g) box.appendChild(g);
    if (o.chips) {
      var row = h('div', { 'class': 'chips', role: 'group', 'aria-label': o.q });
      o.chips.forEach(function (c) {
        var cur = S.a[o.chipKey];
        var on = o.multi ? cur.indexOf(c.v) > -1 : String(cur) === String(c.v);
        row.appendChild(h('button', { type: 'button', 'class': 'opt' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false',
          onclick: function () {
            if (o.multi) { var i = S.a[o.chipKey].indexOf(c.v); if (i > -1) S.a[o.chipKey].splice(i, 1); else S.a[o.chipKey].push(c.v); }
            else S.a[o.chipKey] = c.v;
            if (o.chipKey === 'placeType' || o.chipKey === 'minutes' || o.chipKey === 'meetings') field.set(o.chipKey, RING[S.step], String(c.v));
            render();
          } }, [c.t]));
      });
      box.appendChild(row);
    }
    if (o.chips2) box.appendChild(o.chips2);
    var input = null;
    if (o.key) {
      input = h(o.area ? 'textarea' : 'input', { id: 'ans', 'class': 'ans', rows: o.area ? 3 : null, type: o.area ? null : 'text',
        'aria-labelledby': 'q-t', placeholder: o.ph || 'במילים שלכם…', autocomplete: 'off' });
      input.value = S.a[o.key] || '';
      input.addEventListener('input', function () { S.a[o.key] = input.value; });
      if (!o.area) input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); next(); } });
      box.appendChild(input);
      if (o.key2) {
        var i2 = h('input', { 'class': 'ans small', type: 'text', placeholder: o.ph2, 'aria-label': o.ph2, autocomplete: 'off' });
        i2.value = S.a[o.key2] || ''; i2.addEventListener('input', function () { S.a[o.key2] = i2.value; });
        box.appendChild(i2);
      }
    }
    var nav = h('div', { 'class': 'q-nav' });
    nav.appendChild(h('button', { type: 'button', 'class': 'btn primary', onclick: next }, [S.ret ? 'חזרה לסיכום' : 'המשך']));
    if (o.skip !== false) nav.appendChild(h('button', { type: 'button', 'class': 'linkish', onclick: function () { if (o.key) S.a[o.key] = ''; next(); } }, ['עוד לא יודעים, לדלג']));
    box.appendChild(nav);
    return box;
  }

  var STEPS = {
    path: function () {
      var box = h('div', { 'class': 'q' }, [
        h('p', { 'class': 'q-k', text: 'מאיפה מתחילים' }),
        h('h2', { 'class': 'q-t', id: 'q-t', tabindex: '-1', text: 'מאיפה תרצו להתחיל?' }),
        h('p', { 'class': 'q-sub', text: 'אלה לא דרגות ולא מבחן. אפשר להחליף מסלול בכל רגע, בלי לאבד תשובות.' })
      ]);
      var list = h('div', { 'class': 'paths' });
      K.PATHS.forEach(function (p, i) {
        list.appendChild(h('button', { type: 'button', 'class': 'path p' + i + (S.path === p.id ? ' on' : ''), 'aria-pressed': S.path === p.id ? 'true' : 'false',
          onclick: function () {
            S.path = p.id; S.level = S.level || null; S.levelSuggested = p.level;
            field.set('path', 0, p.id);
            next();
          } }, [h('b', { text: p.label }), h('span', { text: p.say })]));
      });
      box.appendChild(list);
      return box;
    },
    intro: function () {
      var parts = [
        { k: '1 · מיהו המשוטט', t: 'להניח את המפה',
          body: [h('p', { text: 'אנחנו לא הולכים לאיבוד רק כדי לאבד את הדרך. אנחנו משחררים לזמן מה את הצורך לדעת, לשלוט ולתכנן הכול מראש, כדי לפגוש את מה שלא יכולנו לצפות.' }),
            h('p', { 'class': 'quiet', text: 'יוצאים מא׳ אל ב׳, ומה שמשמעותי הוא לעיתים ג׳. השוטטות יוצרת תנאים לגלות את ג׳. זו לא הבטחה, וזה גם לא ויתור על תכנון.' })],
          img: ['../img/getting-lost.jpg', 'הדמות ההולכת של ליאל על שביל מתפתל בעיר מצוירת'] },
        { k: '2 · היסודות', t: 'חלק מרשת חיה',
          body: [h('p', { text: 'אנחנו לא יחידים נפרדים בעולם של חפצים נפרדים ומשאבים בלי סוף. אנחנו חלק מרשת חיה של קשרים: תלויים בה, תורמים לה, ומושפעים מהתנאים שמקיימים אותה.' }),
            h('p', { 'class': 'quiet', text: 'בתמונת EGO האדם עומד בראש פירמידה. בתמונת ECO הוא חלק מרשת החיים: תלוי בה, ומשפיע עליה. השוטטות היא דרך לשהות לזמן מה בין כאוס לסדר, ולשים לב למה שמתחיל לצמוח.' })],
          img: ['../img/ego-eco.jpg', 'EGO: האדם בראש פירמידה. ECO: האדם אחד ממעגל של יצורים קשורים'] },
        { k: '3 · חמש התובנות', t: 'חמש תובנות לחיים',
          body: [h('ul', { 'class': 'ins' }, K.INSIGHTS.map(function (x) { return h('li', { 'class': x.mid ? 'mid' : '' }, [h('b', { text: x.n }), h('span', { text: x.d })]); })),
            h('p', { 'class': 'quiet small', text: 'אלה לא צווים. הם כיוונים לקשב, לשיקול דעת ולפעולה. במרכז, מידת האמצע.' })] }
      ];
      var p = parts[S.intro];
      var box = h('div', { 'class': 'q intro' }, [
        h('p', { 'class': 'q-k', text: 'להכיר את המשוטט · ' + p.k }),
        h('h2', { 'class': 'q-t', id: 'q-t', tabindex: '-1', text: p.t })
      ]);
      if (p.img) box.appendChild(h('img', { src: p.img[0], alt: p.img[1], 'class': 'intro-img', loading: 'lazy' }));
      p.body.forEach(function (b) { box.appendChild(b); });
      var dots = h('div', { 'class': 'intro-dots', 'aria-hidden': 'true' }, parts.map(function (_, i) { return h('i', { 'class': i === S.intro ? 'on' : '' }); }));
      var nav = h('div', { 'class': 'q-nav' });
      if (S.intro < 2) nav.appendChild(h('button', { type: 'button', 'class': 'btn primary', onclick: function () { S.intro++; render(); } }, ['הלאה']));
      else nav.appendChild(h('button', { type: 'button', 'class': 'btn primary', onclick: function () { S.introSeen = true; next(); } }, ['מוכנים? יוצאים למסע']));
      if (S.intro > 0) nav.appendChild(h('button', { type: 'button', 'class': 'linkish', onclick: function () { S.intro--; render(); } }, ['אחורה']));
      nav.appendChild(h('a', { 'class': 'linkish', href: '../flaneur/' }, ['לעמוד השיטה']));
      box.appendChild(dots); box.appendChild(nav);
      return box;
    },
    level: function () {
      var sug = S.levelSuggested || 'l2';
      var box = h('div', { 'class': 'q' }, [
        h('p', { 'class': 'q-k', text: 'דרגת השוטטות' }),
        h('h2', { 'class': 'q-t', id: 'q-t', tabindex: '-1', text: 'באיזו דרגה תרצו לשוטט היום?' }),
        h('p', { 'class': 'q-sub', text: 'הדרגה משנה את עומק המסע, לא את השיטה. היא בוחרת כמה תחנות יהיו, כמה הכוונה תקבלו ואילו שאלות ילוו אתכם. מי שמנוסה יכול לבחור היום דרגה פשוטה.' })
      ]);
      var list = h('div', { 'class': 'levels' });
      K.LEVELS.forEach(function (l, i) {
        var on = S.level === l.id;
        list.appendChild(h('button', { type: 'button', 'class': 'lvl' + (on ? ' on' : '') + (l.id === sug && !S.level ? ' sug' : ''), 'aria-pressed': on ? 'true' : 'false',
          onclick: function () { S.level = l.id; field.set('level', 0, l.id); next(); } }, [
          h('span', { 'class': 'lvl-rings', 'aria-hidden': 'true' }, [0, 1, 2, 3].map(function (k) { return h('i', { 'class': k <= i ? 'on' : '' }); })),
          h('b', { text: l.name }),
          l.id === sug ? h('em', { text: 'מוצע לפי המסלול' }) : null,
          h('dl', {}, [
            h('div', {}, [h('dt', { text: 'המסע' }), h('dd', { text: l.practice })]),
            h('div', {}, [h('dt', { text: 'הכוונה' }), h('dd', { text: l.guidance })]),
            h('div', {}, [h('dt', { text: 'השאלה' }), h('dd', { text: l.depthQ })])
          ])
        ]));
      });
      box.appendChild(list);
      return box;
    },
    mode: function () {
      var box = h('div', { 'class': 'q' }, [
        h('p', { 'class': 'q-k', text: 'אופן השוטטות' }),
        h('h2', { 'class': 'q-t', id: 'q-t', tabindex: '-1', text: 'איך המסע הזה ייראה?' }),
        h('p', { 'class': 'q-sub', text: 'האופן נבחר כאן, ברמת המסע. הוא לא נגזר ממי שאתם או מגודל הקבוצה.' })
      ]);
      var list = h('div', { 'class': 'modes2' });
      K.MODES.forEach(function (m) {
        var on = S.mode === m.id;
        list.appendChild(h('button', { type: 'button', 'class': 'mode-b m-' + m.id + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false',
          onclick: function () { S.mode = m.id; field.set('mode', 0, m.id); next(); } }, [
          h('b', { text: m.name }), h('span', { text: m.say }),
          m.id === 'group' ? h('small', { text: 'מי שמנחה מספר/ת על המקום ועל הקהילה. המידע נשאר בשליטתך: בדף הזה בלבד, בלי שמירה ובלי שליחה.' }) : h('small', { text: 'שום דבר ממה שתכתבו לא נשמר ולא נשלח.' })
        ]));
      });
      box.appendChild(list);
      return box;
    },
    place: function () {
      var g = S.mode === 'group';
      return ask({ q: g ? 'איזה מקום או קהילה התהליך יפגוש?' : 'איזה מקום או קהילה תרצו לפגוש?',
        kicker: g ? 'הכנה עם המנחה · המקום או הקהילה' : null,
        key: 'place', ph: 'למשל: השכונה שלי, הגינה ליד בית הספר, הרחוב הראשי',
        example: 'אפשר לכתוב שם של מקום, או משפט קצר עליו.',
        chips: K.PLACES.map(function (p) { return { v: p.id, t: p.name }; }), chipKey: 'placeType' });
    },
    magic: function () {
      return ask({ q: 'מה הקסם של המקום או הקהילה?', kicker: S.mode === 'group' ? 'הכנה עם המנחה · הסיפור והזהות' : 'סיפור המקום',
        sub: 'לפני שמחפשים בעיה או משימה, מכירים במקום כשלם.', key: 'magic', area: true,
        example: 'מה אתם אוהבים שם? מה מיוחד בו, גם אם זה קטן?' });
    },
    challenge: function () {
      return ask({ q: 'מה האתגר של המקום או הקהילה?', kicker: S.mode === 'group' ? 'הכנה עם המנחה · האתגרים והמתחים' : 'סיפור המקום',
        key: 'challenge', area: true, example: 'מה קשה שם, מה חסר, מה נמצא במתח?' });
    },
    curiosity: function () {
      return ask({ q: 'מה מושך את תשומת הלב שלכם שם, ומה תרצו לגלות?', kicker: 'הכוונה',
        sub: 'התשובה הזו תהיה הכוונה של המסע, במילים שלכם.', key: 'curiosity', area: true,
        example: 'למשל: סיפורים של אנשים, מה משתנה ברחוב, איפה יש חיים שלא שמתי לב אליהם.' });
    },
    conditions: function () {
      return ask({ q: 'כמה זמן יש, ומה חשוב לשמור?', kicker: 'התנאים',
        chips: [{ v: 20, t: 'כ-20 דקות' }, { v: 45, t: 'כ-45 דקות' }, { v: 90, t: 'שעה וחצי' }, { v: 150, t: 'יותר משעתיים' }], chipKey: 'minutes',
        key: 'boundaries', ph: 'גבול שחשוב לשמור, אם יש (למשל: לא מצלמים אנשים בלי רשות)',
        example: 'גבולות הם חלק מהערך. המשוטט יציג אותם בכרטיס המסע.' });
    },
    people: function () {
      return ask({ q: 'מי האנשים והקבוצות שישתתפו?', kicker: 'הכנה עם המנחה · האנשים והקבוצות', key: 'people', area: true,
        chips: [{ v: 'small', t: 'עד 10' }, { v: 'mid', t: '10 עד 25' }, { v: 'large', t: 'יותר מ-25' }], chipKey: 'groupSize',
        example: 'מי הם, מה מחבר ביניהם, ומי עוד לא בחדר.' });
    },
    forces: function () {
      return ask({ q: 'אילו כוחות וקשרים כבר פועלים שם?', kicker: 'הכנה עם המנחה · הכוחות והקשרים', key: 'forces', area: true,
        example: 'ארגונים, יוזמות, אנשי מפתח, קשרים בין קבוצות.' });
    },
    purpose: function () {
      return ask({ q: 'מה המטרה של התהליך?', kicker: 'הכנה עם המנחה · המטרה', key: 'purpose', area: true,
        sub: 'אפשר לסמן גם מטרות מרכזיות. לפיהן ייבחרו בהמשך כלים ממאגר הכלים המשתתפים.',
        chips: K.PURPOSES.map(function (p, i) { return { v: i, t: p }; }), chipKey: 'purposes', multi: true });
    },
    done: function () {
      return ask({ q: 'מה כבר נעשה עד עכשיו?', kicker: 'הכנה עם המנחה · העבודה שכבר נעשתה', key: 'done', area: true,
        example: 'מפגשים קודמים, מיפוי, תוכניות, מה למדתם.' });
    },
    gconditions: function () {
      var row = h('div', { 'class': 'chips', role: 'group', 'aria-label': 'אורך מפגש' });
      [60, 90, 120, 180].forEach(function (v) {
        var on = Number(S.a.meetingMinutes) === v;
        row.appendChild(h('button', { type: 'button', 'class': 'opt' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false',
          onclick: function () { S.a.meetingMinutes = v; render(); } }, [v === 60 ? 'שעה' : v === 90 ? 'שעה וחצי' : v === 120 ? 'שעתיים' : 'שלוש שעות']));
      });
      return ask({ q: 'כמה מפגשים, ומה חשוב לשמור?', kicker: 'התנאים',
        chips: [1, 2, 3, 4].map(function (n) { return { v: n, t: n === 1 ? 'מפגש אחד' : n + ' מפגשים' }; }), chipKey: 'meetings',
        chips2: h('div', { 'class': 'sub-chips' }, [h('span', { 'class': 'quiet small', text: 'אורך כל מפגש:' }), row]),
        key: 'boundaries', ph: 'גבול שחשוב לשמור, אם יש', skip: false });
    },
    reflect: function () { return reflect(); }
  };

  /* -------- reflect: the mechanism listens and says what it understood -------- */
  function reflect() {
    var u = E.understand(S.a);
    if (!S.themes) S.themes = u.themes.map(function (t) { return t.id; });
    var box = h('div', { 'class': 'q reflect' }, [
      h('p', { 'class': 'q-k', text: 'מה הבנתי' }),
      h('h2', { 'class': 'q-t', id: 'q-t', tabindex: '-1', text: 'הנה מה ששמעתי. נכון?' }),
      h('p', { 'class': 'q-sub', text: 'אפשר לתקן כל דבר, להוסיף או להוריד נושא. המשוטט לא מוסיף ידע על המקום משלו.' })
    ]);
    var lv = byId(K.LEVELS, S.level), md = byId(K.MODES, S.mode), pt = byId(K.PLACES, S.a.placeType);
    var rows = [
      ['דרגה', lv && lv.name, 'level'], ['אופן', md && md.name, 'mode'],
      ['המקום', [S.a.place, pt && pt.name].filter(Boolean).join(' · '), 'place'],
      ['הקסם', S.a.magic, 'magic'], ['האתגר', S.a.challenge, 'challenge']
    ];
    if (S.mode === 'group') {
      rows.push(['האנשים', S.a.people, 'people'], ['הכוחות והקשרים', S.a.forces, 'forces'],
        ['המטרה', [S.a.purpose].concat(S.a.purposes.map(function (i) { return K.PURPOSES[i]; })).filter(Boolean).join(' · '), 'purpose'],
        ['מה כבר נעשה', S.a.done, 'done'],
        ['תנאים', S.a.meetings + ' מפגשים, ' + S.a.meetingMinutes + ' דקות כל אחד' + (S.a.boundaries ? ' · גבול: ' + S.a.boundaries : ''), 'gconditions']);
    } else {
      rows.push(['הכוונה', S.a.curiosity, 'curiosity'],
        ['תנאים', 'כ-' + S.a.minutes + ' דקות' + (S.a.boundaries ? ' · גבול: ' + S.a.boundaries : ''), 'conditions']);
    }
    var dl = h('dl', { 'class': 'heard' });
    rows.forEach(function (r) {
      dl.appendChild(h('div', {}, [h('dt', { text: r[0] }), h('dd', {}, [r[1] ? h('q', { text: r[1] }) : h('span', { 'class': 'quiet', text: 'לא נאמר' })]),
        h('button', { type: 'button', 'class': 'linkish', onclick: function () { S.ret = 'reflect'; go(r[2]); } }, ['לתקן'])]));
    });
    box.appendChild(dl);
    var th = h('div', { 'class': 'themes' }, [h('p', { 'class': 'small', text: 'נושאים שזיהיתי במילים שלכם:' })]);
    var row = h('div', { 'class': 'chips' });
    K.THEMES.forEach(function (t) {
      var on = S.themes.indexOf(t.id) > -1, f = u.themes.filter(function (x) { return x.id === t.id; })[0];
      row.appendChild(h('button', { type: 'button', 'class': 'opt theme' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false',
        title: f ? 'בגלל המילה "' + f.because + '"' : 'להוסיף',
        onclick: function () { var i = S.themes.indexOf(t.id); if (i > -1) S.themes.splice(i, 1); else S.themes.push(t.id); render(); } },
        [t.name, f && on ? h('small', { text: ' · "' + f.because + '"' }) : null]));
    });
    th.appendChild(row);
    box.appendChild(th);
    box.appendChild(h('div', { 'class': 'q-nav' }, [
      h('button', { type: 'button', 'class': 'btn primary', onclick: build }, ['זה נכון. בנו את המסע']),
      h('button', { type: 'button', 'class': 'linkish', onclick: back }, ['אחורה'])
    ]));
    return box;
  }

  /* -------- build: compose and show the journey -------- */
  function build() {
    S.a.themes = S.themes.slice();
    S.journey = E.compose({ level: S.level, mode: S.mode }, S.a, IDEAS);
    S.swaps = {};
    S.step = 'journey';
    var n = S.mode === 'group' ? S.journey.meetings.length : S.journey.stations.length;
    field.emerge(n, JSON.stringify(S.a));
    render();
    out.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  function stationCard(st, idx, key) {
    var sw = S.swaps[key];
    var cur = sw != null ? (sw === -1 ? { rec: st.rec, why: st.why } : st.alts[sw]) : { rec: st.rec, why: st.why };
    var r = cur.rec, lv = S.level;
    var card = h('article', { 'class': 'stn' }, [
      h('div', { 'class': 'stn-h' }, [h('span', { 'class': 'stn-n', text: idx }), h('span', { 'class': 'stn-role', text: st.roleName }),
        h('span', { 'class': 'stn-min', text: r.min ? 'כ-' + r.min + ' דקות' : '' })]),
      h('h4', { text: r.name }),
      h('p', { 'class': 'inv', text: r.invite || '' })
    ]);
    if (r.note && (S.mode === 'group' || lv === 'l1')) card.appendChild(h('p', { 'class': 'note' }, [h('b', { text: S.mode === 'group' ? 'למנחה: ' : 'טיפ: ' }), r.note]));
    if (r.border && S.mode === 'group') card.appendChild(h('p', { 'class': 'small' }, [h('span', { 'class': 'verify', text: 'שיוך למאגר בבדיקה' })]));
    var why = h('details', { 'class': 'why' }, [h('summary', { text: 'למה כאן?' }),
      h('ul', {}, (cur.why.length ? cur.why : ['מתאים לזמן ולמקום שתיארתם']).map(function (w) { return h('li', { text: w }); })),
      h('p', { 'class': 'src', text: 'מקור: ' + (r.src || 'לא צוין') + ' · סוג המקור עוד לא הוכרע' })]);
    card.appendChild(why);
    if (st.alts.length) {
      var all = [{ rec: st.rec }].concat(st.alts);
      if (st.choose) {
        var row = h('div', { 'class': 'chips alt', role: 'group', 'aria-label': 'לבחור תרגול לתחנה' }, [h('span', { 'class': 'small quiet', text: 'מרכיבים בדרך, בחרו:' })]);
        all.forEach(function (x, i) {
          var on = (sw == null ? 0 : sw === -1 ? 0 : sw + 1) === i;
          row.appendChild(h('button', { type: 'button', 'class': 'opt' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false',
            onclick: function () { S.swaps[key] = i === 0 ? -1 : i - 1; renderJourney(); } }, [x.rec.name]));
        });
        card.appendChild(row);
      } else {
        card.appendChild(h('button', { type: 'button', 'class': 'linkish swap', onclick: function () {
          var s = S.swaps[key]; s = s == null || s === -1 ? 0 : s + 1; if (s >= st.alts.length) s = -1; S.swaps[key] = s; renderJourney();
        } }, ['להחליף ברעיון אחר']));
      }
    }
    return card;
  }

  function band() {
    var g = S.mode === 'group';
    return h('div', { 'class': 'band7' }, [
      h('ol', {}, K.MOVES.map(function (m, i) {
        var ex = g ? K.MOVES_GROUP[i] : null;
        return h('li', { 'class': i === 6 ? 'cel' : '' }, [h('b', { text: m }), g ? h('span', { 'class': ex ? '' : 'tbd', text: ex || 'טרם נוסח' }) : null]);
      })),
      h('p', { 'class': 'small quiet', text: 'שבע התנועות הן השדרה של כל מסע. הן חוצות אותו כולו, ואינן ממופות אחת לאחת לתחנות' + (g ? ' או למפגשים.' : '.') })
    ]);
  }

  function renderJourney() {
    var J = S.journey; out.innerHTML = ''; out.hidden = false;
    var lv = J.level, g = J.mode === 'group';
    var head = h('header', { 'class': 'j-head' }, [
      h('p', { 'class': 'kicker', text: (g ? 'שוטטות בדיאלוג משתתף' : 'מסע שוטטות אישי') + ' · אב-טיפוס' }),
      h('h2', { id: 'j-t', tabindex: '-1', text: 'מסע שוטטות' + (J.place ? ': ' + J.place : '') }),
      h('div', { 'class': 'j-meta' }, [
        h('span', { text: 'דרגה: ' + lv.name }), h('span', { text: g ? J.meetings.length + ' מפגשים' : 'כ-' + J.minutes + ' דקות מתוך ' + J.budget }),
        J.placeName ? h('span', { text: J.placeName }) : null
      ])
    ]);
    out.appendChild(head);
    var story = h('div', { 'class': 'j-story' });
    if (!g && J.intention) story.appendChild(h('p', { 'class': 'intent' }, [h('b', { text: 'הכוונה: ' }), h('q', { text: J.intention })]));
    if (J.magic || J.challenge) story.appendChild(h('p', { 'class': 'mc' }, [
      J.magic ? h('span', {}, [h('b', { text: 'הקסם ' }), h('q', { text: J.magic })]) : null,
      J.challenge ? h('span', {}, [h('b', { text: 'האתגר ' }), h('q', { text: J.challenge })]) : null]));
    if (J.boundaries) story.appendChild(h('p', { 'class': 'bound' }, [h('b', { text: 'גבול: ' }), J.boundaries]));
    out.appendChild(story);
    out.appendChild(band());

    if (!g) {
      out.appendChild(h('p', { 'class': 'j-why', text: whyShape(lv.id, J.stations.length) }));
      var list = h('div', { 'class': 'stations' });
      J.stations.forEach(function (st, i) { list.appendChild(stationCard(st, i + 1, 's' + i)); });
      if (!J.stations.length) list.appendChild(h('p', { text: 'לא מצאתי רעיון שמתאים לזמן ולמקום שתיארתם. אפשר להאריך את הזמן או לבחור מקום אחר.' }));
      out.appendChild(list);
      if (J.lenses && J.lenses.length) out.appendChild(h('div', { 'class': 'lenses' }, [h('b', { text: 'עדשות לקחת לדרך: ' })].concat(
        J.lenses.map(function (l) { return h('span', { 'class': 'lens', text: l.name.replace('עדשה: ', '') }); }),
        [h('span', { 'class': 'small quiet', text: ' רק השם מתועד, בלי תיאור.' })])));
      out.appendChild(fruits());
    } else {
      out.appendChild(h('div', { 'class': 'prep' }, [
        h('b', { text: 'הכנה עם המנחה' }),
        h('p', { 'class': 'small', text: 'הנושאים: ' + K.PREP.join(', ') + '. מה שכתבתם מופיע כאן במילים שלכם, ונשאר בדף הזה בלבד.' }),
        h('dl', {}, [['האנשים', S.a.people], ['הכוחות והקשרים', S.a.forces], ['המטרה', S.a.purpose], ['מה כבר נעשה', S.a.done]]
          .filter(function (x) { return x[1]; }).map(function (x) { return h('div', {}, [h('dt', { text: x[0] }), h('dd', {}, [h('q', { text: x[1] })])]); }))
      ]));
      var ms = h('div', { 'class': 'meetings' });
      J.meetings.forEach(function (m, mi) {
        var mt = h('section', { 'class': 'meet' }, [h('h3', { text: 'מפגש ' + m.n }), h('span', { 'class': 'quiet small', text: m.minutes + ' דקות' })]);
        m.ideas.forEach(function (st, i) { mt.appendChild(stationCard(st, m.n + '.' + (i + 1), 'm' + mi + 'i' + i)); });
        var pur = m.tool.purposes.map(function (i) { return K.PURPOSES[i]; });
        mt.appendChild(h('article', { 'class': 'stn tool' }, [
          h('div', { 'class': 'stn-h' }, [h('span', { 'class': 'stn-role', text: 'כלי משתתף · מאגר ב' })]),
          h('h4', { text: pur.length ? 'לפי המטרה: ' + pur.join(', ') : 'כלי שיתאים למטרה' }),
          h('p', { 'class': 'inv', text: m.tool.found.length ? '' : 'מאגר הכלים המשתתפים עוד ריק. כאן ייכנס כלי מתועד, עם מקור, כשהמחבר יוסיף אותו. אפשר להשתמש בכלי שאתם מכירים.' })
        ]));
        ms.appendChild(mt);
        if (m.harvestAfter) ms.appendChild(h('div', { 'class': 'harvest' }, [h('b', { text: 'קציר משותף' }),
          h('span', { text: 'מה עובר מהמפגש הזה לבא אחריו. עקבה אישית נכנסת לקציר רק אם מי שיצר אותה בחר לשתף.' })]));
      });
      out.appendChild(ms);
      out.appendChild(h('p', { 'class': 'small quiet', text: 'שום קציר לא נשמר באתר. כללי בעלות, גישה, הסכמה ושימור עוד לא נקבעו. גם הביטוי של ערך ושחרור בתהליך משתתף עוד פתוח.' }));
    }

    var end = h('div', { 'class': 'j-end' }, [
      h('h3', { text: 'בחזרה' }),
      h('p', { 'class': 'depth' }, [h('span', { 'class': 'small quiet', text: 'השאלה של הדרגה: ' }), h('b', { text: J.depthQ })]),
      h('p', { 'class': 'cel' }, [h('b', { text: 'חגיגה. ' }), J.celebration])
    ]);
    if (lv.id === 'l4' && (J.magic || J.challenge)) end.appendChild(h('p', { 'class': 'small' }, ['ועוד שאלה לחזרה: מה השתנה בסיפור שלכם על הקסם והאתגר? ', h('span', { 'class': 'verify', text: 'הצעה' })]));
    out.appendChild(end);

    var act = h('div', { 'class': 'j-act' }, [
      h('button', { type: 'button', 'class': 'btn primary', onclick: function () { window.print(); } }, ['להדפיס או לשמור כ-PDF']),
      h('button', { type: 'button', 'class': 'btn', onclick: function () { go('level'); S.ret = 'reflect'; } }, ['לשנות דרגה']),
      h('button', { type: 'button', 'class': 'btn', onclick: function () { S.ret = null; go('reflect'); } }, ['לתקן תשובות']),
      h('button', { type: 'button', 'class': 'linkish', onclick: restart }, ['להתחיל מחדש'])
    ]);
    out.appendChild(act);
  }

  function whyShape(l, n) {
    return {
      l1: 'בדרגת מתנסה המסע הוא תרגול אחד קצר, עם הסבר קצר. מספיק לצאת.',
      l2: 'בדרגת משוטט מתחיל המסע הוא ' + n + ' תרגולים ברצף, ובכל אחד אפשר להחליף רעיון.',
      l3: 'בדרגת משוטט מיומן המסע משלב ' + n + ' תחנות ועדשות, עם מעט הכוונה.',
      l4: 'בדרגת משוטט אקוסיסטמי מרכיבים את המסע בדרך: בכל תחנה יש כמה רעיונות, ואתם בוחרים.'
    }[l];
  }

  function fruits() {
    var box = h('div', { 'class': 'fruits' }, [
      h('div', { 'class': 'fr-h' }, [h('b', { text: 'פירות שוטטות' }), h('span', { 'class': 'small quiet', text: 'רגע של אה אה! או של וואלה! נגיעה אחת קוטפת אותו. אפשר להוסיף מילה, ואפשר שלא. בדרגה הזו: ' + byId(K.LEVELS, S.level).fruit + '.' })])
    ]);
    var inp = h('input', { type: 'text', 'class': 'ans small', placeholder: 'מילה אחת, אם רוצים', 'aria-label': 'מילה לפרי', autocomplete: 'off' });
    var addF = function (kind) { S.fruits.push({ k: kind, w: inp.value.trim(), t: new Date().toTimeString().slice(0, 5) }); inp.value = ''; renderJourney(); };
    box.appendChild(h('div', { 'class': 'fr-row' }, [
      h('button', { type: 'button', 'class': 'fruit-b', onclick: function () { addF('אה אה!'); } }, ['אה אה!']),
      h('button', { type: 'button', 'class': 'fruit-b w', onclick: function () { addF('וואלה!'); } }, ['וואלה!']), inp]));
    if (S.fruits.length) box.appendChild(h('ul', { 'class': 'fr-list' }, S.fruits.map(function (f) { return h('li', {}, [h('b', { text: f.k }), ' ', f.w || '', h('small', { text: ' ' + f.t })]); })));
    box.appendChild(h('p', { 'class': 'small quiet', text: 'הפירות נשארים בדף הזה בלבד, עד שתסגרו אותו.' }));
    return box;
  }

  /* -------- navigation -------- */
  function next() {
    var f = flow();
    if (S.step === 'level' && !S.level) return;
    if (S.ret) { var r = S.ret; S.ret = null; go(r); return; }
    var i = f.indexOf(S.step);
    if (S.step !== 'intro' && S.step !== 'path' && STEP_KEY[S.step]) field.set(S.step, RING[S.step], STEP_KEY[S.step]());
    if (S.path === 'meet' && S.step === 'path' && S.introSeen) i++; // the introduction is offered once
    go(f[Math.min(i + 1, f.length - 1)]);
  }
  var STEP_KEY = {
    place: function () { return S.a.place; }, magic: function () { return S.a.magic; }, challenge: function () { return S.a.challenge; },
    curiosity: function () { return S.a.curiosity; }, conditions: function () { return S.a.minutes + S.a.boundaries; },
    people: function () { return S.a.people + S.a.groupSize; }, forces: function () { return S.a.forces; },
    purpose: function () { return S.a.purpose + S.a.purposes.join(); }, done: function () { return S.a.done; },
    gconditions: function () { return S.a.meetings + '·' + S.a.meetingMinutes + S.a.boundaries; }
  };
  function go(step) {
    if (S.step !== step) S.back.push(S.step);
    S.step = step; if (step === 'intro') S.intro = 0;
    if (step !== 'journey') { out.hidden = true; field.emerge(0); }
    render(true);
  }
  function back() { var p = S.back.pop(); if (p) { S.step = p; render(true); } }
  function restart() {
    S.step = 'path'; S.back = []; S.ret = null; S.path = null; S.level = null; S.mode = null; S.themes = null; S.journey = null; S.fruits = [];
    Object.keys(S.a).forEach(function (k) { S.a[k] = Array.isArray(S.a[k]) ? [] : (k === 'minutes' ? 45 : k === 'meetings' ? 2 : k === 'meetingMinutes' ? 90 : ''); });
    field.reset(); out.hidden = true; render(true);
  }

  function renderTrail() {
    trail.innerHTML = '';
    var items = [];
    if (S.path) items.push(['מסלול', byId(K.PATHS, S.path).label, 'path']);
    if (S.level) items.push(['דרגה', byId(K.LEVELS, S.level).name, 'level']);
    if (S.mode) items.push(['אופן', byId(K.MODES, S.mode).name, 'mode']);
    items.forEach(function (it) {
      trail.appendChild(h('button', { type: 'button', 'class': 'tr', onclick: function () { if (S.step === 'journey' || S.step === 'reflect') S.ret = 'reflect'; go(it[2]); } },
        [h('small', { text: it[0] }), it[1]]));
    });
    trail.hidden = !items.length;
  }

  function render(focus) {
    var step = S.step === 'journey' ? 'reflect' : S.step;
    panel.innerHTML = '';
    if (S.step === 'journey') {
      panel.appendChild(h('div', { 'class': 'q done' }, [
        h('p', { 'class': 'q-k', text: 'המסע התהווה' }),
        h('h2', { 'class': 'q-t', id: 'q-t', tabindex: '-1', text: 'המסע שלכם מוכן, מתחת לשדה.' }),
        h('p', { 'class': 'q-sub', text: 'הקו בשדה נגזר מהתשובות שלכם ומהרעיונות שנבחרו. אותן תשובות יציירו אותו קו.' }),
        h('div', { 'class': 'q-nav' }, [h('a', { 'class': 'btn primary', href: '#out' }, ['למסע']),
          h('button', { type: 'button', 'class': 'linkish', onclick: function () { go('reflect'); } }, ['לתקן תשובות'])])
      ]));
      renderJourney();
    } else panel.appendChild(STEPS[step]());
    field.focus(RING[step]);
    center.querySelector('b').textContent = S.step === 'journey' ? 'המסע' : SHORT[step];
    var f = flow(), i = f.indexOf(step);
    center.querySelector('span').textContent = S.step === 'journey' ? '' : (i + 1) + ' / ' + f.length;
    renderTrail();
    if (focus) {
      var t = $('#q-t'); if (t) t.focus({ preventScroll: true });
      // on a phone the field sits above the question: bring the question back into view
      if (S.step !== 'journey' && window.innerWidth < 900) {
        var top = panel.getBoundingClientRect().top;
        if (top < 60 || top > window.innerHeight * .55) $('.talk').scrollIntoView({ block: 'start' });
      }
    }
  }

  render();
})();
