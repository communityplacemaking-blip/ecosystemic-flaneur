'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadLibrary } = require('../tools/load');
const { validate } = require('../tools/validate');
const { build } = require('../tools/build');

const fresh = () => JSON.parse(JSON.stringify(loadLibrary()));
const rec = (lib, id) => lib.practices.find(p => p.record.id === id).record;
const errorsAfter = change => { const lib = fresh(); change(lib); return validate(lib).errors.join('\n'); };

test('the library as committed has no errors', () => {
  const res = validate(loadLibrary());
  assert.deepEqual(res.errors, []);
  assert.equal(res.count, 25);
});

test('build joins all 25 practices in B order', () => {
  const out = build();
  assert.equal(out.practices.length, 25);
  assert.equal(out.practices[0].id, 'attention-now');
  assert.equal(out.practices[24].id, 'one-photo');
});

test('a record cannot be marked original or adapted without a recorded decision', () => {
  assert.match(errorsAfter(l => { rec(l, 'count-ten').origin.type = 'original'; }), /count-ten: .*decided_by/);
  assert.match(errorsAfter(l => { rec(l, 'five-r').origin.type = 'adapted'; }), /five-r: .*decided_by/);
  assert.equal(errorsAfter(l => { const r = rec(l, 'five-r'); r.origin.type = 'adapted'; r.origin.decided_by = 'תומר, תאריך'; }), '');
});

test('an external practice must point to an external source', () => {
  assert.match(errorsAfter(l => { rec(l, 'urban-safari').documentation.source_refs = ['how-to-wander']; }), /urban-safari: .*מקור חיצוני/);
});

test('a record without a source, or with an unknown one, is stopped', () => {
  assert.match(errorsAfter(l => { rec(l, 'derive').documentation.source_refs = []; }), /derive: .*הפניה/);
  assert.match(errorsAfter(l => { rec(l, 'derive').documentation.source_refs = ['made-up']; }), /derive: מקור לא קיים/);
});

test('tags must come from the dictionaries', () => {
  assert.match(errorsAfter(l => { rec(l, 'wonder').placement.slots = ['finale']; }), /wonder: שלב לא מוכר/);
  assert.match(errorsAfter(l => { rec(l, 'wonder').placement.movements = ['פירות']; }), /wonder: תנועה לא מוכרת/);
  assert.match(errorsAfter(l => { rec(l, 'wonder').fit.places = ['beach']; }), /wonder: places/);
  assert.match(errorsAfter(l => { rec(l, 'wonder').care.boundary_tags = ['night']; }), /wonder: תגית גבול/);
});

test('attention vocabulary is open: a new quality is allowed once it is listed as emerging', () => {
  const add = l => { rec(l, 'wonder').attention.qualities = [{ category: null, text: 'הקשבה לשקט' }]; };
  assert.match(errorsAfter(add), /wonder: .*מתהוות/);
  assert.equal(errorsAfter(l => { add(l); l.dictionaries['attention-qualities'].emerging.push({ text: 'הקשבה לשקט' }); }), '');
  assert.match(errorsAfter(l => { rec(l, 'wonder').attention.qualities = [{ category: 'telepathy', text: null }]; }), /wonder: קטגוריית קשב/);
});

test('a proposal must quote the record it rests on', () => {
  assert.match(errorsAfter(l => { l.proposals[0].data.proposals[0].basis = ['מילים שלא כתובות בשום מקום']; }), /attention-now: הבסיס לא מצוטט/);
});

test('celebration stays separate from the fruit basket', () => {
  const c = loadLibrary().dictionaries.movements.values.find(v => v.id === 'celebration');
  assert.equal(c.label, 'חגיגה');
  assert.match(c.not_the_same_as, /סל הפירות/);
});
