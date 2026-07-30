// FitTracker Service Worker — v4
// 最小化策略：不缓存 + 不干扰页面渲染
// clients.claim() 会在页面加载中途抢夺控制权导致白屏，已移除

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  // 清理旧版本缓存
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))
  )
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  e.respondWith(fetch(e.request))
})
