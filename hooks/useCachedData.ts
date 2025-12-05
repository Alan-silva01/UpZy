import { useEffect, useState, useCallback } from 'react';
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
    // Inicializar com cache se disponível
    if (enabled && cache.isCacheValid(key, maxAge)) {
      return cache.getCache<T>(key);
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const fetchInProgressRef = useRef(false);

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    // Verificar se tem cache válido e não é força
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

    try {
      fetchInProgressRef.current = true;
      setLoading(true);
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
      // Tentar usar cache primeiro
      const cachedData = cache.getCache<T>(key);
      if (cachedData && cache.isCacheValid(key, maxAge)) {
        setData(cachedData);
        setLoading(false);
      } else if (!fetchInProgressRef.current) {
        fetchData();
      }
    }
  }, [enabled, key]); // Removido fetchData e cache das dependências para evitar loops

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
