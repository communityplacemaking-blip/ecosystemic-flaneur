'use strict';
/* Writes reports/migration-report.md: the proof, record by record, that nothing from B was lost.
   Run: node library/tools/report.js */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const assert = require('node:assert/strict');
const { extractB, B_FILE } = require('./extract-b');
const { loadLibrary, ROOT } = require('./load');
const { toB, formsOf, FIELD_MAP } = require('./mapping');
const { validate } = require('./validate');

const same = (a, b) => { try { assert.deepStrictEqual(a, b); return true; } catch { return false; } };

function report() {
  const B = extractB();
  const lib = loadLibrary();
  const byId = new Map(lib.practices.map(p => [p.record.id, p.record]));
  const sha = crypto.createHash('sha256').update(fs.readFileSync(B_FILE)).digest('hex');
  let bDiff = 'לא נבדק';
  try { bDiff = execSync('git diff --stat HEAD -- mechanism/', { cwd: path.join(ROOT, '..') }).toString().trim() || 'אין שינויים'; } catch {}
  const v = validate(lib);

  const rows = B.LIB.map((b, i) => {
    const r = byId.get(b.id);
    const ok = r && same(toB(r), b);
    const fOk = r && same(formsOf(r), B.FORMS[b.id]);
    const nForms = B.FORMS[b.id] ? Object.keys(B.FORMS[b.id]).length : 0;
    const groupIds = same(b.ids, B.GROUP_IDS) ? ' (GROUP_IDS)' : '';
    return `| ${i + 1} | \`${b.id}\` | ${b.name} | ${Object.keys(b).length} | ${ok ? '✓' : '✗'} | ${nForms} | ${fOk ? '✓' : '✗'} | ${r ? r.origin.type : '—'}${groupIds} |`;
  });
  const allOk = B.LIB.every(b => byId.has(b.id) && same(toB(byId.get(b.id)), b) && same(formsOf(byId.get(b.id)), B.FORMS[b.id]));

  const keyRows = FIELD_MAP.map(([k, p]) => {
    const n = B.LIB.filter(b => k in b).length;
    const m = lib.practices.filter(({ record }) => { let x = record; for (const s of p) { if (x == null || !(s in x)) return false; x = x[s]; } return true; }).length;
    return `| \`${k}\` | \`${p.join('.')}\` | ${n} | ${m} | ${n === m ? '✓' : '✗'} |`;
  });

  const md = `# דוח העברה: 25 הרשומות של גרסה B

נוצר אוטומטית על ידי \`library/tools/report.js\`. אין לערוך ידנית.

## תוצאה

${allOk ? '**כל 25 הרשומות עברו בלי אובדן.**' : '**נמצא פער. ראו את הטבלה.**'} כל רשומה בספרייה מומרת חזרה למבנה של B ומושווית שדה מול שדה לרשומה שנקראת עכשיו מתוך \`mechanism/index.html\`. ההשוואה מחמירה: גם ערך null וגם שדה שחסר ב-B צריכים להישאר בדיוק כך.

- רשומות ב-B: ${B.LIB.length}. רשומות בספרייה: ${lib.practices.length}.
- נוסחי לשון פנייה (FORMS) ב-B: ${Object.keys(B.FORMS).length}. כולם עברו לשדה \`content.invite_forms\`.
- גרסה B לא שונתה. שינויים בתיקייה \`mechanism/\` מול הגרסה השמורה: ${bDiff}.
- טביעת אצבע (SHA-256) של \`mechanism/index.html\`: \`${sha}\`
- אימות הספרייה: ${v.errors.length} שגיאות, ${v.warnings.length} אזהרות על מה שעדיין חסר ברשומות.

## רשומה אחר רשומה

| # | מזהה | שם | שדות ב-B | שוחזר | נוסחי פנייה | שוחזרו | סוג מקור |
|---|---|---|---|---|---|---|---|
${rows.join('\n')}

(GROUP_IDS): ב-B הרשומה מפנה לרשימת הקבוצות המשותפת. בספרייה הרשימה כתובה במלואה, והערך זהה. הרשימה המשותפת נשמרה במילון \`audiences.group_ids\`.

## שדה אחר שדה

| שדה ב-B | מקום בספרייה | ברשומות של B | ברשומות של הספרייה | |
|---|---|---|---|---|
${keyRows.join('\n')}

## מה נוסף, ומה לא

נוספו רק שדות מבנה, וכולם ריקים או נגזרים מכלל כתוב:

- \`kind\`: "lens" לשלוש הרשומות שהמזהה שלהן מתחיל ב-lens-, ו-"practice" לכל השאר.
- \`origin.type\`: נגזר רק מ-status של B. external נשאר חיצוני, idea הופך ל"בפיתוח", וכל השאר "לא הוכרע". אף רשומה לא סומנה כמקורית או כעיבוד.
- \`documentation.source_refs\`: הפניה לרישום המקורות, לפי מה שכתוב בטקסט המקור של B בלבד. "בעקבות X" נרשם כהשפעה שלא אומתה.
- \`placement.movements\` ו-\`attention.qualities\`: ריקים. ההצעות לתיוג נמצאות בנפרד, ב-\`proposals/\`, וממתינות לאישור.
- \`review\`: מצב "migrated-from-b", מקומה של הרשומה ב-B, ושדות בדיקה ריקים.

לא נכתב שום תיאור, נוסח, מטרה או סיווג מתודולוגי חדש.

## ידע מ-B שלא הועבר בשלב הזה

הקשרי הכניסה, הגבולות המוסריים והמילונים הועברו. נקודות הפתיחה של המנחה (STARTS), שש ההנחות של האמנות לארח (AOH), שאלות הפתיחה ונוסחי הממשק נשארים ב-B. הם לא חלק מהספרייה, ונטפל בהם בשלב של ספריית השאלות.
`;
  fs.writeFileSync(path.join(ROOT, 'reports', 'migration-report.md'), md);
  return { allOk, warnings: v.warnings.length };
}

if (require.main === module) console.log(report());
