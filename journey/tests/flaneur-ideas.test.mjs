// node journey/tests/flaneur-ideas.test.mjs
// Repository A additions (library/ideas-flaneur.js): well-formed, unique, and reachable by the engine.
import { createRequire } from 'module'; import assert from 'assert';
const require = createRequire(import.meta.url);
globalThis.window = globalThis;
require('../../library/ideas-snapshot.js'); const base = globalThis.IDEAS.length;
require('../../library/ideas-flaneur.js'); const K = require('../knowledge.js'); const E = require('../engine.js');
const IDEAS = globalThis.IDEAS, added = IDEAS.slice(base); let n = 0; const t = (name, f) => { f(); n++; console.log('✓', name); };
const ROLES = ['entry', 'move', 'discern', 'trace', 'return'], PLACES = K.PLACES.map(p => p.id);
t('snapshot untouched, additions appended', () => { assert.equal(base, 25); assert.ok(added.length > 0); });
t('ids unique', () => assert.equal(new Set(IDEAS.map(r => r.id)).size, IDEAS.length));
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
        (J.stations || []).concat(...(J.meetings || []).map(m => m.stations || [])).forEach(s => { seen.add(s.rec.id); (s.alts || []).forEach(a => seen.add(a.rec.id)); });
      }
  const reached = added.filter(r => seen.has(r.id)).length;
  console.log('  reached', reached, 'of', added.length);
  assert.ok(reached >= added.length / 2);
});
console.log(n + ' checks passed');
