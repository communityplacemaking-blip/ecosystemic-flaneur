// node journey/tests/engine.test.mjs
import { createRequire } from 'module'; import assert from 'assert';
const require = createRequire(import.meta.url);
globalThis.window = globalThis;
require('../../library/ideas-snapshot.js'); const K = require('../knowledge.js'); const E = require('../engine.js');
const IDEAS = globalThis.IDEAS; let n = 0; const t = (name, f) => { f(); n++; console.log('✓', name); };
const a = { place: 'שכונה', placeType: 'neighborhood', magic: 'סיפורים בכל פינה', challenge: 'בניינים נעלמים', curiosity: 'סיפורים של אנשים', minutes: 90 };
t('four levels, names as given 30.10', () => assert.deepEqual(K.LEVELS.map(l => l.name), ['מתנסה', 'משוטט מתחיל', 'משוטט מיומן', 'משוטט אקוסיסטמי']));
t('three readiness paths', () => assert.equal(K.PATHS.length, 3));
t('six purposes; with no catalog loaded, no tool is invented', () => { assert.equal(K.PURPOSES.length, 6); assert.equal(K.TOOLS.length, 0); });
t('repository A = 25 records, untouched', () => assert.equal(IDEAS.length, 25));
t('level changes the structure', () => {
  const c = ['l1', 'l2', 'l3', 'l4'].map(l => E.compose({ level: l, mode: 'solo' }, a, IDEAS).stations.length);
  assert.equal(c[0], 1); assert.ok(c[1] >= 2 && c[1] <= 3); assert.ok(c[2] > c[1]);
});
t('deterministic', () => assert.deepEqual(JSON.stringify(E.compose({ level: 'l3', mode: 'solo' }, a, IDEAS)), JSON.stringify(E.compose({ level: 'l3', mode: 'solo' }, a, IDEAS))));
t('no record used twice, time respected', () => {
  for (const m of [20, 45, 90, 150]) for (const l of ['l1', 'l2', 'l3', 'l4']) {
    const J = E.compose({ level: l, mode: 'solo' }, { ...a, minutes: m }, IDEAS);
    const ids = J.stations.map(s => s.rec.id); assert.equal(new Set(ids).size, ids.length);
    assert.ok(J.minutes <= m, l + ' ' + m + ' ' + J.minutes);
  }
});
t('place filter', () => {
  const J = E.compose({ level: 'l4', mode: 'solo' }, { ...a, placeType: 'nature' }, IDEAS);
  J.stations.forEach(s => { const r = s.rec; assert.ok(r.places === 'all' || r.places.includes('nature')); });
});
t('every station explains itself and cites its source', () => {
  E.compose({ level: 'l3', mode: 'solo' }, a, IDEAS).stations.forEach(s => { assert.ok(Array.isArray(s.why)); assert.ok(s.rec.src); });
});
t('participatory: meetings, harvest between, tool slot by purpose', () => {
  const J = E.compose({ level: 'l3', mode: 'group' }, { ...a, meetings: 3, purposes: [0, 4] }, IDEAS);
  assert.equal(J.meetings.length, 3); assert.deepEqual(J.meetings.map(m => m.harvestAfter), [true, true, false]);
  J.meetings.forEach(m => { assert.deepEqual(m.tool.purposes, [0, 4]); assert.equal(m.tool.found.length, 0); }); assert.deepEqual(J.tools, []);
});
t('mode is never inferred', () => assert.equal(E.compose({ level: 'l2' }, { ...a, people: 'קבוצה של 30' }, IDEAS).mode, 'solo'));
t('understanding quotes the person\'s words', () => { const u = E.understand(a); assert.ok(u.themes.some(x => x.id === 'stories' && x.because === 'סיפורים')); });
t('a personal journey never offers a group practice, at any level or length (27.11)', () => {
  require('../../library/ideas-flaneur.js'); const IDEAS = globalThis.IDEAS;   // the page loads both repositories
  ['l1', 'l2', 'l3', 'l4'].forEach(level => [20, 45, 90, 150].forEach(minutes => {
    const J = E.compose({ level, mode: 'solo' }, { ...a, minutes, curiosity: 'לספר יחד במעגל ולשרטט מפה משותפת בקבוצה' }, IDEAS);
    J.stations.forEach(st => [st.rec].concat(st.alts.map(x => x.rec)).forEach(r => assert.ok(!K.GROUP_ONLY.includes(r.id), level + ' ' + r.id)));
  }));
  K.GROUP_ONLY.forEach(id => assert.ok(IDEAS.some(r => r.id === id), 'unknown id ' + id));
});
t('lenses: every lens is an invitation with an origin or echo; one lens per level; the person\'s words choose it', () => {
  K.LENSES.forEach(l => assert.ok(l.name && l.practice && (l.origin || l.source), l.id));
  assert.equal(K.LENSES.length, 9); assert.ok(K.LENSES.some(l => l.name === 'לקרוא את המקום'));
  ['l1', 'l2', 'l3', 'l4'].forEach(lv => assert.equal(K.LENS_COUNT[lv], 1));
  const W = E.compose({ level: 'l2', mode: 'solo' }, { ...a, curiosity: 'להרגיש את העצים והציפורים ואת מה שחי כאן' }, IDEAS);
  assert.equal(W.lenses.offered[0].id, 'web');
  const J = E.compose({ level: 'l4', mode: 'solo' }, { ...a, magic: 'די המוגונית אין יוצר מדי קשר בין האנשים', challenge: 'יצירת הקשרים לחיבורים קהילתיים כרגע רדום ונפרד', curiosity: 'לגלות הזדמנויות לחיבורים', minutes: 90 }, IDEAS);
  assert.equal(J.lenses.offered.length, 1); assert.equal(J.lenses.offered[0].id, 'patterns'); assert.ok(J.lenses.offered[0].because.length);
  assert.equal(J.lenses.offered.length + J.lenses.more.length, K.LENSES.length);
  assert.equal(E.compose({ level: 'l1', mode: 'solo' }, a, IDEAS).lenses.offered.length, 1);
  assert.deepEqual(E.compose({ level: 'l2', mode: 'solo' }, { place: 'x', minutes: 45 }, IDEAS).lenses.offered.map(l => l.because), [[]]);
});
console.log(n + ' tests pass');
