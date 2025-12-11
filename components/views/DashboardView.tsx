import React, { useState, useEffect } from 'react';
import { ProgressBar } from '../ui/ProgressBar';
import { TrendingUp, DollarSign, Target, ArrowUpRight, PieChart as PieChartIcon, Loader2 } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Sector } from 'recharts';
import { buscarDadosPerformance } from '../../services/api';
import { Seller, StoreStats } from '../../types';
import { supabase } from '../../lib/supabase';
import { useDataCache } from '../../contexts/DataCacheContext';
import { formatCurrency } from '../../utils/formatters';

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
  userId?: string;
  onNavigateToGoals?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ lojaId, userId, onNavigateToGoals }) => {
  // Usar cache global
  const { cache, loading: cacheLoading, getVendedores, getStats } = useDataCache();

  const [activeIndex, setActiveIndex] = useState(0);
  const [chartData, setChartData] = useState<{ name: string; sales: number }[]>([]);
  const [periodoGrafico, setPeriodoGrafico] = useState<'meta' | 'semana' | 'mes'>('meta');
  const [nomeLoja, setNomeLoja] = useState<string>('');
  const [variacaoMesAnterior, setVariacaoMesAnterior] = useState<number>(0);
  const [metaAtiva, setMetaAtiva] = useState<{ id: string; valor: number; dataInicio: string; dataFim: string } | null>(null);
  const [avatarLoja, setAvatarLoja] = useState<string>('');

  // Dados vêm do cache agora
  const stats = getStats();
  const vendedores = getVendedores() || [];

  useEffect(() => {
    if (lojaId && stats) {
      carregarDadosLoja();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lojaId, stats]);

  useEffect(() => {
    if (lojaId) {
      carregarDadosGrafico();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lojaId, periodoGrafico]);

  const carregarDadosLoja = async () => {
    try {
      // Buscar meta ativa
      const { data: metaAtivaData } = await supabase
        .from('metas')
        .select('*')
        .eq('loja_id', lojaId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (metaAtivaData) {
        setMetaAtiva({
          id: metaAtivaData.id,
          valor: metaAtivaData.valor_total,
          dataInicio: metaAtivaData.data_inicio,
          dataFim: metaAtivaData.data_fim
        });
      } else {
        setMetaAtiva(null);
      }

      // Buscar nome e avatar da loja
      const { data: loja, error: lojaError } = await supabase
        .from('lojas')
        .select('nome, avatar_url')
        .eq('id', lojaId)
        .single();

      if (lojaError) {
        console.error('Erro ao buscar nome da loja:', lojaError);
      } else if (loja) {
        setNomeLoja(loja.nome);
        setAvatarLoja(loja.avatar_url || '');
      }

      // Calcular variação vs mês anterior
      if (stats) {
        try {
          const now = new Date();
          const mesAnteriorInicio = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const mesAnteriorFim = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

          const { data: vendasMesAnterior } = await supabase
            .from('vendas')
            .select('valor')
            .eq('loja_id', lojaId)
            .gte('data_venda', mesAnteriorInicio.toISOString())
            .lte('data_venda', mesAnteriorFim.toISOString());

          const totalMesAnterior = vendasMesAnterior?.reduce((acc, venda) => acc + venda.valor, 0) || 0;
          let totalAtualParaComparacao = stats.totalSales;

          if (metaAtivaData) {
            const { data: vendasMeta } = await supabase
              .from('vendas')
              .select('valor')
              .eq('loja_id', lojaId)
              .gte('data_venda', metaAtivaData.data_inicio)
              .lte('data_venda', metaAtivaData.data_fim);

            totalAtualParaComparacao = vendasMeta?.reduce((acc, venda) => acc + venda.valor, 0) || 0;
          }

          if (totalMesAnterior > 0) {
            const variacao = ((totalAtualParaComparacao - totalMesAnterior) / totalMesAnterior) * 100;
            setVariacaoMesAnterior(variacao);
          } else {
            setVariacaoMesAnterior(totalAtualParaComparacao > 0 ? 100 : 0);
          }
        } catch (error) {
          console.error('Erro ao calcular variação:', error);
          setVariacaoMesAnterior(0);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados da loja:', error);
    }
  };

  const carregarDadosGrafico = async () => {
    const dados = await buscarDadosPerformance(lojaId, periodoGrafico);
    setChartData(dados);
  };

  // Mostrar loader apenas na primeira vez
  if (cacheLoading && !stats) {
    return (
      <div className="pb-28 space-y-4 animate-slide-up flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // Se não tem stats, não renderizar nada
  if (!stats) {
    return null;
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
    <>
      {/* Top Header Fixo */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-zinc-950 border-b border-zinc-800/50 z-50 shadow-lg">
        <div className="flex justify-between items-center px-4 py-4 bg-zinc-950/95 backdrop-blur-xl">
          {/* Avatar da Loja */}
          <div className="flex items-center gap-2">
            {avatarLoja ? (
              <img
                src={avatarLoja}
                alt={nomeLoja}
                className="w-8 h-8 rounded-lg object-cover border border-zinc-700"
              />
            ) : (
              <img
                src="/logo.svg"
                alt="UpZy"
                className="w-8 h-8"
              />
            )}
          </div>

          {/* Nome da Loja Centralizado */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-sm font-semibold text-zinc-400 tracking-tight">
              {nomeLoja || 'Carregando...'}
            </h1>
          </div>

          {/* Perfil */}
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-300"></div>
            <img
              src="https://picsum.photos/100/100?random=99"
              alt="Profile"
              className="relative w-8 h-8 rounded-full border-2 border-zinc-900 object-cover"
            />
          </div>
        </div>
      </div>

      <div className="pt-header pb-28 space-y-4 animate-slide-up">
        {/* Main Hero Card - Capsule Style */}
      <div className="relative w-full aspect-[16/10] rounded-[2rem] overflow-hidden shadow-2xl group transition-transform duration-500 hover:scale-[1.02]">
        {/* Background Image/Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950"></div>

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
            <button
              onClick={onNavigateToGoals}
              className="w-7 h-7 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="space-y-0.5">
            <div className="text-zinc-400 text-xs font-medium">Faturamento Total</div>
            <div className="text-3xl font-bold text-white tracking-tight">
               {formatCurrency(stats.totalSales)}
            </div>
            <div className="text-[10px] text-zinc-400">
              {percentage >= 100 ? (
                <>Parabéns! Passou <span className="text-amber-400 font-bold">{formatCurrency(stats.totalSales - stats.monthlyTarget)}</span> da meta</>
              ) : (
                <>de <span className="text-zinc-300">{formatCurrency(stats.monthlyTarget, true)}</span> meta</>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className={`text-2xl font-light ${percentage >= 100 ? 'text-amber-400' : 'text-white'}`}>{percentage.toFixed(0)}<span className={`text-sm ${percentage >= 100 ? 'text-amber-500' : 'text-emerald-400'}`}>%</span></span>
              <span className={`text-[10px] font-medium ${variacaoMesAnterior >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {variacaoMesAnterior >= 0 ? '+' : ''}{variacaoMesAnterior.toFixed(1)}% vs mês anterior
              </span>
            </div>

            {/* Progress Bar com marca da meta */}
            <div className="relative">
              <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${percentage >= 100 ? "bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500" : "bg-gradient-to-r from-emerald-400 to-emerald-300"}`}
                  style={{ width: `${Math.min(percentage, 200)}%` }}
                />
              </div>
              {/* Marca da meta aos 100% - posição proporcional */}
              {percentage > 100 && (
                <div
                  className="absolute top-0 w-0.5 h-1 bg-white/80 shadow-lg"
                  style={{ left: `${(stats.monthlyTarget / stats.totalSales) * 100}%` }}
                >
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-lg"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Strip */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
         <button className="flex-1 min-w-[130px] h-20 rounded-2xl bg-zinc-900 border border-zinc-800 p-3 flex flex-col items-center justify-center hover:border-zinc-700 transition-colors relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-12 h-12 bg-emerald-500/10 rounded-full blur-xl -mr-3 -mt-3 group-hover:bg-emerald-500/20 transition-all"></div>
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
               <DollarSign size={14} />
            </div>
            <div className="text-center">
               <div className="text-base font-bold text-white">{formatCurrency(stats.totalSales, true)}</div>
               <div className="text-[9px] text-zinc-500 uppercase tracking-wider">Vendido</div>
            </div>
         </button>

         <button className="flex-1 min-w-[130px] h-20 rounded-2xl bg-zinc-900 border border-zinc-800 p-3 flex flex-col items-center justify-center hover:border-zinc-700 transition-colors relative overflow-hidden group">
             <div className="absolute right-0 top-0 w-12 h-12 bg-purple-500/10 rounded-full blur-xl -mr-3 -mt-3 group-hover:bg-purple-500/20 transition-all"></div>
             <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 mb-2">
               <Target size={14} />
            </div>
            <div className="text-center">
               <div className="text-base font-bold text-white">{formatCurrency(Math.max(0, stats.monthlyTarget - stats.totalSales), true)}</div>
               <div className="text-[9px] text-zinc-500 uppercase tracking-wider">Falta Vender</div>
            </div>
         </button>
      </div>

      {/* Area Chart Section */}
      <div className="glass-card rounded-[1.5rem] p-5 relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-white">Performance</h3>
          <select
            value={periodoGrafico}
            onChange={(e) => setPeriodoGrafico(e.target.value as 'meta' | 'semana' | 'mes')}
            className="bg-zinc-800 text-[10px] text-zinc-400 border border-zinc-700 rounded-full px-3 py-1 outline-none cursor-pointer font-medium"
          >
            <option value="meta">Meta Ativa</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mês</option>
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
                isAnimationActive={true}
                animationBegin={100}
                animationDuration={1200}
                animationEasing="ease-in-out"
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
                        isAnimationActive={true}
                        animationBegin={0}
                        animationDuration={300}
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
                        {formatCurrency(activeItem.value, true)}
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

      {/* UpZy Branding */}
      <div className="flex items-center justify-center gap-2 py-6">
        <img
          src="/icons/icon.svg"
          alt="UpZy"
          className="w-6 h-6 opacity-70"
        />
        <span className="text-zinc-500 text-xs font-bold tracking-tight">UpZy</span>
      </div>

      </div>
    </>
  );
};
