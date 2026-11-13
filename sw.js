/* The Ecosystemic Flâneur as an app: the journey keeps working with a weak connection or none.
   Pages are fetched from the network first (so updates arrive), and the last copy is used offline. */
var CACHE = 'ef-app-v5';
var CORE = [
  './', 'field/', 'journey/', 'mechanism/', 'try/', 'assets/try.js', 'manifest.webmanifest',
  'journey/app.js', 'journey/engine.js', 'journey/knowledge.js', 'journey/journey.css', 'library/ideas-snapshot.js', 'library/ideas-flaneur.js',
  'site.css', 'ef.css', 'assets/worlds.css', 'assets/chrome.css', 'assets/b-skin.css', 'assets/mech.css',
  'assets/field.js', 'assets/circle.js', 'assets/worlds.js', 'assets/app.js',
  'img/flaneur-figure.png', 'img/ego-eco.jpg', 'img/app/icon-192.png'
];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(CORE.map(function (u) { return c.add(u).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(function (res) {
    if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(r, { ignoreSearch: true }).then(function (m) { return m || caches.match('./'); });
  }));
});
