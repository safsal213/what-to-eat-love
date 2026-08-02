const CACHE_NAME = 'what-to-eat-v32-native-feel';
const STATIC_ASSETS = [
  './','index.html','style.css','manifest.json','js/app.js','js/api.js','js/data.js','js/storage.js','js/ui.js',
  'js/swipe.js',
  'js/utils.js',
  'js/smartShuffle.js',
  'js/roulette.js',
  'js/journal.js',
  'js/insights.js',
  'js/achievements/renderer.js',
  'js/timeline/renderer.js',
  'js/rediscover/renderer.js',
  'js/predictions/renderer.js',
  'js/feedback/skeleton.js',
  'js/feedback/celebration.js',
  'js/feedback/toast.js',
  'js/feedback/index.js',
  'js/predictions/engine.js',
  'js/predictions/index.js',
  'js/rediscover/engine.js',
  'js/rediscover/index.js',
  'js/journey/renderer.js',
  'js/journey/engine.js',
  'js/journey/index.js',
  'js/timeline/grouping.js',
  'js/timeline/formatter.js',
  'js/timeline/engine.js',
  'js/timeline/index.js',
  'js/achievements/engine.js',
  'js/achievements/definitions.js',
  'js/achievements/index.js','js/favorites.js','icons/icon-192.png','icons/icon-512.png'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(STATIC_ASSETS)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))));self.clients.claim()});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.hostname.includes('script.google.com')||url.hostname.includes('googleusercontent.com'))return;event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request)))});
