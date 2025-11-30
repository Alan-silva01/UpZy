import React, { useState } from 'react';
import { SELLERS } from '../../services/mockData';
import { Seller } from '../../types';
import { Plus, Edit3, Save } from 'lucide-react';
import { ProgressBar } from '../ui/ProgressBar';

export const AdminSellersView: React.FC = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localSellers, setLocalSellers] = useState<Seller[]>(SELLERS);

  const handleUpdateTarget = (id: string, newTarget: string) => {
    setLocalSellers(prev => prev.map(s => s.id === id ? { ...s, target: parseFloat(newTarget) } : s));
  };

  const toggleEdit = (id: string) => {
    setEditingId(editingId === id ? null : id);
  };

  return (
    <div className="pb-28 space-y-5 animate-slide-up">
      <div className="px-1 pt-1 flex justify-between items-end">
         <div>
           <span className="text-zinc-500 text-[10px] font-semibold tracking-widest uppercase mb-0.5">Admin</span>
           <h1 className="text-xl font-bold text-white tracking-tight">Gerenciar Vendedores</h1>
         </div>
         <button className="bg-white text-black p-2 rounded-full hover:bg-zinc-200 transition-colors">
            <Plus size={20} />
         </button>
      </div>

      <div className="space-y-3 px-1">
        {localSellers.map((seller) => (
          <div key={seller.id} className="glass-card rounded-[1.5rem] p-4 border border-zinc-800 relative group">
             <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                   <img src={seller.avatar} alt="" className="w-10 h-10 rounded-full border border-zinc-700" />
                   <div>
                      <h3 className="font-bold text-white text-sm">{seller.name}</h3>
                      <p className="text-[10px] text-zinc-500">ID: #{seller.id}</p>
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
                  <span>Vendido: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(seller.currentSales)}</span>
                  <span>{Math.round((seller.currentSales / seller.target) * 100)}%</span>
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};