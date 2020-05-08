self.addEventListener("install", function (e) {
    e.waitUntil(
        caches.open("HueWheel").then(function (cache) {
            return cache.addAll([
                "./",
                "./index.html",
                "./extra.html",
                "./assets/index.css",
                "./assets/js/jquery-3.1.1.min.js",
                "./assets/js/js.cookie-2.1.3.min.js",
                "./assets/js/login.js",
                "./assets/js/scripts.js",
                "./assets/jquery-wheelcolorpicker-2.5.1/jquery.wheelcolorpicker-2.5.1.min.js",
                "./assets/jquery-wheelcolorpicker-2.5.1/css/wheelcolorpicker.dark.css",
            ]);
        })
    );
});

self.addEventListener("fetch", function (event) {
    console.log(event.request.url);

    event.respondWith(
        caches.match(event.request).then(function (response) {
            return response || fetch(event.request);
        })
    );
});
