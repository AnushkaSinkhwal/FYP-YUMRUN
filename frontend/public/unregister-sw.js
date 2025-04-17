// Enhanced service worker unregistration script
(function() {
  // Function to unregister service workers
  function unregisterServiceWorkers() {
    if ('serviceWorker' in navigator) {
      // Unregister all service workers
      navigator.serviceWorker.getRegistrations().then(registrations => {
        const unregisterPromises = registrations.map(registration => {
          return registration.unregister()
            .then(() => console.log('Service worker unregistered'))
            .catch(error => console.error('Failed to unregister service worker:', error));
        });
        
        return Promise.all(unregisterPromises);
      }).catch(error => {
        console.error('Error getting service worker registrations:', error);
      });
    }
  }
  
  // Function to clear caches
  function clearCaches() {
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        const deletePromises = cacheNames.map(cacheName => {
          return caches.delete(cacheName)
            .then(() => console.log(`Cache ${cacheName} deleted`))
            .catch(error => console.error(`Failed to delete cache ${cacheName}:`, error));
        });
        
        return Promise.all(deletePromises);
      }).then(() => {
        console.log('Cache runtime deleted');
      }).catch(error => {
        console.error('Error clearing caches:', error);
      });
    }
  }
  
  // Handle potential errors with service worker and cache operations
  try {
    unregisterServiceWorkers();
    clearCaches();
  } catch (e) {
    console.error('Error in service worker cleanup:', e);
  }
})(); 