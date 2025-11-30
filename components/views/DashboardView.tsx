import React, { useState, useEffect } from 'react';
import { ProgressBar } from '../ui/ProgressBar';
import { TrendingUp, DollarSign, Target, ArrowUpRight, PieChart as PieChartIcon, Loader2 } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Sector } from 'recharts';
import { buscarVendedores, calcularEstatisticasLoja } from '../../services/api';
import { Seller, StoreStats } from '../../types';

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

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

  return (
    <g style={{ outline: 'none' }}>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="outline-none transition-all duration-300 ease-out"
        style={{
          filter: `drop-shadow(0 0 12px ${fill}90)`,
          outline: 'none',
          cursor: 'pointer'
        }}
      />
    </g>
  );
};

interface DashboardViewProps {
  lojaId: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ lojaId }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [stats, setStats] = useState<StoreStats | null>(null);
  const [vendedores, setVendedores] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lojaId]);

  const carregarDados = async () => {
    setLoading(true);
    const [estatisticas, listaVendedores] = await Promise.all([
      calcularEstatisticasLoja(lojaId),
      buscarVendedores(lojaId)
    ]);
    setStats(estatisticas);
    setVendedores(listaVendedores);
    setLoading(false);
  };

  if (loading || !stats) {
    return (
      <div className="pb-28 space-y-4 animate-slide-up flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const percentage = (stats.totalSales / stats.monthlyTarget) * 100;

  const sellerData = vendedores.map(s => ({
    name: s.name.split(' ')[0],
    value: s.currentSales,
    full_name: s.name
  })).sort((a, b) => b.value - a.value);

  const activeItem = sellerData[activeIndex] || { name: '', value: 0, full_name: '' };
  const activePercentage = stats.totalSales > 0 ? (activeItem.value / stats.totalSales) : 0;

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

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
               {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(stats.totalSales)}
            </div>
            <div className="text-[10px] text-zinc-400">
              de <span className="text-zinc-300">{new Intl.NumberFormat('pt-BR', { notation: "compact", compactDisplay: "short", style: 'currency', currency: 'BRL' }).format(stats.monthlyTarget)}</span> meta
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-2xl font-light text-white">{percentage.toFixed(0)}<span className="text-sm text-emerald-400">%</span></span>
              <span className="text-[10px] text-emerald-400 font-medium">+15% vs mês anterior</span>
            </div>
            <ProgressBar
              current={stats.totalSales}
              total={stats.monthlyTarget}
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
               <div className="text-base font-bold text-white">{new Intl.NumberFormat('pt-BR', { notation: "compact", style: 'currency', currency: 'BRL' }).format(stats.totalSales)}</div>
               <div className="text-[9px] text-zinc-500 uppercase tracking-wider">Vendido</div>
            </div>
         </button>

         <button className="flex-1 min-w-[130px] h-20 rounded-2xl bg-zinc-900 border border-zinc-800 p-3 flex flex-col justify-between hover:border-zinc-700 transition-colors relative overflow-hidden group">
             <div className="absolute right-0 top-0 w-12 h-12 bg-purple-500/10 rounded-full blur-xl -mr-3 -mt-3 group-hover:bg-purple-500/20 transition-all"></div>
             <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
               <Target size={14} />
            </div>
            <div>
               <div className="text-base font-bold text-white">{new Intl.NumberFormat('pt-BR', { notation: "compact", style: 'currency', currency: 'BRL' }).format(Math.max(0, stats.monthlyTarget - stats.totalSales))}</div>
               <div className="text-[9px] text-zinc-500 uppercase tracking-wider">Falta Vender</div>
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
      {sellerData.length > 0 && (
        <div className="glass-card rounded-[1.5rem] p-5 relative overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
               <PieChartIcon size={14} className="text-zinc-400" />
               Share de Vendas
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
             {/* The Chart */}
             <div className="h-48 w-full sm:w-1/2 relative outline-none focus:outline-none">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape}
                        data={sellerData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        onMouseEnter={onPieEnter}
                        onClick={onPieEnter}
                        className="outline-none focus:outline-none cursor-pointer"
                     >
                        {sellerData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                            stroke="none"
                            className="outline-none focus:outline-none"
                          />
                        ))}
                     </Pie>
                  </PieChart>
               </ResponsiveContainer>

               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-300">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 font-medium">{activeItem.name}</span>
                  <span className="text-3xl font-black text-white leading-none tracking-tight">
                      {(activePercentage * 100).toFixed(0)}<span className="text-sm text-zinc-600 font-bold align-top ml-0.5">%</span>
                  </span>
                  <div className="mt-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm">
                     <span className="text-[10px] text-emerald-400 font-semibold tracking-wide">
                        {new Intl.NumberFormat('pt-BR', { notation: "compact", style: 'currency', currency: 'BRL' }).format(activeItem.value)}
                     </span>
                  </div>
               </div>
             </div>

             {/* Custom Legend */}
             <div className="w-full sm:w-1/2 grid grid-cols-2 gap-2 mt-2 sm:mt-0">
                {sellerData.map((entry, index) => (
                  <div
                     key={index}
                     className={`flex items-center gap-2 transition-all duration-300 cursor-pointer p-1.5 rounded-lg ${index === activeIndex ? 'bg-white/5 opacity-100 scale-105' : 'opacity-60 hover:opacity-100'}`}
                     onMouseEnter={() => setActiveIndex(index)}
                     onClick={() => setActiveIndex(index)}
                  >
                     <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                     <span className="text-[10px] text-zinc-300 font-medium truncate">{entry.full_name}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
