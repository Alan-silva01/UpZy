import { useState, useEffect } from 'react';
import { verificarStatusLoja, StatusLoja } from '../services/auth';
import { supabase } from '../lib/supabase';

export function useStoreStatus(lojaId: string | null) {
  const [statusLoja, setStatusLoja] = useState<StatusLoja | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarStatus = async () => {
      if (!lojaId) {
        setLoading(false);
        return;
      }

      const status = await verificarStatusLoja(lojaId);
      setStatusLoja(status);
      setLoading(false);
    };

    carregarStatus();

    // Se não tem lojaId, não configura o realtime
    if (!lojaId) return;

    // Configurar subscription realtime para mudanças na loja
    const channel = supabase
      .channel(`loja-status-${lojaId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lojas',
          filter: `id=eq.${lojaId}`
        },
        async (payload) => {
          console.log('🔄 Status da loja atualizado em tempo real:', payload.new);

          // Atualizar status imediatamente quando houver mudança
          const novoStatus = await verificarStatusLoja(lojaId);
          setStatusLoja(novoStatus);

          // Se a loja foi bloqueada, forçar reload da página
          if (novoStatus?.bloqueado) {
            console.log('⚠️ Loja bloqueada - recarregando página...');
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        }
      )
      .subscribe();

    // Cleanup: remover subscription ao desmontar
    return () => {
      supabase.removeChannel(channel);
    };
  }, [lojaId]);

  const isBlocked = statusLoja?.bloqueado ?? false;
  const isActive = statusLoja?.status === 'ACTIVE';

  return {
    statusLoja,
    loading,
    isBlocked,
    isActive
  };
}
