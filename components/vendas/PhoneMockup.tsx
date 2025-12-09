import React, { useState, useEffect } from 'react';
import { Crown } from 'lucide-react';
import { UpzyLogo } from '../App';

const PhoneMockup: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState(0);

  // Switch screens every 4 seconds to show different features (0 -> 1 -> 2)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveScreen(prev => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative mx-auto border-gray-800 bg-gray-900 border-[8px] rounded-[2.5rem] h-[500px] w-full max-w-[280px] sm:h-[600px] sm:max-w-[320px] shadow-2xl flex flex-col overflow-hidden animate-float">
      {/* Notch */}
      <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[11px] top-[72px] rounded-l-lg"></div>
      <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[11px] top-[124px] rounded-l-lg"></div>
      <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[11px] top-[142px] rounded-r-lg"></div>
      
      {/* Screen Content */}
      <div className="flex-1 rounded-[2rem] overflow-hidden bg-brand-darker relative font-sans text-white">
        
        {/* Status Bar Mock */}
        <div className="h-8 w-full flex justify-between items-center px-6 pt-2 text-[10px] text-gray-300 z-20 relative">
          <span>11:28</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-white rounded-full opacity-20"></div>
            <div className="w-3 h-3 bg-white rounded-full opacity-60"></div>
            <div className="w-3 h-3 bg-white rounded-full opacity-90"></div>
          </div>
        </div>

        {/* App Header (Static) */}
        <div className="px-6 py-4 flex justify-between items-center z-20 relative">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs">
            <img
              src="/assets/Logotipo Design (7).png"
              alt="UPZY Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-sm font-semibold">Fashion Wick</div>
          <div className="w-8 h-8 rounded-full bg-orange-200 border-2 border-white/20 overflow-hidden">
             <img src="https://picsum.photos/50/50?random=10" alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Scrollable Area Container */}
        <div className="relative w-full h-full">
          
          {/* SCREEN 1: Dashboard */}
          <div 
            className={`absolute top-0 left-0 w-full h-full px-5 space-y-4 pb-20 transition-all duration-700 transform ${
              activeScreen === 0 
                ? 'opacity-100 translate-x-0' 
                : 'opacity-0 -translate-x-10 pointer-events-none'
            }`}
          >
            {/* Main Card */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-5 shadow-lg border border-white/5">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-300">Meta Mensal</span>
                <div className="w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center text-[10px]">↗</div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-400 text-xs mb-1">Faturamento Total</p>
                <h2 className="text-3xl font-bold">R$ 5.657,70</h2>
                <p className="text-xs text-gray-500">de R$ 60 mil meta</p>
              </div>

              <div className="relative pt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-brand-success font-bold text-lg">9%</span>
                  <span className="text-brand-success text-xs">+0.0% vs mês anterior</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-success w-[9%] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                </div>
              </div>
            </div>

            {/* Mini Cards Row */}
            <div className="flex space-x-3">
              <div className="flex-1 bg-gray-800/50 rounded-2xl p-3 border border-white/5">
                <div className="w-6 h-6 rounded-full bg-green-900/50 text-green-400 flex items-center justify-center text-xs mb-2">$</div>
                <p className="text-sm font-bold">R$ 5,7 mil</p>
                <p className="text-[10px] text-gray-500 uppercase">Vendido</p>
              </div>
              <div className="flex-1 bg-gray-800/50 rounded-2xl p-3 border border-white/5">
                <div className="w-6 h-6 rounded-full bg-purple-900/50 text-purple-400 flex items-center justify-center text-xs mb-2">◎</div>
                <p className="text-sm font-bold">R$ 54,3 mil</p>
                <p className="text-[10px] text-gray-500 uppercase">Falta Vender</p>
              </div>
            </div>

            {/* Chart Card */}
            <div className="bg-gray-800/40 rounded-3xl p-5 border border-white/5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium">Performance</h3>
                <span className="text-[10px] bg-white/5 px-2 py-1 rounded border border-white/10">Esta Semana</span>
              </div>
              {/* CSS Chart */}
              <div className="h-24 w-full flex items-end space-x-1 relative">
                 <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                   <path 
                      d="M0,35 Q20,30 40,35 T70,10 T100,30" 
                      fill="none" 
                      stroke="#8b5cf6" 
                      strokeWidth="2" 
                      strokeLinecap="round"
                   />
                   <path 
                      d="M0,35 Q20,30 40,35 T70,10 T100,30 V40 H0 Z" 
                      fill="url(#grad1)" 
                      opacity="0.2"
                   />
                   <defs>
                     <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                       <stop offset="0%" stopColor="#8b5cf6" stopOpacity="1" />
                       <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                     </linearGradient>
                   </defs>
                 </svg>
              </div>
            </div>
          </div>

          {/* SCREEN 2: Ranking / Sales Team */}
          <div 
            className={`absolute top-0 left-0 w-full h-full px-5 space-y-4 pb-20 transition-all duration-700 transform ${
              activeScreen === 1 
                ? 'opacity-100 translate-x-0' 
                : activeScreen === 0 ? 'opacity-0 translate-x-10 pointer-events-none' : 'opacity-0 -translate-x-10 pointer-events-none'
            }`}
          >
            <div className="flex justify-between items-end mb-2">
               <div>
                  <p className="text-[10px] text-gray-500 font-bold tracking-wider uppercase">Ranking</p>
                  <h2 className="text-lg font-bold">Equipe de Vendas</h2>
               </div>
            </div>

            {/* Winner Card */}
            <div className="bg-gradient-to-b from-yellow-900/40 to-gray-900/80 border border-yellow-500/30 rounded-3xl p-6 text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full bg-yellow-500/5 z-0"></div>
               <div className="relative z-10">
                  <div className="w-16 h-16 mx-auto rounded-full border-2 border-yellow-500 p-1 mb-2 relative">
                     <Crown size={20} className="absolute -top-3 left-1/2 -translate-x-1/2 text-yellow-400 fill-yellow-400" />
                     <img src="https://picsum.photos/60/60?random=11" className="w-full h-full rounded-full object-cover" />
                  </div>
                  <h3 className="font-bold text-white">Maria Lucia</h3>
                  <p className="text-yellow-400 font-bold text-xl mb-3">R$ 3,9 mil</p>
                  
                  <div className="bg-gray-800/50 rounded-lg p-2 text-xs flex justify-between items-center border border-white/5">
                     <span className="text-gray-400">Performance</span>
                     <span className="font-bold">26%</span>
                  </div>
                  <div className="h-1 bg-gray-700 rounded-full mt-2 overflow-hidden">
                     <div className="h-full bg-yellow-500 w-[26%]"></div>
                  </div>
               </div>
            </div>

            {/* Ranking List */}
            <div className="space-y-3">
               {[
                  { pos: 2, name: "Pedro Paulo", val: "R$ 1,4 mil", img: 12, percent: "15%" },
                  { pos: 3, name: "Andressa Mota", val: "R$ 271", img: 13, percent: "5%" },
                  { pos: 4, name: "André Soares", val: "R$ 100", img: 14, percent: "2%" }
               ].map((item) => (
                  <div key={item.pos} className="bg-gray-800/40 border border-white/5 rounded-2xl p-3 flex items-center gap-3">
                     <span className="text-gray-500 font-bold text-sm w-4">{item.pos}</span>
                     <img src={`https://picsum.photos/40/40?random=${item.img}`} className="w-8 h-8 rounded-full bg-gray-700" />
                     <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                           <span className="text-xs font-bold">{item.name}</span>
                           <span className="text-xs font-bold text-gray-300">{item.val}</span>
                        </div>
                        <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                           <div className="h-full bg-gray-500" style={{ width: item.percent }}></div>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
          </div>

          {/* SCREEN 3: Timeline / Recent Sales */}
          <div 
             className={`absolute top-0 left-0 w-full h-full px-5 space-y-4 pb-20 transition-all duration-700 transform ${
               activeScreen === 2 
                 ? 'opacity-100 translate-x-0' 
                 : 'opacity-0 translate-x-10 pointer-events-none'
             }`}
          >
             <div className="mb-2">
                <p className="text-[10px] text-gray-500 font-bold tracking-wider uppercase">Timeline</p>
                <h2 className="text-lg font-bold">Vendas Recentes</h2>
             </div>

             <div className="relative pl-2">
                {/* Vertical Line */}
                <div className="absolute left-[7px] top-2 bottom-0 w-[2px] bg-gray-800"></div>
                <div className="absolute left-[7px] top-2 h-1/2 w-[2px] bg-gradient-to-b from-brand-success to-transparent"></div>

                {/* Timeline Items */}
                <div className="space-y-4">
                  {[
                    { name: "Alan Bastião", val: "+ R$ 140,00", time: "48 min atrás", seller: "Maria", img: 11 },
                    { name: "Neymar", val: "+ R$ 432,00", time: "19h atrás", seller: "Maria", img: 11 },
                    { name: "Santos", val: "+ R$ 858,00", time: "20h atrás", seller: "Pedro", img: 12 },
                    { name: "Neymar", val: "+ R$ 100,00", time: "20h atrás", seller: "Pedro", img: 12 },
                  ].map((sale, idx) => (
                    <div key={idx} className="relative pl-6">
                      {/* Dot */}
                      <div className="absolute left-0 top-6 w-4 h-4 rounded-full bg-gray-900 border-2 border-brand-success z-10"></div>
                      
                      {/* Card */}
                      <div className="bg-gray-800/40 border border-white/5 rounded-2xl p-4">
                         <div className="flex justify-between items-start mb-2">
                            <div>
                               <h4 className="font-bold text-sm text-white">{sale.name}</h4>
                               <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full border border-gray-600"></span> 
                                  {sale.time}
                               </p>
                            </div>
                            <div className="flex flex-col items-end">
                               <span className="text-brand-success font-bold text-sm">{sale.val}</span>
                               <span className="text-[9px] text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded border border-white/5">itens</span>
                            </div>
                         </div>
                         <div className="border-t border-dashed border-white/5 mt-2 pt-2 flex items-center gap-2">
                            <img src={`https://picsum.photos/30/30?random=${sale.img}`} className="w-5 h-5 rounded-full" />
                            <p className="text-[10px] text-gray-400">Vendido por <span className="text-white font-bold">{sale.seller}</span></p>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>

          {/* Bottom Nav Mock (Static Overlay) */}
          <div className="absolute bottom-4 left-4 right-4 bg-gray-800/90 backdrop-blur-md rounded-2xl p-4 flex justify-between items-center text-gray-400 border border-white/10 shadow-2xl z-20">
             <div className={`${activeScreen === 0 ? 'text-white' : 'text-gray-500'} flex flex-col items-center transition-colors relative`}>
                <div className={`w-1 h-1 bg-white rounded-full mt-1 absolute -bottom-2 transition-opacity ${activeScreen === 0 ? 'opacity-100' : 'opacity-0'}`}></div>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
             </div>
             <div className={`${activeScreen === 1 ? 'text-white' : 'text-gray-500'} flex flex-col items-center transition-colors relative`}>
                <div className={`w-1 h-1 bg-white rounded-full mt-1 absolute -bottom-2 transition-opacity ${activeScreen === 1 ? 'opacity-100' : 'opacity-0'}`}></div>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
             </div>
             <div className={`${activeScreen === 2 ? 'text-white' : 'text-gray-500'} flex flex-col items-center transition-colors relative`}>
                 <div className={`w-1 h-1 bg-white rounded-full mt-1 absolute -bottom-2 transition-opacity ${activeScreen === 2 ? 'opacity-100' : 'opacity-0'}`}></div>
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
             </div>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PhoneMockup;