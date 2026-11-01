/* The site as a phone app: the service worker, and the "add to home screen" invitation on the mechanism page. */
(function () {
  'use strict';
  var link = document.querySelector('link[rel="manifest"]');
  if (!link) return;
  var root = new URL('./', link.href).href;
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register(root + 'sw.js', { scope: root }).catch(function () {}); });
  }
  var box = document.querySelector('.app-install');
  if (!box) return;
  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (standalone) return;
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var btn = box.querySelector('button'), how = box.querySelector('.app-how'), deferred = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; box.hidden = false; });
  window.addEventListener('appinstalled', function () { box.hidden = true; });
  if (ios) { box.hidden = false; }
  btn.addEventListener('click', function () {
    if (deferred) { deferred.prompt(); deferred.userChoice.then(function () { deferred = null; }); return; }
    how.hidden = !how.hidden; btn.setAttribute('aria-expanded', String(!how.hidden));
  });
  how.textContent = ios
    ? 'באייפון: לוחצים על כפתור השיתוף בספארי, ובוחרים "הוספה למסך הבית".'
    : 'בתפריט הדפדפן (שלוש הנקודות) בוחרים "התקנת אפליקציה" או "הוספה למסך הבית".';
})();
