import React from 'react';
import { AlertTriangle, Lock } from 'lucide-react';

interface InactiveAccountBannerProps {
  isAdmin?: boolean;
}

export const InactiveAccountBanner: React.FC<InactiveAccountBannerProps> = ({ isAdmin = false }) => {
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 w-full max-w-md z-50 px-4 animate-slide-down">
      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-500/50 rounded-2xl p-4 backdrop-blur-xl shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <Lock size={20} className="text-amber-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={16} className="text-amber-400" />
              <h3 className="text-white font-bold text-sm">Conta Inativa</h3>
            </div>
            <p className="text-zinc-300 text-xs leading-relaxed mb-2">
              {isAdmin ? (
                <>
                  Sua conta está <span className="font-bold text-amber-400">inativa</span>.
                  Você pode visualizar o app, mas não pode cadastrar vendedores ou realizar vendas.
                </>
              ) : (
                <>
                  A loja está com a conta <span className="font-bold text-amber-400">inativa</span>.
                  Você pode visualizar, mas não pode cadastrar vendas no momento.
                </>
              )}
            </p>
            {isAdmin && (
              <p className="text-[10px] text-zinc-400 bg-black/20 rounded-lg px-2 py-1.5 border border-amber-500/20">
                Entre em contato com o suporte para ativar sua conta e ter acesso completo.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
