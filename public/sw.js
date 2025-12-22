// Service Worker for Push Notifications

self.addEventListener('push', function(event) {
  console.log('[SW] Push event received:', event);
  
  let data = {
    title: 'New Call Sheet',
    body: 'A new call sheet has been published',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: {}
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: [
      { action: 'view', title: 'View Call Sheet' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    requireInteraction: true,
    tag: 'call-sheet-notification'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification click:', event.action);
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/';
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(function(clientList) {
          for (const client of clientList) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

self.addEventListener('install', function(event) {
  console.log('[SW] Service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('[SW] Service worker activated');
  event.waitUntil(clients.claim());
});
