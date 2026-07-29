// FitTracker Service Worker — PWA 离线支持
// 版本号每次部署时更新，确保旧缓存被清理
const CACHE = 'ft-v2'

self.addEventListener('install', (e) => {
  // 新 SW 安装后立即激活，不等待旧 SW 释放
  self.skipWaiting()
  // 预缓存关键资源
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll([
        '/',
        '/manifest.json',
        '/icon-192.png',
        '/icon-512.png',
      ]).catch(() => { /* 非关键资源失败不阻塞 */ })
    })
  )
})

self.addEventListener('activate', (e) => {
  // 清理旧版本缓存
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE).map(key => caches.delete(key))
      )
    })
  )
  // 立即接管所有页面
  e.waitUntil(clients.claim())
})

// 网络优先策略 — 始终尝试获取最新资源，网络失败时回退缓存
self.addEventListener('fetch', (e) => {
  // 跳过非 GET 请求和 API 请求
  if (e.request.method !== 'GET') return
  if (e.request.url.includes('/api/')) return

  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(response => {
        // 只缓存成功的静态资源
        if (response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE).then(cache => cache.put(e.request, clone))
        }
        return response
      })
      .catch(() => {
        // 网络失败时尝试缓存
        return caches.match(e.request)
      })
  )
})
