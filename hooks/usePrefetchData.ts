import { useCache } from '../contexts/CacheContext';
import { useCallback } from 'react';

export const usePrefetchData = (lojaId: string | null) => {
  const cache = useCache();

  const prefetchDashboardData = useCallback(async () => {
    if (!lojaId) return;

    const keys = [
      `vendas-hoje-${lojaId}`,
      `vendas-mes-${lojaId}`,
      `top-vendedores-${lojaId}`,
      `vendas-recentes-${lojaId}`,
      `meta-ativa-${lojaId}`,
    ];

    // Verificar quais já estão em cache
    const needsFetch = keys.filter(key => !cache.isCacheValid(key));

    if (needsFetch.length === 0) return; // Tudo já está em cache

    // Importar e buscar dados em paralelo
    const { buscarVendasHoje, buscarVendasMes, buscarTopVendedores, buscarVendasRecentes } = await import('../services/api');
    const { buscarMetaAtiva } = await import('../services/metas');

    const promises = [];

    if (needsFetch.includes(`vendas-hoje-${lojaId}`)) {
      promises.push(
        buscarVendasHoje(lojaId).then(data => cache.setCache(`vendas-hoje-${lojaId}`, data))
      );
    }

    if (needsFetch.includes(`vendas-mes-${lojaId}`)) {
      promises.push(
        buscarVendasMes(lojaId).then(data => cache.setCache(`vendas-mes-${lojaId}`, data))
      );
    }

    if (needsFetch.includes(`top-vendedores-${lojaId}`)) {
      promises.push(
        buscarTopVendedores(lojaId).then(data => cache.setCache(`top-vendedores-${lojaId}`, data))
      );
    }

    if (needsFetch.includes(`vendas-recentes-${lojaId}`)) {
      promises.push(
        buscarVendasRecentes(lojaId, 10).then(data => cache.setCache(`vendas-recentes-${lojaId}`, data))
      );
    }

    if (needsFetch.includes(`meta-ativa-${lojaId}`)) {
      promises.push(
        buscarMetaAtiva(lojaId).then(data => cache.setCache(`meta-ativa-${lojaId}`, data))
      );
    }

    await Promise.allSettled(promises);
  }, [lojaId, cache]);

  const prefetchTeamData = useCallback(async () => {
    if (!lojaId) return;

    const key = `top-vendedores-${lojaId}`;
    if (cache.isCacheValid(key)) return;

    const { buscarTopVendedores } = await import('../services/api');
    const data = await buscarTopVendedores(lojaId);
    cache.setCache(key, data);
  }, [lojaId, cache]);

  const prefetchSalesData = useCallback(async () => {
    if (!lojaId) return;

    const key = `vendas-recentes-${lojaId}`;
    if (cache.isCacheValid(key)) return;

    const { buscarVendasRecentes } = await import('../services/api');
    const data = await buscarVendasRecentes(lojaId, 50);
    cache.setCache(key, data);
  }, [lojaId, cache]);

  const prefetchGoalsData = useCallback(async () => {
    if (!lojaId) return;

    const keys = [`meta-ativa-${lojaId}`, `metas-${lojaId}`];
    const needsFetch = keys.filter(key => !cache.isCacheValid(key));

    if (needsFetch.length === 0) return;

    const { buscarMetaAtiva, buscarMetas } = await import('../services/metas');

    const promises = [];
    if (needsFetch.includes(`meta-ativa-${lojaId}`)) {
      promises.push(
        buscarMetaAtiva(lojaId).then(data => cache.setCache(`meta-ativa-${lojaId}`, data))
      );
    }

    if (needsFetch.includes(`metas-${lojaId}`)) {
      promises.push(
        buscarMetas(lojaId).then(data => cache.setCache(`metas-${lojaId}`, data))
      );
    }

    await Promise.allSettled(promises);
  }, [lojaId, cache]);

  const prefetchAdminSellersData = useCallback(async () => {
    if (!lojaId) return;

    const key = `vendedores-${lojaId}`;
    if (cache.isCacheValid(key)) return;

    const { buscarVendedores } = await import('../services/api');
    const data = await buscarVendedores(lojaId);
    cache.setCache(key, data);
  }, [lojaId, cache]);

  return {
    prefetchDashboardData,
    prefetchTeamData,
    prefetchSalesData,
    prefetchGoalsData,
    prefetchAdminSellersData,
  };
};
