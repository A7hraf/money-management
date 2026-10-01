// Masroof offline cache. It only stores the app's own files — never your data.
// The app's code is fetched fresh whenever the phone is online, so a push to GitHub shows up
// the next time the app is opened. The cached copy is only used offline.
const VERSION = 'masroof-v11';
const CORE = ['./', './index.html', './css/app.css', './js/i18n.js', './js/globe-data.js', './js/globe.js', './js/globe-countries.js', './js/vendor/globe.gl.min.js', './js/globe3d.js', './images/earth-night.jpg', './images/earth-day.jpg', './js/app.js', './manifest.json', './images/logo.jpg', './images/logo-mark.jpg', './images/icon-180.png', './images/icon-192.png', './images/icon-512.png'];
const OCR = ['./ocr/tesseract.min.js', './ocr/worker.min.js', './ocr/tesseract-core-simd-lstm.wasm.js', './ocr/tesseract-core-lstm.wasm.js', './ocr/lang/eng.traineddata.gz'];
// cache:'reload' skips the browser's own HTTP cache, which could otherwise hand back a stale copy
const fresh = u => new Request(u, { cache: 'reload' });
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(async c => {
    await Promise.all(CORE.map(u => fetch(fresh(u)).then(r => { if (!r.ok) throw new Error(u); return c.put(u, r); })));
    await Promise.all(OCR.map(u => c.add(fresh(u)).catch(() => {}))); // receipt reader, best effort
  }).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const isBig = p => p.includes('/ocr/') || p.includes('/images/'); // large files that rarely change
function fromNetwork(req) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 4000); // slow network: fall back to the cached copy
  return fetch(req.url, { cache: 'no-cache', signal: ctl.signal, credentials: 'same-origin' }).then(res => {
    clearTimeout(t);
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  }, err => { clearTimeout(t); throw err; });
}
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return; // nothing else is ever fetched
  const cached = () => caches.match(req, { ignoreSearch: true });
  if (isBig(url.pathname)) {
    e.respondWith(cached().then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    })));
    return;
  }
  e.respondWith(fromNetwork(req).catch(() => cached().then(hit => hit || caches.match('./index.html'))));
});
