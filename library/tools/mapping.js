'use strict';
/* The one place that says where every field of a B record lives in the new record.
   toRecord() and toB() are exact inverses: the migration test runs toB(toRecord(b)) over all 25 records
   and requires a deep-equal result, including which keys are absent. */

// [B key, path in the new record]. Keys that B leaves out on a record stay absent in the new record.
const FIELD_MAP = [
  ['id', ['id']],
  ['name', ['name']],
  ['status', ['documentation', 'status']],
  ['source', ['documentation', 'source_note']],
  ['invite', ['content', 'invite']],
  ['facil', ['content', 'facilitator_note']],
  ['slots', ['placement', 'slots']],
  ['axis', ['attention', 'axis']],
  ['dim', ['attention', 'direction']],
  ['div', ['attention', 'diversity']],
  ['depth', ['attention', 'depth']],
  ['intents', ['fit', 'intents']],
  ['ids', ['fit', 'audiences']],
  ['places', ['fit', 'places']],
  ['min', ['fit', 'min_minutes']],
  ['facilOnly', ['fit', 'facilitated_only']],
  ['modes', ['fit', 'modes']],
  ['tags', ['care', 'boundary_tags']],
  ['includesTrace', ['output', 'includes_trace']],
  ['core', ['engine', 'core']]
];

function getPath(o, p) { return p.reduce((x, k) => (x == null ? undefined : x[k]), o); }
function hasPath(o, p) {
  let x = o;
  for (const k of p) { if (x == null || !Object.prototype.hasOwnProperty.call(x, k)) return false; x = x[k]; }
  return true;
}
function setPath(o, p, v) {
  let x = o;
  p.slice(0, -1).forEach(k => { if (!x[k]) x[k] = {}; x = x[k]; });
  x[p[p.length - 1]] = v;
}

/* B record + its gendered invitation forms (FORMS[id], if any) -> library record.
   New fields that B never had are created empty: nothing is inferred here. */
function toRecord(b, forms) {
  const r = { schema: 1 };
  for (const [key, p] of FIELD_MAP) if (Object.prototype.hasOwnProperty.call(b, key)) setPath(r, p, b[key]);
  if (forms) setPath(r, ['content', 'invite_forms'], forms);
  setPath(r, ['placement', 'movements'], []);
  setPath(r, ['attention', 'qualities'], []);
  return r;
}

function toB(r) {
  const b = {};
  for (const [key, p] of FIELD_MAP) if (hasPath(r, p)) b[key] = getPath(r, p);
  return b;
}

function formsOf(r) { return getPath(r, ['content', 'invite_forms']); }

module.exports = { FIELD_MAP, toRecord, toB, formsOf, getPath, hasPath };
