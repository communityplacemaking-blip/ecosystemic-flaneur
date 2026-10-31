# דוח העברה: 25 הרשומות של גרסה B

נוצר אוטומטית על ידי `library/tools/report.js`. אין לערוך ידנית.

## תוצאה

**כל 25 הרשומות עברו בלי אובדן.** כל רשומה בספרייה מומרת חזרה למבנה של B ומושווית שדה מול שדה לרשומה שנקראת עכשיו מתוך `mechanism/index.html`. ההשוואה מחמירה: גם ערך null וגם שדה שחסר ב-B צריכים להישאר בדיוק כך.

- רשומות ב-B: 25. רשומות בספרייה: 25.
- נוסחי לשון פנייה (FORMS) ב-B: 15. כולם עברו לשדה `content.invite_forms`.
- גרסה B לא שונתה. שינויים בתיקייה `mechanism/` מול הגרסה השמורה: אין שינויים.
- טביעת אצבע (SHA-256) של `mechanism/index.html`: `07720a28f86d85602192b6b147e86099362d45cbaf05ee842133a5c4265697f2`
- אימות הספרייה: 0 שגיאות, 76 אזהרות על מה שעדיין חסר ברשומות.

## רשומה אחר רשומה

| # | מזהה | שם | שדות ב-B | שוחזר | נוסחי פנייה | שוחזרו | סוג מקור |
|---|---|---|---|---|---|---|---|
| 1 | `attention-now` | מה מבקש תשומת לב עכשיו? | 16 | ✓ | 2 | ✓ | developing |
| 2 | `question-release` | השאלה והשחרור ממנה | 16 | ✓ | 2 | ✓ | unresolved |
| 3 | `count-ten` | ספירה עד 10 | 17 | ✓ | 0 | ✓ | unresolved (GROUP_IDS) |
| 4 | `brown-green` | חומים וירוקים | 16 | ✓ | 2 | ✓ | unresolved |
| 5 | `slow-walk` | הליכה איטית | 16 | ✓ | 2 | ✓ | unresolved |
| 6 | `derive` | דריווה: בכל צומת לפי סקרנות | 16 | ✓ | 2 | ✓ | unresolved |
| 7 | `urban-safari` | ספארי עירוני | 16 | ✓ | 2 | ✓ | external |
| 8 | `third-space` | אזור המעבר | 16 | ✓ | 2 | ✓ | unresolved |
| 9 | `together-apart` | יחד ולחוד | 17 | ✓ | 0 | ✓ | unresolved (GROUP_IDS) |
| 10 | `resonance-text` | טקסט ההדהוד | 18 | ✓ | 2 | ✓ | unresolved |
| 11 | `wonder` | פליאה | 16 | ✓ | 3 | ✓ | unresolved |
| 12 | `encounter` | רגע של מפגש | 16 | ✓ | 3 | ✓ | unresolved |
| 13 | `read-city` | קריאת העיר | 16 | ✓ | 2 | ✓ | unresolved |
| 14 | `potential` | מה מבקש להיוולד כאן? | 16 | ✓ | 2 | ✓ | unresolved |
| 15 | `city-listening` | הקשבת העיר | 16 | ✓ | 2 | ✓ | unresolved |
| 16 | `five-r` | 5R: משקפי סיפור המקום | 17 | ✓ | 0 | ✓ | unresolved (GROUP_IDS) |
| 17 | `one-line` | שורה אחת | 16 | ✓ | 2 | ✓ | unresolved |
| 18 | `small-action` | פעולה קטנה | 16 | ✓ | 2 | ✓ | unresolved |
| 19 | `what-appeared` | מה הופיע שלא תכננתי? | 16 | ✓ | 0 | ✓ | developing |
| 20 | `tell-create` | נחזור לספר, ניצור | 17 | ✓ | 0 | ✓ | unresolved (GROUP_IDS) |
| 21 | `shared-map` | מפה של הידוע המשותף | 17 | ✓ | 0 | ✓ | unresolved |
| 22 | `lens-transience` | עדשה: ארעיות | 15 | ✓ | 0 | ✓ | unresolved |
| 23 | `lens-rhythms` | עדשה: מקצבי העיר | 15 | ✓ | 0 | ✓ | unresolved |
| 24 | `lens-traces` | עדשה: עקבות | 15 | ✓ | 0 | ✓ | unresolved |
| 25 | `one-photo` | תמונה אחת שמספרת משהו עליי | 18 | ✓ | 0 | ✓ | unresolved (GROUP_IDS) |

