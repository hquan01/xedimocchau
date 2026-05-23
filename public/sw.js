// Simple service worker for PWA support
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Xe Đi Mộc Châu Notifications';
  const options = {
    body: data.message || 'Bạn có thông báo mới!',
    icon: '/logo.png',
    badge: '/logo.png',
    data: data.metadata || {}
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
