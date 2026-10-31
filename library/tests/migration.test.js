'use strict';
/* Proves the migration lost nothing: every B record, its invitation forms, its order and B's dictionaries
   are reproduced exactly from the library. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { extractB } = require('../tools/extract-b');
const { loadLibrary } = require('../tools/load');
const { toB, formsOf } = require('../tools/mapping');

const B = extractB();
const lib = loadLibrary();
const byId = new Map(lib.practices.map(p => [p.record.id, p.record]));
const values = name => lib.dictionaries[name].values;

test('B still holds 25 records, and the library holds the same 25', () => {
  assert.equal(B.LIB.length, 25);
  assert.equal(lib.practices.length, 25);
  assert.deepEqual([...byId.keys()].sort(), B.LIB.map(b => b.id).sort());
});

test('every B record comes back field for field, including absent keys', () => {
  for (const b of B.LIB) assert.deepStrictEqual(toB(byId.get(b.id)), b, b.id);
});

test('every gendered invitation form comes back, and no record gained forms', () => {
  for (const b of B.LIB) assert.deepStrictEqual(formsOf(byId.get(b.id)), B.FORMS[b.id], b.id);
});

test('B order is kept', () => {
  B.LIB.forEach((b, i) => assert.equal(byId.get(b.id).review.b_order, i, b.id));
});

test('no new tag was written into a record during migration', () => {
  for (const { record: r } of lib.practices) {
    assert.deepEqual(r.placement.movements, [], r.id);
    assert.deepEqual(r.attention.qualities, [], r.id);
    assert.equal(r.origin.decided_by, null, r.id);
    assert.ok(!['original', 'adapted'].includes(r.origin.type), r.id);
  }
});

test('origin follows B status only: external, idea -> developing, everything else unresolved', () => {
  for (const b of B.LIB) {
    const want = b.status === 'external' ? 'external' : b.status === 'idea' ? 'developing' : 'unresolved';
    assert.equal(byId.get(b.id).origin.type, want, b.id);
  }
});

test('B dictionaries are carried over with the same labels', () => {
  assert.deepEqual(values('movements').map(v => v.label), B.MOVEMENTS);
  assert.deepEqual(values('slots').map(v => ({ key: v.id, name: v.label, share: v.share })), B.SLOTS);
  assert.deepEqual(Object.fromEntries(values('documentation-status').map(v => [v.id, v.label])), B.STATUS);
  assert.deepEqual(Object.fromEntries(values('audiences').map(v => [v.id, v.label])), B.IDS);
  assert.deepEqual(lib.dictionaries.audiences.group_ids, B.GROUP_IDS);
  assert.deepEqual(Object.fromEntries(values('places').map(v => [v.id, v.label])), B.PLACES);
  assert.deepEqual(Object.fromEntries(values('intents').map(v => [v.id, v.label])), B.TYPES);
  assert.deepEqual(Object.fromEntries(values('modes').map(v => [v.id, v.label])), B.MODES);
  assert.deepEqual(Object.fromEntries(values('boundaries').map(v => [v.id, { label: v.label, excl: v.excludes_tag }])), B.MORAL);
  assert.deepStrictEqual(values('contexts'), B.CONTEXTS);
});
