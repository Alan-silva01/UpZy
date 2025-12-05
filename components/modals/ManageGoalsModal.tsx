import React, { useState, useEffect } from 'react';
import { X, Target, Calendar, DollarSign, Check, Loader2, TrendingUp, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatarDataSemTimezone } from '../../utils/formatters';

interface Meta {
  id: string;
  valor_total: number;
  data_inicio: string;
  data_fim: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  criado_em: string;
}

interface MetaComDados extends Meta {
  vendas_total: number;
  percentual_atingido: number;
  numero_vendedores: number;
  meta_por_vendedor: number;
}

interface ManageGoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lojaId: string;
  onMetaSelected: (metaId: string | null) => void;
}

export const ManageGoalsModal: React.FC<ManageGoalsModalProps> = ({
  isOpen,
  onClose,
  lojaId,
  onMetaSelected
}) => {
  const [metas, setMetas] = useState<MetaComDados[]>([]);
  const [loading, setLoading] = useState(false);
  const [metaAtiva, setMetaAtiva] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      carregarMetas();
    }
  }, [isOpen]);

  const carregarMetas = async () => {
    setLoading(true);
    try {
      // Buscar metas
      const { data: metasData, error: metasError } = await supabase
        .from('metas')
        .select('*')
        .eq('loja_id', lojaId)
        .order('criado_em', { ascending: false });

      if (metasError) {
        console.error('Erro ao carregar metas:', metasError);
        return;
      }

      // Buscar número de vendedores
      const { data: vendedores } = await supabase
        .from('vendedores')
        .select('id')
        .eq('loja_id', lojaId);

      const numeroVendedores = vendedores?.length || 0;

      // Para cada meta, buscar vendas do período
      const metasComDados = await Promise.all(
        (metasData || []).map(async (meta) => {
          const { data: vendas } = await supabase
            .from('vendas')
            .select('valor')
            .eq('loja_id', lojaId)
            .gte('data_venda', meta.data_inicio)
            .lte('data_venda', meta.data_fim);

          const vendasTotal = vendas?.reduce((acc, v) => acc + v.valor, 0) || 0;
          const percentualAtingido = meta.valor_total > 0 ? (vendasTotal / meta.valor_total) * 100 : 0;
          const metaPorVendedor = numeroVendedores > 0 ? meta.valor_total / numeroVendedores : meta.valor_total;

          return {
            ...meta,
            vendas_total: vendasTotal,
            percentual_atingido: percentualAtingido,
            numero_vendedores: numeroVendedores,
            meta_por_vendedor: metaPorVendedor
          };
        })
      );

      // Log completo das metas carregadas
      console.log('🔍 [GERENCIAR METAS] Metas carregadas do banco:', JSON.stringify(metasComDados, null, 2));

      setMetas(metasComDados);

      // Identificar meta ativa
      const ativa = metasComDados.find(m => m.status === 'ACTIVE');
      if (ativa) {
        console.log('✅ [GERENCIAR METAS] Meta ativa:', ativa);
        console.log('📅 [GERENCIAR METAS] data_inicio:', ativa.data_inicio);
        console.log('📅 [GERENCIAR METAS] data_fim:', ativa.data_fim);
        setMetaAtiva(ativa.id);
      }
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
    } finally {
      setLoading(false);
    }
  };

  const ativarMeta = async (metaId: string) => {
    try {
      // Desativar todas as outras metas
      await supabase
        .from('metas')
        .update({ status: 'CANCELLED' })
        .eq('loja_id', lojaId)
        .eq('status', 'ACTIVE');

      // Ativar a meta selecionada
      const { error } = await supabase
        .from('metas')
        .update({ status: 'ACTIVE' })
        .eq('id', metaId);

      if (error) {
        console.error('Erro ao ativar meta:', error);
        alert('Erro ao ativar meta');
        return;
      }

      setMetaAtiva(metaId);
      onMetaSelected(metaId);
      carregarMetas();
    } catch (error) {
      console.error('Erro ao ativar meta:', error);
      alert('Erro ao ativar meta');
    }
  };

  const desativarMeta = async (metaId: string) => {
    try {
      const { error } = await supabase
        .from('metas')
        .update({ status: 'CANCELLED' })
        .eq('id', metaId);

      if (error) {
        console.error('Erro ao desativar meta:', error);
        alert('Erro ao desativar meta');
        return;
      }

      setMetaAtiva(null);
      onMetaSelected(null);
      carregarMetas();
    } catch (error) {
      console.error('Erro ao desativar meta:', error);
      alert('Erro ao desativar meta');
    }
  };

  const formatarData = (dataISO: string) => {
    console.log('📅 Data ISO recebida:', dataISO);
    const resultado = formatarDataSemTimezone(dataISO, 'curto');
    console.log('📅 Data formatada:', resultado);
    return resultado;
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-zinc-900 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl max-h-[90vh] flex flex-col animate-slide-up border border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Gerenciar Metas</h2>
              <p className="text-xs text-zinc-500">Ative ou desative metas existentes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : metas.length === 0 ? (
            <div className="text-center py-12">
              <Target size={48} className="mx-auto text-zinc-700 mb-3" />
              <p className="text-zinc-500 text-sm">Nenhuma meta criada ainda</p>
              <p className="text-zinc-600 text-xs mt-1">Crie uma meta primeiro</p>
            </div>
          ) : (
            <div className="space-y-3">
              {metas.map((meta) => {
                const isAtiva = meta.status === 'ACTIVE' && meta.id === metaAtiva;

                return (
                  <div
                    key={meta.id}
                    className={`glass-card rounded-2xl p-5 space-y-4 transition-all ${
                      isAtiva
                        ? 'border-2 border-indigo-500/50 bg-indigo-500/5'
                        : 'border border-zinc-800'
                    }`}
                  >
                    {/* Header da Meta */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign size={18} className="text-indigo-400" />
                          <span className="text-xl font-bold text-white">
                            {formatarValor(meta.valor_total)}
                          </span>
                          {isAtiva && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[9px] font-bold border border-indigo-500/30">
                              ATIVA
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
                          <Calendar size={12} />
                          <span>{formatarData(meta.data_inicio)} - {formatarData(meta.data_fim)}</span>
                        </div>

                        {/* Estatísticas */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-zinc-900/50 rounded-lg p-2">
                            <div className="flex items-center gap-1.5 mb-1">
                              <TrendingUp size={12} className="text-emerald-400" />
                              <span className="text-[9px] text-zinc-500 uppercase font-bold">Vendido</span>
                            </div>
                            <span className="text-sm font-bold text-white">
                              {formatarValor(meta.vendas_total)}
                            </span>
                          </div>
                          <div className="bg-zinc-900/50 rounded-lg p-2">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Users size={12} className="text-purple-400" />
                              <span className="text-[9px] text-zinc-500 uppercase font-bold">Por Vendedor</span>
                            </div>
                            <span className="text-sm font-bold text-white">
                              {formatarValor(meta.meta_por_vendedor)}
                            </span>
                          </div>
                        </div>

                        {/* Progresso */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-zinc-500">Progresso</span>
                            <span className={`text-xs font-bold ${
                              meta.percentual_atingido >= 100
                                ? 'text-emerald-400'
                                : meta.percentual_atingido >= 50
                                  ? 'text-yellow-400'
                                  : 'text-zinc-400'
                            }`}>
                              {meta.percentual_atingido.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                meta.percentual_atingido >= 100
                                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                  : meta.percentual_atingido >= 50
                                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                                    : 'bg-gradient-to-r from-indigo-400 to-indigo-500'
                              }`}
                              style={{ width: `${Math.min(meta.percentual_atingido, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botão de Ativar/Desativar */}
                    {isAtiva ? (
                      <button
                        onClick={() => desativarMeta(meta.id)}
                        className="w-full py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-bold hover:bg-zinc-700 transition-colors"
                      >
                        Desativar Meta
                      </button>
                    ) : (
                      <button
                        onClick={() => ativarMeta(meta.id)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-xs font-bold hover:from-indigo-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Check size={14} />
                        Ativar Esta Meta
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
