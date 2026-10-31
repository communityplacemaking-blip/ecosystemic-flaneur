/* The Ecosystemic Flâneur, adaptive mechanism prototype (31.10.2026).
   The knowledge structure behind the mechanism. Nothing here is invented content:
   - LEVELS: the four wandering levels, names as Tomer gave them on 30.10 (preliminary labels).
     The "what changes" rows are the 30.10 concept proposal, kept as proposals until approved.
   - PATHS: the three readiness paths from Tomer's 31.10 brief. Their default level/intro is the
     31.10 proposal ("three dimensions" profile), every dimension stays changeable.
   - Repository A = window.IDEAS (read-only snapshot of the Stage 2 library, ../library/ideas-snapshot.js).
   - Repository B = TOOLS, empty on purpose. Six central purposes are Tomer's; the five roles are secondary.
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
    { id: 'solo', name: 'שוטטות אישית', say: 'מפגש אישי עם מקום.' },
    { id: 'group', name: 'שוטטות משתתפת', say: 'תהליך מונחה לקבוצה או לקהילה, לעיתים בכמה מפגשים.' }
  ];

  K.MOVES = ['ערך', 'שחרור', 'שוטטות', 'קשב', 'הבחנה', 'יצירה', 'חגיגה'];
  /* Tomer's expressions for participatory wandering (31.10). Value and Release: not yet formulated. */
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

  /* Repository B: Participatory tools. Empty until the author adds documented entries. */
  K.PURPOSES = ['הקשבה ושיח משותפים', 'העלאת ידע מבוזר ומקומי', 'למידה הדדית',
    'חקירה ורפלקציה משותפות', 'יצירה ועשייה משותפות', 'גילוי מה שנוצר בין אנשים'];
  K.ROLES = ['הקשבה', 'חקירה', 'שיח', 'יצירה', 'עשייה']; // secondary metadata only
  K.TOOLS = []; // { id, name, type:'tool'|'method', purposes:[0..5], roles:[], source, steps, links:{ideas:[]} }

  /* Tomer's seven topics for the facilitator's preparation (participatory). */
  K.PREP = ['המקום או הקהילה', 'הסיפור והזהות', 'הכוחות והקשרים', 'האתגרים והמתחים',
    'האנשים והקבוצות', 'המטרה', 'העבודה שכבר נעשתה'];

  /* C: Journey templates. A template combines entries from A and B; it is not a repository. */
  K.TEMPLATES = [
    { id: 'adaptive-solo', mode: 'solo', name: 'מסע שוטטות אישי, לפי דרגה',
      state: 'proto', note: 'מספר התחנות ועומקן נקבעים לפי הדרגה שנבחרה.' },
    { id: 'flaneur-b', mode: 'solo', name: 'המשוטט B: יציאה אחת בחמישה שלבים',
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

  root.EF_K = K;
  if (typeof module !== 'undefined') module.exports = K;
})(typeof window !== 'undefined' ? window : globalThis);
