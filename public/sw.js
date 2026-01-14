// Service Worker para VoxCash - Versão otimizada
const CACHE_NAME = 'voxcash-v3';
const STATIC_CACHE = 'voxcash-static-v3';
const DYNAMIC_CACHE = 'voxcash-dynamic-v3';

// URLs para cache estático (recursos que raramente mudam)
const staticAssets = [
  '/manifest.json',
  '/icon-192x192.svg',
  '/icon-512x512.svg'
];

// URLs que devem sempre buscar da rede primeiro
const networkFirstUrls = [
  '/api/',
  '/_next/static/chunks/',
  '/_next/static/css/',
  '/_next/static/chunks/webpack'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('SW: Instalando service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('SW: Cache estático aberto');
        return cache.addAll(staticAssets);
      })
      .then(() => {
        console.log('SW: Forçando ativação imediata');
        return self.skipWaiting();
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('SW: Ativando service worker...');
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE) {
              console.log('SW: Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Tomar controle imediato
      self.clients.claim()
    ])
  );
});

// Interceptar requisições com estratégia inteligente
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requisições não-HTTP
  if (!request.url.startsWith('http')) {
    return;
  }

  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  const pathname = url.pathname || '';
  const hostname = url.hostname || '';
  const hasSensitiveHeaders =
    request.headers.has('authorization') ||
    request.headers.has('apikey') ||
    request.headers.has('x-client-info');
  const isAuthRequest =
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/auth/') ||
    (hostname.endsWith('.supabase.co') && pathname.startsWith('/auth/')) ||
    hasSensitiveHeaders;

  if (isAuthRequest) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  // Estratégia Network First para APIs e recursos dinâmicos
  if (networkFirstUrls.some(pattern => request.url.includes(pattern))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Estratégia Cache First para recursos estáticos
  if (request.destination === 'image' || 
      request.url.includes('/_next/static/media/') ||
      staticAssets.some(asset => request.url.endsWith(asset))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Estratégia Network First para páginas HTML (navegação)
  // Evita servir páginas antigas (ex.: estado "Carregando...") do cache
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Fallback para network
  event.respondWith(fetch(request));
});

// Estratégia Network First
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok && request.method === 'GET') {
      try {
        const cache = await caches.open(DYNAMIC_CACHE);
        await cache.put(request, networkResponse.clone());
      } catch {}
    }
    return networkResponse;
  } catch (error) {
    console.log('SW: Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Estratégia Cache First
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('SW: Failed to fetch:', request.url);
    return new Response('Resource not available', { status: 404 });
  }
}

// Estratégia Stale While Revalidate (apenas para recursos não-HTML)
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const isHtml = request.headers.get('accept')?.includes('text/html');
  if (isHtml) {
    // Para HTML, delegar para networkFirst através do listener
    return fetch(request);
  }

  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Gerenciar notificações push
self.addEventListener('push', (event) => {
  console.log('Push recebido:', event);
  
  let notificationData = {
    title: 'VoxCash',
    body: 'Nova notificação',
    icon: '/icon-192x192.svg',
    badge: '/icon-192x192.svg',
    tag: 'voxcash-notification',
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
