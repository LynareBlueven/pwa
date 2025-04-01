// Implementación base del Service Worker (esta base se genero mediante la instalacion del PWA en Django, solo la copiamos y la pegamos aquí)
var staticCacheName = "django-pwa-v" + new Date().getTime();
var filesToCache = [
    '/offline/', // pagina que nos retornara si no encuentra lo que buscas y no esta almacenado en el cache uwu
    '/static/app/css', //<--- se pasan todos los estilos, librerias, imagenes, etc... gg
    '/static/app/js',
    '/static/app/lib',
    '/static/app/scss',
];

// Caché al instalar <--- Es donde vamos a guardar todo owo
self.addEventListener("install", event => {
    this.skipWaiting();
    event.waitUntil(
        caches.open(staticCacheName)
            .then(cache => {
                console.log('Service Worker: Archivos en caché');
                return cache.addAll(filesToCache).catch(error => {
                    console.error('Service Worker: Error al cachear los recursos en la instalación', error);
                });
            })
    );
});

// Limpiar cachés viejos al activar, en caso de actualizaciones de nuestra página :D
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => cacheName.startsWith("django-pwa-"))
                    .filter(cacheName => cacheName !== staticCacheName)
                    .map(cacheName => caches.delete(cacheName))
            );
        }).catch(error => {
            console.error('Service Worker: Error al limpiar las cachés viejas', error); // se tiene que limpiar en caso de actualización de algún recurso d:
        })
    );
});

// Servir desde la caché con respaldo en caso de fallos <--- Esto es asi por si no hay internet :o
self.addEventListener("fetch", function(event) {
    event.respondWith(
        fetch(event.request)
            .then(function(response) {
                // Si la solicitud de la red es exitosa, se guarda en el caché :D
                return caches.open(staticCacheName)
                    .then(function(cache) {
                        // Clonamos la respuesta
                        var responseClone = response.clone();
                        cache.put(event.request, responseClone)
                            .catch(function(error) {
                                console.error('Service Worker: Error al cachear la respuesta de la red', error);//si la solicitud de cachear la info eso ocurre
                            });
                        return response;
                    });
            })
            .catch(function(error) {
                // Si la red falla, intentamos recuperar el recurso desde la caché y nos retorna este error :(
                console.error('Service Worker: Falló la solicitud de red, sirviendo la página desde la caché', error);
                return caches.match(event.request)
                    .then(function(cachedResponse) {
                        if (cachedResponse) {
                            return cachedResponse;
                        } else {
                            return caches.match('/offline/'); // Te enviara en esta pagina en caso de que no encuentre nada en lo solicitado
                        }
                    });
            })
    );
});
