import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface InactiveAccountToastProps {
  isAdmin?: boolean;
  onClose?: () => void;
}

export const InactiveAccountToast: React.FC<InactiveAccountToastProps> = ({ isAdmin = false, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-fechar após 8 segundos
    const timer = setTimeout(() => {
      handleClose();
    }, 8000);

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
    <div className={`fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-md z-50 px-4 transition-all duration-300 ${
      isVisible ? 'animate-slide-down opacity-100' : 'opacity-0 -translate-y-4'
    }`}>
      <div className="bg-gradient-to-r from-amber-500/95 to-orange-500/95 border border-amber-400/50 rounded-2xl p-4 backdrop-blur-xl shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-sm mb-1">Conta Inativa - Modo Demonstração</h3>
            <p className="text-white/90 text-xs leading-relaxed">
              {isAdmin ? (
                <>Você pode visualizar o app, mas não pode realizar cadastros ou vendas.</>
              ) : (
                <>A loja está inativa. Você só pode visualizar no momento.</>
              )}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
