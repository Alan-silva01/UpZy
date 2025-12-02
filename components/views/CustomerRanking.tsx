import React from 'react';
import { CUSTOMERS } from '../../services/mockData';
import { Award, ChevronRight } from 'lucide-react';

export const CustomerRanking: React.FC = () => {
  const getTierColor = (tier: string) => {
    switch(tier) {
      case 'VIP': return 'from-purple-500 to-indigo-600 shadow-purple-500/20';
      case 'Gold': return 'from-amber-400 to-yellow-600 shadow-amber-500/20';
      case 'Silver': return 'from-zinc-400 to-zinc-500 shadow-zinc-500/20';
      default: return 'from-orange-700 to-orange-800 shadow-orange-900/20';
    }
  };

  return (
    <div className="pt-32 pb-28 space-y-4 animate-slide-up">
      <div className="px-1 pt-1">
         <span className="text-zinc-500 text-[10px] font-semibold tracking-widest uppercase mb-0.5">CRM</span>
         <h1 className="text-xl font-bold text-white tracking-tight">Top Clientes</h1>
      </div>

      <div className="grid gap-3 px-1">
        {CUSTOMERS.map((customer, idx) => (
          <div key={customer.id} className="group relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${getTierColor(customer.tier)} opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500 blur-lg`}></div>
            
            <div className="glass-card rounded-3xl p-3 flex items-center gap-3 relative z-10 hover:border-white/10 transition-all group-hover:-translate-y-0.5 duration-300">
              <div className="relative shrink-0">
                <div className={`absolute -inset-0.5 bg-gradient-to-br ${getTierColor(customer.tier)} rounded-full opacity-30`}></div>
                <img src={customer.avatar} alt={customer.name} className="w-12 h-12 rounded-full object-cover relative z-10 border border-zinc-900" />
                <div className="absolute -bottom-0.5 -right-0.5 z-20 bg-zinc-900 rounded-full p-0.5">
                   <div className="bg-zinc-800 text-[9px] w-5 h-5 flex items-center justify-center rounded-full text-white font-bold border border-zinc-700">
                     {idx + 1}
                   </div>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                 <div className="flex items-center gap-2 mb-0.5">
                   <h3 className="text-white font-semibold text-sm truncate">{customer.name}</h3>
                 </div>
                 <div className="flex items-center gap-2 mb-1">
                   <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r ${getTierColor(customer.tier)} text-white shadow-sm`}>
                     {customer.tier}
                   </span>
                   <span className="text-[10px] text-zinc-500">{customer.visits} visitas</span>
                 </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[10px] text-zinc-500 mb-0.5">Total Gasto</div>
                <div className="text-emerald-400 font-bold text-sm">
                  {new Intl.NumberFormat('pt-BR', { notation: "compact", style: 'currency', currency: 'BRL' }).format(customer.totalSpent)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};