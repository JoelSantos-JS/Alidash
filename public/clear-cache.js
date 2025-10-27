// Script para limpar cache do navegador e service worker
(function() {
  'use strict';
  
  console.log('🧹 Iniciando limpeza de cache...');
  
  // Função para limpar cache do service worker
  async function clearServiceWorkerCache() {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        for (let registration of registrations) {
          console.log('🔄 Desregistrando service worker...');
          await registration.unregister();
        }
        
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          console.log('📦 Caches encontrados:', cacheNames);
          
          for (let cacheName of cacheNames) {
            console.log('🗑️ Removendo cache:', cacheName);
            await caches.delete(cacheName);
          }
        }
        
        console.log('✅ Cache do service worker limpo com sucesso!');
      } catch (error) {
        console.error('❌ Erro ao limpar cache do service worker:', error);
      }
    }
  }
  
  // Função para limpar localStorage e sessionStorage
  function clearStorage() {
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log('✅ Storage local limpo com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao limpar storage:', error);
    }
  }
  
  // Função para limpar cookies
  function clearCookies() {
    try {
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      console.log('✅ Cookies limpos com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao limpar cookies:', error);
    }
  }
  
  // Função principal
  async function clearAllCache() {
    console.log('🚀 Executando limpeza completa...');
    
    await clearServiceWorkerCache();
    clearStorage();
    clearCookies();
    
    console.log('🎉 Limpeza completa finalizada!');
    console.log('🔄 Recarregando página em 2 segundos...');
    
    setTimeout(() => {
      window.location.reload(true);
    }, 2000);
  }
  
  // Executar limpeza
  clearAllCache();
  
  // Disponibilizar função globalmente para uso manual
  window.clearAppCache = clearAllCache;
  
})();