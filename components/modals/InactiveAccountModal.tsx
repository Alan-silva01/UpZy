import React from 'react';
import { X, Lock, CreditCard, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface InactiveAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionAttempted: string; // Ex: "cadastrar vendedor", "registrar venda"
  userEmail?: string;
}

export const InactiveAccountModal: React.FC<InactiveAccountModalProps> = ({
  isOpen,
  onClose,
  actionAttempted,
  userEmail
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handlePaymentClick = () => {
    if (userEmail) {
      navigate(`/vendas?email=${encodeURIComponent(userEmail)}#precos`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-red-500/30 w-full max-w-md rounded-[2.5rem] rounded-b-none sm:rounded-[2.5rem] relative overflow-hidden animate-slide-up shadow-2xl shadow-red-500/10">
        {/* Brilho animado no topo */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

        {/* Header com gradiente */}
        <div className="relative p-6 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent">
          <div className="relative flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center shrink-0 border border-red-500/30 shadow-lg shadow-red-500/20">
              <Lock size={26} className="text-red-400" />
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-black text-white mb-1 tracking-tight">Plano Inativo</h2>
              <p className="text-sm text-zinc-400">Você não possui um plano ativo</p>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-zinc-800/50 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Mensagem da ação bloqueada */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
            <p className="text-sm text-zinc-200 leading-relaxed">
              Você tentou <span className="font-bold text-red-400">{actionAttempted}</span>, mas esta ação está <span className="font-bold text-red-400">bloqueada</span> no modo demonstração.
            </p>
          </div>

          {/* Modo Demo Info */}
          <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Modo Demonstração</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Você pode visualizar todas as funcionalidades do UpZy, mas para realizar ações como cadastros, vendas e metas, é necessário ativar um plano.
            </p>
          </div>

          {/* CTA para ativação */}
          <div className="relative bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-indigo-500/10 border border-emerald-500/30 rounded-2xl p-5 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <CreditCard size={16} className="text-emerald-400" />
                </div>
                <h4 className="text-base font-bold text-white">Ative seu plano agora</h4>
              </div>

              <p className="text-xs text-zinc-300 mb-4 leading-relaxed">
                Para desbloquear todas as funcionalidades e começar a usar o UpZy sem limitações, efetue o pagamento do seu plano.
              </p>

              <button
                onClick={handlePaymentClick}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                <CreditCard size={18} />
                Efetuar Pagamento
              </button>
            </div>
          </div>

          {/* Botão fechar */}
          <button
            onClick={onClose}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-xl transition-all active:scale-95 border border-zinc-700/50"
          >
            Voltar ao App
          </button>
        </div>
      </div>
    </div>
  );
};
