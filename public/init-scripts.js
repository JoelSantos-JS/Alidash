// Service Worker Registration
if ('serviceWorker' in navigator) {
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