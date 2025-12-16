import React, { useState } from 'react';
import { Loader2, ChevronDown, Target, Clock } from 'lucide-react';
import { Sale, Seller } from '../../types';
import { useDataCache } from '../../contexts/DataCacheContext';
import { formatarTempoRelativo } from '../../utils/formatters';

interface Meta {
  id: string;
  nome?: string;
  data_inicio: string;
  data_fim: string;
  status: string;
}

export const SalesFeed: React.FC = () => {
  // Usar cache global - tudo vem pré-carregado
  const { loading: cacheLoading, getVendedores, getTodasVendas, getMetas } = useDataCache();

  const [visibleCount, setVisibleCount] = useState(20);

  // Tudo vem do cache - carrega instantaneamente
  const sellers = getVendedores() || [];
  const sales = getTodasVendas() || [];
  const cachedMetas = getMetas() || [];

  // Converter metas do cache para formato local
  const metas: Meta[] = cachedMetas.map(m => ({
    id: m.id,
    nome: (m as any).nome,
    data_inicio: m.data_inicio,
    data_fim: m.data_fim,
    status: m.status
  }));

  const getSellerAvatar = (id: string) => {
    return sellers.find(s => s.id === id)?.avatar || '';
  };

  const getSellerName = (id: string) => {
    return sellers.find(s => s.id === id)?.name || 'Vendedor';
  };

  // Verificar se uma venda está dentro do período de uma meta
  const getMetaForSale = (saleTimestamp: string): Meta | null => {
    const saleDate = new Date(saleTimestamp);
    for (const meta of metas) {
      const inicio = new Date(meta.data_inicio);
      const fim = new Date(meta.data_fim);
      if (saleDate >= inicio && saleDate <= fim) {
        return meta;
      }
    }
    return null;
  };

  // Verificar se devemos mostrar o separador antes desta venda
  const shouldShowSeparator = (index: number, sale: Sale): Meta | null => {
    const currentMeta = getMetaForSale(sale.timestamp);
    if (!currentMeta) return null;

    // Se é a primeira venda visível, mostrar separador se está dentro de uma meta
    if (index === 0) return currentMeta;

    // Verificar se a venda anterior está na mesma meta
    const visibleSales = sales.slice(0, visibleCount);
    const prevSale = visibleSales[index - 1];
    const prevMeta = getMetaForSale(prevSale.timestamp);

    // Se a meta mudou (ou entrou em uma meta), mostrar separador
    if (currentMeta.id !== prevMeta?.id) {
      return currentMeta;
    }

    return null;
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
        {/* Continuous Line - centered on dots: dots at left-3 (12px) + half of 11px width = 17.5px from container */}
        <div className="absolute left-[17px] top-4 bottom-0 w-[2px] bg-gradient-to-b from-emerald-500/50 via-zinc-800 to-transparent"></div>

        <div className="space-y-3">
          {sales.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <p>Nenhuma venda registrada ainda.</p>
            </div>
          ) : (
            <>
              {sales.slice(0, visibleCount).map((sale, index) => {
                const separatorMeta = shouldShowSeparator(index, sale);

                return (
                  <React.Fragment key={sale.id}>
                    {/* Meta Separator */}
                    {separatorMeta && (
                      <div className="relative pl-12 py-2">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-[11px] h-[11px] rounded-full bg-emerald-500 z-10 shadow-[0_0_12px_rgba(16,185,129,0.6)]"></div>
                        <div className="flex items-center gap-3">
                          <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/60 via-emerald-500/30 to-transparent"></div>
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                            <Target size={12} className="text-emerald-400" />
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                              Meta: {separatorMeta.nome || 'Sem nome'}
                            </span>
                          </div>
                          <div className="h-px flex-1 bg-gradient-to-l from-emerald-500/60 via-emerald-500/30 to-transparent"></div>
                        </div>
                      </div>
                    )}

                    {/* Sale Card */}
                    <div className="relative pl-12 group">
                      {/* Timeline Dot */}
                      <div className="absolute left-3 top-5 w-[11px] h-[11px] rounded-full bg-zinc-950 border-2 border-emerald-500 z-10 group-hover:scale-125 transition-transform duration-300 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>

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
                  </React.Fragment>
                );
              })}

              {/* Load More Button */}
              {visibleCount < sales.length && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => setVisibleCount(prev => prev + 20)}
                    className="flex items-center gap-2 px-6 py-3 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 rounded-full text-sm text-zinc-300 hover:text-white transition-all duration-300"
                  >
                    <ChevronDown size={16} />
                    Carregar Mais ({sales.length - visibleCount} restantes)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};