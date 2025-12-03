import React from 'react';
import { LogOut } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  onLogout?: () => void;
  storeName?: string | null;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, storeName }) => {
  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-zinc-950 border-b border-zinc-800/50 z-50 shadow-lg">
      {/* Conteúdo do header */}
      <div className="px-4 py-4 flex justify-between items-center bg-zinc-950/95 backdrop-blur-xl">
        {isAdmin ? (
          // Layout para Admin - Logo e nome da loja centralizado
          <>
            <div className="flex items-center gap-3 flex-1">
              <img src="/favicon_pwa.png" alt="UpZy Logo" className="w-10 h-10 object-contain" />
              <div className="flex-1 text-center">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  {storeName || 'Minha Loja'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-zinc-400 hover:text-white"
                  title="Sair"
                >
                  <LogOut size={18} />
                </button>
              )}

              <img
                src={user.avatar}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-zinc-800"
              />
            </div>
          </>
        ) : (
          // Layout para Vendedor - Bem-vindo
          <>
            <div className="flex items-center gap-3">
              <img src="/favicon_pwa.png" alt="UpZy Logo" className="w-10 h-10 object-contain" />
              <div>
                <span className="text-zinc-500 text-[10px] font-semibold tracking-widest uppercase">
                  Bem-vindo
                </span>
                <h1 className="text-lg font-bold text-white tracking-tight">{user.name}</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-zinc-400 hover:text-white"
                  title="Sair"
                >
                  <LogOut size={18} />
                </button>
              )}

              <img
                src={user.avatar}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-zinc-800"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
