import React, { useState } from 'react';
import { USERS } from '../../services/mockData';
import { User } from '../../types';
import { Fingerprint, Lock, ArrowRight } from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Demo convenience function
  const handleDemoLogin = (role: 'ADMIN' | 'SELLER') => {
    setIsLoading(true);
    setTimeout(() => {
      const user = USERS.find(u => u.role === role);
      if (user) onLogin(user);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-black">
       {/* Background Effects */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 via-black to-black opacity-60"></div>
          <div className="absolute top-[20%] right-[-10%] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[10%] left-[-10%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px]"></div>
       </div>

      <div className="w-full max-w-sm relative z-10 animate-slide-up">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 tracking-tighter mb-2">UpZy</h1>
          <p className="text-zinc-500 text-sm tracking-widest uppercase">Sales Intelligence</p>
        </div>

        <div className="glass-card rounded-[2.5rem] p-8 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <div className="space-y-4 mb-8">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors">
                <Fingerprint size={20} />
              </div>
              <input 
                type="text" 
                placeholder="ID do Usuário" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 focus:bg-zinc-900/80 transition-all"
              />
            </div>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors">
                <Lock size={20} />
              </div>
              <input 
                type="password" 
                placeholder="Senha" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 focus:bg-zinc-900/80 transition-all"
              />
            </div>
          </div>

          <button 
            disabled={isLoading}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 group mb-6"
          >
             {isLoading ? 'Acessando...' : 'Entrar'}
             {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>

          <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-zinc-800"></div>
              <span className="flex-shrink-0 mx-4 text-zinc-600 text-[10px] uppercase tracking-widest">Demo Access</span>
              <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
             <button 
               onClick={() => handleDemoLogin('ADMIN')}
               className="py-3 px-4 rounded-xl bg-zinc-800/50 border border-white/5 hover:bg-zinc-800 text-xs text-zinc-300 transition-colors"
             >
               Admin
             </button>
             <button 
               onClick={() => handleDemoLogin('SELLER')}
               className="py-3 px-4 rounded-xl bg-zinc-800/50 border border-white/5 hover:bg-zinc-800 text-xs text-zinc-300 transition-colors"
             >
               Vendedor
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};