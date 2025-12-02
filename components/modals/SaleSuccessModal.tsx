import React from 'react';
import { CheckCircle, TrendingUp, X } from 'lucide-react';

interface SaleSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue?: () => void;
  saleData: {
    valor: number;
    cliente: string;
    numeroPedido: string;
  };
}

export const SaleSuccessModal: React.FC<SaleSuccessModalProps> = ({ isOpen, onClose, onContinue, saleData }) => {
  if (!isOpen) return null;

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="bg-zinc-900 border border-emerald-500/30 w-full max-w-md rounded-[2.5rem] relative overflow-hidden animate-scale-in shadow-2xl shadow-emerald-500/20">

        {/* Header com gradiente */}
        <div className="relative p-8 text-center bg-gradient-to-b from-emerald-500/10 to-transparent">
          {/* Círculo animado de fundo */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>

          {/* Ícone de sucesso */}
          <div className="relative mx-auto w-20 h-20 mb-4 animate-bounce-in">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
            <div className="relative w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50">
              <CheckCircle size={40} className="text-white" strokeWidth={2.5} />
            </div>
          </div>

          {/* Título */}
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
            Venda Realizada!
          </h2>
          <p className="text-sm text-zinc-400">
            Sua venda foi registrada com sucesso
          </p>
        </div>

        {/* Detalhes da venda */}
        <div className="p-6 space-y-4">

          {/* Valor da venda - Destaque */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-5 text-center">
            <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-2 flex items-center justify-center gap-2">
              <TrendingUp size={14} />
              Valor da Venda
            </div>
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-emerald-600 tracking-tighter">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(saleData.valor)}
            </div>
          </div>

          {/* Informações adicionais */}
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Cliente</span>
              <span className="text-sm text-white font-medium">{saleData.cliente}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Nº Pedido</span>
              <span className="text-sm text-white font-mono font-bold">{saleData.numeroPedido}</span>
            </div>
          </div>

          {/* Mensagem motivacional */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-center">
            <p className="text-xs text-indigo-300 leading-relaxed">
              Continue assim! Cada venda te aproxima da sua meta 🎯
            </p>
          </div>

          {/* Botão de fechar */}
          <button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98]"
          >
            Continuar Vendendo
          </button>
        </div>

        {/* Botão X no canto */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-zinc-800/80 backdrop-blur-sm border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
        >
          <X size={18} />
        </button>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};
