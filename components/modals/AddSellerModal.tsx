import React, { useState } from 'react';
import { X, User, Mail, Loader2, AlertCircle, UserPlus } from 'lucide-react';
import { capitalizeName } from '../../utils/formatters';
import { PasswordInput } from '../ui/PasswordInput';

interface AddSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (dados: { nome: string; email: string; senha: string }) => Promise<void>;
}

export const AddSellerModal: React.FC<AddSellerModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: ''
  });
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

    setLoading(true);
    try {
      await onAdd(formData);
      setFormData({ nome: '', email: '', senha: '' });
      onClose();
    } catch (error: any) {
      setErro(error.message || 'Erro ao cadastrar vendedor');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ nome: '', email: '', senha: '' });
      setErro('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pt-52">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-zinc-900 rounded-[2rem] shadow-2xl max-h-[85vh] flex flex-col animate-slide-up border border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Novo Vendedor</h2>
              <p className="text-xs text-zinc-500">Adicione um membro à equipe</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error Message */}
          {erro && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 animate-slide-up">
              <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-red-200 text-xs">{erro}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2 block">
                Nome Completo
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Digite o nome completo"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  onBlur={(e) => setFormData({ ...formData, nome: capitalizeName(e.target.value) })}
                  disabled={loading}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors text-sm disabled:opacity-50"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2 block">
                Email
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={loading}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors text-sm disabled:opacity-50"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2 block">
                Senha
              </label>
              <PasswordInput
                placeholder="Mínimo 6 caracteres"
                value={formData.senha}
                onChange={(value) => setFormData({ ...formData, senha: value })}
                minLength={6}
                autoComplete="new-password"
                className="emerald"
              />
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-3 rounded-xl border border-zinc-700 bg-zinc-800 text-white text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  'Adicionar Vendedor'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
