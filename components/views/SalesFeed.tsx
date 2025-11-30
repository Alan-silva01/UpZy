import React from 'react';
import { RECENT_SALES, SELLERS } from '../../services/mockData';
import { Clock } from 'lucide-react';

export const SalesFeed: React.FC = () => {
  const getSellerAvatar = (id: string) => {
    return SELLERS.find(s => s.id === id)?.avatar || '';
  };

  return (
    <div className="pb-28 space-y-4 animate-slide-up">
      <div className="flex justify-between items-end px-1 pt-1">
         <div>
           <span className="text-zinc-500 text-[10px] font-semibold tracking-widest uppercase mb-0.5">Timeline</span>
           <h1 className="text-xl font-bold text-white tracking-tight">Vendas Recentes</h1>
         </div>
      </div>

      <div className="relative px-1">
        {/* Continuous Line */}
        <div className="absolute left-4 top-4 bottom-0 w-px bg-gradient-to-b from-emerald-500/50 via-zinc-800 to-transparent"></div>
        
        <div className="space-y-3">
          {RECENT_SALES.map((sale) => (
            <div key={sale.id} className="relative pl-8 group">
              {/* Timeline Dot */}
              <div className="absolute left-[12px] top-5 w-2 h-2 rounded-full bg-zinc-950 border border-emerald-500 z-10 group-hover:scale-125 transition-transform duration-300 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
              
              <div className="glass-card rounded-2xl p-4 hover:bg-white/5 transition-all duration-300 border-zinc-800/50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                     <h3 className="font-bold text-white text-sm">{sale.customerName}</h3>
                     <span className="text-zinc-500 text-[10px] flex items-center gap-1 mt-0.5">
                       <Clock size={10} /> {sale.timestamp}
                     </span>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 font-bold text-sm leading-tight">
                       + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.amount)}
                    </div>
                    <span className="text-[9px] text-zinc-500 bg-zinc-900/50 px-1.5 py-0.5 rounded-full inline-block mt-1 border border-zinc-800">
                      {sale.itemsCount} itens
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 pt-2 border-t border-dashed border-zinc-800/60">
                  <div className="relative">
                    <img src={getSellerAvatar(sale.sellerId)} alt="" className="w-5 h-5 rounded-full border border-zinc-700" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-zinc-900"></div>
                  </div>
                  <span className="text-[10px] text-zinc-400">
                     Vendido por <span className="text-zinc-200 font-medium">{SELLERS.find(s => s.id === sale.sellerId)?.name.split(' ')[0]}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};