import React, { useState, useEffect } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { Sale, Seller } from '../../types';
import { buscarVendas, buscarVendedores } from '../../services/api';
import { buscarLojaIdUsuario, verificarSessao } from '../../services/auth';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';

export const SalesFeed: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [lojaId, setLojaId] = useState<string>('');

  useEffect(() => {
    carregarDados();

    // Listener para forçar atualização silenciosa
    const handleForceRefresh = () => {
      console.log('🔄 [Timeline Vendas] Atualização forçada disparada!');
      carregarDados(true); // silencioso
    };

    window.addEventListener('forceRefreshDashboard', handleForceRefresh);

    return () => {
      window.removeEventListener('forceRefreshDashboard', handleForceRefresh);
    };
  }, []);

  // Real-time subscriptions para vendas
  useRealtimeSubscription({
    table: 'vendas',
    lojaId,
    onInsert: () => {
      console.log('🔴 Nova venda na timeline! Recarregando...');
      carregarDados(true); // silencioso
    },
    onUpdate: () => {
      console.log('🔴 Venda atualizada na timeline! Recarregando...');
      carregarDados(true); // silencioso
    },
    onDelete: () => {
      console.log('🔴 Venda deletada da timeline! Recarregando...');
      carregarDados(true); // silencioso
    }
  });

  const carregarDados = async (silencioso = false) => {
    if (!silencioso) {
      setLoading(true);
    }
    const user = await verificarSessao();
    if (user) {
      const loja = await buscarLojaIdUsuario(user.id);
      if (loja) {
        setLojaId(loja);
        const [vendas, vendedores] = await Promise.all([
          buscarVendas(loja),
          buscarVendedores(loja)
        ]);
        setSales(vendas);
        setSellers(vendedores);
      }
    }
    if (!silencioso) {
      setLoading(false);
    }
  };

  const getSellerAvatar = (id: string) => {
    return sellers.find(s => s.id === id)?.avatar || '';
  };

  const getSellerName = (id: string) => {
    return sellers.find(s => s.id === id)?.name || 'Vendedor';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias`;
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="pt-header pb-28 space-y-4 flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-header pb-28 space-y-4 animate-slide-up">
      <div className="flex justify-between items-end px-1">
         <div>
           <span className="text-zinc-500 text-[10px] font-semibold tracking-widest uppercase mb-0.5">Timeline</span>
           <h1 className="text-xl font-bold text-white tracking-tight">Vendas Recentes</h1>
         </div>
      </div>

      <div className="relative px-1">
        {/* Continuous Line */}
        <div className="absolute left-4 top-4 bottom-0 w-px bg-gradient-to-b from-emerald-500/50 via-zinc-800 to-transparent"></div>
        
        <div className="space-y-3">
          {sales.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <p>Nenhuma venda registrada ainda.</p>
            </div>
          ) : (
            sales.map((sale) => (
              <div key={sale.id} className="relative pl-8 group">
                {/* Timeline Dot */}
                <div className="absolute left-[12px] top-5 w-2 h-2 rounded-full bg-zinc-950 border border-emerald-500 z-10 group-hover:scale-125 transition-transform duration-300 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>

                <div className="glass-card rounded-2xl p-4 hover:bg-white/5 transition-all duration-300 border-zinc-800/50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                       <h3 className="font-bold text-white text-sm">{sale.customerName}</h3>
                       <span className="text-zinc-500 text-[10px] flex items-center gap-1 mt-0.5">
                         <Clock size={10} /> {formatTimestamp(sale.timestamp)}
                       </span>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-400 font-bold text-sm leading-tight">
                         + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.amount)}
                      </div>
                      <span className="text-[9px] text-zinc-500 bg-zinc-900/50 px-1.5 py-0.5 rounded-full inline-block mt-1 border border-zinc-800">
                        {sale.itemsCount} itens
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-dashed border-zinc-800/60">
                    <div className="relative">
                      <img src={getSellerAvatar(sale.sellerId)} alt="" className="w-5 h-5 rounded-full border border-zinc-700" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-zinc-900"></div>
                    </div>
                    <span className="text-[10px] text-zinc-400">
                       Vendido por <span className="text-zinc-200 font-medium">{getSellerName(sale.sellerId).split(' ')[0]}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};