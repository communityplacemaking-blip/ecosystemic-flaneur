'use strict';
/* One-time migration of mechanism B's data into the library. Reads B, never writes to it.
   Run: node library/tools/migrate.js [--force]
   Without --force an existing file is left as it is, so later edits to the library are never overwritten. */
const fs = require('fs');
const path = require('path');
const { extractB } = require('./extract-b');
const { toRecord } = require('./mapping');

const ROOT = path.join(__dirname, '..');
const FORCE = process.argv.includes('--force');

/* Which registry sources a B source text names. Only what the text itself says; "בעקבות X" becomes an
   influence entry whose attribution is not verified. */
const SOURCE_REFS = {
  'מסמך הרקע: הזמנת הפתיחה של אב-הטיפוס': ['background-doc'],
  '"איך משוטטים", שלבים 1 ו-2: ניסוח השאלה ושחרור השליטה': ['how-to-wander'],
  'תרגילי הקשבה, סדנת "הזמנה ללכת לאיבוד"': ['workshop-getting-lost-2015'],
  '"איך משוטטים", שלב 3: פתיחת הקשב': ['how-to-wander'],
  'מפת התרגילים, "איך משוטטים", בעקבות דבור והסיטואציוניסטים': ['exercise-map', 'how-to-wander', 'influence-debord'],
  'Flaneur Society, Guide to Getting Lost (בתיקייה)': ['guide-getting-lost'],
  'מפת התרגילים, "איך משוטטים", בעקבות מישל סר (הייחוס לבדיקה)': ['exercise-map', 'how-to-wander', 'influence-serres'],
  'הזמנת 2015: "מוזמנים להנות יחד ולחוד מן התנאים לגלוי"': ['invitation-2015'],
  '"איך משוטטים": התרגיל שתומר תיאר כ"לב השיטה". מוצע, טרם הוכרע': ['how-to-wander'],
  'מפת התרגילים, בעקבות אברהם יהושע השל': ['exercise-map', 'influence-heschel'],
  'מפת התרגילים, בעקבות מרטין בובר': ['exercise-map', 'influence-buber'],
  'מפת התרגילים, בעקבות וולטר בנימין': ['exercise-map', 'influence-benjamin'],
  'מפת התרגילים, בעקבות אוטו שארמר': ['exercise-map', 'influence-scharmer'],
  'מפת התרגילים ותרגיל ההקשבה בעיניים עצומות מסדנת 2015': ['exercise-map', 'workshop-getting-lost-2015'],
  'סדנת "סיפור המקום בשילוב צא ולמד"': ['workshop-place-story'],
  '"איך משוטטים", שלב 6 (רישום במחברת), ו"להוסיף שורה לעולם"': ['how-to-wander', 'add-a-line'],
  '"איך משוטטים", שלב 6': ['how-to-wander'],
  'המדרג: תמונת א/ב/ג': ['hamadreg'],
  'מבנה סדנת "הזמנה ללכת לאיבוד": נחשף להשראה, נצא לשוטט, נחזור לספר, ניצור': ['workshop-getting-lost-2015'],
  'סדנת "סיפור המקום": REVIEW, מפה של הידוע המשותף': ['workshop-place-story'],
  'נושאי סדנת "הזמנה ללכת לאיבוד", 2015': ['workshop-getting-lost-2015'],
  'המפגש הראשון של "משיבי הרוח" (האיות לבדיקה), לפי התיאור של תומר': ['meshivei-haruach']
};

/* Origin type. Decided rule (proposal doc, 31.10): nothing is "original" or "adapted" without documentation.
   B's own status gives the only two non-unresolved cases. */
function originOf(b) {
  if (b.status === 'external') return { type: 'external', note: 'B מסמן מקור חיצוני.' };
  if (b.status === 'idea') return { type: 'developing', note: 'B מסמן רעיון מתועד שטרם נוסה.' };
  return { type: 'unresolved', note: null };
}

function write(rel, data) {
  const file = path.join(ROOT, rel);
  if (fs.existsSync(file) && !FORCE) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  return true;
}

function migrate() {
  const B = extractB();
  const written = [];
  const out = (rel, data) => { if (write(rel, data)) written.push(rel); };

  B.LIB.forEach((b, i) => {
    const r = toRecord(b, B.FORMS[b.id]);
    const unknown = !SOURCE_REFS[b.source];
    if (unknown) throw new Error(`no source mapping for ${b.id}: ${b.source}`);
    const rec = {
      schema: r.schema, id: r.id, name: r.name,
      kind: b.id.startsWith('lens-') ? 'lens' : 'practice',
      origin: { ...originOf(b), decided_by: null },
      documentation: { ...r.documentation, source_refs: SOURCE_REFS[b.source] },
      content: r.content, placement: r.placement, attention: r.attention, fit: r.fit, care: r.care,
      ...(r.output ? { output: r.output } : {}), ...(r.engine ? { engine: r.engine } : {}),
      review: { state: 'migrated-from-b', b_order: i, confidence: null, checked_by: null, checked_at: null }
    };
    out(`practices/${b.id}.json`, rec);
  });

  const dict = (name, label, values, extra = {}) => out(`dictionaries/${name}.json`, { name, label, from_b: true, ...extra, values });
  dict('slots', 'חמשת השלבים במנגנון', B.SLOTS.map(s => ({ id: s.key, label: s.name, share: s.share })));
  dict('documentation-status', 'מצב התיעוד (מ-B)', Object.entries(B.STATUS).map(([id, label]) => ({ id, label })),
    { note: 'מה ידוע על התיעוד של התרגול. נפרד מסוג המקור (origin).' });
  dict('audiences', 'למי', Object.entries(B.IDS).map(([id, label]) => ({ id, label })), { group_ids: B.GROUP_IDS });
  dict('places', 'סוג מרחב', Object.entries(B.PLACES).map(([id, label]) => ({ id, label })));
  dict('intents', 'סוג כוונה', Object.entries(B.TYPES).map(([id, label]) => ({ id, label })));
  dict('modes', 'אופן שילוב (שדה מוצע, לא הוכרע)', Object.entries(B.MODES).map(([id, label]) => ({ id, label })));
  dict('boundaries', 'גבולות מוסריים ותגיות גבול', Object.entries(B.MORAL).map(([id, m]) => ({ id, label: m.label, excludes_tag: m.excl })));
  dict('contexts', 'הקשרי כניסה', B.CONTEXTS);
  return { B, written };
}

module.exports = { migrate, SOURCE_REFS, originOf };

if (require.main === module) {
  const { written } = migrate();
  console.log(written.length ? `written ${written.length} files:\n` + written.join('\n') : 'nothing written (files exist; use --force)');
}
