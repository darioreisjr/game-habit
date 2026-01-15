// Service Worker Registration and Utilities

export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });

    console.log('Service Worker registered:', registration);

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60000); // Check every minute

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
}

export async function unregisterServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  await registration.unregister();
}

// Queue a checkin for background sync
export async function queueCheckinForSync(checkinData: any) {
  if (typeof window === 'undefined') return;

  try {
    // Open IndexedDB
    const db = await openDB();

    // Add to pending queue
    await addPendingCheckin(db, checkinData);

    // Request background sync if available
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('sync-checkins');
    }
  } catch (error) {
    console.error('Failed to queue checkin:', error);
  }
}

// Check if user is online
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

// Listen to online/offline events
export function setupOnlineListeners(
  onOnline?: () => void,
  onOffline?: () => void
) {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', () => {
    console.log('Back online!');
    onOnline?.();
  });

  window.addEventListener('offline', () => {
    console.log('Gone offline!');
    onOffline?.();
  });
}

// IndexedDB helpers
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GameHabitDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('pendingCheckins')) {
        db.createObjectStore('pendingCheckins', {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
    };
  });
}

function addPendingCheckin(db: IDBDatabase, data: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingCheckins'], 'readwrite');
    const store = transaction.objectStore('pendingCheckins');
    const request = store.add({
      data,
      timestamp: Date.now(),
    });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// Show a notification
export async function showNotification(
  title: string,
  options?: NotificationOptions
) {
  if (typeof window === 'undefined') return;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification(title, {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    ...options,
  });
}
