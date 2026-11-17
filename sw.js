// Garagebook's offline start: keeps a copy of the page and its icons, so the installed app opens without
// a connection. The page itself always comes from the network first, so a new version shows up at once;
// the copy is only used when offline. Nothing else (your garage, sign-in, the server) is cached here.
const CACHE = "garagebook-v2";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png",
  "./fonts/inter-latin.woff2", "./fonts/spacegrotesk-latin.woff2"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;   // the server and other sites: never cached
  const page = e.request.mode === "navigate";
  // Only the app page itself is kept as the offline copy; other pages (privacy, terms…) are left to the network.
  if (page && !/\/(index\.html)?$/.test(url.pathname)) return;
  if (!page && !FILES.some((f) => url.pathname.endsWith(f.replace("./", "/")) && f !== "./")) return;
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(page ? "./index.html" : e.request, copy)); }
      return res;
    }).catch(() => caches.match(page ? "./index.html" : e.request))
  );
});
