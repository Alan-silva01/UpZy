import React, { useState } from 'react';
import { X, DollarSign, CreditCard, Banknote, FileText, Smartphone, Calendar } from 'lucide-react';
import { Sale } from '../../types';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput, capitalizeName } from '../../utils/formatters';

interface EditSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vendaId: string, dadosAtualizados: Partial<Sale>) => Promise<void>;
  sale: Sale;
}

export const EditSaleModal: React.FC<EditSaleModalProps> = ({ isOpen, onClose, onSave, sale }) => {
  // Converter timestamp para formato datetime-local
  const formatDateTimeLocal = (timestamp: string) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    numeroPedido: sale.orderId || '',
    valor: sale.amount.toString(),
    nomeCliente: sale.customerName || '',
    dataVenda: formatDateTimeLocal(sale.timestamp),
    metodoPagamento: sale.metodo_pagamento || 'pix',
    tipoPagamento: sale.tipo_pagamento || 'avista',
    parcelas: sale.parcelas || 1
  });
  // Formatar valor inicial sem o prefixo R$ (o prefixo é mostrado separadamente no campo)
  const [displayAmount, setDisplayAmount] = useState(
    formatCurrency(sale.amount).replace('R$', '').trim()
  );

  if (!isOpen) return null;

  const showPaymentTypeOption = ['cartao_credito', 'boleto', 'promissoria'].includes(formData.metodoPagamento);
  const showInstallments = showPaymentTypeOption && formData.tipoPagamento === 'parcelado';

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    // Remove o prefixo R$ da formatação pois ele é mostrado separadamente
    const displayValue = formatted.replace('R$', '').trim();
    setDisplayAmount(displayValue);
    const numeric = parseCurrencyInput(formatted);
    setFormData({ ...formData, valor: numeric.toString() });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Converter datetime-local para ISO string
    const dataVendaISO = new Date(formData.dataVenda).toISOString();

    await onSave(sale.id, {
      numero_pedido: formData.numeroPedido,
      valor: parseFloat(formData.valor),
      nome_cliente: formData.nomeCliente,
      data_venda: dataVendaISO,
      metodo_pagamento: formData.metodoPagamento as any,
      tipo_pagamento: formData.tipoPagamento as any,
      parcelas: formData.parcelas
    } as any);

    onClose();
  };

  const methods = [
    { id: 'pix', label: 'Pix', icon: Smartphone },
    { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
    { id: 'cartao_debito', label: 'Débito', icon: CreditCard },
    { id: 'cartao_credito', label: 'Crédito', icon: CreditCard },
    { id: 'boleto', label: 'Boleto', icon: FileText },
    { id: 'promissoria', label: 'Promissória', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      {/* Modal Content */}
      <div className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-[2.5rem] rounded-b-none sm:rounded-[2.5rem] relative overflow-hidden animate-slide-up shadow-2xl flex flex-col max-h-[85vh] mb-4">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/50 backdrop-blur-md sticky top-0 z-20">
          <h2 className="text-xl font-bold text-white">Editar Venda</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto thin-scrollbar pb-10">
          {/* Order Number */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Nº Pedido</label>
            <input
              required
              type="text"
              value={formData.numeroPedido}
              onChange={e => setFormData({ ...formData, numeroPedido: e.target.value })}
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="#0000"
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Valor</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">
                R$
              </div>
              <input
                required
                type="text"
                inputMode="numeric"
                value={displayAmount}
                onChange={handleAmountChange}
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          {/* Customer */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Cliente</label>
            <input
              required
              type="text"
              value={formData.nomeCliente}
              onChange={e => setFormData({ ...formData, nomeCliente: e.target.value })}
              onBlur={e => setFormData({ ...formData, nomeCliente: capitalizeName(e.target.value) })}
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="Nome do cliente"
            />
          </div>

          {/* Sale Date */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-2">
              <Calendar size={12} />
              Data da Venda
            </label>
            <input
              required
              type="datetime-local"
              value={formData.dataVenda}
              onChange={e => setFormData({ ...formData, dataVenda: e.target.value })}
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Forma de Pagamento</label>
            <div className="grid grid-cols-3 gap-2">
              {methods.map((method) => {
                const Icon = method.icon;
                const isSelected = formData.metodoPagamento === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        metodoPagamento: method.id,
                        tipoPagamento: 'avista' // reset type when changing method
                      });
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${isSelected ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-zinc-800/30 border-zinc-700 text-zinc-500 hover:bg-zinc-800'}`}
                  >
                    <Icon size={20} className="mb-1" />
                    <span className="text-[10px] font-medium">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Logic Section */}
          <div className={`space-y-6 transition-all duration-500 overflow-hidden ${showPaymentTypeOption ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            {/* Type (Spot vs Installments) */}
            <div className="bg-zinc-800/30 rounded-xl p-1 border border-zinc-700 flex">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipoPagamento: 'avista' })}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.tipoPagamento === 'avista' ? 'bg-zinc-700 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                À Vista
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipoPagamento: 'parcelado' })}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.tipoPagamento === 'parcelado' ? 'bg-zinc-700 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Parcelado
              </button>
            </div>

            {/* Installments Selector */}
            {showInstallments && (
              <div className="space-y-2 animate-slide-up">
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Parcelas</label>
                <select
                  value={formData.parcelas}
                  onChange={e => setFormData({ ...formData, parcelas: parseInt(e.target.value) })}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i} value={i + 1}>{i + 1}x</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all mt-4">
            Salvar Alterações
          </button>
        </form>
      </div>
    </div>
  );
};
