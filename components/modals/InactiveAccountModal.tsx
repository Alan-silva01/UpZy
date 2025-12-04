import React from 'react';
import { X, Lock, Mail, Phone } from 'lucide-react';

interface InactiveAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionAttempted: string; // Ex: "cadastrar vendedor", "registrar venda"
}

export const InactiveAccountModal: React.FC<InactiveAccountModalProps> = ({
  isOpen,
  onClose,
  actionAttempted
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="bg-zinc-900 border border-amber-500/30 w-full max-w-md rounded-[2.5rem] rounded-b-none sm:rounded-[2.5rem] relative overflow-hidden animate-slide-up shadow-2xl">
        {/* Header com gradiente */}
        <div className="relative p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />

          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Lock size={24} className="text-amber-400" />
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">Conta Inativa</h2>
              <p className="text-sm text-zinc-400">Ação bloqueada temporariamente</p>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-800/50 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <p className="text-sm text-zinc-300 leading-relaxed">
              Você tentou <span className="font-bold text-amber-400">{actionAttempted}</span>, mas sua conta está atualmente <span className="font-bold text-amber-400">inativa</span>.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">O que você pode fazer:</h3>

            <div className="bg-zinc-800/50 rounded-xl p-3 space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-emerald-400 text-xs font-bold">1</span>
                </div>
                <p className="text-xs text-zinc-300">
                  <span className="font-bold text-white">Visualizar</span> todos os dados e funcionalidades do app
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-indigo-400 text-xs font-bold">2</span>
                </div>
                <p className="text-xs text-zinc-300">
                  <span className="font-bold text-white">Explorar</span> as funcionalidades em modo demonstração
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 border border-emerald-500/20 rounded-xl p-4">
              <h4 className="text-sm font-bold text-white mb-2">Para ativar sua conta:</h4>
              <p className="text-xs text-zinc-300 mb-3 leading-relaxed">
                Entre em contato com o suporte UpZy para liberar o acesso completo e começar a usar todas as funcionalidades.
              </p>

              <div className="space-y-2">
                <a
                  href="mailto:suporte@upzy.com.br"
                  className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <Mail size={14} />
                  <span>suporte@upzy.com.br</span>
                </a>
                <a
                  href="https://wa.me/5511999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <Phone size={14} />
                  <span>(11) 99999-9999</span>
                </a>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};
