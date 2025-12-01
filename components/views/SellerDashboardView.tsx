import React, { useState, useEffect } from 'react';
import { User, Seller } from '../../types';
import { ProgressBar } from '../ui/ProgressBar';
import { Target, TrendingUp, AlertCircle, LogOut, Loader2 } from 'lucide-react';
import { fazerLogout, buscarLojaIdUsuario } from '../../services/auth';
import { buscarVendedores } from '../../services/api';

interface SellerDashboardProps {
  user: User;
  onLogout?: () => void;
}

export const SellerDashboardView: React.FC<SellerDashboardProps> = ({ user, onLogout }) => {
  const [sellerProfile, setSellerProfile] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDadosVendedor();
  }, [user.sellerId]);

  const carregarDadosVendedor = async () => {
    setLoading(true);
    const lojaId = await buscarLojaIdUsuario(user.id);
    if (lojaId) {
      const vendedores = await buscarVendedores(lojaId);
      const vendedor = vendedores.find(v => v.id === user.sellerId);
      if (vendedor) {
        setSellerProfile(vendedor);
      } else {
        // Fallback se não encontrar
        setSellerProfile({
          id: user.sellerId || '0',
          name: user.name,
          currentSales: 0,
          target: 10000,
          avatar: user.avatar
        } as Seller);
      }
    }
    setLoading(false);
  };

  const percentage = sellerProfile ? (sellerProfile.currentSales / sellerProfile.target) * 100 : 0;

  const handleLogout = async () => {
    await fazerLogout();
    if (onLogout) {
      onLogout();
    }
  };

  if (loading || !sellerProfile) {
    return (
      <div className="pb-28 space-y-6 flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-28 space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex justify-between items-center px-1">
        <div>
          <span className="text-zinc-500 text-[10px] font-semibold tracking-widest uppercase mb-0.5">Bem-vindo</span>
          <h1 className="text-xl font-bold text-white tracking-tight">{user.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-zinc-400 hover:text-white"
            title="Sair"
          >
            <LogOut size={18} />
          </button>
          <img src={user.avatar} alt="Profile" className="w-10 h-10 rounded-full border-2 border-zinc-800" />
        </div>
      </div>

      {/* Main Goal Card */}
      <div className="relative w-full aspect-[4/5] sm:aspect-[16/10] rounded-[2.5rem] overflow-hidden shadow-2xl group">
         <div className="absolute inset-0 bg-zinc-900"></div>
         {/* Animated Background Gradients */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
         
         <div className="relative h-full p-6 flex flex-col justify-between z-10">
            <div className="flex justify-between items-start">
               <div className="bg-white/5 border border-white/5 rounded-full px-3 py-1 flex items-center gap-2 backdrop-blur-md">
                 <Target size={14} className="text-emerald-400" />
                 <span className="text-xs text-emerald-100 font-medium">Minha Meta</span>
               </div>
            </div>

            <div className="text-center py-4">
              <div className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2">Vendido este mês</div>
              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 tracking-tighter">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(sellerProfile.currentSales)}
              </div>
              <div className="text-xs text-zinc-500 mt-2">
                 Faltam <span className="text-white font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(sellerProfile.target - sellerProfile.currentSales)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end text-xs font-bold px-1">
                 <span className="text-emerald-400">{percentage.toFixed(0)}%</span>
                 <span className="text-zinc-600">{new Intl.NumberFormat('pt-BR', { notation: "compact", style: 'currency', currency: 'BRL' }).format(sellerProfile.target)}</span>
              </div>
              <ProgressBar 
                current={sellerProfile.currentSales} 
                total={sellerProfile.target} 
                heightClass="h-3"
                colorClass={percentage >= 100 ? "bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500" : "bg-gradient-to-r from-emerald-500 to-emerald-300"}
              />
              
              {percentage >= 100 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-3 mt-2">
                   <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                   <p className="text-[10px] text-amber-200/80 leading-relaxed">
                     Parabéns! Você bateu sua meta. Tudo que vender agora conta para o bônus extra.
                   </p>
                </div>
              )}
            </div>
         </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
         <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2">
               <TrendingUp size={16} />
            </div>
            <div className="text-2xl font-bold text-white">12</div>
            <div className="text-[10px] text-zinc-500 uppercase">Vendas Realizadas</div>
         </div>
         <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4">
             <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
               <Target size={16} />
            </div>
            <div className="text-2xl font-bold text-white">R$ 3.2k</div>
            <div className="text-[10px] text-zinc-500 uppercase">Ticket Médio</div>
         </div>
      </div>
    </div>
  );
};