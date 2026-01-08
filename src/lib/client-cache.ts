type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const cacheStore = new Map<string, CacheEntry<any>>();

export function getCache<T>(key: string, ttlMs: number): T | null {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  const isFresh = Date.now() - entry.timestamp < ttlMs;
  return isFresh ? (entry.data as T) : null;
}

export function setCache<T>(key: string, data: T): void {
  cacheStore.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache(key: string): void {
  cacheStore.delete(key);
}

export function invalidateCacheByPrefix(prefix: string): void {
  for (const k of cacheStore.keys()) {
    if (k.startsWith(prefix)) {
      cacheStore.delete(k);
    }
  }
}

export function clearCache(): void {
  cacheStore.clear();
}

// Opcional: limpar entradas antigas (não crítico para uso leve)
export function pruneOld(ttlMs: number): void {
  const now = Date.now();
  for (const [key, entry] of cacheStore.entries()) {
    if (now - entry.timestamp >= ttlMs) {
      cacheStore.delete(key);
    }
  }
}