(GROUP_IDS): ב-B הרשומה מפנה לרשימת הקבוצות המשותפת. בספרייה הרשימה כתובה במלואה, והערך זהה. הרשימה המשותפת נשמרה במילון `audiences.group_ids`.

## שדה אחר שדה

| שדה ב-B | מקום בספרייה | ברשומות של B | ברשומות של הספרייה | |
|---|---|---|---|---|
| `id` | `id` | 25 | 25 | ✓ |
| `name` | `name` | 25 | 25 | ✓ |
| `status` | `documentation.status` | 25 | 25 | ✓ |
| `source` | `documentation.source_note` | 25 | 25 | ✓ |
| `invite` | `content.invite` | 25 | 25 | ✓ |
| `facil` | `content.facilitator_note` | 22 | 22 | ✓ |
| `slots` | `placement.slots` | 25 | 25 | ✓ |
| `axis` | `attention.axis` | 25 | 25 | ✓ |
| `dim` | `attention.direction` | 25 | 25 | ✓ |
| `div` | `attention.diversity` | 25 | 25 | ✓ |
| `depth` | `attention.depth` | 25 | 25 | ✓ |
| `intents` | `fit.intents` | 25 | 25 | ✓ |
| `ids` | `fit.audiences` | 25 | 25 | ✓ |
| `places` | `fit.places` | 25 | 25 | ✓ |
| `min` | `fit.min_minutes` | 25 | 25 | ✓ |
| `facilOnly` | `fit.facilitated_only` | 6 | 6 | ✓ |
| `modes` | `fit.modes` | 1 | 1 | ✓ |
| `tags` | `care.boundary_tags` | 25 | 25 | ✓ |
| `includesTrace` | `output.includes_trace` | 1 | 1 | ✓ |
| `core` | `engine.core` | 1 | 1 | ✓ |

## מה נוסף, ומה לא

נוספו רק שדות מבנה, וכולם ריקים או נגזרים מכלל כתוב:

- `kind`: "lens" לשלוש הרשומות שהמזהה שלהן מתחיל ב-lens-, ו-"practice" לכל השאר.
- `origin.type`: נגזר רק מ-status של B. external נשאר חיצוני, idea הופך ל"בפיתוח", וכל השאר "לא הוכרע". אף רשומה לא סומנה כמקורית או כעיבוד.
- `documentation.source_refs`: הפניה לרישום המקורות, לפי מה שכתוב בטקסט המקור של B בלבד. "בעקבות X" נרשם כהשפעה שלא אומתה.
- `placement.movements` ו-`attention.qualities`: ריקים. ההצעות לתיוג נמצאות בנפרד, ב-`proposals/`, וממתינות לאישור.
- `review`: מצב "migrated-from-b", מקומה של הרשומה ב-B, ושדות בדיקה ריקים.

לא נכתב שום תיאור, נוסח, מטרה או סיווג מתודולוגי חדש.

## ידע מ-B שלא הועבר בשלב הזה

הקשרי הכניסה, הגבולות המוסריים והמילונים הועברו. נקודות הפתיחה של המנחה (STARTS), שש ההנחות של האמנות לארח (AOH), שאלות הפתיחה ונוסחי הממשק נשארים ב-B. הם לא חלק מהספרייה, ונטפל בהם בשלב של ספריית השאלות.
