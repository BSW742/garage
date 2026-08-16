// Service Worker for Garage Admin PWA v3

self.addEventListener('install', (event) => {
  console.log('SW: Installing v3');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('SW: Activating v3');
  event.waitUntil(clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('SW: Push received!', event);

  let data = { title: 'Garage', body: 'New notification' };

  if (event.data) {
    try {
      data = event.data.json();
      console.log('SW: Push data:', data);
    } catch (e) {
      console.log('SW: Push parse error:', e);
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/nav/merch-v2.png',
      badge: '/nav/merch-v2.png'
    })
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes('/app') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow('/app');
      }
    })
  );
});
