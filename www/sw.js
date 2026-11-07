/* Milestone 3: cache app shell as an offline fallback; always try fresh local assets first. */
const CACHE='xu-thriftexchange-milestone3-v1';
const FILES=['./','./index.html','./css/styles.css','./js/app.js','./js/firebase-config.js','./js/firebase-core.js','./js/google-sso.js','./js/features/item-listings.js','./js/features/item-status.js','./js/features/search-filter.js','./js/features/reservations.js','./assets/icon.svg','./assets/books.jpg','./assets/medical.jpg','./assets/bag.jpg','./assets/math.jpg','./manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 e.respondWith(fetch(e.request).then(resp=>{if(resp.ok){const copy=resp.clone();void caches.open(CACHE).then(c=>c.put(e.request,copy));}return resp;}).catch(()=>caches.match(e.request)));
});
