import React, { useState, useEffect } from 'react';
import { Target, Calendar, DollarSign, TrendingUp, Users, Edit2, Trash2, Check, X, Plus, Loader2, Trophy, ArrowLeft, Tag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ConfirmModal } from '../modals/ConfirmModal';
import { useDataCache } from '../../contexts/DataCacheContext';
import { formatCurrencyInput, parseCurrencyInput } from '../../utils/formatters';

interface Meta {
  id: string;
  nome?: string;
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
  onBlockedAction?: () => void;
}

export const GoalsManagementView: React.FC<GoalsManagementViewProps> = ({ lojaId, userId, onBack, onBlockedAction }) => {
  // Usar cache global
  const { loading: cacheLoading, getVendedores, getVendas, getMetas, refreshData } = useDataCache();

  const [metas, setMetas] = useState<MetaComDados[]>([]);
  const [metaExpandida, setMetaExpandida] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editandoMeta, setEditandoMeta] = useState<string | null>(null);

  // Modais de confirmação
  const [modalDeletarAberto, setModalDeletarAberto] = useState(false);
  const [modalAtivarAberto, setModalAtivarAberto] = useState(false);
  const [modalDesativarAberto, setModalDesativarAberto] = useState(false);
  const [metaSelecionada, setMetaSelecionada] = useState<MetaComDados | null>(null);

  // Form state
  const [nomeMeta, setNomeMeta] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [displayValor, setDisplayValor] = useState('R$ 0,00');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Dados vêm do cache
  const vendedores = getVendedores() || [];
  const vendas = getVendas() || [];
  const metasCache = getMetas() || [];

  // Processar metas do cache sempre que mudarem
  useEffect(() => {
    if (metasCache.length > 0 || vendedores.length > 0 || vendas.length > 0) {
      processarMetas(metasCache);
    }
  }, [metasCache, vendedores.length, vendas.length]);

  const processarMetas = (metasData: Meta[]) => {
    const numeroVendedores = vendedores.length;
    console.log('📊 Número de vendedores do cache:', numeroVendedores);

    // Para cada meta, calcular estatísticas usando dados do cache
    const metasComDados = (metasData || []).map((meta) => {
      console.log(`🔍 Calculando vendas para meta ${meta.id} de ${meta.data_inicio} até ${meta.data_fim}`);

      // Filtrar vendas dentro do período da meta
      const vendasMeta = vendas.filter(v => {
        const dataVenda = new Date(v.timestamp);
        const dataInicio = new Date(meta.data_inicio);
        const dataFim = new Date(meta.data_fim);
        return dataVenda >= dataInicio && dataVenda <= dataFim;
      });

      console.log(`✅ Encontradas ${vendasMeta.length} vendas para a meta`);

      const vendasTotal = vendasMeta.reduce((acc, v) => acc + v.amount, 0);
      const percentualAtingido = meta.valor_total > 0 ? (vendasTotal / meta.valor_total) * 100 : 0;
      const metaPorVendedor = numeroVendedores > 0 ? meta.valor_total / numeroVendedores : meta.valor_total;

      console.log(`🎯 Meta ${meta.id}:`, {
        valor_total: meta.valor_total,
        numeroVendedores,
        metaPorVendedor,
        vendasTotal
      });

      // Calcular vendas por vendedor usando cache
      const vendedoresStats = vendedores.map(vendedor => {
        const vendasVendedor = vendasMeta.filter(v => v.sellerId === vendedor.id);
        const totalVendedor = vendasVendedor.reduce((acc, v) => acc + v.amount, 0);
        const percentualVendedor = metaPorVendedor > 0 ? (totalVendedor / metaPorVendedor) * 100 : 0;

        return {
          id: vendedor.id,
          nome: vendedor.name,
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
    });

    setMetas(metasComDados);
  };

  const criarOuEditarMeta = async () => {
    // Verificar se a loja está bloqueada
    if (onBlockedAction) {
      onBlockedAction();
      return;
    }

    if (!valorTotal || !dataInicio || !dataFim) {
      alert('Preencha todos os campos!');
      return;
    }

    const valor = parseCurrencyInput(displayValor);
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
            nome: nomeMeta || null,
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
            nome: nomeMeta || null,
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
      setNomeMeta('');
      setValorTotal('');
      setDisplayValor('R$ 0,00');
      setDataInicio('');
      setDataFim('');
      setShowForm(false);

      // Atualizar cache
      await refreshData(true);
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      alert('Erro ao salvar meta. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const abrirModalDeletar = (meta: MetaComDados) => {
    // Verificar se a loja está bloqueada
    if (onBlockedAction) {
      onBlockedAction();
      return;
    }

    setMetaSelecionada(meta);
    setModalDeletarAberto(true);
  };

  const excluirMeta = async () => {
    if (!metaSelecionada) return;

    // Verificar se a loja está bloqueada
    if (onBlockedAction) {
      setModalDeletarAberto(false);
      onBlockedAction();
      return;
    }

    try {
      const { error } = await supabase
        .from('metas')
        .delete()
        .eq('id', metaSelecionada.id);

      if (error) {
        console.error('Erro ao excluir meta:', error);
        alert('Erro ao excluir meta. Tente novamente.');
      } else {
        // Atualizar cache
        await refreshData(true);
      }
    } catch (error) {
      console.error('Erro ao excluir meta:', error);
      alert('Erro ao excluir meta. Tente novamente.');
    }
  };

  const abrirModalAtivar = (meta: MetaComDados) => {
    // Verificar se a loja está bloqueada
    if (onBlockedAction) {
      onBlockedAction();
      return;
    }

    setMetaSelecionada(meta);
    setModalAtivarAberto(true);
  };

  const abrirModalDesativar = (meta: MetaComDados) => {
    // Verificar se a loja está bloqueada
    if (onBlockedAction) {
      onBlockedAction();
      return;
    }

    setMetaSelecionada(meta);
    setModalDesativarAberto(true);
  };

  const ativarMeta = async () => {
    if (!metaSelecionada) return;

    // Verificar se a loja está bloqueada
    if (onBlockedAction) {
      setModalAtivarAberto(false);
      onBlockedAction();
      return;
    }

    try {
      console.log('🎯 Ativando meta:', metaSelecionada.id);

      // Ativar a meta selecionada (o trigger do banco desativa as outras automaticamente)
      const { error } = await supabase
        .from('metas')
        .update({ status: 'ACTIVE' })
        .eq('id', metaSelecionada.id);

      if (error) {
        console.error('Erro ao ativar meta:', error);
        alert('Erro ao ativar meta');
        return;
      }

      console.log('✅ Meta ativada com sucesso!');
      // Atualizar cache
      await refreshData(true);
    } catch (error) {
      console.error('Erro ao ativar meta:', error);
      alert('Erro ao ativar meta');
    }
  };

  const desativarMeta = async () => {
    if (!metaSelecionada) return;

    // Verificar se a loja está bloqueada
    if (onBlockedAction) {
      setModalDesativarAberto(false);
      onBlockedAction();
      return;
    }

    try {
      console.log('⏸️ Desativando meta:', metaSelecionada.id);

      const { error } = await supabase
        .from('metas')
        .update({ status: 'CANCELLED' })
        .eq('id', metaSelecionada.id);

      if (error) {
        console.error('Erro ao desativar meta:', error);
        alert('Erro ao desativar meta');
        return;
      }

      console.log('✅ Meta desativada!');
      // Atualizar cache
      await refreshData(true);
    } catch (error) {
      console.error('Erro ao desativar meta:', error);
      alert('Erro ao desativar meta');
    }
  };

  const iniciarEdicao = (meta: Meta) => {
    // Verificar se a loja está bloqueada
    if (onBlockedAction) {
      onBlockedAction();
      return;
    }

    setEditandoMeta(meta.id);
    setNomeMeta(meta.nome || '');
    setValorTotal(meta.valor_total.toString());
    // Usar formatCurrency para display, não formatCurrencyInput (que espera centavos)
    setDisplayValor(new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(meta.valor_total));
    setDataInicio(meta.data_inicio.split('T')[0]);
    setDataFim(meta.data_fim.split('T')[0]);
    setShowForm(true);
  };

  const cancelarEdicao = () => {
    setEditandoMeta(null);
    setNomeMeta('');
    setValorTotal('');
    setDisplayValor('R$ 0,00');
    setDataInicio('');
    setDataFim('');
    setShowForm(false);
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setDisplayValor(formatted);
    const numeric = parseCurrencyInput(formatted);
    setValorTotal(numeric.toString());
  };

  const formatarData = (dataISO: string) => {
    // Extrair ano, mês e dia diretamente da string sem conversão de timezone
    const dataParte = dataISO.includes('T') ? dataISO.split('T')[0] : dataISO.split(' ')[0];
    const [ano, mes, dia] = dataParte.split('-');

    const mesesCurtos = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const mesNome = mesesCurtos[parseInt(mes) - 1];

    return `${dia} de ${mesNome}. de ${ano}`;
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  return (
    <div className="pt-header pb-28 space-y-4 animate-slide-up">
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
          onClick={() => {
            if (onBlockedAction) {
              onBlockedAction();
              return;
            }
            setShowForm(true);
          }}
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
            {/* Nome da Meta */}
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2 block">
                Nome da Meta (opcional)
              </label>
              <div className="relative">
                <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={nomeMeta}
                  onChange={(e) => setNomeMeta(e.target.value)}
                  placeholder="Ex: Meta de Natal, Black Friday..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
                />
              </div>
            </div>

            {/* Valor Total */}
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2 block">
                Valor Total da Meta
              </label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={displayValor}
                  onChange={handleValorChange}
                  placeholder="R$ 0,00"
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
      {cacheLoading && metas.length === 0 ? (
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
                className={`glass-card rounded-2xl overflow-hidden transition-all ${isAtiva
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
                      {meta.nome && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <Tag size={12} className="text-zinc-500" />
                          <span className="text-sm text-zinc-400 font-medium">{meta.nome}</span>
                        </div>
                      )}
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
                          <span className={`text-xs font-bold ${meta.percentual_atingido >= 100
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
                            className={`h-full transition-all duration-500 ${meta.percentual_atingido >= 100
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
                      title="Editar meta"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => abrirModalDeletar(meta)}
                      className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-500/50 transition-colors"
                      title="Excluir meta"
                    >
                      <Trash2 size={14} />
                    </button>
                    {isAtiva ? (
                      <button
                        onClick={() => abrirModalDesativar(meta)}
                        className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-colors"
                        title="Desativar meta"
                      >
                        <X size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => abrirModalAtivar(meta)}
                        className="px-3 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
                        title="Ativar meta"
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
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
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
                              <span className={`text-sm font-bold ${vendedor.percentual >= 100 ? 'text-emerald-400' :
                                vendedor.percentual >= 50 ? 'text-yellow-400' :
                                  'text-zinc-400'
                                }`}>
                                {vendedor.percentual.toFixed(1)}%
                              </span>
                              <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-1">
                                <div
                                  className={`h-full ${vendedor.percentual >= 100 ? 'bg-emerald-400' :
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

      {/* Modal Confirmar Deletar Meta */}
      <ConfirmModal
        isOpen={modalDeletarAberto}
        onClose={() => {
          setModalDeletarAberto(false);
          setMetaSelecionada(null);
        }}
        onConfirm={excluirMeta}
        type="danger"
        title="Excluir Meta"
        message={`Tem certeza que deseja excluir esta meta de ${metaSelecionada ? formatarValor(metaSelecionada.valor_total) : ''}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
      />

      {/* Modal Confirmar Ativar Meta */}
      <ConfirmModal
        isOpen={modalAtivarAberto}
        onClose={() => {
          setModalAtivarAberto(false);
          setMetaSelecionada(null);
        }}
        onConfirm={ativarMeta}
        type="success"
        title="Ativar Meta"
        message={`Deseja ativar esta meta de ${metaSelecionada ? formatarValor(metaSelecionada.valor_total) : ''}? Todos os dados do dashboard serão filtrados pelo período desta meta.`}
        confirmText="Ativar"
        cancelText="Cancelar"
      />

      {/* Modal Confirmar Desativar Meta */}
      <ConfirmModal
        isOpen={modalDesativarAberto}
        onClose={() => {
          setModalDesativarAberto(false);
          setMetaSelecionada(null);
        }}
        onConfirm={desativarMeta}
        type="warning"
        title="Desativar Meta"
        message="Deseja desativar esta meta? O dashboard voltará a mostrar os dados do mês atual."
        confirmText="Desativar"
        cancelText="Cancelar"
      />
    </div>
  );
};
