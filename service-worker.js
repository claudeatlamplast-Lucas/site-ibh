/* Service worker básico da Comunidade IBH — existe para permitir a instalação
   como PWA. Faz cache leve do "app shell" e sempre prioriza a rede, para não
   servir conteúdo velho do feed (que vem do Supabase). */

var CACHE_NAME = 'ibh-comunidade-v1';
var APP_SHELL = [
  '/comunidade.html',
  '/manifest.json',
  '/assets/css/site.css',
  '/assets/css/comunidade.css',
  '/assets/js/site.js',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(APP_SHELL);
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(nomes){
      return Promise.all(nomes.filter(function(n){ return n !== CACHE_NAME; }).map(function(n){ return caches.delete(n); }));
    }).then(function(){
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event){
  var req = event.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return; // não mexe em chamadas ao Supabase etc.

  event.respondWith(
    fetch(req).then(function(res){
      var copia = res.clone();
      caches.open(CACHE_NAME).then(function(cache){ cache.put(req, copia); });
      return res;
    }).catch(function(){
      return caches.match(req).then(function(cached){
        return cached || caches.match('/comunidade.html');
      });
    })
  );
});
