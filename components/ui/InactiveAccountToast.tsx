import React, { useEffect, useState } from 'react';
import { Lock, X, CreditCard } from 'lucide-react';

interface InactiveAccountToastProps {
  isAdmin?: boolean;
  onClose?: () => void;
}

export const InactiveAccountToast: React.FC<InactiveAccountToastProps> = ({ isAdmin = false, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-fechar após 10 segundos
    const timer = setTimeout(() => {
      handleClose();
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300); // Aguarda animação terminar
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-lg z-50 px-4 transition-all duration-300 ${
      isVisible ? 'animate-slide-down opacity-100' : 'opacity-0 -translate-y-4'
    }`}>
      <div className="bg-gradient-to-br from-zinc-900/98 via-zinc-900/98 to-zinc-800/98 border border-red-500/30 rounded-2xl p-4 backdrop-blur-xl shadow-2xl shadow-red-500/10">
        {/* Linha superior brilhante */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

        <div className="flex items-start gap-3">
          {/* Ícone */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center shrink-0 border border-red-500/30 shadow-lg shadow-red-500/20">
            <Lock size={20} className="text-red-400" />
          </div>

          {/* Conteúdo */}
          <div className="flex-1 pt-0.5">
            <h3 className="text-white font-bold text-sm mb-1.5 tracking-tight">Plano Inativo - Modo Demonstração</h3>
            <p className="text-zinc-300 text-xs leading-relaxed mb-2">
              {isAdmin ? (
                <>Você não possui um plano ativo. Para cadastrar vendedores, registrar vendas ou criar metas, <span className="font-semibold text-white">efetue o pagamento</span> do seu plano.</>
              ) : (
                <>A loja está sem plano ativo. Entre em contato com o administrador para liberar o acesso completo.</>
              )}
            </p>

            {/* Botão CTA (apenas para admin) */}
            {isAdmin && (
              <button
                onClick={() => {
                  console.log('Redirecionar para pagamento');
                  handleClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95 shadow-md shadow-emerald-500/25"
              >
                <CreditCard size={14} />
                Efetuar Pagamento
              </button>
            )}
          </div>

          {/* Botão fechar */}
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-full bg-zinc-800/50 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
