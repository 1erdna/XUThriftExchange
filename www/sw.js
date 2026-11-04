/* UI DEMO ONLY: caches static app shell and sample images, not remote user data. */
const CACHE='xu-thriftexchange-milestone2-v1';
const FILES=['./','./index.html','./css/styles.css','./js/app.js','./assets/icon.svg','./assets/books.jpg','./assets/medical.jpg','./assets/bag.jpg','./assets/math.jpg','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith(caches.match(event.request).then(c=>c||fetch(event.request)));});
