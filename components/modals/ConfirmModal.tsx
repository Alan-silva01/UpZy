import React from 'react';
import ReactDOM from 'react-dom';
import { X, AlertTriangle, CheckCircle, Save, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'success' | 'warning';
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar'
}) => {
  // Bloquear scroll do body quando modal estiver aberto
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 size={24} className="text-red-400" />;
      case 'success':
        return <CheckCircle size={24} className="text-emerald-400" />;
      default:
        return <AlertTriangle size={24} className="text-amber-400" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          button: 'bg-red-500 hover:bg-red-600'
        };
      case 'success':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          button: 'bg-emerald-500 hover:bg-emerald-600'
        };
      default:
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          button: 'bg-amber-500 hover:bg-amber-600'
        };
    }
  };

  const colors = getColors();

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden"
        style={{
          animation: 'scaleIn 0.2s ease-out'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white z-10"
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl ${colors.bg} border ${colors.border} flex items-center justify-center mx-auto`}>
            {getIcon()}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-white text-center">
            {title}
          </h2>

          {/* Message */}
          <p className="text-sm text-zinc-400 text-center leading-relaxed">
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-zinc-700 bg-zinc-800 text-white text-sm font-bold hover:bg-zinc-700 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 py-3 rounded-xl ${colors.button} text-white text-sm font-bold transition-colors shadow-lg`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};
