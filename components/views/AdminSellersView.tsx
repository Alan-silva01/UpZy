import React, { useState, useEffect } from 'react';
import { Seller } from '../../types';
import { Plus, Edit3, Trash2, Loader2 } from 'lucide-react';
import { ProgressBar } from '../ui/ProgressBar';
import { buscarVendedores, cadastrarVendedor, atualizarVendedor, deletarVendedor } from '../../services/api';
import { AddSellerModal } from '../modals/AddSellerModal';
import { EditSellerModal } from '../modals/EditSellerModal';
import { ConfirmModal } from '../modals/ConfirmModal';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';

interface AdminSellersViewProps {
  lojaId: string;
}

export const AdminSellersView: React.FC<AdminSellersViewProps> = ({ lojaId }) => {
  const [localSellers, setLocalSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [vendedorSelecionado, setVendedorSelecionado] = useState<Seller | null>(null);
  const [modalConfirmarAberto, setModalConfirmarAberto] = useState(false);
  const [vendedorParaDeletar, setVendedorParaDeletar] = useState<Seller | null>(null);

  useEffect(() => {
    carregarVendedores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lojaId]);

  // Real-time subscriptions
  useRealtimeSubscription({
    table: 'vendedores',
    lojaId,
    onInsert: () => {
      console.log('🔴 Novo vendedor detectado! Recarregando lista...');
      carregarVendedores();
    },
    onUpdate: () => {
      console.log('🔴 Vendedor atualizado! Recarregando lista...');
      carregarVendedores();
    },
    onDelete: () => {
      console.log('🔴 Vendedor deletado! Recarregando lista...');
      carregarVendedores();
    }
  });

  useRealtimeSubscription({
    table: 'vendas',
    lojaId,
    onInsert: () => {
      console.log('🔴 Nova venda detectada! Atualizando vendedores...');
      carregarVendedores();
    },
    onUpdate: () => {
      console.log('🔴 Venda atualizada! Atualizando vendedores...');
      carregarVendedores();
    },
    onDelete: () => {
      console.log('🔴 Venda deletada! Atualizando vendedores...');
      carregarVendedores();
    }
  });

  const carregarVendedores = async () => {
    setLoading(true);
    const vendedores = await buscarVendedores(lojaId);
    setLocalSellers(vendedores);
    setLoading(false);
  };

  const handleAdicionarVendedor = async (dados: { nome: string; email: string; senha: string; meta: number }) => {
    const resultado = await cadastrarVendedor({
      lojaId,
      ...dados
    });

    if (resultado.sucesso) {
      await carregarVendedores();
    } else {
      throw new Error(resultado.mensagem);
    }
  };

  const handleAtualizarVendedor = async (dados: { id: string; nome: string; meta: number }) => {
    const resultado = await atualizarVendedor({
      vendedorId: dados.id,
      nome: dados.nome,
      meta: dados.meta
    });

    if (resultado.sucesso) {
      await carregarVendedores();
    } else {
      throw new Error(resultado.mensagem);
    }
  };

  const handleDeletarVendedor = async () => {
    if (!vendedorParaDeletar) return;

    const resultado = await deletarVendedor(vendedorParaDeletar.id);

    if (resultado.sucesso) {
      await carregarVendedores();
    } else {
      alert(resultado.mensagem);
    }
  };

  const abrirModalEditar = (seller: Seller) => {
    setVendedorSelecionado(seller);
    setModalEditarAberto(true);
  };

  const abrirModalDeletar = (seller: Seller) => {
    setVendedorParaDeletar(seller);
    setModalConfirmarAberto(true);
  };

  // Detectar gênero pelo nome
  const detectarGenero = (nome: string): 'feminino' | 'masculino' => {
    const nomeMinusculo = nome.toLowerCase().trim();
    const terminacoesFemininas = ['a', 'ana', 'ane', 'ina', 'ice', 'ete', 'ela', 'isa', 'lia'];

    // Verifica terminações comuns femininas
    for (const terminacao of terminacoesFemininas) {
      if (nomeMinusculo.endsWith(terminacao)) {
        return 'feminino';
      }
    }

    // Nomes femininos comuns que não terminam em 'a'
    const nomesFemininos = ['isabel', 'mairim', 'beatriz', 'raquel', 'ruth', 'edith', 'judith'];
    if (nomesFemininos.some(nf => nomeMinusculo.includes(nf))) {
      return 'feminino';
    }

    return 'masculino';
  };

  if (loading) {
    return (
      <div className="pt-24 pb-28 space-y-5 animate-slide-up flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-24 pb-28 space-y-5 animate-slide-up">
      <div className="px-1 flex justify-between items-end">
         <div>
           <span className="text-zinc-500 text-[10px] font-semibold tracking-widest uppercase mb-0.5">Admin</span>
           <h1 className="text-xl font-bold text-white tracking-tight">Gerenciar Vendedores</h1>
         </div>
         <button
           onClick={() => setModalAberto(true)}
           className="bg-white text-black p-2 rounded-full hover:bg-zinc-200 transition-colors"
         >
            <Plus size={20} />
         </button>
      </div>

      <div className="space-y-3 px-1">
        {localSellers.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <p>Nenhum vendedor cadastrado ainda.</p>
          </div>
        ) : (
          localSellers.map((seller) => {
            const genero = detectarGenero(seller.name);
            const tipoLabel = genero === 'feminino' ? 'Vendedora' : 'Vendedor';

            return (
              <div key={seller.id} className="glass-card rounded-[1.5rem] p-4 border border-zinc-800 relative group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <img src={seller.avatar} alt="" className="w-10 h-10 rounded-full border border-zinc-700" />
                    <div>
                      <h3 className="font-bold text-white text-sm">{seller.name}</h3>
                      <p className="text-[10px] text-zinc-500">{tipoLabel}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => abrirModalEditar(seller)}
                      className="p-2 rounded-full bg-zinc-800 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50 border border-transparent transition-colors"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => abrirModalDeletar(seller)}
                      className="p-2 rounded-full bg-zinc-800 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 border border-transparent transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Meta Atual</span>
                    <span className="text-sm font-bold text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(seller.target)}
                    </span>
                  </div>

                  <ProgressBar
                    current={seller.currentSales}
                    total={seller.target}
                    colorClass="bg-zinc-500" // Neutral color for admin view
                    heightClass="h-1.5"
                  />

                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Vendido: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(seller.currentSales)}</span>
                    <span>{Math.round((seller.currentSales / seller.target) * 100)}%</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Adicionar Vendedor */}
      <AddSellerModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onAdd={handleAdicionarVendedor}
      />

      {/* Modal Editar Vendedor */}
      <EditSellerModal
        isOpen={modalEditarAberto}
        onClose={() => {
          setModalEditarAberto(false);
          setVendedorSelecionado(null);
        }}
        onUpdate={handleAtualizarVendedor}
        seller={vendedorSelecionado}
      />

      {/* Modal Confirmar Deletar */}
      <ConfirmModal
        isOpen={modalConfirmarAberto}
        onClose={() => {
          setModalConfirmarAberto(false);
          setVendedorParaDeletar(null);
        }}
        onConfirm={handleDeletarVendedor}
        type="danger"
        title="Deletar Vendedor"
        message={`Tem certeza que deseja deletar ${vendedorParaDeletar?.name}? Esta ação não pode ser desfeita e todas as vendas deste vendedor serão perdidas.`}
        confirmText="Deletar"
        cancelText="Cancelar"
      />
    </div>
  );
};
