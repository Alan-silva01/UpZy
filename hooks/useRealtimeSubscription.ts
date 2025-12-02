import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeSubscriptionOptions {
  table: string;
  lojaId: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  filter?: string; // Filtro adicional, ex: "vendedor_id=eq.123"
}

export const useRealtimeSubscription = ({
  table,
  lojaId,
  onInsert,
  onUpdate,
  onDelete,
  filter
}: UseRealtimeSubscriptionOptions) => {
  useEffect(() => {
    if (!lojaId) return;

    console.log(`🔴 [Realtime] Conectando à tabela: ${table} (loja: ${lojaId})`);

    // Para DELETE, o filtro precisa estar no payload.old, não no payload.new
    // Então vamos aplicar o filtro manualmente para eventos DELETE
    const filterConfig = filter || `loja_id=eq.${lojaId}`;

    // Criar canal único para esta subscription
    const channel: RealtimeChannel = supabase
      .channel(`${table}_changes_${lojaId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table
          // Removemos o filter daqui para aplicar manualmente
        },
        (payload) => {
          console.log(`📡 [Realtime] Mudança detectada em ${table}:`, payload);

          // Aplicar filtro manualmente
          const data = payload.eventType === 'DELETE' ? payload.old : payload.new;

          // Checar se o registro pertence à loja correta
          if (data && data.loja_id !== lojaId) {
            console.log(`⏭️ [Realtime] Ignorando evento (loja diferente): ${data.loja_id}`);
            return;
          }

          // Aplicar filtro adicional se houver
          if (filter && data) {
            const [key, value] = filter.split('=eq.');
            if (data[key] !== value) {
              console.log(`⏭️ [Realtime] Ignorando evento (filtro adicional não passou)`);
              return;
            }
          }

          switch (payload.eventType) {
            case 'INSERT':
              if (onInsert) {
                console.log(`➕ [Realtime] INSERT em ${table}`, payload.new);
                onInsert(payload.new);
              }
              break;
            case 'UPDATE':
              if (onUpdate) {
                console.log(`✏️ [Realtime] UPDATE em ${table}`, payload.new);
                onUpdate(payload.new);
              }
              break;
            case 'DELETE':
              if (onDelete) {
                console.log(`🗑️ [Realtime] DELETE em ${table}`, payload.old);
                onDelete(payload.old);
              }
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log(`🔌 [Realtime] Status da conexão ${table}:`, status);
      });

    // Cleanup ao desmontar componente
    return () => {
      console.log(`🔴 [Realtime] Desconectando da tabela: ${table}`);
      supabase.removeChannel(channel);
    };
  }, [table, lojaId, filter, onInsert, onUpdate, onDelete]);
};
