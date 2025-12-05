import React, { useState, useEffect } from 'react';
import { X, Target, Calendar, DollarSign, Trash2, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '../../utils/formatters';

interface Meta {
  id: string;
  valor_total: number;
  data_inicio: string;
  data_fim: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  criado_em: string;
}

interface GoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lojaId: string;
  userId: string;
}

export const GoalsModal: React.FC<GoalsModalProps> = ({ isOpen, onClose, lojaId, userId }) => {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [valorTotal, setValorTotal] = useState('');
  const [displayValor, setDisplayValor] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (isOpen) {
      carregarMetas();
    }
  }, [isOpen]);

  const carregarMetas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('metas')
        .select('*')
        .eq('loja_id', lojaId)
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro ao carregar metas:', error);
      } else {
        setMetas(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setDisplayValor(formatted);
    const numeric = parseCurrencyInput(formatted);
    setValorTotal(numeric.toString());
  };

  const criarMeta = async () => {
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
      } else {
        // Limpar formulário
        setValorTotal('');
        setDisplayValor('');
        setDataInicio('');
        setDataFim('');
        setShowForm(false);
        // Recarregar metas
        carregarMetas();
      }
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      alert('Erro ao criar meta. Tente novamente.');
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

  const formatarData = (dataISO: string) => {
    // Extrair ano, mês e dia diretamente da string sem conversão de timezone
    const dataParte = dataISO.includes('T') ? dataISO.split('T')[0] : dataISO.split(' ')[0];
    const [ano, mes, dia] = dataParte.split('-');

    const mesesCurtos = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const mesNome = mesesCurtos[parseInt(mes) - 1];

    return `${dia} de ${mesNome}. de ${ano}`;
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
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Metas da Equipe</h2>
              <p className="text-xs text-zinc-500">Gerencie as metas de vendas</p>
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
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Lista de Metas */}
              {metas.length > 0 && (
                <div className="space-y-3">
                  {metas.map((meta) => (
                    <div
                      key={meta.id}
                      className="glass-card rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign size={16} className="text-emerald-400" />
                            <span className="text-xl font-bold text-white">
                              {formatCurrency(meta.valor_total)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <Calendar size={12} />
                            <span>{formatarData(meta.data_inicio)} - {formatarData(meta.data_fim)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => excluirMeta(meta.id)}
                          className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${
                        meta.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {meta.status === 'ACTIVE' ? 'Ativa' : meta.status === 'COMPLETED' ? 'Concluída' : 'Cancelada'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulário de Nova Meta */}
              {showForm ? (
                <div className="glass-card rounded-2xl p-4 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Plus size={16} className="text-emerald-400" />
                    Nova Meta
                  </h3>

                  <div className="space-y-3">
                    {/* Valor Total */}
                    <div>
                      <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2 block">
                        Valor Total da Meta
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">R$</div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={displayValor}
                          onChange={handleValorChange}
                          placeholder="R$ 0,00"
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors text-sm font-mono"
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
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors text-sm"
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
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors text-sm"
                      />
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowForm(false)}
                      className="flex-1 py-3 rounded-xl border border-zinc-700 bg-zinc-800 text-white text-sm font-bold hover:bg-zinc-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={criarMeta}
                      disabled={salvando}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {salvando ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        'Criar Meta'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full py-4 rounded-2xl border-2 border-dashed border-zinc-700 hover:border-emerald-500/50 bg-zinc-900/50 hover:bg-emerald-500/5 text-zinc-500 hover:text-emerald-400 text-sm font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Criar Nova Meta
                </button>
              )}

              {metas.length === 0 && !showForm && (
                <div className="text-center py-12">
                  <Target size={48} className="mx-auto text-zinc-700 mb-3" />
                  <p className="text-zinc-500 text-sm">Nenhuma meta criada ainda</p>
                  <p className="text-zinc-600 text-xs mt-1">Clique no botão acima para criar</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
