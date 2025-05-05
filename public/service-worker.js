// This service worker handles push notifications

self.addEventListener('push', function(event) {
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }
  
  try {
    // Parse the notification data
    const data = event.data.json();
    
    // Show the notification
    const promiseChain = self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon-192.png',
      badge: '/icons/badge-96.png',
      data: {
        url: data.url || '/'
      }
    });
    
    event.waitUntil(promiseChain);
  } catch (error) {
    console.error('Error showing notification:', error);
  }
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Get the URL to open
  const urlToOpen = event.notification.data?.url || '/';
  
  // Open the URL in a new window/tab or focus an existing one
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  })
  .then((windowClients) => {
    // Check if there is already a window/tab open with the target URL
    let matchingClient = null;
    
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      
      // If the client URL starts with our target URL, focus it
      if (client.url.startsWith(self.location.origin) && 'focus' in client) {
        matchingClient = client;
        break;
      }
    }
    
    // If we found a matching client, focus it
    if (matchingClient) {
      return matchingClient.focus().then(() => {
        // If the URL is different, navigate to it
        if (matchingClient.url !== urlToOpen) {
          return matchingClient.navigate(urlToOpen);
        }
      });
    }
    
    // If no matching client, open a new window/tab
    if (clients.openWindow) {
      return clients.openWindow(urlToOpen);
    }
  });
  
  event.waitUntil(promiseChain);
});

// Handle service worker installation
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim());
});
