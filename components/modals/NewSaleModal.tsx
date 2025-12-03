import React, { useState } from 'react';
import { X, DollarSign, CreditCard, Banknote, FileText, Smartphone } from 'lucide-react';
import { PaymentMethod, PaymentType } from '../../types';
import { formatCurrencyInput, parseCurrencyInput } from '../../utils/formatters';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const NewSaleModal: React.FC<NewSaleModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    orderId: '',
    amount: '',
    customerName: '',
    paymentMethod: 'pix' as PaymentMethod,
    paymentType: 'spot' as PaymentType,
    installments: 1
  });
  const [displayAmount, setDisplayAmount] = useState('');

  if (!isOpen) return null;

  const showPaymentTypeOption = ['card_credit', 'boleto', 'promissory'].includes(formData.paymentMethod);
  const showInstallments = showPaymentTypeOption && formData.paymentType === 'installments';

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setDisplayAmount(formatted);
    const numeric = parseCurrencyInput(formatted);
    setFormData({...formData, amount: numeric.toString()});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setDisplayAmount('');
    onClose();
  };

  const methods = [
    { id: 'pix', label: 'Pix', icon: Smartphone },
    { id: 'money', label: 'Dinheiro', icon: Banknote },
    { id: 'card_debit', label: 'Débito', icon: CreditCard },
    { id: 'card_credit', label: 'Crédito', icon: CreditCard },
    { id: 'boleto', label: 'Boleto', icon: FileText },
    { id: 'promissory', label: 'Promissória', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      {/* Modal Content */}
      <div className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-[2.5rem] rounded-b-none sm:rounded-[2.5rem] relative overflow-hidden animate-slide-up shadow-2xl flex flex-col max-h-[85vh] mb-4">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/50 backdrop-blur-md sticky top-0 z-20">
          <h2 className="text-xl font-bold text-white">Nova Venda</h2>
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
              value={formData.orderId}
              onChange={e => setFormData({...formData, orderId: e.target.value})}
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
              value={formData.customerName}
              onChange={e => setFormData({...formData, customerName: e.target.value})}
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="Nome do cliente"
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
             <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Forma de Pagamento</label>
             <div className="grid grid-cols-3 gap-2">
                {methods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = formData.paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData, 
                          paymentMethod: method.id as PaymentMethod,
                          paymentType: 'spot' // reset type when changing method
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
                  onClick={() => setFormData({...formData, paymentType: 'spot'})}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.paymentType === 'spot' ? 'bg-zinc-700 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  À Vista
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, paymentType: 'installments'})}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.paymentType === 'installments' ? 'bg-zinc-700 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Parcelado
                </button>
             </div>

             {/* Installments Selector */}
             {showInstallments && (
               <div className="space-y-2 animate-slide-up">
                  <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Parcelas</label>
                  <select 
                    value={formData.installments}
                    onChange={e => setFormData({...formData, installments: parseInt(e.target.value)})}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i} value={i+1}>{i+1}x</option>
                    ))}
                  </select>
               </div>
             )}
          </div>

          <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all mt-4">
            Registrar Venda
          </button>
        </form>
      </div>
    </div>
  );
};