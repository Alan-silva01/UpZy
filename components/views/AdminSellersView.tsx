import React, { useState, useEffect } from 'react';
import { Seller } from '../../types';
import { Plus, Edit3, Save, Loader2 } from 'lucide-react';
import { ProgressBar } from '../ui/ProgressBar';
import { buscarVendedores, atualizarMetaVendedor, cadastrarVendedor } from '../../services/api';
import { AddSellerModal } from '../modals/AddSellerModal';

interface AdminSellersViewProps {
  lojaId: string;
}

export const AdminSellersView: React.FC<AdminSellersViewProps> = ({ lojaId }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localSellers, setLocalSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [editedTargets, setEditedTargets] = useState<Record<string, number>>({});
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    carregarVendedores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lojaId]);

  const carregarVendedores = async () => {
    setLoading(true);
    const vendedores = await buscarVendedores(lojaId);
    setLocalSellers(vendedores);
    setLoading(false);
  };

  const handleUpdateTarget = (id: string, newTarget: string) => {
    const valor = parseFloat(newTarget);
    setEditedTargets(prev => ({ ...prev, [id]: valor }));
    setLocalSellers(prev => prev.map(s => s.id === id ? { ...s, target: valor } : s));
  };

  const toggleEdit = async (id: string) => {
    if (editingId === id) {
      // Salvando
      const novaMeta = editedTargets[id];
      if (novaMeta !== undefined) {
        const sucesso = await atualizarMetaVendedor(id, novaMeta);
        if (sucesso) {
          await carregarVendedores();
        }
      }
      setEditingId(null);
    } else {
      setEditingId(id);
    }
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
      <div className="pt-32 pb-28 space-y-5 animate-slide-up flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-32 pb-28 space-y-5 animate-slide-up">
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
                  <button
                    onClick={() => toggleEdit(seller.id)}
                    className={`p-2 rounded-full transition-colors ${editingId === seller.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                  >
                    {editingId === seller.id ? <Save size={16} /> : <Edit3 size={16} />}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Meta Atual</span>
                    {editingId === seller.id ? (
                      <div className="flex items-center gap-1 border-b border-emerald-500 pb-0.5">
                        <span className="text-xs text-emerald-500">R$</span>
                        <input
                          type="number"
                          defaultValue={seller.target}
                          className="bg-transparent text-right text-sm font-bold text-white w-20 focus:outline-none"
                          onChange={(e) => handleUpdateTarget(seller.id, e.target.value)}
                        />
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(seller.target)}
                      </span>
                    )}
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

      <AddSellerModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onAdd={handleAdicionarVendedor}
      />
    </div>
  );
};