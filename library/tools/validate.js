'use strict';
/* Checks the library against its dictionaries and source registry. Errors block; warnings only report what
   is still missing in a record, since incomplete records are allowed and kept.
   Run: node library/tools/validate.js */
const { loadLibrary } = require('./load');

const FORM_KEYS = ['n', 'f', 'm', 'p'];
const LIST_OR_ALL = ['intents', 'audiences', 'places'];

function validate(lib) {
  const errors = [], warnings = [];
  const err = (id, msg) => errors.push(`${id}: ${msg}`);
  const warn = (id, msg) => warnings.push(`${id}: ${msg}`);
  const D = lib.dictionaries;
  const ids = name => new Set(D[name].values.map(v => v.id));

  const slots = ids('slots'), statuses = ids('documentation-status'), origins = ids('origin-types');
  const movements = ids('movements'), modes = ids('modes');
  const fitSets = { intents: ids('intents'), audiences: ids('audiences'), places: ids('places') };
  const tags = new Set(D.boundaries.values.map(v => v.excludes_tag).filter(Boolean));
  const ax = D['attention-axes'];
  const axes = new Set(ax.axis.map(v => v.id)), dirs = new Set(ax.direction.map(v => v.id));
  const divs = new Set(ax.diversity.map(v => v.id)), depths = new Set(ax.depth.map(v => v.id));
  const aq = D['attention-qualities'];
  const categories = new Set(aq.categories.map(c => c.id));
  const emerging = new Set((aq.emerging || []).map(e => e.text));
  const sources = new Map(lib.registry.sources.map(s => [s.id, s]));

  const seen = new Set();
  for (const { file, record: r } of lib.practices) {
    const id = r.id || file;
    if (r.schema !== 1) err(id, 'schema חייב להיות 1');
    if (!r.id) { err(file, 'חסר id'); continue; }
    if (file !== `${r.id}.json`) err(id, `שם הקובץ ${file} לא תואם ל-id`);
    if (seen.has(r.id)) err(id, 'id כפול');
    seen.add(r.id);
    if (!r.name) err(id, 'חסר שם');
    if (!['practice', 'lens'].includes(r.kind)) err(id, `kind לא מוכר: ${r.kind}`);

    // origin: never "original"/"adapted" without a recorded decision; external must point to an external source
    const o = r.origin || {};
    if (!origins.has(o.type)) err(id, `סוג מקור לא מוכר: ${o.type}`);
    if (D['origin-types'].values.find(v => v.id === o.type)?.requires_decision && !o.decided_by)
      err(id, `סוג המקור "${o.type}" דורש החלטה מתועדת (origin.decided_by)`);

    const doc = r.documentation || {};
    if (!statuses.has(doc.status)) err(id, `מצב תיעוד לא מוכר: ${doc.status}`);
    if (!doc.source_note) err(id, 'חסר תיאור מקור (source_note)');
    if (!Array.isArray(doc.source_refs) || !doc.source_refs.length) err(id, 'חייבת להיות הפניה אחת לפחות לרישום המקורות');
    for (const s of doc.source_refs || []) if (!sources.has(s)) err(id, `מקור לא קיים ברישום: ${s}`);
    if (o.type === 'external' && !(doc.source_refs || []).some(s => sources.get(s)?.kind === 'external'))
      err(id, 'תרגול חיצוני חייב להפנות למקור חיצוני ברישום');

    const c = r.content || {};
    if (typeof c.invite !== 'string' || !c.invite) err(id, 'חסר נוסח הזמנה');
    if (c.invite_forms) for (const k of Object.keys(c.invite_forms)) if (!FORM_KEYS.includes(k)) err(id, `לשון פנייה לא מוכרת: ${k}`);

    const pl = r.placement || {};
    if (!Array.isArray(pl.slots)) err(id, 'slots חייב להיות רשימה');
    for (const s of pl.slots || []) if (!slots.has(s)) err(id, `שלב לא מוכר: ${s}`);
    if (!Array.isArray(pl.movements)) err(id, 'movements חייב להיות רשימה');
    for (const m of pl.movements || []) if (!movements.has(m)) err(id, `תנועה לא מוכרת: ${m}`);

    const a = r.attention || {};
    if (!axes.has(a.axis)) err(id, `ציר לא מוכר: ${a.axis}`);
    if (!dirs.has(a.direction)) err(id, `כיוון קשב לא מוכר: ${a.direction}`);
    if (!divs.has(a.diversity)) err(id, `ערך מגוון לא מוכר: ${a.diversity}`);
    if (!depths.has(a.depth)) err(id, `עומק לא מוכר: ${a.depth}`);
    if (!Array.isArray(a.qualities)) err(id, 'qualities חייב להיות רשימה');
    for (const q of a.qualities || []) {
      if (q.category === null) { if (!q.text || !emerging.has(q.text)) err(id, 'איכות בלי קטגוריה חייבת להופיע ברשימת המתהוות'); }
      else if (!categories.has(q.category)) err(id, `קטגוריית קשב לא מוכרת: ${q.category}`);
    }

    const f = r.fit || {};
    for (const k of LIST_OR_ALL) {
      const v = f[k];
      if (v === 'all') continue;
      if (!Array.isArray(v)) { err(id, `${k} חייב להיות "all" או רשימה`); continue; }
      for (const x of v) if (!fitSets[k].has(x)) err(id, `${k}: ערך לא מוכר ${x}`);
    }
    if (typeof f.min_minutes !== 'number' || f.min_minutes < 0) err(id, 'משך מינימלי חייב להיות מספר לא שלילי');
    for (const m of f.modes || []) if (!modes.has(m)) err(id, `אופן שילוב לא מוכר: ${m}`);
    for (const t of (r.care || {}).boundary_tags || []) if (!tags.has(t)) err(id, `תגית גבול לא מוכרת: ${t}`);

    // what is still missing: reported, never filled in
    if (r.kind === 'practice' && !(pl.slots || []).length) warn(id, 'אין מקום בחמשת השלבים');
    if (r.kind === 'lens' && doc.status === 'nameonly') warn(id, 'שם בלבד, חסר נוסח');
    if (!(pl.movements || []).length) warn(id, 'אין תיוג תנועה מאושר');
    if (!(a.qualities || []).length) warn(id, 'אין איכות קשב מאושרת');
    if (o.type === 'unresolved') warn(id, 'סוג המקור לא הוכרע');
  }

  for (const ctx of D.contexts.values) for (const p of ctx.prefer) if (!seen.has(p)) err(`context ${ctx.id}`, `מפנה לתרגול שלא קיים: ${p}`);

  // proposals: only known targets and terms, and every basis or text is quoted from the record itself
  const byId = new Map(lib.practices.map(p => [p.record.id, p.record]));
  for (const { file, data } of lib.proposals) for (const p of data.proposals) {
    const r = byId.get(p.id);
    const where = `${file} ${p.id}`;
    if (!r) { err(where, 'הצעה לתרגול שלא קיים'); continue; }
    const words = [r.name, r.content.invite, r.content.facilitator_note || '', ...Object.values(r.content.invite_forms || {})].join('\n');
    for (const m of p.movements) if (!movements.has(m)) err(where, `תנועה לא מוכרת: ${m}`);
    for (const q of p.qualities) {
      if (!categories.has(q.category)) err(where, `קטגוריה לא מוכרת: ${q.category}`);
      if (q.text && !words.includes(q.text)) err(where, `התיאור לא מצוטט מהרשומה: "${q.text}"`);
    }
    for (const b of p.basis) if (!words.includes(b)) err(where, `הבסיס לא מצוטט מהרשומה: "${b}"`);
    if ((p.movements.length || p.qualities.length) && !p.basis.length) err(where, 'הצעה בלי בסיס');
  }

  return { errors, warnings, count: lib.practices.length };
}

module.exports = { validate };

if (require.main === module) {
  const res = validate(loadLibrary());
  console.log(`רשומות: ${res.count} · שגיאות: ${res.errors.length} · אזהרות: ${res.warnings.length}`);
  res.errors.forEach(e => console.log('✗ ' + e));
  if (process.argv.includes('--warnings')) res.warnings.forEach(w => console.log('· ' + w));
  process.exit(res.errors.length ? 1 : 0);
}
