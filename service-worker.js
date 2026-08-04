const CACHE_NAME = "shopping-list-v16";
const CACHE_FIRST_ASSETS = [
  "./icon-192.png",
  "./icon-512.png",
  "./panda-empty.png",
  "./panda13.png",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_FIRST_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isCacheFirst = CACHE_FIRST_ASSETS.some((asset) =>
    url.pathname.endsWith(asset.replace("./", "/"))
  );

  if (isCacheFirst) {
    // めったに変わらないアイコン・マニフェストはキャッシュ優先
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return (
          cached ||
          fetch(event.request).then((res) => {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
            return res;
          })
        );
      })
    );
  } else {
    // HTML本体・画面はネットワーク優先(最新を優先し、オフライン時のみキャッシュへ)
    // ブラウザ自身のHTTPキャッシュも素通りして、必ずサーバーの最新版を取りに行く
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
