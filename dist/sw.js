// FitTracker Service Worker — v3
const CACHE = 'ft-v3'

self.addEventListener('install', (e) => {
  // 立即接管，不等待
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  // 删除所有旧版本缓存（包括 ft-v1, ft-v2）
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(key => caches.delete(key)))
    })
  )
  // 立即接管所有页面
  e.waitUntil(clients.claim())
  // 接管后通知所有页面刷新
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(clients => {
      clients.forEach(client => client.navigate(client.url))
    })
  )
})

// 纯网络优先 — 不缓存任何东西，避免版本问题
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  e.respondWith(fetch(e.request))
})
