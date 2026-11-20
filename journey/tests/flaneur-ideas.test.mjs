// node journey/tests/flaneur-ideas.test.mjs
// Repository A additions (library/ideas-flaneur.js): well-formed, unique, and reachable by the engine.
import { createRequire } from 'module'; import assert from 'assert';
const require = createRequire(import.meta.url);
globalThis.window = globalThis;
require('../../library/ideas-snapshot.js'); const base = globalThis.IDEAS.length;
require('../../library/ideas-flaneur.js'); const K = require('../knowledge.js'); const E = require('../engine.js');
const IDEAS = globalThis.IDEAS, addedAll = IDEAS.slice(base), added = addedAll.filter(r => r.kind === 'practice'); let n = 0; const t = (name, f) => { f(); n++; console.log('✓', name); };
const ROLES = ['entry', 'move', 'discern', 'trace', 'return'], PLACES = K.PLACES.map(p => p.id);
t('snapshot untouched, additions appended', () => { assert.equal(base, 25); assert.ok(added.length > 0); });
t('ids unique', () => assert.equal(new Set(IDEAS.map(r => r.id)).size, IDEAS.length));
t('added lenses carry a name, an invitation and a source', () => addedAll.filter(r => r.kind !== 'practice').forEach(r => {
  assert.equal(r.kind, 'lens', r.id); assert.ok(r.name && r.invite && r.src, r.id);
}));
t('completions reach the snapshot records', () => {
  ['lens-transience', 'lens-rhythms', 'lens-traces'].forEach(id => { const r = IDEAS.find(x => x.id === id); assert.ok(r.invite && r.doc !== 'nameonly', id); });
  assert.ok(!/לבירור/.test(IDEAS.find(x => x.id === 'count-ten').note));
});
t('no creator name in the library', () => assert.ok(!/תומר|בן חמו/.test(JSON.stringify(IDEAS))));
t('every addition is a complete practice with a credit', () => added.forEach(r => {
  assert.equal(r.kind, 'practice', r.id); assert.ok(r.name && r.invite && r.src && r.credit, r.id);
  assert.ok(r.min > 0, r.id); assert.ok(r.slots.length && r.slots.every(s => ROLES.includes(s)), r.id);
  assert.ok(r.places === 'all' || r.places.every(p => PLACES.includes(p)), r.id);
}));
t('additions can be chosen by the engine', () => {
  const seen = new Set();
  for (const placeType of ['city', 'neighborhood', 'nature', 'institution'])
    for (const curiosity of ['צלילים ושקט', 'אנשים ומפגשים', 'סיפורים', 'רחוב ובניינים', 'צבע וערך'])
      for (const l of ['l2', 'l3', 'l4']) for (const mode of ['solo', 'group']) {
        const J = E.compose({ level: l, mode }, { placeType, curiosity, minutes: 120, meetings: 2, meetingMinutes: 120 }, IDEAS);
        (J.stations || []).concat(...(J.meetings || []).map(m => m.ideas || [])).forEach(s => { seen.add(s.rec.id); (s.alts || []).forEach(a => seen.add(a.rec.id)); });
      }
  const reached = added.filter(r => seen.has(r.id)).length;
  console.log('  reached', reached, 'of', added.length);
  assert.ok(reached >= added.length / 2);
});
t('every addition is offered when the wanderer\'s words name it', () => {
  const missed = added.filter(r => {
    const placeType = r.places === 'all' ? 'city' : r.places[0];
    for (const mode of ['solo', 'group']) for (const l of ['l3', 'l4']) {
      const J = E.compose({ level: l, mode }, { placeType, curiosity: r.name, minutes: 120, meetings: 2, meetingMinutes: 120 }, IDEAS);
      const st = (J.stations || []).concat(...(J.meetings || []).map(m => m.ideas || []));
      if (st.some(s => s.rec.id === r.id || (s.alts || []).some(a => a.rec.id === r.id))) return false;
    }
    return true;
  }).map(r => r.id);
  assert.deepEqual(missed, []);
});
console.log(n + ' checks passed');
