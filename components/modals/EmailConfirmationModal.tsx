import React, { useEffect } from 'react';
import { Mail, X, ArrowRight } from 'lucide-react';

interface EmailConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  type: 'signup' | 'reset-password';
}

export const EmailConfirmationModal: React.FC<EmailConfirmationModalProps> = ({
  isOpen,
  onClose,
  email,
  type
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const title = type === 'signup' ? 'Confirme seu Email' : 'Email de Recuperação Enviado';
  const message = type === 'signup'
    ? 'Enviamos um link de confirmação para seu email. Clique no link para ativar sua conta e começar a usar o UpZy.'
    : 'Enviamos um link de recuperação para seu email. Clique no link para redefinir sua senha.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-3xl shadow-2xl animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mb-6 animate-bounce-in shadow-lg shadow-emerald-500/30">
            <Mail size={36} className="text-white" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-3">
            {title}
          </h2>

          {/* Message */}
          <p className="text-zinc-400 mb-6 leading-relaxed">
            {message}
          </p>

          {/* Email Display */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 mb-6">
            <p className="text-xs text-zinc-500 mb-1">Email enviado para:</p>
            <p className="text-emerald-400 font-medium break-all">{email}</p>
          </div>

          {/* Instructions */}
          <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs text-zinc-400 mb-3 font-semibold">Próximos passos:</p>
            <ol className="space-y-2 text-xs text-zinc-500">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold mt-0.5">1.</span>
                <span>Abra sua caixa de entrada de email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold mt-0.5">2.</span>
                <span>Procure por um email do UpZy</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold mt-0.5">3.</span>
                <span>Clique no link de {type === 'signup' ? 'confirmação' : 'recuperação'}</span>
              </li>
              {type === 'signup' && (
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold mt-0.5">4.</span>
                  <span>Faça login para começar a usar sua loja</span>
                </li>
              )}
            </ol>
          </div>

          {/* Warning */}
          <p className="text-xs text-zinc-600 mb-6">
            Não recebeu o email? Verifique sua pasta de spam ou lixo eletrônico.
          </p>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-2 group"
          >
            Entendido
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
