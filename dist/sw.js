// FitTracker Service Worker — v3
// 纯网络优先策略，不缓存任何内容

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
  // 立即接管所有页面（不强制刷新，避免无限刷新循环）
  e.waitUntil(clients.claim())
})

// 纯网络优先 — 不缓存任何东西，避免版本问题
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  e.respondWith(fetch(e.request))
})
