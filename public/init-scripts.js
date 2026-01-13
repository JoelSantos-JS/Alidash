// Service Worker Registration (desativado em localhost e com ?sw=off)
(function() {
  const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const devPorts = ['3000', '3001', '3002'];
  const isDevPort = devPorts.includes(location.port);
  const disableSw = isLocalhost || location.search.includes('sw=off');

  async function clearServiceWorkerCache() {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        console.log('🔄 Desregistrando service worker...');
        await registration.unregister();
      }
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (let cacheName of cacheNames) {
          console.log('🗑️ Removendo cache:', cacheName);
          await caches.delete(cacheName);
        }
      }
      console.log('✅ Cache SW limpo');
    } catch (error) {
      console.warn('⚠️ Erro ao limpar cache SW:', error);
    }
  }

  if ('serviceWorker' in navigator) {
    const shouldDisable = disableSw || isDevPort;
    if (shouldDisable) {
      const hadController = !!navigator.serviceWorker.controller;
      clearServiceWorkerCache().finally(() => {
        try {
          const key = 'voxcash_sw_cleared_reload';
          if (hadController && !sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1');
            window.location.reload();
          }
        } catch (_) {}
      });
    } else {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
          .then(function(registration) {
            console.log('SW registrado com sucesso:', registration.scope);
          })
          .catch(function(error) {
            console.log('Falha ao registrar SW:', error);
          });
      });
    }
  }
})();

// Handler global para erros de chunks
window.addEventListener('error', function(event) {
  if (event.error && (
    event.error.name === 'ChunkLoadError' ||
    event.message.includes('Loading chunk') ||
    event.message.includes('Loading CSS chunk')
  )) {
    console.warn('🔄 Erro de chunk detectado, recarregando...', event.error);
    setTimeout(function() {
      window.location.reload();
    }, 1000);
  }
});

window.addEventListener('unhandledrejection', function(event) {
  if (event.reason && event.reason.message && (
    event.reason.message.includes('Loading chunk') ||
    event.reason.message.includes('Failed to import')
  )) {
    console.warn('🔄 Promise rejeitada por chunk, recarregando...', event.reason);
    setTimeout(function() {
      window.location.reload();
    }, 1000);
  }
});
