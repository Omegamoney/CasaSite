// sw.js

self.addEventListener("install", (event) => {
  console.log("Service Worker Installed!");
  // Optionally cache files here
  event.waitUntil(
    caches.open("app-cache").then((cache) => {
      return cache.addAll([
        "/", // Cache the root URL
        "/index.html", // Cache your main HTML file
        "/style.css", // Cache your CSS
        "/script.js", // Cache your JavaScript
        "/daytime.gif", // Cache your GIFs
        "/afterhours.gif",
      ]);
    })
  );
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker Activated!");
});

self.addEventListener("fetch", (event) => {
  console.log("Fetch Event for", event.request.url);
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
