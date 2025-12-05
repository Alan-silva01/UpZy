import { useEffect, useState, useCallback, useRef } from 'react';
import { useCache } from '../contexts/CacheContext';

interface UseCachedDataOptions<T> {
  key: string;
  fetchFn: () => Promise<T>;
  maxAge?: number;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
}

export function useCachedData<T>({
  key,
  fetchFn,
  maxAge = 10 * 60 * 1000, // 10 minutos padrão (otimizado)
  enabled = true,
  onSuccess
}: UseCachedDataOptions<T>) {
  const cache = useCache();
  const [data, setData] = useState<T | null>(() => {
    // SEMPRE inicializar com cache, mesmo se expirado
    // Isso garante que sempre há dados para mostrar instantaneamente
    const cachedData = cache.getCache<T>(key);
    return cachedData || null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const fetchInProgressRef = useRef(false);

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    // Se tem cache válido e não é força, não buscar
    if (!force && cache.isCacheValid(key, maxAge)) {
      const cachedData = cache.getCache<T>(key);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return cachedData;
      }
    }

    // Evitar múltiplas requisições simultâneas
    if (fetchInProgressRef.current && !force) {
      return;
    }

    // Se já está carregando no cache, aguardar
    const { loading: isLoading } = cache.getCacheWithLoading(key);
    if (isLoading && !force) {
      return;
    }

    // Se tem dados em cache (mesmo expirados), NÃO mostrar loading
    // Atualiza em background silenciosamente
    const hasStaleData = !!cache.getCache<T>(key);

    try {
      fetchInProgressRef.current = true;

      // Só mostra loading se NÃO tem dados antigos
      if (!hasStaleData) {
        setLoading(true);
      }

      cache.setCacheLoading(key, true);
      setError(null);

      const result = await fetchFn();

      cache.setCache(key, result);
      setData(result);

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      setError(error);
      console.error(`❌ Erro ao buscar dados para ${key}:`, error);
    } finally {
      setLoading(false);
      cache.setCacheLoading(key, false);
      fetchInProgressRef.current = false;
    }
  }, [key, fetchFn, maxAge, enabled, cache, onSuccess]);

  // Carregar dados na montagem
  useEffect(() => {
    if (enabled) {
      // Sempre mostrar cache primeiro (mesmo expirado)
      const cachedData = cache.getCache<T>(key);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);

        // Se expirado, buscar em background silenciosamente
        if (!cache.isCacheValid(key, maxAge) && !fetchInProgressRef.current) {
          fetchData();
        }
      } else {
        // Se não tem cache, buscar com loading
        if (!fetchInProgressRef.current) {
          fetchData();
        }
      }
    }
  }, [enabled, key]);

  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const invalidate = useCallback(() => {
    cache.invalidateCache(key);
    setData(null);
  }, [cache, key]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate
  };
}
