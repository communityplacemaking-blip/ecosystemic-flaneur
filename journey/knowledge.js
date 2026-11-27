/* The Ecosystemic Flâneur, adaptive mechanism prototype (31.10.2026).
   The knowledge structure behind the mechanism. Nothing here is invented content:
   - LEVELS: the four wandering levels, names as given on 30.10 (preliminary labels).
     The "what changes" rows are the 30.10 concept proposal, kept as proposals until approved.
   - PATHS: the three readiness paths from the 31.10 brief. Their default level/intro is the
     31.10 proposal ("three dimensions" profile), every dimension stays changeable.
   - Repository A = window.IDEAS (read-only snapshot of the Stage 2 library, ../library/ideas-snapshot.js).
   - Repository B = TOOLS, empty on purpose. Six central purposes are the author's; the five roles are secondary.
   - Journey templates C = TEMPLATES. */
(function (root) {
  var K = {};

  K.LEVELS = [
    { id: 'l1', name: 'מתנסה', en: 'Beginner',
      depthQ: 'מה ראיתי?', practice: 'תרגול אחד קצר', independence: 'מודרך צעד אחר צעד',
      observe: 'חושים ופרטים', guidance: 'הסבר קצר בכל שלב, דוגמה אחת', fruit: 'צילום או מילה אחת',
      wheel: 'לא מוצג' },
    { id: 'l2', name: 'משוטט מתחיל', en: 'Developing Wanderer',
      depthQ: 'מה הפתיע אותי?', practice: 'שניים עד שלושה, ברצף', independence: 'מודרך, עם בחירות',
      observe: 'סיפורים וסימנים', guidance: 'הסבר כשנוגעים', fruit: 'מה הפתיע',
      wheel: 'לא מוצג' },
    { id: 'l3', name: 'משוטט מיומן', en: 'Skilled Wanderer',
      depthQ: 'מה מחבר בין הדברים?', practice: 'שילוב עדשות, כמו 5R', independence: 'הנחיה קלה',
      observe: 'קשרים וקולות', guidance: 'רק כשמבקשים', fruit: 'קשר שנגלה',
      wheel: 'סיבוב אחד, שכבה אחת (כשיהיה מאגר שאלות)' },
    { id: 'l4', name: 'משוטט אקוסיסטמי', en: 'Deep Ecosystemic Wanderer',
      depthQ: 'איזה דפוס חוזר, מתח או אפשרות מתהווה?', practice: 'תהליך שמרכיבים בדרך, גם לקבוצה',
      independence: 'פתוח, הגלגל רק מזמין', observe: 'מערכת, שכבות וזמנים',
      guidance: 'כמעט בלי, ומקורות למי שרוצה', fruit: 'שאלה חדשה, הבנה שהשתנתה',
      wheel: 'מלא (כשיהיה מאגר שאלות)' }
  ];

  K.PATHS = [
    { id: 'explore', label: 'אני רוצה לחקור',
      say: 'אני יודע/ת מה אני רוצה לחקור. עזרו לי ליצור מסע שוטטות.',
      intro: 'touch', level: 'l2' },
    { id: 'meet', label: 'אני רוצה להכיר את המשוטט קודם',
      say: 'סקרן/ית, אבל רוצה להבין מהו המשוטט האקוסיסטמי לפני שמתחילים.',
      intro: 'full', level: 'l1' },
    { id: 'deep', label: 'משוטט מנוסה או מנחה',
      say: 'מכיר/ה את השיטה ורוצה ליצור תהליך עמוק או מורכב יותר.',
      intro: 'none', level: 'l3' }
  ];

  K.MODES = [
    { id: 'solo', name: 'שוטטות אישית', say: 'דיאלוג עם הסביבה: מקומות, סיפורים, עקבות וגילויים לא צפויים.' },
    { id: 'group', name: 'שוטטות משתתפת', say: 'דיאלוג עם אנשים: ידע מקומי וחוכמה משותפת. תהליך מונחה, לעיתים בכמה מפגשים.' }
  ];

  K.MOVES = ['ערך', 'שחרור', 'שוטטות', 'קשב', 'הבחנה', 'יצירה', 'חגיגה'];
  /* The expressions for participatory wandering (31.10). Value and Release: not yet formulated. */
  K.MOVES_GROUP = [null, null, 'חקירה משותפת, לא בהכרח הליכה במרחב', 'לקולות רבים, ליחסים ולמקום עצמו',
    'דפוסים משותפים, ידע מקומי, מתחים ואפשרויות', 'רעיונות משותפים, יוזמות וצורות שיתוף פעולה חדשות',
    'הכרה במה שעלה, במה שהתאפשר ובאנשים שתרמו'];
  K.CELEBRATION = 'החגיגה היא רפלקציה שנשענת על הכרת תודה: מה נפגש, מה התאפשר, מה נלמד, ואילו אנשים, יחסים ונסיבות תרמו לכך. היא לא דוח ולא הערכה, והיא שומרת את האפשרות לחזור אל הערך בהבנה שהשתנתה.';

  K.INSIGHTS = [
    { n: 'חכמת רבים', d: 'אף אחד לא רואה את כל התמונה. כשאנשים שונים משתפים במה שהם יודעים, יכולה לצמוח הבנה שאף אחד מהם לא היה מגיע אליה לבד.' },
    { n: 'מגוון זה חיים', d: 'מגוון של אנשים, מינים, נקודות מבט ודרכי ידיעה נותן למערכת חיה עושר, יכולת הסתגלות ואפשרויות. זה לא רק משהו שצריך לסבול.' },
    { n: 'מידת האמצע', mid: true, d: 'לזהות את המידה הנכונה, בלי לצבור, לצרוך או לקחת יותר ממה שצריך. זו לא בינוניות ולא פשרה אוטומטית, אלא שיקול דעת בכל מצב, מתוך התלות שלנו ברשת החיים והתרומה שלנו לה.' },
    { n: 'הקשבה זו חכמה', d: 'להקשיב זה להכיר בכך שנקודת המבט שלנו חלקית. כשמקשיבים לאחרים, למקום, לטבע ולמה שעוד לא מבינים, לומדים את מה שלא נראה מנקודת מבט אחת.' },
    { n: 'הוקרת היש', d: 'לפני שמחפשים עוד, לשים לב למה שכבר כאן ולהוקיר אותו: אנשים, קשרים, מקומות והזדמנויות. הכרת תודה מאזנת את הלחץ לצבור עוד ועוד.' }
  ];

  K.PLACES = [
    { id: 'city', name: 'עיר ורחוב' }, { id: 'neighborhood', name: 'שכונה' },
    { id: 'nature', name: 'טבע או גינה' }, { id: 'institution', name: 'מוסד, בית ספר או ארגון' },
    { id: 'other', name: 'מקום אחר' }
  ];

  /* Repository B: Participatory tools. The records live in library/tools-data.js (window.TOOLS) and reach the
     journey through the tool catalogs (library/catalog/catalog.js, 16.11); K.TOOLS is kept for older readers. */
  K.PURPOSES = ['הקשבה ושיח משותפים', 'העלאת ידע מבוזר ומקומי', 'למידה הדדית',
    'חקירה ורפלקציה משותפות', 'יצירה ועשייה משותפות', 'גילוי מה שנוצר בין אנשים'];
  K.ROLES = ['הקשבה', 'חקירה', 'שיח', 'יצירה', 'עשייה']; // secondary metadata only
  K.TOOLS = root.TOOLS || [];

  /* The seven topics for the facilitator's preparation (participatory). */
  K.PREP = ['המקום או הקהילה', 'הסיפור והזהות', 'הכוחות והקשרים', 'האתגרים והמתחים',
    'האנשים והקבוצות', 'המטרה', 'העבודה שכבר נעשתה'];

  /* C: Journey templates. A template combines entries from A and B; it is not a repository. */
  K.TEMPLATES = [
    { id: 'adaptive-solo', mode: 'solo', name: 'מסע שוטטות אישי, לפי דרגה',
      state: 'proto', note: 'מספר התחנות ועומקן נקבעים לפי הדרגה שנבחרה.' },
    { id: 'flaneur-b', mode: 'solo', name: 'מסע בחמישה שלבים: יציאה אישית אחת',
      state: 'live', href: '../mechanism/', note: 'כניסה, תנועה, הבחנה, עקבה, חזרה. נשמר כמו שהוא.' },
    { id: 'participatory-dialogue', mode: 'group', name: 'שוטטות בדיאלוג משתתף',
      state: 'proto', note: 'הכנה עם המנחה, מפגשים שמשלבים רעיון ממאגר א וכלי ממאגר ב, וקציר משותף ביניהם.' }
  ];

  /* Words that may connect a person's answer to a record's own wording.
     Only used to find overlap in the record's existing text; never to tag records. */
  K.THEMES = [
    { id: 'stories', name: 'סיפורים וזיכרון', w: ['סיפור', 'סיפורים', 'זיכרון', 'זכרון', 'היסטוריה', 'עבר', 'מספר', 'לספר'] },
    { id: 'people', name: 'אנשים ומפגשים', w: ['אנשים', 'שכנים', 'קהילה', 'מפגש', 'מפגשים', 'תושבים', 'ילדים', 'זרים'] },
    { id: 'sound', name: 'צלילים והקשבה', w: ['קול', 'קולות', 'צליל', 'צלילים', 'רעש', 'שקט', 'הקשבה', 'להקשיב', 'שומע'] },
    { id: 'nature', name: 'טבע וחיים', w: ['טבע', 'עצים', 'עץ', 'ירוק', 'צמחים', 'ציפורים', 'גינה', 'פארק', 'אדמה', 'מים'] },
    { id: 'built', name: 'המרחב הבנוי', w: ['רחוב', 'רחובות', 'בניינים', 'בתים', 'אדריכלות', 'עיר', 'שכונה', 'מבנה', 'קירות', 'צומת'] },
    { id: 'change', name: 'זמן ושינוי', w: ['שינוי', 'משתנה', 'זמן', 'ארעי', 'חדש', 'ישן', 'נעלם', 'מתחדש', 'עתיד'] },
    { id: 'wonder', name: 'פליאה והפתעה', w: ['פליאה', 'הפתעה', 'מפתיע', 'קסם', 'יופי', 'סקרנות'] },
    { id: 'possible', name: 'אפשרויות ויצירה', w: ['אפשרות', 'אפשרויות', 'ליצור', 'יצירה', 'פעולה', 'לעשות', 'להיוולד', 'פוטנציאל', 'רעיון'] }
  ];

  /* Practices that need a group, a pair or a circle. A personal journey never offers them (creator 27.11:
     "if it is personal wandering, find personal processes and tools, not group participatory ones"). */
  K.GROUP_ONLY = ['count-ten', 'together-apart', 'five-r', 'tell-create', 'shared-map', 'one-photo',
    'simultaneous-drift', 'describe-to-see', 'footsteps'];

  /* Lenses for a personal journey (27.11). A lens is what the wanderer practices on the way: a point of view, a pace,
     a character, traces, patterns. Each one says what you practice and where the idea comes from. The engine offers
     the lenses that the person's own words point to. w: words that point to the lens; th: the themes that do. */
  K.LENSES = [
    { id: 'viewpoint', name: 'נקודת מבט',
      practice: 'משנים עמדה ושואלים מה השתנה: מלמעלה או מלמטה, מקרוב או מרחוק, מהצד השני של הרחוב.',
      source: 'מתוך "חמש שכבות של התבוננות" בארגז הכלים של המשוטט: המבט המשתנה.',
      href: 'library/toolbox/#t-five-layers',
      w: ['מבט', 'לראות', 'רואה', 'אחרת', 'זווית', 'נקודת', 'חדש', 'רעיון', 'להבין'], th: ['built', 'possible'] },
    { id: 'pace', name: 'קצב',
      practice: 'הולכים בקצב שהמקום מזמין ולא בקצב של משימה. מאטים כשמשהו מושך, ועוצרים בלי סיבה.',
      source: 'ולטר בנימין מספר שבפריז, סביב 1840, היה לזמן קצר אופנתי לטייל בפסאז׳ים עם צב, ולתת לו לקבוע את הקצב.', refs: ['Walter Benjamin, Das Paris des Second Empire bei Baudelaire (1938)'],
      w: ['לאט', 'האטה', 'מהר', 'קצב', 'עצירה', 'לעצור', 'שקט', 'רגוע', 'לחץ', 'עומס', 'זמן', 'מנוחה'], th: ['sound', 'nature'] },
    { id: 'rhythms', name: 'מקצבי העיר',
      practice: 'מקשיבים למה שחוזר במקום: מתי הוא מתמלא ומתי מתרוקן, מה קורה כל יום ומה קורה רק פעם אחת.',
      source: 'אחת העדשות בסדנאות "הזמנה ללכת לאיבוד". קווין לינץ׳ כתב על הזמן כפי שהוא נחווה במרחב: מחזורי היום, העונות, ומה שנשאר מן העבר. אנרי לפבר התבונן ברחוב מחלון ביתו בפריז וקרא אותו דרך המקצבים שלו, בספרו על "ריתמואנליזה".',
      refs: ['Kevin Lynch, What Time Is This Place? (1972)', 'Henri Lefebvre, Éléments de rythmanalyse (1992)'],
      field: 'time',
      w: ['מקצב', 'קצב', 'בוקר', 'ערב', 'לילה', 'שגרה', 'יומיום', 'תנועה', 'רדום', 'ער', 'חוזר', 'שעות'], th: ['change', 'sound'] },
    { id: 'transience', name: 'ארעיות',
      practice: 'מחפשים את מה שלא יהיה כאן מחר: צל, מודעה, שיחה, ערימת עלים, רגע שעובר.',
      source: 'אחת העדשות בסדנאות "הזמנה ללכת לאיבוד". שארל בודלר כתב ב"צייר החיים המודרניים" שהמודרניות היא "החולף, הנמלט, המקרי" (בתרגום חופשי).', refs: ['Charles Baudelaire, Le Peintre de la vie moderne (1863)'],
      field: 'time',
      w: ['ארעי', 'ארעיות', 'רגע', 'חולף', 'משתנה', 'שינוי', 'נעלם', 'זמני', 'עובר', 'מתחלף'], th: ['change', 'wonder'] },
    { id: 'traces', name: 'עקבות',
      practice: 'מחפשים סימנים של מי שעבר כאן לפניכם: שביל רמוס בדשא, שם על קיר, כיסא שהוזז.',
      source: 'אחת העדשות בסדנאות "הזמנה ללכת לאיבוד". ולטר בנימין: "לחיות פירושו להשאיר עקבות".', refs: ['Walter Benjamin, Paris, die Hauptstadt des XIX. Jahrhunderts (1935)'],
      field: 'memory',
      w: ['עקבות', 'עקבה', 'סימן', 'סימנים', 'זיכרון', 'זכרון', 'עבר', 'היסטוריה', 'ישן', 'נעלם', 'סיפור', 'סיפורים'], th: ['stories'] },
    { id: 'legibility', name: 'לקרוא את העיר',
      practice: 'שמים לב איך אתם מתמצאים: באילו נתיבים הולכים, איפה עוברים גבול, באיזה רובע אתם, איפה צומת שאנשים מתכנסים בו, ומה ציון הדרך שלכם.',
      source: 'קווין לינץ׳, "דימוי העיר": עד כמה עיר "קריאה" למי שהולך בה. לינץ׳ ביקש מתושבים לצייר את עירם מן הזיכרון, ומצא חמישה מרכיבים שמהם בונים מפה בראש: נתיבים, גבולות, רבעים, צמתים וציוני דרך.', refs: ['Kevin Lynch, The Image of the City (1960)'],
      href: 'library/toolbox/#t-memory-map',
      w: ['רחוב', 'רחובות', 'צומת', 'גבול', 'גבולות', 'שכונה', 'רובע', 'דרך', 'מפה', 'להתמצא', 'שביל', 'כיכר', 'מבנה', 'ללכת', 'הליכה'], th: ['built'] },
    { id: 'character', name: 'דמות',
      practice: 'יוצאים בעיניים של מישהו אחר: ילדה, אורח שהגיע הבוקר, ארכאולוג מהעתיד. בסוף יוצאים מהדמות ורושמים מה היא ראתה.',
      source: 'מתוך "התחפשות המשוטט" בארגז הכלים של המשוטט.',
      href: 'library/toolbox/#t-flaneur-disguise',
      w: ['דמות', 'ילד', 'ילדים', 'זרים', 'זר', 'דמיון', 'משחק', 'יצירתי', 'יצירה', 'אנשים', 'תקוע'], th: ['people', 'wonder'] },
    { id: 'patterns', name: 'דפוסים',
      practice: 'שמים לב למה שחוזר ומתחבר: איפה אנשים עוצרים, איפה נוצר קשר, מה מוביל למה.',
      source: 'קשב לדפוסים הוא לב "המרחב הכאורדי" בשיטה: סימנים של סדר חדש שמתחיל לצמוח. וברוח "שפת תבניות" של כריסטופר אלכסנדר.', refs: ['Christopher Alexander et al., A Pattern Language (1977)'],
      href: 'flaneur/',
      w: ['דפוס', 'דפוסים', 'חוזר', 'קשר', 'קשרים', 'חיבור', 'חיבורים', 'רשת', 'מערכת', 'שיתוף', 'קהילה', 'קהילתי', 'נפרד', 'מחובר'], th: ['people', 'built'] }
  ];
  /* How many lenses each level offers (proposal 27.11): one to start, more as the wanderer deepens. */
  K.LENS_COUNT = { l1: 1, l2: 1, l3: 2, l4: 3 };

  root.EF_K = K;
  if (typeof module !== 'undefined') module.exports = K;
})(typeof window !== 'undefined' ? window : globalThis);
