/* ============================================================
   ColdPics - Service Worker (PWA)
   Cache inteligente + offline + actualización automática
   Autor: ChatGPT (para Felipe Pardo)
============================================================ */

const CACHE_NAME = "coldpics-cache-v3";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./camera.js",
  "./manifest.json",
  "./icons/add.svg",
  "./icons/arrow_back.svg",
  "./icons/camera.svg",
  "./icons/delete.svg",
  "./icons/folder.svg",
  "./icons/image.svg",
  "./icons/menu.svg",
  "./icons/more_vert.svg",
  "./icons/search.svg"
];

/* ============================================================
   INSTALACIÓN: Cachear archivos base
============================================================ */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[ColdPics SW] Cacheando archivos base...");
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

/* ============================================================
   ACTIVACIÓN: Eliminar caches viejos
============================================================ */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[ColdPics SW] Eliminando cache viejo:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

/* ============================================================
   FETCH: Estrategia Offline-First
============================================================ */
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Para GitHub Pages (carpetas), devolver index.html en rutas desconocidas
  if (url.origin === location.origin && !url.pathname.includes(".")) {
    event.respondWith(caches.match("./index.html"));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request)
          .then((response) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response.clone());
              return response;
            });
          })
          .catch(() => {
            // fallback solo si es navegación
            if (event.request.mode === "navigate") {
              return caches.match("./index.html");
            }
          })
      );
    })
  );
});
