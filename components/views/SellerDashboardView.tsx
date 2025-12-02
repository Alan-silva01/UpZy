import React, { useState, useEffect } from 'react';
import { User, Seller, Sale } from '../../types';
import { ProgressBar } from '../ui/ProgressBar';
import { Target, TrendingUp, AlertCircle, Loader2, Receipt, ArrowRight } from 'lucide-react';
import { buscarLojaIdUsuario } from '../../services/auth';
import { buscarVendedores } from '../../services/api';
import { supabase } from '../../lib/supabase';
import { Header } from '../Header';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';

interface SellerDashboardProps {
  user: User;
  onLogout?: () => void;
  onViewAllSales?: () => void;
}

export const SellerDashboardView: React.FC<SellerDashboardProps> = ({ user, onLogout, onViewAllSales }) => {
  const [sellerProfile, setSellerProfile] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [ultimasVendas, setUltimasVendas] = useState<Sale[]>([]);
  const [lojaId, setLojaId] = useState<string>('');

  useEffect(() => {
    const inicializar = async () => {
      const loja = await buscarLojaIdUsuario(user.id);
      if (loja) {
        setLojaId(loja);
      }
      carregarDadosVendedor();
      carregarUltimasVendas();
    };
    inicializar();
  }, [user.sellerId]);

  // Real-time subscriptions (atualizações silenciosas - sem loader)
  useRealtimeSubscription({
    table: 'vendas',
    lojaId,
    filter: `vendedor_id=eq.${user.sellerId}`,
    onInsert: () => {
      console.log('🔴 Nova venda do vendedor detectada! Recarregando dados...');
      carregarDadosVendedor(true); // silencioso
      carregarUltimasVendas();
    },
    onUpdate: () => {
      console.log('🔴 Venda do vendedor atualizada! Recarregando dados...');
      carregarDadosVendedor(true); // silencioso
      carregarUltimasVendas();
    },
    onDelete: () => {
      console.log('🔴 Venda do vendedor deletada! Recarregando dados...');
      carregarDadosVendedor(true); // silencioso
      carregarUltimasVendas();
    }
  });

  useRealtimeSubscription({
    table: 'vendedores',
    lojaId,
    filter: `id=eq.${user.sellerId}`,
    onUpdate: () => {
      console.log('🔴 Perfil do vendedor atualizado! Recarregando dados...');
      carregarDadosVendedor(true); // silencioso
    }
  });

  useRealtimeSubscription({
    table: 'metas',
    lojaId,
    onInsert: () => {
      console.log('🔴 Nova meta detectada! Recarregando dados...');
      carregarDadosVendedor(true); // silencioso
    },
    onUpdate: () => {
      console.log('🔴 Meta atualizada! Recarregando dados...');
      carregarDadosVendedor(true); // silencioso
    }
  });

  const carregarDadosVendedor = async (silencioso = false) => {
    if (!silencioso) {
      setLoading(true);
    }
    const lojaId = await buscarLojaIdUsuario(user.id);
    if (lojaId) {
      const vendedores = await buscarVendedores(lojaId);
      const vendedor = vendedores.find(v => v.id === user.sellerId);
      if (vendedor) {
        setSellerProfile(vendedor);

        // Buscar estatísticas reais do vendedor
        const { data: vendas } = await supabase
          .from('vendas')
          .select('valor')
          .eq('vendedor_id', user.sellerId);

        const totalVendas = vendas?.length || 0;
        const valorTotal = vendas?.reduce((acc, v) => acc + v.valor, 0) || 0;
        const ticketMedio = totalVendas > 0 ? valorTotal / totalVendas : 0;

        setSellerProfile(prev => ({
          ...vendedor,
          totalVendas,
          ticketMedio
        } as any));
      } else {
        // Fallback se não encontrar
        setSellerProfile({
          id: user.sellerId || '0',
          name: user.name,
          currentSales: 0,
          target: 10000,
          avatar: user.avatar,
          totalVendas: 0,
          ticketMedio: 0
        } as any);
      }
    }
    if (!silencioso) {
      setLoading(false);
    }
  };

  const carregarUltimasVendas = async () => {
    if (!user.sellerId) return;

    const lojaId = await buscarLojaIdUsuario(user.id);
    if (!lojaId) return;

    const { data: vendas, error } = await supabase
      .from('vendas')
      .select('*')
      .eq('vendedor_id', user.sellerId)
      .eq('loja_id', lojaId)
      .order('data_venda', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Erro ao carregar vendas:', error);
      return;
    }

    setUltimasVendas((vendas as Sale[]) || []);
  };

  const percentage = sellerProfile ? (sellerProfile.currentSales / sellerProfile.target) * 100 : 0;

  if (loading || !sellerProfile) {
    return (
      <>
        <Header user={user} onLogout={onLogout} />
        <div className="pt-32 pb-28 space-y-6 flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header user={user} onLogout={onLogout} />
      <div className="pt-24 pb-28 space-y-6 animate-slide-up">

      {/* Main Goal Card */}
      <div className="relative w-full rounded-[2.5rem] overflow-hidden shadow-2xl group">
         <div className="absolute inset-0 bg-zinc-900"></div>
         {/* Animated Background Gradients */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

         <div className="relative p-6 flex flex-col justify-between z-10">
            <div className="flex justify-between items-start mb-4">
               <div className="bg-white/5 border border-white/5 rounded-full px-3 py-1 flex items-center gap-2 backdrop-blur-md">
                 <Target size={14} className="text-emerald-400" />
                 <span className="text-xs text-emerald-100 font-medium">Minha Meta</span>
               </div>
            </div>

            <div className="text-center py-3">
              <div className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2">Vendido este mês</div>
              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 tracking-tighter">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(sellerProfile.currentSales)}
              </div>
              <div className="text-xs text-zinc-500 mt-2">
                {percentage >= 100 ? (
                  <>Parabéns! Você passou <span className="text-amber-400 font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(sellerProfile.currentSales - sellerProfile.target)}</span> da meta</>
                ) : (
                  <>Faltam <span className="text-white font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(sellerProfile.target - sellerProfile.currentSales)}</span></>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end text-xs font-bold px-1">
                 <span className={percentage >= 100 ? "text-amber-400" : "text-emerald-400"}>{percentage.toFixed(0)}%</span>
                 <span className="text-zinc-600">Meta: {new Intl.NumberFormat('pt-BR', { notation: "compact", style: 'currency', currency: 'BRL' }).format(sellerProfile.target)}</span>
              </div>

              {/* Custom Progress Bar com marca de meta */}
              <div className="relative">
                <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${percentage >= 100 ? "bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500" : "bg-gradient-to-r from-emerald-500 to-emerald-300"}`}
                    style={{ width: `${Math.min(percentage, 150)}%` }}
                  />
                </div>
                {/* Marca da meta aos 100% */}
                {percentage > 100 && (
                  <div className="absolute top-0 w-0.5 h-3 bg-black" style={{ left: `${(100 / Math.min(percentage, 150)) * 100}%` }}>
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full"></div>
                  </div>
                )}
              </div>

              {percentage >= 100 && (
                <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-3">
                   <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                     <AlertCircle size={14} className="text-amber-400" />
                   </div>
                   <p className="text-[10px] text-amber-100 leading-relaxed font-medium">
                     Meta batida! Tudo que vender agora conta para o bônus extra.
                   </p>
                </div>
              )}
            </div>
         </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
         <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <TrendingUp size={16} />
              </div>
              <div className="text-[10px] text-zinc-500 uppercase font-medium">Vendas Realizadas</div>
            </div>
            <div className="text-2xl font-bold text-white">{(sellerProfile as any).totalVendas || 0}</div>
         </div>
         <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Target size={16} />
              </div>
              <div className="text-[10px] text-zinc-500 uppercase font-medium">Ticket Médio</div>
            </div>
            <div className="text-2xl font-bold text-white">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format((sellerProfile as any).ticketMedio || 0)}
            </div>
         </div>
      </div>

      {/* Últimas Vendas */}
      <div className="glass-card rounded-[2rem] p-5 border border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Receipt size={20} />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Últimas Vendas</h3>
              <p className="text-[10px] text-zinc-500">Suas 5 vendas mais recentes</p>
            </div>
          </div>
          {onViewAllSales && (
            <button
              onClick={onViewAllSales}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all text-xs font-bold"
            >
              Ver Todas
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        {ultimasVendas.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <p className="text-xs">Nenhuma venda realizada ainda.</p>
            <p className="text-[10px] text-zinc-600 mt-2">Total no estado: {ultimasVendas.length}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ultimasVendas.map((venda) => {
              const metodoPagamento = {
                'pix': 'PIX',
                'dinheiro': 'Dinheiro',
                'cartao': 'Cartão',
                'boleto': 'Boleto',
                'promissoria': 'Promissória'
              }[venda.metodo_pagamento] || venda.metodo_pagamento;

              const tipoPagamento = venda.tipo_pagamento === 'avista' ? 'À vista' : `${venda.parcelas}x`;

              return (
                <div key={venda.id} className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800 hover:border-zinc-700 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm">{venda.nome_cliente || 'Cliente'}</p>
                      <p className="text-[10px] text-zinc-500">
                        {new Date(venda.data_venda).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-sm">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(venda.valor)}
                      </p>
                      <p className="text-[10px] text-zinc-500">{venda.quantidade_itens} {venda.quantidade_itens === 1 ? 'item' : 'itens'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-medium">
                      {metodoPagamento}
                    </span>
                    {venda.tipo_pagamento === 'parcelado' && (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                        {tipoPagamento}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </>
  );
};