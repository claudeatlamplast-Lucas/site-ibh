/* Service worker básico da Comunidade IBH — existe para permitir a instalação
   como PWA. Faz cache leve do "app shell" e sempre prioriza a rede, para não
   servir conteúdo velho do feed (que vem do Supabase). */

var CACHE_NAME = 'ibh-comunidade-v2';
var APP_SHELL = [
  '/comunidade.html',
  '/instalar.html',
  '/manifest.json',
  '/assets/css/site.css',
  '/assets/css/comunidade.css',
  '/assets/css/instalar.css',
  '/assets/js/site.js',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/qr-instalar.svg'
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

self.addEventListener('push', function(event){
  var dados = {};
  try{ dados = event.data ? event.data.json() : {}; }catch(e){}
  var titulo = dados.title || 'Comunidade IBH';
  var opcoes = {
    body: dados.body || 'Novo post na comunidade.',
    icon: '/assets/icons/icon-192.png',
    badge: '/assets/icons/icon-192.png',
    data: { url: dados.url || '/comunidade.html' }
  };
  event.waitUntil(self.registration.showNotification(titulo, opcoes));
});

self.addEventListener('notificationclick', function(event){
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/comunidade.html';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(lista){
      for(var i = 0; i < lista.length; i++){
        if(lista[i].url.indexOf(url) !== -1 && 'focus' in lista[i]) return lista[i].focus();
      }
      if(clients.openWindow) return clients.openWindow(url);
    })
  );
});

self.addEventListener('fetch', function(event){
  var req = event.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return; // não mexe em chamadas ao Supabase etc.

  event.respondWith(
    fetch(req, { cache: 'no-store' }).then(function(res){
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
