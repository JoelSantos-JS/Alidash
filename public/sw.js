// Service Worker para Alidash
const CACHE_NAME = 'alidash-v1';
const urlsToCache = [
  '/',
  '/agenda',
  '/produtos',
  '/transacoes',
  '/manifest.json'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - retorna resposta
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Gerenciar notificações push
self.addEventListener('push', (event) => {
  console.log('Push recebido:', event);
  
  let notificationData = {
    title: 'Alidash',
    body: 'Nova notificação',
    icon: '/icon-192x192.svg',
    badge: '/icon-192x192.svg',
    tag: 'alidash-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'Ver',
        icon: '/icon-192x192.svg'
      },
      {
        action: 'dismiss',
        title: 'Dispensar'
      }
    ]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
        data: data // Dados adicionais para o click handler
      };
    } catch (e) {
      console.error('Erro ao parsear dados da notificação:', e);
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Gerenciar cliques em notificações
self.addEventListener('notificationclick', (event) => {
  console.log('Clique na notificação:', event);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Determinar URL baseada no tipo de notificação
  let urlToOpen = '/';
  
  if (event.notification.data) {
    const data = event.notification.data;
    
    switch (data.type) {
      case 'calendar_event':
        urlToOpen = '/agenda';
        break;
      case 'product_alert':
        urlToOpen = '/produtos';
        break;
      case 'transaction':
        urlToOpen = '/transacoes';
        break;
      case 'goal_reminder':
        urlToOpen = '/metas';
        break;
      case 'debt_reminder':
        urlToOpen = '/dividas';
        break;
      default:
        urlToOpen = data.url || '/';
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Verificar se já existe uma janela aberta
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      
      // Se não há janela aberta, abrir uma nova
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Gerenciar fechamento de notificações
self.addEventListener('notificationclose', (event) => {
  console.log('Notificação fechada:', event.notification.tag);
  
  // Opcional: enviar analytics sobre notificações fechadas
  if (event.notification.data && event.notification.data.trackClose) {
    // Implementar tracking se necessário
  }
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Implementar sincronização de dados offline
    console.log('Executando sincronização em background');
    
    // Exemplo: sincronizar eventos do calendário
    const response = await fetch('/api/calendar/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('Sincronização concluída com sucesso');
    }
  } catch (error) {
    console.error('Erro na sincronização em background:', error);
  }
}