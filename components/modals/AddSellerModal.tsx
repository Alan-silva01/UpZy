import React, { useState } from 'react';
import { X } from 'lucide-react';

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
      setErro('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Adicionar Vendedor</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {erro}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
              placeholder="Ex: João Silva"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
              placeholder="vendedor@exemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha *
            </label>
            <input
              type="password"
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
              placeholder="Mínimo 6 caracteres"
            />
            <p className="mt-1 text-xs text-gray-500">Mínimo 6 caracteres</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Mensal (R$) *
            </label>
            <input
              type="number"
              value={formData.meta}
              onChange={(e) => setFormData({ ...formData, meta: Number(e.target.value) })}
              disabled={loading}
              min="0"
              step="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
              placeholder="50000"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Cadastrando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
