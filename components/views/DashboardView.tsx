import React from 'react';
import { STORE_STATS, SELLERS } from '../../services/mockData';
import { ProgressBar } from '../ui/ProgressBar';
import { TrendingUp, DollarSign, Target, ArrowUpRight, PieChart as PieChartIcon } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';

const chartData = [
  { name: 'Seg', sales: 4000 },
  { name: 'Ter', sales: 3000 },
  { name: 'Qua', sales: 5000 },
  { name: 'Qui', sales: 2780 },
  { name: 'Sex', sales: 1890 },
  { name: 'Sab', sales: 9240 },
  { name: 'Dom', sales: 3490 },
];

const PIE_COLORS = ['#10b981', '#8b5cf6', '#f59e0b', '#3b82f6', '#ec4899'];

export const DashboardView: React.FC = () => {
  const percentage = (STORE_STATS.totalSales / STORE_STATS.monthlyTarget) * 100;
  
  // Prepare data for Pie Chart
  const sellerData = SELLERS.map(s => ({
    name: s.name.split(' ')[0], // First name only for cleaner chart
    value: s.currentSales,
    full_name: s.name
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="pb-28 space-y-4 animate-slide-up">
      {/* Top Header */}
      <div className="flex justify-between items-center px-1">
        <div className="flex flex-col">
          <span className="text-zinc-500 text-[10px] font-semibold tracking-widest uppercase mb-0.5">UpZy Store</span>
          <h1 className="text-xl font-bold text-white tracking-tight">Visão Geral</h1>
        </div>
        <div className="relative group cursor-pointer">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-300"></div>
          <img 
            src="https://picsum.photos/100/100?random=99" 
            alt="Profile" 
            className="relative w-9 h-9 rounded-full border-2 border-zinc-900 object-cover"
          />
        </div>
      </div>

      {/* Main Hero Card - Capsule Style */}
      <div className="relative w-full aspect-[16/10] rounded-[2rem] overflow-hidden shadow-2xl group transition-transform duration-500 hover:scale-[1.02]">
        {/* Background Image/Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3"></div>

        {/* Content */}
        <div className="relative h-full p-6 flex flex-col justify-between z-10">
          <div className="flex justify-between items-start">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
              <Target size={12} className="text-emerald-400" />
              <span className="text-[10px] text-emerald-100 font-medium">Meta Mensal</span>
            </div>
            <button className="w-7 h-7 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors">
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="space-y-0.5">
            <div className="text-zinc-400 text-xs font-medium">Faturamento Total</div>
            <div className="text-3xl font-bold text-white tracking-tight">
               {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(STORE_STATS.totalSales)}
            </div>
            <div className="text-[10px] text-zinc-400">
              de <span className="text-zinc-300">{new Intl.NumberFormat('pt-BR', { notation: "compact", compactDisplay: "short", style: 'currency', currency: 'BRL' }).format(STORE_STATS.monthlyTarget)}</span> meta
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-2xl font-light text-white">{percentage.toFixed(0)}<span className="text-sm text-emerald-400">%</span></span>
              <span className="text-[10px] text-emerald-400 font-medium">+15% vs mês anterior</span>
            </div>
            <ProgressBar 
              current={STORE_STATS.totalSales} 
              total={STORE_STATS.monthlyTarget} 
              heightClass="h-1" 
              colorClass="bg-gradient-to-r from-emerald-400 to-emerald-300" 
            />
          </div>
        </div>
      </div>

      {/* Action Strip */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
         <button className="flex-1 min-w-[130px] h-20 rounded-2xl bg-zinc-900 border border-zinc-800 p-3 flex flex-col justify-between hover:border-zinc-700 transition-colors relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-12 h-12 bg-emerald-500/10 rounded-full blur-xl -mr-3 -mt-3 group-hover:bg-emerald-500/20 transition-all"></div>
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
               <DollarSign size={14} />
            </div>
            <div>
               <div className="text-base font-bold text-white">{new Intl.NumberFormat('pt-BR', { notation: "compact", style: 'currency', currency: 'BRL' }).format(STORE_STATS.salesToday)}</div>
               <div className="text-[9px] text-zinc-500 uppercase tracking-wider">Vendas Hoje</div>
            </div>
         </button>

         <button className="flex-1 min-w-[130px] h-20 rounded-2xl bg-zinc-900 border border-zinc-800 p-3 flex flex-col justify-between hover:border-zinc-700 transition-colors relative overflow-hidden group">
             <div className="absolute right-0 top-0 w-12 h-12 bg-purple-500/10 rounded-full blur-xl -mr-3 -mt-3 group-hover:bg-purple-500/20 transition-all"></div>
             <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
               <TrendingUp size={14} />
            </div>
            <div>
               <div className="text-base font-bold text-white">{new Intl.NumberFormat('pt-BR', { notation: "compact", style: 'currency', currency: 'BRL' }).format(STORE_STATS.dailyTarget)}</div>
               <div className="text-[9px] text-zinc-500 uppercase tracking-wider">Meta Diária</div>
            </div>
         </button>
      </div>

      {/* Area Chart Section */}
      <div className="glass-card rounded-[1.5rem] p-5 relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-white">Performance</h3>
          <select className="bg-zinc-800 text-[10px] text-zinc-400 border border-zinc-700 rounded-full px-2 py-0.5 outline-none">
            <option>Esta Semana</option>
            <option>Mês Passado</option>
          </select>
        </div>
        
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '6px 10px' }}
                itemStyle={{ color: '#e4e4e7', fontSize: '11px', fontWeight: 600 }}
                labelStyle={{ display: 'none' }}
                formatter={(value: number) => [`R$ ${value}`, '']}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorSales)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sales Distribution Pie Chart */}
      <div className="glass-card rounded-[1.5rem] p-5 relative overflow-hidden">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
             <PieChartIcon size={14} className="text-zinc-400" />
             Share de Vendas
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
           {/* The Chart */}
           <div className="h-48 w-full sm:w-1/2 relative">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                   <Pie
                      data={sellerData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                   >
                      {sellerData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                   </Pie>
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '6px 10px' }}
                     itemStyle={{ color: '#e4e4e7', fontSize: '11px', fontWeight: 600 }}
                     formatter={(value: number) => [`${new Intl.NumberFormat('pt-BR', { notation: "compact", style: 'currency', currency: 'BRL' }).format(value)}`, '']}
                   />
                </PieChart>
             </ResponsiveContainer>
             {/* Center Text */}
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Total</span>
                <span className="text-lg font-bold text-white">100%</span>
             </div>
           </div>

           {/* Custom Legend */}
           <div className="w-full sm:w-1/2 grid grid-cols-2 gap-2 mt-2 sm:mt-0">
              {sellerData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                   <div 
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.5)]" 
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                   ></div>
                   <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-zinc-300 font-medium truncate leading-none mb-0.5">{entry.name}</span>
                      <span className="text-[9px] text-zinc-500 leading-none">
                         {new Intl.NumberFormat('pt-BR', { style: 'percent' }).format(entry.value / STORE_STATS.totalSales)}
                      </span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
