import React, { useState, useEffect } from 'react';
import { User, Sale } from '../../types';
import { ArrowLeft, Search, Edit3, Trash2, Save, X, Loader2, Filter } from 'lucide-react';
import { buscarLojaIdUsuario } from '../../services/auth';
import { supabase } from '../../lib/supabase';
import { ConfirmModal } from '../modals/ConfirmModal';
import { Header } from '../Header';

interface SellerSalesHistoryViewProps {
  user: User;
  onBack: () => void;
}

export const SellerSalesHistoryView: React.FC<SellerSalesHistoryViewProps> = ({ user, onBack }) => {
  const [vendas, setVendas] = useState<Sale[]>([]);
  const [vendasFiltradas, setVendasFiltradas] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Sale>>({});

  // Modais de confirmação
  const [modalDelete, setModalDelete] = useState<{ isOpen: boolean; vendaId: string | null }>({ isOpen: false, vendaId: null });
  const [modalSave, setModalSave] = useState<{ isOpen: boolean; vendaId: string | null }>({ isOpen: false, vendaId: null });

  // Filtros
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroPedido, setFiltroPedido] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [filtroValorMin, setFiltroValorMin] = useState('');
  const [filtroValorMax, setFiltroValorMax] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  useEffect(() => {
    carregarVendas();
  }, [user.sellerId]);

  useEffect(() => {
    aplicarFiltros();
  }, [vendas, filtroNome, filtroPedido, filtroDataInicio, filtroDataFim, filtroValorMin, filtroValorMax]);

  const carregarVendas = async () => {
    if (!user.sellerId) return;

    setLoading(true);
    try {
      const lojaId = await buscarLojaIdUsuario(user.id);
      if (!lojaId) return;

      const { data, error } = await supabase
        .from('vendas')
        .select('*')
        .eq('vendedor_id', user.sellerId)
        .eq('loja_id', lojaId)
        .order('data_venda', { ascending: false });

      if (error) throw error;

      setVendas(data as Sale[]);
      setVendasFiltradas(data as Sale[]);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      alert('Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...vendas];

    // Filtro por nome do cliente
    if (filtroNome) {
      resultado = resultado.filter(v =>
        v.nome_cliente?.toLowerCase().includes(filtroNome.toLowerCase())
      );
    }

    // Filtro por número do pedido
    if (filtroPedido) {
      resultado = resultado.filter(v =>
        v.numero_pedido?.toLowerCase().includes(filtroPedido.toLowerCase())
      );
    }

    // Filtro por data início
    if (filtroDataInicio) {
      resultado = resultado.filter(v =>
        new Date(v.data_venda) >= new Date(filtroDataInicio)
      );
    }

    // Filtro por data fim
    if (filtroDataFim) {
      resultado = resultado.filter(v =>
        new Date(v.data_venda) <= new Date(filtroDataFim)
      );
    }

    // Filtro por valor mínimo
    if (filtroValorMin) {
      resultado = resultado.filter(v =>
        v.valor >= parseFloat(filtroValorMin)
      );
    }

    // Filtro por valor máximo
    if (filtroValorMax) {
      resultado = resultado.filter(v =>
        v.valor <= parseFloat(filtroValorMax)
      );
    }

    setVendasFiltradas(resultado);
  };

  const limparFiltros = () => {
    setFiltroNome('');
    setFiltroPedido('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setFiltroValorMin('');
    setFiltroValorMax('');
  };

  const handleEdit = (venda: Sale) => {
    setEditingId(venda.id);
    setEditData({
      nome_cliente: venda.nome_cliente,
      numero_pedido: venda.numero_pedido,
      valor: venda.valor,
      quantidade_itens: venda.quantidade_itens,
      metodo_pagamento: venda.metodo_pagamento,
      tipo_pagamento: venda.tipo_pagamento || 'avista',
      parcelas: venda.parcelas || 1
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSaveEdit = async (vendaId: string) => {
    try {
      const { error } = await supabase
        .from('vendas')
        .update(editData)
        .eq('id', vendaId);

      if (error) throw error;

      setEditingId(null);
      setEditData({});
      await carregarVendas();
    } catch (error) {
      console.error('Erro ao atualizar venda:', error);
      alert('Erro ao atualizar venda');
    }
  };

  const confirmSave = (vendaId: string) => {
    setModalSave({ isOpen: true, vendaId });
  };

  const confirmDelete = (vendaId: string) => {
    setModalDelete({ isOpen: true, vendaId });
  };

  const handleDelete = async () => {
    if (!modalDelete.vendaId) return;

    try {
      const { error } = await supabase
        .from('vendas')
        .delete()
        .eq('id', modalDelete.vendaId);

      if (error) throw error;

      await carregarVendas();
    } catch (error) {
      console.error('Erro ao excluir venda:', error);
      alert('Erro ao excluir venda');
    }
  };

  const formatarMetodoPagamento = (metodo: string) => {
    const map: Record<string, string> = {
      'pix': 'PIX',
      'dinheiro': 'Dinheiro',
      'cartao': 'Cartão',
      'boleto': 'Boleto',
      'promissoria': 'Promissória'
    };
    return map[metodo] || metodo;
  };

  if (loading) {
    return (
      <>
        <Header user={user} title="Minhas Vendas" subtitle="Histórico" />
        <div className="pt-32 pb-28 space-y-6 flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header Fixo com botão de voltar customizado */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-zinc-950 border-b border-zinc-800/50 z-50 shadow-lg" style={{ paddingTop: 'env(safe-area-inset-top)' }}>

        {/* Conteúdo do header */}
        <div className="px-4 py-4 flex items-center gap-3 bg-zinc-950/95 backdrop-blur-xl">
          <button
            onClick={onBack}
            className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <img src="/favicon_pwa.png" alt="UpZy Logo" className="w-10 h-10 object-contain" />
          <div className="flex-1">
            <span className="text-zinc-500 text-[10px] font-semibold tracking-widest uppercase">Histórico</span>
            <h1 className="text-lg font-bold text-white tracking-tight">Minhas Vendas</h1>
          </div>
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={`p-2 rounded-full border transition-all ${
              mostrarFiltros
                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400'
                : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
            }`}
          >
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="pt-32 pb-28 space-y-6 animate-slide-up">

      {/* Filtros */}
      {mostrarFiltros && (
        <div className="glass-card rounded-[2rem] p-5 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-bold text-sm">Filtros</h3>
            <button
              onClick={limparFiltros}
              className="text-xs text-zinc-500 hover:text-white transition-colors"
            >
              Limpar tudo
            </button>
          </div>

          {/* Nome do Cliente */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-1">
              Nome do Cliente
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
                placeholder="Buscar por nome..."
                className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Número do Pedido */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-1">
              Número do Pedido
            </label>
            <input
              type="text"
              value={filtroPedido}
              onChange={(e) => setFiltroPedido(e.target.value)}
              placeholder="Ex: #12345"
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          {/* Data Início e Fim */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-1">
                Data Início
              </label>
              <input
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-1">
                Data Fim
              </label>
              <input
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Valor Mínimo e Máximo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-1">
                Valor Mínimo
              </label>
              <input
                type="number"
                value={filtroValorMin}
                onChange={(e) => setFiltroValorMin(e.target.value)}
                placeholder="R$ 0,00"
                className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-1">
                Valor Máximo
              </label>
              <input
                type="number"
                value={filtroValorMax}
                onChange={(e) => setFiltroValorMax(e.target.value)}
                placeholder="R$ 9999,99"
                className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* Contador de Resultados */}
      <div className="px-1 flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          {vendasFiltradas.length} {vendasFiltradas.length === 1 ? 'venda encontrada' : 'vendas encontradas'}
        </p>
        <p className="text-xs font-bold text-emerald-400">
          Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
            vendasFiltradas.reduce((acc, v) => acc + v.valor, 0)
          )}
        </p>
      </div>

      {/* Lista de Vendas */}
      <div className="space-y-3">
        {vendasFiltradas.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <p className="text-sm">Nenhuma venda encontrada</p>
            {(filtroNome || filtroPedido || filtroDataInicio || filtroDataFim || filtroValorMin || filtroValorMax) && (
              <button
                onClick={limparFiltros}
                className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          vendasFiltradas.map((venda) => (
            <div
              key={venda.id}
              className="glass-card rounded-[1.5rem] p-4 border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              {editingId === venda.id ? (
                // Modo de Edição
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-bold text-sm">Editando Venda</h3>
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
                        >
                          <X size={16} />
                        </button>
                        <span className="text-[9px] text-zinc-500 font-medium">Cancelar</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => confirmSave(venda.id)}
                          className="p-2 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                        >
                          <Save size={16} />
                        </button>
                        <span className="text-[9px] text-emerald-400 font-medium">Salvar</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold ml-1">
                        Nome do Cliente
                      </label>
                      <input
                        type="text"
                        value={editData.nome_cliente || ''}
                        onChange={(e) => setEditData({ ...editData, nome_cliente: e.target.value })}
                        className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold ml-1">
                        Nº Pedido
                      </label>
                      <input
                        type="text"
                        value={editData.numero_pedido || ''}
                        onChange={(e) => setEditData({ ...editData, numero_pedido: e.target.value })}
                        className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold ml-1">
                        Valor (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editData.valor || ''}
                        onChange={(e) => setEditData({ ...editData, valor: parseFloat(e.target.value) })}
                        className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold ml-1">
                        Qtd. Itens
                      </label>
                      <input
                        type="number"
                        value={editData.quantidade_itens || ''}
                        onChange={(e) => setEditData({ ...editData, quantidade_itens: parseInt(e.target.value) })}
                        className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold ml-1">
                        Método
                      </label>
                      <select
                        value={editData.metodo_pagamento || ''}
                        onChange={(e) => setEditData({ ...editData, metodo_pagamento: e.target.value })}
                        className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50"
                      >
                        <option value="pix">PIX</option>
                        <option value="dinheiro">Dinheiro</option>
                        <option value="cartao">Cartão</option>
                        <option value="boleto">Boleto</option>
                        <option value="promissoria">Promissória</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold ml-1">
                        Tipo
                      </label>
                      <select
                        value={editData.tipo_pagamento || 'avista'}
                        onChange={(e) => setEditData({ ...editData, tipo_pagamento: e.target.value, parcelas: e.target.value === 'avista' ? 1 : editData.parcelas })}
                        className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50"
                      >
                        <option value="avista">À Vista</option>
                        <option value="parcelado">Parcelado</option>
                      </select>
                    </div>

                    {editData.tipo_pagamento === 'parcelado' && (
                      <div className="col-span-2 space-y-1">
                        <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold ml-1">
                          Nº de Parcelas
                        </label>
                        <select
                          value={editData.parcelas || 2}
                          onChange={(e) => setEditData({ ...editData, parcelas: parseInt(e.target.value) })}
                          className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50"
                        >
                          {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                            <option key={num} value={num}>{num}x</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Modo de Visualização
                <>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold text-sm">{venda.nome_cliente || 'Cliente'}</p>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                          {venda.numero_pedido || 'S/N'}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500">
                        {new Date(venda.data_venda).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(venda)}
                        className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:bg-indigo-500/20 hover:text-indigo-400 transition-all"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => confirmDelete(venda.id)}
                        className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <p className="text-[9px] text-zinc-500 uppercase mb-1">Valor</p>
                      <p className="text-white font-bold text-lg">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(venda.valor)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-zinc-500 uppercase mb-1">Itens</p>
                      <p className="text-white font-bold text-sm">{venda.quantidade_itens}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-medium">
                      {formatarMetodoPagamento(venda.metodo_pagamento)}
                    </span>
                    {venda.tipo_pagamento === 'parcelado' && venda.parcelas && (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                        {venda.parcelas}x
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modais de Confirmação */}
      <ConfirmModal
        isOpen={modalDelete.isOpen}
        onClose={() => setModalDelete({ isOpen: false, vendaId: null })}
        onConfirm={handleDelete}
        title="Excluir Venda"
        message="Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita."
        type="danger"
        confirmText="Sim, excluir"
        cancelText="Cancelar"
      />

      <ConfirmModal
        isOpen={modalSave.isOpen}
        onClose={() => setModalSave({ isOpen: false, vendaId: null })}
        onConfirm={() => modalSave.vendaId && handleSaveEdit(modalSave.vendaId)}
        title="Salvar Alterações"
        message="Deseja salvar as alterações feitas nesta venda?"
        type="success"
        confirmText="Sim, salvar"
        cancelText="Cancelar"
      />
    </div>
    </>
  );
};
