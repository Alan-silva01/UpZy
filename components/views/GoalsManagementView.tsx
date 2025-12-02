import React, { useState, useEffect } from 'react';
import { Target, Calendar, DollarSign, TrendingUp, Users, Edit2, Trash2, Check, X, Plus, Loader2, Trophy, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
  vendedores_stats: {
    id: string;
    nome: string;
    vendas: number;
    percentual: number;
  }[];
}

interface GoalsManagementViewProps {
  lojaId: string;
  userId: string;
  onBack: () => void;
}

export const GoalsManagementView: React.FC<GoalsManagementViewProps> = ({ lojaId, userId, onBack }) => {
  const [metas, setMetas] = useState<MetaComDados[]>([]);
  const [loading, setLoading] = useState(false);
  const [metaExpandida, setMetaExpandida] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editandoMeta, setEditandoMeta] = useState<string | null>(null);

  // Form state
  const [valorTotal, setValorTotal] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarMetas();
  }, [lojaId]);

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

      // Buscar vendedores com join na tabela usuarios
      const { data: vendedores, error: vendedoresError } = await supabase
        .from('vendedores')
        .select(`
          id,
          usuarios!inner (
            nome
          )
        `)
        .eq('loja_id', lojaId);

      if (vendedoresError) {
        console.error('❌ Erro ao buscar vendedores:', vendedoresError);
      }

      console.log('👥 Vendedores retornados:', vendedores);
      const numeroVendedores = vendedores?.length || 0;
      console.log('📊 Número de vendedores encontrados:', numeroVendedores);

      // Para cada meta, buscar vendas e estatísticas por vendedor
      const metasComDados = await Promise.all(
        (metasData || []).map(async (meta) => {
          const { data: vendas } = await supabase
            .from('vendas')
            .select('valor, vendedor_id')
            .eq('loja_id', lojaId)
            .gte('data', meta.data_inicio)
            .lte('data', meta.data_fim);

          const vendasTotal = vendas?.reduce((acc, v) => acc + v.valor, 0) || 0;
          const percentualAtingido = meta.valor_total > 0 ? (vendasTotal / meta.valor_total) * 100 : 0;
          const metaPorVendedor = numeroVendedores > 0 ? meta.valor_total / numeroVendedores : meta.valor_total;

          console.log(`🎯 Meta ${meta.id}:`, {
            valor_total: meta.valor_total,
            numeroVendedores,
            metaPorVendedor
          });

          // Calcular vendas por vendedor
          const vendedoresStats = (vendedores || []).map(vendedor => {
            const vendasVendedor = vendas?.filter(v => v.vendedor_id === vendedor.id) || [];
            const totalVendedor = vendasVendedor.reduce((acc, v) => acc + v.valor, 0);
            const percentualVendedor = metaPorVendedor > 0 ? (totalVendedor / metaPorVendedor) * 100 : 0;

            return {
              id: vendedor.id,
              nome: (vendedor as any).usuarios?.nome || 'Sem nome',
              vendas: totalVendedor,
              percentual: percentualVendedor
            };
          }).sort((a, b) => b.vendas - a.vendas); // Ordenar por vendas (maior primeiro)

          return {
            ...meta,
            vendas_total: vendasTotal,
            percentual_atingido: percentualAtingido,
            numero_vendedores: numeroVendedores,
            meta_por_vendedor: metaPorVendedor,
            vendedores_stats: vendedoresStats
          };
        })
      );

      setMetas(metasComDados);
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
    } finally {
      setLoading(false);
    }
  };

  const criarOuEditarMeta = async () => {
    if (!valorTotal || !dataInicio || !dataFim) {
      alert('Preencha todos os campos!');
      return;
    }

    const valor = parseFloat(valorTotal);
    if (valor <= 0) {
      alert('O valor da meta deve ser maior que zero!');
      return;
    }

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    if (fim <= inicio) {
      alert('A data de fim deve ser posterior à data de início!');
      return;
    }

    setSalvando(true);
    try {
      if (editandoMeta) {
        // Editar meta existente
        const { error } = await supabase
          .from('metas')
          .update({
            valor_total: valor,
            data_inicio: inicio.toISOString(),
            data_fim: fim.toISOString()
          })
          .eq('id', editandoMeta);

        if (error) {
          console.error('Erro ao editar meta:', error);
          alert('Erro ao editar meta. Tente novamente.');
        } else {
          setEditandoMeta(null);
        }
      } else {
        // Criar nova meta
        const { error } = await supabase
          .from('metas')
          .insert({
            loja_id: lojaId,
            valor_total: valor,
            data_inicio: inicio.toISOString(),
            data_fim: fim.toISOString(),
            status: 'ACTIVE',
            criado_por: userId
          });

        if (error) {
          console.error('Erro ao criar meta:', error);
          alert('Erro ao criar meta. Tente novamente.');
        }
      }

      // Limpar formulário
      setValorTotal('');
      setDataInicio('');
      setDataFim('');
      setShowForm(false);
      carregarMetas();
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      alert('Erro ao salvar meta. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const excluirMeta = async (metaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('metas')
        .delete()
        .eq('id', metaId);

      if (error) {
        console.error('Erro ao excluir meta:', error);
        alert('Erro ao excluir meta. Tente novamente.');
      } else {
        carregarMetas();
      }
    } catch (error) {
      console.error('Erro ao excluir meta:', error);
      alert('Erro ao excluir meta. Tente novamente.');
    }
  };

  const ativarMeta = async (metaId: string) => {
    try {
      console.log('🎯 Ativando meta:', metaId);

      // PRIMEIRO: Desativar TODAS as metas da loja
      const { error: errorDesativar } = await supabase
        .from('metas')
        .update({ ativa: false })
        .eq('loja_id', lojaId);

      if (errorDesativar) {
        console.error('Erro ao desativar outras metas:', errorDesativar);
        alert('Erro ao desativar outras metas');
        return;
      }

      // SEGUNDO: Ativar apenas a meta selecionada
      const { error } = await supabase
        .from('metas')
        .update({ ativa: true })
        .eq('id', metaId);

      if (error) {
        console.error('Erro ao ativar meta:', error);
        alert('Erro ao ativar meta');
        return;
      }

      console.log('✅ Meta ativada com sucesso!');
      alert('Meta ativada! Todos os dados agora mostram vendas deste período.');
      carregarMetas();
    } catch (error) {
      console.error('Erro ao ativar meta:', error);
      alert('Erro ao ativar meta');
    }
  };

  const desativarMeta = async (metaId: string) => {
    try {
      console.log('⏸️ Desativando meta:', metaId);

      const { error } = await supabase
        .from('metas')
        .update({ ativa: false })
        .eq('id', metaId);

      if (error) {
        console.error('Erro ao desativar meta:', error);
        alert('Erro ao desativar meta');
        return;
      }

      console.log('✅ Meta desativada!');
      alert('Meta desativada. Voltando a mostrar dados do mês atual.');
      carregarMetas();
    } catch (error) {
      console.error('Erro ao desativar meta:', error);
      alert('Erro ao desativar meta');
    }
  };

  const iniciarEdicao = (meta: Meta) => {
    setEditandoMeta(meta.id);
    setValorTotal(meta.valor_total.toString());
    setDataInicio(meta.data_inicio.split('T')[0]);
    setDataFim(meta.data_fim.split('T')[0]);
    setShowForm(true);
  };

  const cancelarEdicao = () => {
    setEditandoMeta(null);
    setValorTotal('');
    setDataInicio('');
    setDataFim('');
    setShowForm(false);
  };

  const formatarData = (dataISO: string) => {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  return (
    <div className="pt-24 pb-28 space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-2">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <Target className="w-4 h-4 text-indigo-400" />
          </div>
          <h1 className="text-lg font-bold text-white">Gerenciar Metas</h1>
        </div>
        <div className="w-9" /> {/* Spacer */}
      </div>

      {/* Botão Criar Nova Meta */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 bg-zinc-900/50 hover:bg-indigo-500/5 text-zinc-500 hover:text-indigo-400 text-sm font-bold transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Criar Nova Meta
        </button>
      )}

      {/* Formulário de Criar/Editar Meta */}
      {showForm && (
        <div className="glass-card rounded-2xl p-5 space-y-4 border border-zinc-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            {editandoMeta ? <Edit2 size={16} className="text-indigo-400" /> : <Plus size={16} className="text-indigo-400" />}
            {editandoMeta ? 'Editar Meta' : 'Nova Meta'}
          </h3>

          <div className="space-y-3">
            {/* Valor Total */}
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2 block">
                Valor Total da Meta
              </label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="number"
                  value={valorTotal}
                  onChange={(e) => setValorTotal(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
                />
              </div>
              <p className="text-xs text-zinc-600 mt-1">
                Será dividido entre todos os vendedores
              </p>
            </div>

            {/* Data Início */}
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2 block">
                Data de Início
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
              />
            </div>

            {/* Data Fim */}
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2 block">
                Data de Término
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={cancelarEdicao}
              className="flex-1 py-3 rounded-xl border border-zinc-700 bg-zinc-800 text-white text-sm font-bold hover:bg-zinc-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={criarOuEditarMeta}
              disabled={salvando}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-bold hover:from-indigo-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {salvando ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                editandoMeta ? 'Salvar Alterações' : 'Criar Meta'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Lista de Metas */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : metas.length === 0 ? (
        <div className="text-center py-12">
          <Target size={48} className="mx-auto text-zinc-700 mb-3" />
          <p className="text-zinc-500 text-sm">Nenhuma meta criada ainda</p>
          <p className="text-zinc-600 text-xs mt-1">Clique no botão acima para criar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {metas.map((meta) => {
            const isAtiva = meta.status === 'ACTIVE';
            const isExpandida = metaExpandida === meta.id;

            return (
              <div
                key={meta.id}
                className={`glass-card rounded-2xl overflow-hidden transition-all ${
                  isAtiva
                    ? 'border-2 border-indigo-500/50 bg-indigo-500/5'
                    : 'border border-zinc-800'
                }`}
              >
                {/* Header da Meta */}
                <div className="p-5 space-y-4">
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

                      {/* Estatísticas Resumidas */}
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

                  {/* Botões de Ação */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMetaExpandida(isExpandida ? null : meta.id)}
                      className="flex-1 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition-colors"
                    >
                      {isExpandida ? 'Ocultar Detalhes' : 'Ver Detalhes'}
                    </button>
                    <button
                      onClick={() => iniciarEdicao(meta)}
                      className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-indigo-400 hover:border-indigo-500/50 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => excluirMeta(meta.id)}
                      className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-500/50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    {isAtiva ? (
                      <button
                        onClick={() => desativarMeta(meta.id)}
                        className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-colors"
                      >
                        <X size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => ativarMeta(meta.id)}
                        className="px-3 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Detalhes Expandidos - Ranking de Vendedores */}
                {isExpandida && (
                  <div className="border-t border-zinc-800 p-5 bg-zinc-900/30">
                    <div className="flex items-center gap-2 mb-4">
                      <Trophy size={16} className="text-yellow-400" />
                      <h4 className="text-sm font-bold text-white">Ranking de Vendedores</h4>
                    </div>

                    {meta.vendedores_stats.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-4">Nenhum vendedor cadastrado</p>
                    ) : (
                      <div className="space-y-3">
                        {meta.vendedores_stats.map((vendedor, index) => (
                          <div
                            key={vendedor.id}
                            className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800"
                          >
                            {/* Posição */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                              index === 1 ? 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30' :
                              index === 2 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                              'bg-zinc-800 text-zinc-500'
                            }`}>
                              {index + 1}º
                            </div>

                            {/* Info do Vendedor */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white truncate">{vendedor.nome}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-emerald-400 font-bold">
                                  {formatarValor(vendedor.vendas)}
                                </span>
                                <span className="text-xs text-zinc-500">
                                  de {formatarValor(meta.meta_por_vendedor)}
                                </span>
                              </div>
                            </div>

                            {/* Percentual */}
                            <div className="text-right">
                              <span className={`text-sm font-bold ${
                                vendedor.percentual >= 100 ? 'text-emerald-400' :
                                vendedor.percentual >= 50 ? 'text-yellow-400' :
                                'text-zinc-400'
                              }`}>
                                {vendedor.percentual.toFixed(1)}%
                              </span>
                              <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-1">
                                <div
                                  className={`h-full ${
                                    vendedor.percentual >= 100 ? 'bg-emerald-400' :
                                    vendedor.percentual >= 50 ? 'bg-yellow-400' :
                                    'bg-indigo-400'
                                  }`}
                                  style={{ width: `${Math.min(vendedor.percentual, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
