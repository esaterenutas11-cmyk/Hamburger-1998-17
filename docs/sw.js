// Couple's Burger Life – çevrimdışı çalışma (PWA service worker)
// Oyun dosyaları (index.html, native.js…) HER ZAMAN önce internetten alınır: güncelleme anında gelir.
// İnternet yoksa en son kaydedilen kopya açılır. 3D kütüphanesi ve simgeler önbellekten gelir (değişmezler).
const CACHE = "burgerbiz-v55";
const FILES = ["./", "./index.html", "./three.min.js", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png"];
const STATIC = /three\.min\.js|\/icons\/|cdnjs\.cloudflare\.com/;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(new Request(f, { cache: "reload" })).catch(() => {})))));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = req.url, own = url.startsWith(self.location.origin);
  if (!own && !url.includes("cdnjs.cloudflare.com")) return;            // Firebase, yazı tipleri vb. tarayıcıya kalsın
  const save = res => { if (res && res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };
  if (STATIC.test(url)){                                                 // değişmeyen büyük dosyalar: önce önbellek
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(save)));
    return;
  }
  // oyunun kendisi: önce internet (her zaman en yeni sürüm), olmazsa önbellek
  e.respondWith(fetch(req, { cache: "no-store" }).then(save).catch(() => caches.match(req).then(hit => hit || caches.match("./index.html"))));
});
