/* The site as an app: the service worker, a quiet "install" button in every page header,
   the "add to home screen" invitation on the journey page (26.11),
   and a "share" button in every header, also inside the installed app where there is no address bar (27.11). */
(function () {
  'use strict';
  var link = document.querySelector('link[rel="manifest"]');
  if (!link) return;
  var root = new URL('./', link.href).href;
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register(root + 'sw.js', { scope: root }).catch(function () {}); });
  }
  shareButton();
  // already opened as the installed app: nothing to offer
  if (window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: window-controls-overlay)').matches || window.navigator.standalone === true) return;

  var ua = navigator.userAgent;
  var ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var macSafari = !ios && /Macintosh/.test(ua) && /Safari\//.test(ua) && !/Chrome|Chromium|CriOS|Edg|Firefox|OPR/.test(ua);
  var lang = (document.documentElement.lang || 'he').slice(0, 2);
  var T = {
    he: { label: 'התקנה', aria: 'להתקין את המשוטט כאפליקציה', title: 'המשוטט כאפליקציה',
          ios: 'באייפון ובאייפד: לוחצים על כפתור השיתוף (ריבוע עם חץ למעלה), ובוחרים "הוספה למסך הבית".',
          mac: 'בספארי במק: בתפריט "קובץ" בוחרים "הוספה ל-Dock".',
          other: 'בתפריט הדפדפן בוחרים "התקנת אפליקציה" או "הוספה למסך הבית".',
          note: 'האתר ייפתח בחלון משלו, עם הסמל של המשוטט.', close: 'לסגור',
          journey: 'להוסיף את המנגנון למסך הבית' },
    en: { label: 'Install', aria: 'Install the Flâneur as an app', title: 'The Flâneur as an app',
          ios: 'On iPhone and iPad: tap the Share button (a square with an arrow pointing up), then choose "Add to Home Screen".',
          mac: 'In Safari on a Mac: open the File menu and choose "Add to Dock".',
          other: 'In your browser menu, choose "Install app" or "Add to Home screen".',
          note: 'The site opens in its own window, with the Flâneur icon.', close: 'Close' },
    fr: { label: 'Installer', aria: 'Installer le Flâneur comme application', title: 'Le Flâneur comme application',
          ios: 'Sur iPhone et iPad : touchez le bouton Partager (un carré avec une flèche vers le haut), puis choisissez « Sur l’écran d’accueil ».',
          mac: 'Dans Safari sur Mac : ouvrez le menu Fichier et choisissez « Ajouter au Dock ».',
          other: 'Dans le menu du navigateur, choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».',
          note: 'Le site s’ouvre dans sa propre fenêtre, avec l’icône du Flâneur.', close: 'Fermer' }
  }[lang] || null;
  if (!T) return;
  var how = ios ? T.ios : macSafari ? T.mac : T.other;
  var deferred = null, shown = [];
  function show(el) { el.hidden = false; shown.push(el); }

  // 1. the header button, beside day/night
  var wb = document.querySelector('header.wb'), sky = wb && wb.querySelector('.sky');
  var hb = null, pop = null;
  if (sky) {
    hb = document.createElement('button');
    hb.type = 'button'; hb.className = 'wb-app'; hb.hidden = true;
    hb.setAttribute('aria-label', T.aria); hb.setAttribute('aria-expanded', 'false'); hb.setAttribute('aria-controls', 'wb-app-pop');
    hb.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="5" y="2" width="10" height="16" rx="2"/><path d="M10 6v6M7.5 9.5 10 12l2.5-2.5"/></svg><span>' + T.label + '</span>';
    sky.parentNode.insertBefore(hb, sky.nextSibling);
    pop = document.createElement('div');
    pop.className = 'wb-app-pop'; pop.id = 'wb-app-pop'; pop.hidden = true; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', T.title);
    pop.innerHTML = '<p class="wap-t"></p><p class="wap-how"></p><p class="wap-note"></p><button type="button" class="wap-x"></button>';
    pop.querySelector('.wap-t').textContent = T.title;
    pop.querySelector('.wap-how').textContent = how;
    pop.querySelector('.wap-note').textContent = T.note;
    pop.querySelector('.wap-x').textContent = T.close;
    wb.appendChild(pop);
    var toggle = function (open) { pop.hidden = !open; hb.setAttribute('aria-expanded', String(open)); };
    hb.addEventListener('click', function () {
      if (deferred) { var d = deferred; d.prompt(); d.userChoice.then(function (c) { if (c && c.outcome === 'accepted') hideAll(); }); deferred = null; return; }
      toggle(pop.hidden);
    });
    pop.querySelector('.wap-x').addEventListener('click', function () { toggle(false); hb.focus(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) { toggle(false); hb.focus(); } });
    document.addEventListener('click', function (e) { if (!pop.hidden && !pop.contains(e.target) && !hb.contains(e.target)) toggle(false); });
  }

  // 2. the invitation on the journey page (unchanged wording)
  var box = document.querySelector('.app-install'), bb = box && box.querySelector('button'), bhow = box && box.querySelector('.app-how');
  if (box) {
    bhow.textContent = ios ? 'באייפון: לוחצים על כפתור השיתוף בספארי, ובוחרים "הוספה למסך הבית".' : macSafari ? T.mac : 'בתפריט הדפדפן (שלוש הנקודות) בוחרים "התקנת אפליקציה" או "הוספה למסך הבית".';
    bb.addEventListener('click', function () {
      if (deferred) { var d = deferred; d.prompt(); d.userChoice.then(function (c) { if (c && c.outcome === 'accepted') hideAll(); }); deferred = null; return; }
      bhow.hidden = !bhow.hidden; bb.setAttribute('aria-expanded', String(!bhow.hidden));
    });
  }

  function offer() { if (hb) show(hb); if (box) show(box); }
  function hideAll() { shown.forEach(function (el) { el.hidden = true; }); if (pop) pop.hidden = true; }
  // Chrome, Edge, Samsung Internet: the browser's own install window. It only fires when the app is not installed yet.
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; offer(); });
  window.addEventListener('appinstalled', hideAll);
  // Safari has no install window: the button opens the two-step instructions
  if (ios || macSafari) offer();

  // the share button: WhatsApp first, then the phone's own share sheet, then copying the link
  function shareButton() {
    var wb = document.querySelector('header.wb'), sky = wb && wb.querySelector('.sky');
    if (!sky) return;
    var lang = (document.documentElement.lang || 'he').slice(0, 2);
    var S = {
      he: { label: 'לשיתוף', aria: 'לשתף את העמוד', title: 'לשתף את המשוטט', wa: 'לשלוח בוואטסאפ', more: 'שיתוף בדרך אחרת', copy: 'להעתיק את הקישור', copied: 'הקישור הועתק', close: 'לסגור' },
      en: { label: 'Share', aria: 'Share this page', title: 'Share the Flâneur', wa: 'Send on WhatsApp', more: 'Share another way', copy: 'Copy the link', copied: 'Link copied', close: 'Close' },
      fr: { label: 'Partager', aria: 'Partager cette page', title: 'Partager le Flâneur', wa: 'Envoyer sur WhatsApp', more: 'Partager autrement', copy: 'Copier le lien', copied: 'Lien copié', close: 'Fermer' }
    }[lang] || null;
    if (!S) return;
    var u = new URL(location.href);
    u.searchParams.delete('source'); u.hash = '';
    var url = u.href, title = document.title;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'wb-app wb-share';
    b.setAttribute('aria-label', S.aria); b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'wb-share-pop');
    b.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="15" cy="4.5" r="2.3"/><circle cx="5" cy="10" r="2.3"/><circle cx="15" cy="15.5" r="2.3"/><path d="M7 8.9l6-3.3M7 11.1l6 3.3"/></svg><span>' + S.label + '</span>';
    sky.parentNode.insertBefore(b, sky.nextSibling);
    var pop = document.createElement('div');
    pop.className = 'wb-app-pop wb-share-pop'; pop.id = 'wb-share-pop'; pop.hidden = true; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', S.title);
    pop.innerHTML = '<p class="wap-t"></p><div class="wsh"><a class="wsh-wa" target="_blank" rel="noopener"></a>' +
      (navigator.share ? '<button type="button" class="wsh-more"></button>' : '') +
      '<button type="button" class="wsh-copy"></button></div><p class="wsh-url" dir="ltr"></p><button type="button" class="wap-x"></button>';
    pop.querySelector('.wap-t').textContent = S.title;
    var wa = pop.querySelector('.wsh-wa');
    wa.textContent = S.wa; wa.href = 'https://wa.me/?text=' + encodeURIComponent(title + '\n' + url);
    if (navigator.share) pop.querySelector('.wsh-more').textContent = S.more;
    var cp = pop.querySelector('.wsh-copy'); cp.textContent = S.copy;
    pop.querySelector('.wsh-url').textContent = url.replace(/^https?:\/\//, '');
    pop.querySelector('.wap-x').textContent = S.close;
    wb.appendChild(pop);
    var toggle = function (open) {
      pop.hidden = !open; b.setAttribute('aria-expanded', String(open));
      if (open) { var o = document.getElementById('wb-app-pop'); if (o) o.hidden = true; }
    };
    b.addEventListener('click', function () { toggle(pop.hidden); });
    wa.addEventListener('click', function () { toggle(false); });
    if (navigator.share) pop.querySelector('.wsh-more').addEventListener('click', function () {
      navigator.share({ title: title, url: url }).catch(function () {}); toggle(false);
    });
    cp.addEventListener('click', function () {
      var done = function () { cp.textContent = S.copied; setTimeout(function () { cp.textContent = S.copy; }, 2200); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(done, fallback); else fallback();
      function fallback() {
        var t = document.createElement('textarea'); t.value = url; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
        document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) {} document.body.removeChild(t);
      }
    });
    pop.querySelector('.wap-x').addEventListener('click', function () { toggle(false); b.focus(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) { toggle(false); b.focus(); } });
    document.addEventListener('click', function (e) { if (!pop.hidden && !pop.contains(e.target) && !b.contains(e.target)) toggle(false); });
  }
})();
