import React, { createContext, useContext, useCallback, useRef, useMemo } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  loading: boolean;
}

interface CacheContextType {
  getCache: <T>(key: string) => T | null;
  setCache: <T>(key: string, data: T) => void;
  invalidateCache: (key: string) => void;
  clearAllCache: () => void;
  isCacheValid: (key: string, maxAge?: number) => boolean;
  getCacheWithLoading: <T>(key: string) => { data: T | null; loading: boolean };
  setCacheLoading: (key: string, loading: boolean) => void;
  prefetch: <T>(key: string, fetchFn: () => Promise<T>) => Promise<void>;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

const DEFAULT_MAX_AGE = 10 * 60 * 1000; // 10 minutos (aumentado de 5 para reduzir requisições)
const MAX_CACHE_SIZE = 100; // Limite de entradas no cache

export const CacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cacheRef = useRef<Map<string, CacheEntry<any>>>(new Map());
  const accessOrderRef = useRef<string[]>([]);

  // Evict LRU (Least Recently Used) quando cache estiver cheio
  const evictLRU = useCallback(() => {
    if (cacheRef.current.size >= MAX_CACHE_SIZE && accessOrderRef.current.length > 0) {
      const oldestKey = accessOrderRef.current.shift();
      if (oldestKey) {
        cacheRef.current.delete(oldestKey);
      }
    }
  }, []);

  const updateAccessOrder = useCallback((key: string) => {
    const index = accessOrderRef.current.indexOf(key);
    if (index > -1) {
      accessOrderRef.current.splice(index, 1);
    }
    accessOrderRef.current.push(key);
  }, []);

  const getCache = useCallback(<T,>(key: string): T | null => {
    const entry = cacheRef.current.get(key);
    if (entry) {
      updateAccessOrder(key);
      return entry.data;
    }
    return null;
  }, [updateAccessOrder]);

  const setCache = useCallback(<T,>(key: string, data: T) => {
    evictLRU();
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
      loading: false
    });
    updateAccessOrder(key);
  }, [evictLRU, updateAccessOrder]);

  const setCacheLoading = useCallback((key: string, loading: boolean) => {
    const entry = cacheRef.current.get(key);
    if (entry) {
      entry.loading = loading;
    } else {
      evictLRU();
      cacheRef.current.set(key, {
        data: null,
        timestamp: Date.now(),
        loading
      });
    }
    updateAccessOrder(key);
  }, [evictLRU, updateAccessOrder]);

  const invalidateCache = useCallback((key: string) => {
    cacheRef.current.delete(key);
    const index = accessOrderRef.current.indexOf(key);
    if (index > -1) {
      accessOrderRef.current.splice(index, 1);
    }
  }, []);

  const clearAllCache = useCallback(() => {
    cacheRef.current.clear();
    accessOrderRef.current = [];
  }, []);

  const isCacheValid = useCallback((key: string, maxAge: number = DEFAULT_MAX_AGE): boolean => {
    const entry = cacheRef.current.get(key);
    if (!entry) return false;
    const isValid = Date.now() - entry.timestamp < maxAge;
    if (isValid) {
      updateAccessOrder(key);
    }
    return isValid;
  }, [updateAccessOrder]);

  const getCacheWithLoading = useCallback(<T,>(key: string): { data: T | null; loading: boolean } => {
    const entry = cacheRef.current.get(key);
    if (entry) {
      updateAccessOrder(key);
    }
    return {
      data: entry?.data || null,
      loading: entry?.loading || false
    };
  }, [updateAccessOrder]);

  const prefetch = useCallback(async <T,>(key: string, fetchFn: () => Promise<T>) => {
    if (isCacheValid(key)) return;

    try {
      setCacheLoading(key, true);
      const data = await fetchFn();
      setCache(key, data);
    } catch (error) {
      console.error(`Prefetch error for ${key}:`, error);
    } finally {
      setCacheLoading(key, false);
    }
  }, [isCacheValid, setCacheLoading, setCache]);

  const value = useMemo(
    () => ({
      getCache,
      setCache,
      invalidateCache,
      clearAllCache,
      isCacheValid,
      getCacheWithLoading,
      setCacheLoading,
      prefetch
    }),
    [getCache, setCache, invalidateCache, clearAllCache, isCacheValid, getCacheWithLoading, setCacheLoading, prefetch]
  );

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = () => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
};
