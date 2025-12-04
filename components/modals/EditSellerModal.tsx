import React, { useState, useEffect } from 'react';
import { X, User, Target, Loader2, AlertCircle } from 'lucide-react';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput, capitalizeName } from '../../utils/formatters';

interface EditSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (dados: { id: string; nome: string; meta: number }) => Promise<void>;
  seller: {
    id: string;
    name: string;
    target: number;
  } | null;
}

export const EditSellerModal: React.FC<EditSellerModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  seller
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    meta: 0
  });
  const [displayMeta, setDisplayMeta] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // Atualizar form quando seller mudar
  useEffect(() => {
    if (seller) {
      setFormData({
        nome: seller.name,
        meta: seller.target
      });
      setDisplayMeta(formatCurrency(seller.target));
    }
  }, [seller]);

  if (!isOpen || !seller) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!formData.nome) {
      setErro('Preencha o nome do vendedor');
      return;
    }

    setLoading(true);
    try {
      await onUpdate({
        id: seller.id,
        nome: formData.nome,
        meta: formData.meta
      });
      onClose();
    } catch (error: any) {
      setErro(error.message || 'Erro ao atualizar vendedor');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setErro('');
      onClose();
    }
  };

  const handleMetaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setDisplayMeta(formatted);
    const numeric = parseCurrencyInput(formatted);
    setFormData({ ...formData, meta: numeric });
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 pt-20 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="w-full max-w-md relative animate-slide-up">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent rounded-[2rem] blur-2xl"></div>

        <div className="glass-card rounded-[2rem] p-6 border border-white/10 shadow-2xl relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Editar Vendedor</h2>
              <p className="text-zinc-500 text-xs mt-0.5">Atualizar informações do vendedor</p>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Message */}
          {erro && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 animate-slide-up">
              <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-red-200 text-xs">{erro}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Nome */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Nome</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-400 transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Nome Completo"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  onBlur={(e) => setFormData({ ...formData, nome: capitalizeName(e.target.value) })}
                  disabled={loading}
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:bg-zinc-900/80 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Meta */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Meta Mensal</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-400 transition-colors">
                  <Target size={18} />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="R$ 0,00"
                  value={displayMeta}
                  onChange={handleMetaChange}
                  disabled={loading}
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:bg-zinc-900/80 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mt-4">
              <p className="text-amber-200 text-xs">
                ⚠️ <strong>Atenção:</strong> Alterar o nome do vendedor não atualiza o email de login.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-3.5 border border-white/10 text-zinc-300 rounded-xl hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3.5 bg-white text-black rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
