import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Seller, Sale, StoreStats, ClienteRanking } from '../types';
import { buscarVendedores, buscarVendas, calcularEstatisticasLoja, buscarRankingClientes } from '../services/api';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';

interface DataCache {
  vendedores: Seller[] | null;
  vendas: Sale[] | null;
  stats: StoreStats | null;
  clientes: ClienteRanking[] | null;
  lastUpdate: number;
}

interface DataCacheContextType {
  cache: DataCache;
  loading: boolean;
  refreshData: (silent?: boolean) => Promise<void>;
  getVendedores: () => Seller[] | null;
  getVendas: () => Sale[] | null;
  getStats: () => StoreStats | null;
  getClientes: () => ClienteRanking[] | null;
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

interface DataCacheProviderProps {
  children: ReactNode;
  lojaId: string | null;
}

export const DataCacheProvider: React.FC<DataCacheProviderProps> = ({ children, lojaId }) => {
  const [cache, setCache] = useState<DataCache>({
    vendedores: null,
    vendas: null,
    stats: null,
    clientes: null,
    lastUpdate: 0,
  });
  const [loading, setLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Função para carregar todos os dados
  const refreshData = useCallback(async (silent = false) => {
    if (!lojaId) return;

    if (!silent && !hasLoadedOnce) {
      setLoading(true);
    }

    try {
      console.log('🔄 [Cache] Carregando dados...', { silent, hasLoadedOnce });

      const [vendedores, vendas, stats, clientes] = await Promise.all([
        buscarVendedores(lojaId),
        buscarVendas(lojaId),
        calcularEstatisticasLoja(lojaId),
        buscarRankingClientes(lojaId, 10),
      ]);

      setCache({
        vendedores,
        vendas,
        stats,
        clientes,
        lastUpdate: Date.now(),
      });

      console.log('✅ [Cache] Dados carregados com sucesso');
      setHasLoadedOnce(true);
    } catch (error) {
      console.error('❌ [Cache] Erro ao carregar dados:', error);
    } finally {
      if (!silent && !hasLoadedOnce) {
        setLoading(false);
      }
    }
  }, [lojaId, hasLoadedOnce]);

  // Carregar dados iniciais quando lojaId estiver disponível
  useEffect(() => {
    if (lojaId && !hasLoadedOnce) {
      refreshData();
    }
  }, [lojaId, hasLoadedOnce, refreshData]);

  // Real-time subscriptions para atualizar cache automaticamente
  useRealtimeSubscription({
    table: 'vendas',
    lojaId: lojaId || undefined,
    onInsert: () => {
      console.log('🔴 [Cache] Nova venda detectada! Atualizando cache...');
      refreshData(true);
    },
    onUpdate: () => {
      console.log('🔴 [Cache] Venda atualizada! Atualizando cache...');
      refreshData(true);
    },
    onDelete: () => {
      console.log('🔴 [Cache] Venda deletada! Atualizando cache...');
      refreshData(true);
    },
  });

  useRealtimeSubscription({
    table: 'vendedores',
    lojaId: lojaId || undefined,
    onInsert: () => {
      console.log('🔴 [Cache] Novo vendedor detectado! Atualizando cache...');
      refreshData(true);
    },
    onUpdate: () => {
      console.log('🔴 [Cache] Vendedor atualizado! Atualizando cache...');
      refreshData(true);
    },
    onDelete: () => {
      console.log('🔴 [Cache] Vendedor deletado! Atualizando cache...');
      refreshData(true);
    },
  });

  // Getters para acessar dados do cache
  const getVendedores = useCallback(() => cache.vendedores, [cache.vendedores]);
  const getVendas = useCallback(() => cache.vendas, [cache.vendas]);
  const getStats = useCallback(() => cache.stats, [cache.stats]);
  const getClientes = useCallback(() => cache.clientes, [cache.clientes]);

  return (
    <DataCacheContext.Provider
      value={{
        cache,
        loading,
        refreshData,
        getVendedores,
        getVendas,
        getStats,
        getClientes,
      }}
    >
      {children}
    </DataCacheContext.Provider>
  );
};

export const useDataCache = () => {
  const context = useContext(DataCacheContext);
  if (context === undefined) {
    throw new Error('useDataCache must be used within a DataCacheProvider');
  }
  return context;
};
