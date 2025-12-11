import React, { useState, useEffect } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { Sale, Seller } from '../../types';
import { buscarLojaIdUsuario, verificarSessao } from '../../services/auth';
import { useDataCache } from '../../contexts/DataCacheContext';
import { formatarTempoRelativo } from '../../utils/formatters';

export const SalesFeed: React.FC = () => {
  // Usar cache global
  const { cache, loading: cacheLoading, getVendas, getVendedores } = useDataCache();

  const [lojaId, setLojaId] = useState<string>('');

  // Dados vêm do cache
  const sales = getVendas() || [];
  const sellers = getVendedores() || [];

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  const carregarDadosIniciais = async () => {
    const user = await verificarSessao();
    if (user) {
      const loja = await buscarLojaIdUsuario(user.id);
      if (loja) {
        setLojaId(loja);
      }
    }
  };

  const getSellerAvatar = (id: string) => {
    return sellers.find(s => s.id === id)?.avatar || '';
  };

  const getSellerName = (id: string) => {
    return sellers.find(s => s.id === id)?.name || 'Vendedor';
  };


  if (cacheLoading && sales.length === 0) {
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
        <div className="absolute left-[18.5px] top-4 bottom-0 w-px bg-gradient-to-b from-emerald-500/50 via-zinc-800 to-transparent"></div>

        <div className="space-y-3">
          {sales.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <p>Nenhuma venda registrada ainda.</p>
            </div>
          ) : (
            sales.map((sale) => (
              <div key={sale.id} className="relative pl-12 group">
                {/* Timeline Dot */}
                <div className="absolute left-[13px] top-5 w-[11px] h-[11px] rounded-full bg-zinc-950 border-2 border-emerald-500 z-10 group-hover:scale-125 transition-transform duration-300 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>

                <div className="glass-card rounded-2xl p-4 hover:bg-white/5 transition-all duration-300 border-zinc-800/50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                       <h3 className="font-bold text-white text-sm">{sale.customerName}</h3>
                       <span className="text-zinc-500 text-[10px] flex items-center gap-1 mt-0.5">
                         <Clock size={10} /> {formatarTempoRelativo(sale.timestamp)}
                       </span>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-400 font-bold text-sm leading-tight">
                         + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.amount)}
                      </div>
                      <span className="text-[10px] text-zinc-600">Pedido: {sale.orderId}</span>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                      {{
                        'pix': 'PIX',
                        'dinheiro': 'Dinheiro',
                        'cartao_debito': 'Débito',
                        'cartao_credito': 'Crédito',
                        'boleto': 'Boleto',
                        'promissoria': 'Promissória'
                      }[sale.paymentMethod] || sale.paymentMethod}
                    </span>
                    {sale.paymentType === 'parcelado' && sale.installments && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                        {sale.installments}x
                      </span>
                    )}
                    {sale.paymentType === 'avista' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                        À vista
                      </span>
                    )}
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