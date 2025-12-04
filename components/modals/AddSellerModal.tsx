import React, { useState } from 'react';
import { X, User, Mail, Lock, Target, Loader2, AlertCircle } from 'lucide-react';
import { formatCurrencyInput, parseCurrencyInput, capitalizeName } from '../../utils/formatters';

interface AddSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (dados: { nome: string; email: string; senha: string; meta: number }) => Promise<void>;
}

export const AddSellerModal: React.FC<AddSellerModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    meta: 50000
  });
  const [displayMeta, setDisplayMeta] = useState('R$ 50.000,00');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!formData.nome || !formData.email || !formData.senha) {
      setErro('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (formData.meta <= 0) {
      setErro('A meta deve ser maior que zero');
      return;
    }

    setLoading(true);
    try {
      await onAdd(formData);
      setFormData({ nome: '', email: '', senha: '', meta: 50000 });
      setDisplayMeta('R$ 50.000,00');
      onClose();
    } catch (error: any) {
      setErro(error.message || 'Erro ao cadastrar vendedor');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ nome: '', email: '', senha: '', meta: 50000 });
      setDisplayMeta('R$ 50.000,00');
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 pt-20 animate-fade-in" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="w-full max-w-md relative animate-slide-up">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent rounded-[2rem] blur-2xl"></div>

        <div className="glass-card rounded-[2rem] p-6 border border-white/10 shadow-2xl relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Novo Vendedor</h2>
              <p className="text-zinc-500 text-xs mt-0.5">Adicione um membro à equipe</p>
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
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Nome Completo"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  onBlur={(e) => setFormData({ ...formData, nome: capitalizeName(e.target.value) })}
                  disabled={loading}
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:bg-zinc-900/80 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Email */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors">
                <Mail size={18} />
              </div>
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
                className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:bg-zinc-900/80 transition-all disabled:opacity-50"
              />
            </div>

            {/* Senha */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="Senha (mín. 6 caracteres)"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                disabled={loading}
                minLength={6}
                className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:bg-zinc-900/80 transition-all disabled:opacity-50"
              />
            </div>

            {/* Meta */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Meta Mensal</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors">
                  <Target size={18} />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="R$ 0,00"
                  value={displayMeta}
                  onChange={handleMetaChange}
                  disabled={loading}
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:bg-zinc-900/80 transition-all disabled:opacity-50"
                />
              </div>
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
                    Cadastrando...
                  </>
                ) : (
                  'Adicionar'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
