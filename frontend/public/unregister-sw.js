// Unregisters any existing service workers and clears caches
if ('serviceWorker' in navigator) {
  // Unregister all service workers
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister();
      console.log('Service worker unregistered');
    }
  });
  
  // Clear all caches to prevent stale data issues
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
        console.log(`Cache ${cacheName} deleted`);
      });
    });
  }
  
  // If there are any fetch event listeners that are causing problems,
  // this will replace them with a no-op handler that immediately resolves
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CLEAR_FETCH_HANDLERS'
    });
  }
} 