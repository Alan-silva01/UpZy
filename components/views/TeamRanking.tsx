import React, { useState, useEffect } from 'react';
import { ProgressBar } from '../ui/ProgressBar';
import { Crown, ChevronDown, ShoppingBag, Loader2, Trophy, Calendar } from 'lucide-react';
import { Seller, Sale } from '../../types';
import { buscarVendedores, buscarVendas, buscarRankingClientes, ClienteRanking } from '../../services/api';
import { buscarLojaIdUsuario, verificarSessao } from '../../services/auth';

export const TeamRanking: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [clientes, setClientes] = useState<ClienteRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [lojaId, setLojaId] = useState<string | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    const user = await verificarSessao();
    if (user) {
      const loja = await buscarLojaIdUsuario(user.id);
      if (loja) {
        setLojaId(loja);
        const [vendedores, vendas, rankingClientes] = await Promise.all([
          buscarVendedores(loja),
          buscarVendas(loja),
          buscarRankingClientes(loja, 5)
        ]);
        setSellers(vendedores);
        setSales(vendas);
        setClientes(rankingClientes);
      }
    }
    setLoading(false);
  };

  const aplicarFiltroData = async () => {
    if (!lojaId) return;

    setLoading(true);
    try {
      const rankingClientes = await buscarRankingClientes(
        lojaId,
        5,
        dataInicio ? new Date(dataInicio).toISOString() : undefined,
        dataFim ? new Date(dataFim + 'T23:59:59').toISOString() : undefined
      );
      setClientes(rankingClientes);
    } catch (error) {
      console.error('Erro ao aplicar filtro:', error);
    }
    setLoading(false);
  };

  const limparFiltro = async () => {
    setDataInicio('');
    setDataFim('');
    if (!lojaId) return;

    setLoading(true);
    const rankingClientes = await buscarRankingClientes(lojaId, 5);
    setClientes(rankingClientes);
    setLoading(false);
  };

  const sortedSellers = [...sellers].sort((a, b) => b.currentSales - a.currentSales);
  const top1 = sortedSellers[0];
  const rest = sortedSellers.slice(1);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getRecentSales = (sellerId: string) => {
    return sales.filter(sale => sale.sellerId === sellerId).slice(0, 5);
  };

  if (loading) {
    return (
      <div className="pt-24 pb-28 space-y-5 flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (sellers.length === 0) {
    return (
      <div className="pt-24 pb-28 space-y-5">
        <div className="px-1">
          <span className="text-zinc-500 text-[10px] font-semibold tracking-widest uppercase mb-0.5">Ranking</span>
          <h1 className="text-xl font-bold text-white tracking-tight">Equipe de Vendas</h1>
        </div>
        <div className="text-center py-12 text-zinc-500">
          <p>Nenhum vendedor cadastrado ainda.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-28 space-y-5">
      <div className="px-1">
         <span className="text-zinc-500 text-[10px] font-semibold tracking-widest uppercase mb-0.5">Ranking</span>
         <h1 className="text-xl font-bold text-white tracking-tight">Equipe de Vendas</h1>
      </div>

      {/* Top 1 Highlight */}
      <div 
        className="relative mx-2 mt-4 cursor-pointer"
        onClick={() => toggleExpand(top1.id)}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/20 to-transparent rounded-[2rem] blur-xl"></div>
        <div className={`glass-card rounded-[2rem] p-5 text-center relative overflow-hidden border-amber-500/20 transition-all duration-300 ${expandedId === top1.id ? 'glass-card-active' : ''}`}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
          
          <div className="relative inline-block mb-3 mt-2">
             <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-amber-400 animate-float">
                <Crown size={24} fill="currentColor" />
             </div>
             <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-b from-amber-300 to-amber-600">
               <img 
                 src={top1.avatar} 
                 alt={top1.name}
                 className="w-full h-full rounded-full border-4 border-zinc-900 object-cover"
               />
             </div>
          </div>
          
          <h2 className="text-lg font-bold text-white mb-0.5">{top1.name}</h2>
          <div className="flex items-center justify-center gap-2 mb-3">
             <span className="text-2xl font-bold text-amber-400">
               {new Intl.NumberFormat('pt-BR', { notation: "compact", style: 'currency', currency: 'BRL' }).format(top1.currentSales)}
             </span>
          </div>

          <div className="bg-zinc-900/50 rounded-xl p-2.5 border border-white/5 mb-2">
             <div className="flex justify-between text-[10px] text-zinc-400 mb-1.5">
               <span>Performance</span>
               <span>{Math.round((top1.currentSales / top1.target) * 100)}%</span>
             </div>
             <ProgressBar current={top1.currentSales} total={top1.target} heightClass="h-1.5" colorClass="bg-gradient-to-r from-amber-400 to-amber-600" />
          </div>

           {/* Expandable Section using Grid Rows for smooth animation */}
          <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] ${expandedId === top1.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
               <div className="text-left border-t border-white/5 pt-3 mt-2">
                  <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-2">Últimas Vendas</h4>
                  <div className="space-y-2 overflow-y-auto max-h-40 thin-scrollbar pr-1">
                    {getRecentSales(top1.id).length > 0 ? (
                      getRecentSales(top1.id).map(sale => (
                        <div key={sale.id} className="flex justify-between items-center bg-white/5 rounded-lg p-2.5">
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                               <ShoppingBag size={10} />
                             </div>
                             <span className="text-xs text-zinc-300">{sale.customerName}</span>
                          </div>
                          <span className="text-xs font-bold text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.amount)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-600 text-center py-2">Nenhuma venda recente.</p>
                    )}
                  </div>
               </div>
            </div>
          </div>

          <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 text-zinc-600 transition-transform duration-300 ${expandedId === top1.id ? 'rotate-180' : ''}`}>
             <ChevronDown size={14} />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2 px-1">
        {rest.map((seller, index) => (
          <div 
            key={seller.id}
            onClick={() => toggleExpand(seller.id)}
            className={`group glass-card rounded-[1.5rem] p-3.5 transition-all duration-300 cursor-pointer border-transparent ${expandedId === seller.id ? 'bg-zinc-800/80 border-zinc-700' : 'hover:bg-white/5'}`}
          >
            <div className="flex items-center gap-3">
              <div className="text-zinc-500 font-bold text-sm w-5 text-center group-hover:text-white transition-colors">
                 {index + 2}
              </div>
              
              <div className="relative shrink-0">
                 <img 
                   src={seller.avatar} 
                   alt={seller.name} 
                   className="w-10 h-10 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                 />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold text-zinc-200 text-sm group-hover:text-white transition-colors truncate">{seller.name}</h3>
                  <span className="text-sm font-bold text-white">
                    {new Intl.NumberFormat('pt-BR', { notation: "compact", style: 'currency', currency: 'BRL' }).format(seller.currentSales)}
                  </span>
                </div>
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-zinc-500 group-hover:bg-emerald-400 transition-colors duration-500" 
                     style={{ width: `${Math.min(100, (seller.currentSales / seller.target) * 100)}%` }}
                   />
                </div>
              </div>
            </div>

            {/* Expandable Section using Grid Rows */}
            <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] ${expandedId === seller.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
               <div className="overflow-hidden">
                  <div className="border-t border-white/5 pt-3 mt-3">
                    <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-2">Últimas Vendas</h4>
                    <div className="space-y-2 overflow-y-auto max-h-40 thin-scrollbar pr-1">
                      {getRecentSales(seller.id).length > 0 ? (
                        getRecentSales(seller.id).map(sale => (
                          <div key={sale.id} className="flex justify-between items-center bg-white/5 rounded-lg p-2">
                            <div className="flex items-center gap-2">
                               <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                 <ShoppingBag size={10} />
                               </div>
                               <span className="text-xs text-zinc-300">{sale.customerName}</span>
                            </div>
                            <span className="text-xs font-bold text-white">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.amount)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-zinc-600 text-center py-2">Nenhuma venda recente.</p>
                      )}
                    </div>
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ranking de Clientes */}
      <div className="mt-8 space-y-4">
        <div className="px-1">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-emerald-500" />
            <span className="text-zinc-500 text-[10px] font-semibold tracking-widest uppercase">Top Clientes</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">Quem Mais Comprou</h2>
        </div>

        {/* Filtro de Datas */}
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Filtrar Período</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-zinc-500 mb-1 block">Data Início</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 mb-1 block">Data Fim</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={aplicarFiltroData}
              disabled={!dataInicio || !dataFim}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              Aplicar Filtro
            </button>
            <button
              onClick={limparFiltro}
              className="px-4 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Lista de Clientes */}
        {clientes.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center">
            <p className="text-zinc-500 text-sm">Nenhum cliente encontrado no período selecionado.</p>
          </div>
        ) : (
          <div className="space-y-2 px-1">
            {clientes.map((cliente, index) => (
              <div
                key={`${cliente.nome}-${index}`}
                className="glass-card rounded-2xl p-4 hover:bg-white/5 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30">
                    <span className="text-emerald-400 font-bold text-sm">#{index + 1}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm truncate">{cliente.nome}</h3>
                    <p className="text-[10px] text-zinc-500">
                      {cliente.quantidadeCompras} {cliente.quantidadeCompras === 1 ? 'compra' : 'compras'}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-emerald-400 font-bold text-sm">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cliente.totalGasto)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};