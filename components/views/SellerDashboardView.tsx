import React, { useState, useEffect } from 'react';
import { User, Seller, Sale } from '../../types';
import { ProgressBar } from '../ui/ProgressBar';
import { Target, TrendingUp, AlertCircle, Receipt, ArrowRight } from 'lucide-react';
import LoadingScreen from '../ui/LoadingScreen';
import { buscarLojaIdUsuario } from '../../services/auth';
import { supabase } from '../../lib/supabase';
import { useDataCache } from '../../contexts/DataCacheContext';
import { EditSaleModal } from '../modals/EditSaleModal';
import { SellerSettingsModal } from '../modals/SellerSettingsModal';
import { formatCurrency } from '../../utils/formatters';

interface SellerDashboardProps {
  user: User;
  onLogout?: () => void;
  onViewAllSales?: (saleId?: string) => void;
}

export const SellerDashboardView: React.FC<SellerDashboardProps> = ({ user, onLogout, onViewAllSales }) => {
  // Usar cache global
  const { loading: cacheLoading, getVendedores, getVendas } = useDataCache();

  const [sellerProfile, setSellerProfile] = useState<Seller | null>(null);
  const [ultimasVendas, setUltimasVendas] = useState<Sale[]>([]);
  const [lojaId, setLojaId] = useState<string>('');
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [userName, setUserName] = useState(user.name);
  const [metaAtiva, setMetaAtiva] = useState<{ dataInicio: string; dataFim: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Dados vêm do cache
  const vendedores = getVendedores() || [];
  const todasVendas = getVendas() || [];

  useEffect(() => {
    const inicializar = async () => {
      const loja = await buscarLojaIdUsuario(user.id);
      if (loja) {
        setLojaId(loja);
      }
    };
    inicializar();
  }, [user.id]);

  // Atualizar dados do vendedor quando o cache mudar
  useEffect(() => {
    if (!cacheLoading && vendedores.length > 0 && user.sellerId && lojaId) {
      carregarDadosVendedor();
    }
  }, [cacheLoading, vendedores, todasVendas, user.sellerId, lojaId]);

  // Carregar últimas vendas do vendedor
  useEffect(() => {
    if (todasVendas.length > 0 && user.sellerId) {
      const vendasVendedor = todasVendas
        .filter(v => v.sellerId === user.sellerId)
        .slice(0, 5);
      setUltimasVendas(vendasVendedor);
    }
  }, [todasVendas, user.sellerId]);

  const carregarDadosVendedor = async () => {
    console.log('📊 [Dashboard Vendedor] Carregando dados do vendedor...', { sellerId: user.sellerId });

    if (!lojaId) {
      console.warn('⚠️ [Dashboard Vendedor] lojaId não disponível ainda');
      return;
    }

    // Buscar meta ativa primeiro
    const { data: metaAtivaData } = await supabase
      .from('metas')
      .select('*')
      .eq('loja_id', lojaId)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (metaAtivaData) {
      setMetaAtiva({
        dataInicio: metaAtivaData.data_inicio,
        dataFim: metaAtivaData.data_fim
      });
    } else {
      setMetaAtiva(null);
    }

    const vendedor = vendedores.find(v => v.id === user.sellerId);
    if (vendedor) {
      console.log('📊 [Dashboard Vendedor] Vendedor encontrado:', vendedor);

      // Filtrar vendas do vendedor
      let vendasVendedor = todasVendas.filter(v => v.sellerId === user.sellerId);

      // Se houver meta ativa, filtrar apenas vendas dentro do período da meta
      if (metaAtivaData) {
        const dataInicio = new Date(metaAtivaData.data_inicio);
        const dataFim = new Date(metaAtivaData.data_fim);
        vendasVendedor = vendasVendedor.filter(v => {
          const dataVenda = new Date(v.timestamp);
          return dataVenda >= dataInicio && dataVenda <= dataFim;
        });
      }

      const totalVendas = vendasVendedor.length;
      const valorTotal = vendasVendedor.reduce((acc, v) => acc + (v.amount || 0), 0);
      const ticketMedio = totalVendas > 0 ? valorTotal / totalVendas : 0;

      console.log('📊 [Dashboard Vendedor] Estatísticas calculadas:', {
        totalVendas,
        valorTotal,
        ticketMedio,
        currentSales: vendedor.currentSales,
        target: vendedor.target,
        metaAtiva: metaAtivaData ? 'SIM' : 'NÃO'
      });

      setSellerProfile({
        ...vendedor,
        totalVendas,
        ticketMedio,
        currentSales: metaAtivaData ? valorTotal : vendedor.currentSales
      } as any);
    } else {
      console.warn('⚠️ [Dashboard Vendedor] Vendedor não encontrado na lista!');
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
  };

  const handleSaveSale = async (vendaId: string, dadosAtualizados: Partial<Sale>) => {
    console.log('💾 Salvando venda:', vendaId, dadosAtualizados);

    const { error } = await supabase
      .from('vendas')
      .update(dadosAtualizados)
      .eq('id', vendaId);

    if (error) {
      console.error('❌ Erro ao atualizar venda:', error);
      alert('Erro ao atualizar venda');
      return;
    }

    console.log('✅ Venda atualizada com sucesso!');
  };

  const percentage = sellerProfile ? (sellerProfile.currentSales / sellerProfile.target) * 100 : 0;

  // Mostrar loader apenas na primeira carga quando não tem dados do cache
  if ((loading || cacheLoading) && vendedores.length === 0) {
    return <LoadingScreen />;
  }

  if (!sellerProfile) {
    return null;
  }

  return (
    <div className="pt-header pb-28 space-y-6 animate-slide-up">

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
            <div className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2">Vendido nesta meta</div>
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 tracking-tighter">
              {formatCurrency(sellerProfile.currentSales)}
            </div>
            <div className="text-xs text-zinc-500 mt-2">
              {percentage >= 100 ? (
                <>Parabéns! Você passou <span className="text-amber-400 font-bold">{formatCurrency(sellerProfile.currentSales - sellerProfile.target)}</span> da meta</>
              ) : (
                <>Faltam <span className="text-white font-bold">{formatCurrency(sellerProfile.target - sellerProfile.currentSales)}</span></>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end text-xs font-bold px-1">
              <span className={percentage >= 100 ? "text-amber-400" : "text-emerald-400"}>{percentage.toFixed(0)}%</span>
              <span className="text-zinc-600">Meta: {formatCurrency(sellerProfile.target, true)}</span>
            </div>

            {/* Custom Progress Bar com marca de meta proporcional */}
            <div className="relative">
              <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${percentage >= 100 ? "bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500" : "bg-gradient-to-r from-emerald-500 to-emerald-300"}`}
                  style={{ width: `${Math.min(percentage, 200)}%` }}
                />
              </div>
              {/* Marca da meta aos 100% - posição proporcional */}
              {percentage > 100 && (
                <div
                  className="absolute top-0 w-0.5 h-3 bg-white/80 shadow-lg"
                  style={{ left: `${(sellerProfile.target / sellerProfile.currentSales) * 100}%` }}
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-lg"></div>
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
            {formatCurrency((sellerProfile as any).ticketMedio || 0, true)}
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
                'cartao_debito': 'Débito',
                'cartao_credito': 'Crédito',
                'boleto': 'Boleto',
                'promissoria': 'Promissória'
              }[venda.paymentMethod || ''] || venda.paymentMethod;

              const tipoPagamento = venda.paymentType === 'avista' ? 'À vista' : `${venda.installments}x`;

              return (
                <div
                  key={venda.id}
                  onClick={() => onViewAllSales?.(venda.id)}
                  className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm">{venda.customerName || 'Cliente'}</p>
                      <p className="text-[10px] text-zinc-500">
                        {new Date(venda.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-sm">
                        {formatCurrency(venda.amount)}
                      </p>
                      <p className="text-[10px] text-zinc-500">Pedido: {venda.orderId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                      {metodoPagamento}
                    </span>
                    {venda.paymentType === 'parcelado' && (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                        {tipoPagamento}
                      </span>
                    )}
                    {venda.paymentType === 'avista' && (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                        À vista
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {editingSale && (
        <EditSaleModal
          isOpen={true}
          onClose={() => setEditingSale(null)}
          onSave={handleSaveSale}
          sale={editingSale}
        />
      )}
    </div>
  );
};