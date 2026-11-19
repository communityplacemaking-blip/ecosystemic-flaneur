// node journey/tests/catalog.test.mjs
// The tool catalogs (library/catalog/): one record shape, two collections, search, and the journey's recommendations.
import assert from 'assert'; import vm from 'vm'; import fs from 'fs'; import { createRequire } from 'module';
const require = createRequire(import.meta.url);
globalThis.window = globalThis;
const R = new URL('../../', import.meta.url).pathname;
for (const f of ['library/ideas-snapshot.js', 'library/ideas-flaneur.js', 'library/tools-data.js', 'library/catalog/toolbox-data.js', 'library/catalog/catalog.js'])
  vm.runInThisContext(fs.readFileSync(R + f, 'utf8'), { filename: f });
const K = require('../knowledge.js'); const E = require('../engine.js');
const C = globalThis.EF_CATALOG, TOOLS = globalThis.TOOLS, IDEAS = globalThis.IDEAS;
let n = 0; const t = (name, f) => { f(); n++; console.log('✓', name); };
const names = (list) => list.map(r => r.id);

t('every participatory tool is in its catalog, nothing lost', () => {
  const P = C.all('participatory'); assert.equal(P.length, TOOLS.length); assert.ok(TOOLS.every(x => x.scale), 'every participatory tool has a scale');
  TOOLS.forEach(x => { const r = C.find(x.id); assert.equal(r.name, x.name); assert.equal(r.essence, x.essence); assert.deepEqual(r.steps, x.steps);
    assert.equal(r.hosting, x.hosting); assert.equal(r.harvest, x.harvest); assert.equal(r.credit, x.credit); assert.deepEqual(r.principles, x.principles);
    (x.contains || []).forEach(id => assert.ok(r.related.includes(id))); });
});
t('the toolbox holds the two new tools and every practice of repository A', () => {
  const B = C.all('toolbox'); assert.equal(B.length, IDEAS.length + window.EF_TOOLKIT.length);
  assert.ok(C.find('five-layers') && C.find('six-hats'));
});
t('ids are unique across both catalogs', () => { const ids = C.all().map(r => r.id); assert.equal(new Set(ids).size, ids.length); });
t('every record is complete enough to open in full, with known categories and intentions', () => {
  const cats = { toolbox: C.CATEGORIES.toolbox.map(c => c.id), participatory: C.CATEGORIES.participatory.map(c => c.id) };
  const ints = C.INTENTS.map(i => i.id);
  C.all().forEach(r => { assert.ok(r.id && r.name && typeof r.essence === 'string', r.id);
    (r.categories || []).forEach(c => assert.ok(cats[r.collection].includes(c), r.id + ' ' + c));
    (r.intents || []).forEach(i => assert.ok(ints.includes(i), r.id + ' ' + i));
    (r.related || []).forEach(id => assert.ok(C.find(id), r.id + ' → ' + id)); });
});
t('five layers: five layers, each with a question and prompts, flexible, individual and group', () => {
  const r = C.find('five-layers'); assert.equal(r.parts.items.length, 5);
  assert.deepEqual(r.parts.items.map(p => p.name), ['המבט החושי', 'המבט המכוון', 'המבט המשתנה', 'המבט הרפלקטיבי', 'המבט היוצר']);
  r.parts.items.forEach(p => { assert.ok(p.q); assert.ok(p.prompts.length >= 3); });
  assert.ok(/לא בהכרח חמישה שלבים/.test(r.parts.note)); assert.deepEqual(r.users, ['solo', 'group']);
  assert.ok(!r.time && !r.size, 'no invented duration or group size');
});
t('six hats: six thinking modes, four ways to use them, credited to de Bono', () => {
  const r = C.find('six-hats'); assert.equal(r.parts.items.length, 6); assert.equal(r.modes.length, 4);
  assert.ok(/לא טיפוסי אישיות/.test(r.parts.note)); assert.ok(/דה בונו/.test(r.credit)); assert.ok(!r.time);
});
t('search: Hebrew name, description, intention, purpose and tags, with prefixes', () => {
  assert.ok(names(C.search('toolbox', { q: 'כובעים' })).includes('six-hats'));
  assert.ok(names(C.search('toolbox', { q: 'התבוננות' })).includes('five-layers'));
  assert.ok(names(C.search('toolbox', { q: 'נקודת מבט' })).includes('six-hats'));
  assert.ok(names(C.search('toolbox', { q: 'בהזדמנויות' })).includes('six-hats'));
  assert.ok(names(C.search('participatory', { q: 'קפה' })).includes('world-cafe'));
  assert.ok(names(C.search('participatory', { q: 'לזהות נכסים' })).includes('appreciative-inquiry'));
  assert.ok(names(C.search('participatory', { q: 'למידה הדדית' })).length > 0, 'purpose is searchable');
  assert.equal(C.search('toolbox', { q: 'קפה עולם' }).length, 0, 'each catalog searches itself');
});
t('filters: kind, category and users', () => {
  assert.deepEqual(names(C.search('toolbox', { kind: 'tools' })), ['five-layers', 'six-hats', 'flaneur-disguise', 'wander-and-gather', 'many-uses']);
  assert.equal(C.search('toolbox', { kind: 'practice' }).length, IDEAS.length);
  assert.ok(C.search('participatory', { category: 'p0' }).every(r => r.categories.includes('p0')));
  assert.deepEqual(names(C.search('toolbox', { category: 'observe' })), ['five-layers', 'wander-and-gather']);
});
const rec = (text, mode) => names(C.recommend(text, { mode }));
t('the three creativity tools: solo and group, a full solo mode for the disguise, every study cited and linked to the article', () => {
  ['flaneur-disguise', 'wander-and-gather', 'many-uses'].forEach(id => { const r = C.find(id);
    assert.deepEqual(r.users, ['solo', 'group'], id); assert.ok(r.sources.length && r.sources.every(x => x.t && x.note), id);
    assert.ok(/EOL/.test(r.from.name), id); assert.ok(r.time, id); });
  const d = C.find('flaneur-disguise'); assert.equal(d.modes[0].name, 'המשוטט הבודד'); assert.ok(d.steps.length >= 6);
  assert.ok(d.prompts.every(q => /^כיצד|^מה /.test(q)));
  assert.ok(names(C.search('toolbox', { q: 'התחפשות' })).includes('flaneur-disguise'));
});
t('creativity wording → the disguise; mind-wandering wording → wander and gather', () => {
  assert.equal(rec('אני לא מרגיש יצירתי, רוצה להתחפש לדמות אחרת', 'solo')[0], 'flaneur-disguise');
  assert.ok(rec('יש לי רעיון שלא מתגבש, רוצה יצירתיות', 'solo').includes('wander-and-gather'));
});
t('a familiar neighborhood that is hard to notice → the five layers', () => assert.deepEqual(rec('קשה לי לשים לב למה שקורה בשכונה המוכרת שלי', 'solo'), ['five-layers']));
t('a local challenge from several perspectives → six hats first', () => assert.equal(rec('לבחון אתגר מקומי מכמה נקודות מבט', 'solo')[0], 'six-hats'));
t('bringing residents together → participatory tools, none in individual wandering', () => {
  const g = rec('לחבר תושבים סביב נושא משותף', 'group'); assert.ok(g.length && g.every(id => C.find(id).collection === 'participatory'));
  assert.ok(rec('לחבר תושבים סביב נושא משותף', 'solo').every(id => C.find(id).collection === 'toolbox'));
});
t('hidden assets → an observation tool and a participatory tool', () => {
  const g = rec('לזהות נכסים נסתרים בשכונה', 'group'); assert.ok(g.includes('five-layers')); assert.ok(g.some(id => C.find(id).collection === 'participatory'));
});
t('no forced tool: unrelated words give no recommendation', () => {
  assert.deepEqual(rec('סיפורים של אנשים', 'solo'), []); assert.deepEqual(rec('', 'group'), []); assert.deepEqual(rec('ים, שקיעה ושקט', 'solo'), []);
});
t('every recommendation explains itself and opens in full', () => {
  C.recommend('לבחון אתגר מקומי מכמה נקודות מבט, להרגיש מה מטריד', { mode: 'solo' }).forEach(r => {
    assert.ok(r.why.length && r.why.every(w => w.includes('"'))); assert.ok(r.discover); assert.ok(/^library\/(toolbox|participatory)\/#t-/.test(r.href)); });
  assert.ok(C.recommend('לבחון אתגר, מה מטריד אותנו', { mode: 'solo' })[0].focus.includes('הכובע האדום'), 'focused hats');
});
t('the journey: individual journeys may carry toolbox tools, groups get a participatory tool per meeting', () => {
  const a = { place: 'שכונה', placeType: 'neighborhood', curiosity: 'לשים לב למה שקורה ברחוב המוכר', minutes: 60 };
  const J = E.compose({ level: 'l2', mode: 'solo' }, a, IDEAS); assert.deepEqual(names(J.tools), ['five-layers']);
  const G = E.compose({ level: 'l3', mode: 'group' }, { ...a, purpose: 'לחבר תושבים', meetings: 3, meetingMinutes: 90, purposes: [0] }, IDEAS);
  G.meetings.slice(0, -1).forEach(m => { assert.ok(m.tool.found.length); assert.ok(C.find(m.tool.found[0].id).categories.includes('p0')); });
  assert.notEqual(G.meetings[0].tool.found[0].id, G.meetings[1].tool.found[0].id);
  const ids = G.meetings.flatMap(m => m.tool.found.map(x => x.id)); assert.ok(G.tools.every(x => !ids.includes(x.id)), 'no tool offered twice');
});
t('proportion: a meeting only gets a tool that fits the time it leaves; days-long processes never sit inside a meeting', () => {
  const big = C.all('participatory').filter(r => r.scale === 'day' || r.scale === 'process').map(r => r.id);
  assert.ok(big.includes('dragon-dreaming') && big.includes('open-space') && big.includes('appreciative-inquiry'));
  for (const len of [60, 90, 120, 180]) for (const p of [[0], [4], [4, 5], [1, 2]]) {
    const G = E.compose({ level: 'l3', mode: 'group' }, { purpose: 'חלום משותף ויוזמה של תושבים', meetings: 3, meetingMinutes: len, purposes: p }, IDEAS);
    G.meetings.forEach(m => m.tool.found.forEach(t => { const r = C.find(t.id); assert.ok(!big.includes(r.id), r.id + ' in a meeting');
      if (!m.closing && r.minutes && r.minutes[0]) assert.ok(r.minutes[0] <= m.tool.avail, r.id + ' ' + r.minutes[0] + ' > ' + m.tool.avail); }));
    G.tools.forEach(t => assert.ok(!big.includes(t.id)));
  }
});
t('a process of several meetings ends reflective and celebratory, with the four seasons', () => {
  const r = C.find('four-seasons'); assert.equal(r.steps.length, 4); assert.ok(/קיץ/.test(r.steps[0]) && /אביב/.test(r.steps[3]));
  for (const n of [2, 3, 4]) { const G = E.compose({ level: 'l3', mode: 'group' }, { meetings: n, purposes: [4] }, IDEAS);
    const last = G.meetings[n - 1]; assert.ok(last.closing); assert.equal(last.tool.found[0].id, 'four-seasons');
    assert.deepEqual(last.ideas.map(s => s.role), ['return']);
    G.meetings.slice(0, -1).forEach(m => assert.ok(!m.closing && (m.tool.found[0] || {}).id !== 'four-seasons')); }
  const one = E.compose({ level: 'l3', mode: 'group' }, { meetings: 1, purposes: [4] }, IDEAS); assert.ok(!one.meetings[0].closing);
});
t('a whole process is offered as a frame, beside the meetings, only when the words point to it', () => {
  const G = E.compose({ level: 'l3', mode: 'group' }, { purpose: 'לפתח יוזמה קהילתית מתוך חלום משותף של תושבים, ולתכנן פרויקט', meetings: 2, purposes: [4] }, IDEAS);
  assert.ok(G.frame && ['dragon-dreaming', 'appreciative-inquiry', 'art-of-hosting', 'open-space', 'liberating-structures'].includes(G.frame.id));
  assert.equal(E.compose({ level: 'l3', mode: 'group' }, { purpose: 'ים ושקיעה', meetings: 2 }, IDEAS).frame, null);
});
t('deterministic', () => assert.equal(JSON.stringify(C.recommend('לבחון אתגר מקומי', { mode: 'group' })), JSON.stringify(C.recommend('לבחון אתגר מקומי', { mode: 'group' }))));
console.log(n + ' tests pass');
