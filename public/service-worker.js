// Service Worker for Game Habit - Offline Mode
const CACHE_NAME = 'game-habit-v2'
const OFFLINE_URL = '/offline'

// Files to cache for offline use
const STATIC_CACHE_URLS = ['/', '/offline', '/manifest.json']

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_CACHE_URLS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip Supabase API requests (always need network)
  if (request.url.includes('supabase.co')) {
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          // Cache successful responses
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // If offline and requesting a page, show offline page
          if (request.destination === 'document') {
            return caches.match(OFFLINE_URL)
          }
        })
    })
  )
})

// Background sync for offline checkins
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-checkins') {
    event.waitUntil(syncCheckins())
  }
})

async function syncCheckins() {
  try {
    // Get pending checkins from IndexedDB
    const db = await openDB()
    const pendingCheckins = await getAllPendingCheckins(db)

    // Sync each checkin
    for (const checkin of pendingCheckins) {
      try {
        await fetch('/api/checkins', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(checkin.data),
        })

        // Remove from pending queue
        await removePendingCheckin(db, checkin.id)
      } catch (error) {
        console.error('[SW] Failed to sync checkin:', error)
      }
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error)
  }
}

// IndexedDB helpers
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GameHabitDB', 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('pendingCheckins')) {
        db.createObjectStore('pendingCheckins', { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

function getAllPendingCheckins(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingCheckins'], 'readonly')
    const store = transaction.objectStore('pendingCheckins')
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

function removePendingCheckin(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingCheckins'], 'readwrite')
    const store = transaction.objectStore('pendingCheckins')
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// Push notification handling
self.addEventListener('push', (event) => {
  const data = event.data.json()

  const options = {
    body: data.message,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
    },
  }

  event.waitUntil(self.registration.showNotification(data.title || 'Game Habit', options))
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(clients.openWindow(event.notification.data.url || '/'))
})
