import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CreditCard, FileText, Check, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PricingPlan } from './types';
import CheckoutStepper from '../../components/vendas/CheckoutStepper';
import { supabase } from '../../lib/supabase';
import {
  maskCPF,
  maskCEP,
  maskPhone,
  maskCardNumber,
  maskCardExpiry,
  validateCPF,
  validateEmail,
  validateCardNumber,
  validateExpiry,
  validateCVV,
} from '../../utils/masks';

interface CheckoutProps {
  selectedPlan: PricingPlan;
  onBack: () => void;
}

type PaymentMethod = 'CREDIT_CARD' | 'BOLETO';

const Checkout: React.FC<CheckoutProps> = ({ selectedPlan, onBack }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CREDIT_CARD');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [boletoUrl, setBoletoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    // Dados pessoais
    name: '',
    email: '',
    whatsapp: '',
    cpf: '',
    // Endereço
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    // Cartão (se aplicável)
    cardHolderName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCVV: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Steps configuration - varies based on payment method
  const getSteps = () => {
    if (paymentMethod === 'CREDIT_CARD') {
      return [
        { number: 1, title: 'Pagamento' },
        { number: 2, title: 'Cartão' },
        { number: 3, title: 'Dados' },
        { number: 4, title: 'Confirmação' },
      ];
    } else {
      return [
        { number: 1, title: 'Pagamento' },
        { number: 2, title: 'Dados' },
        { number: 3, title: 'Confirmação' },
      ];
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCEPBlur = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            logradouro: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf,
          }));
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
      }
    }
  };

  // Validation functions for each step
  const validateStep1 = (): boolean => {
    return true;
  };

  const validateStep2Card = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.cardHolderName.trim()) {
      newErrors.cardHolderName = 'Digite o nome como está no cartão';
    } else if (formData.cardHolderName.trim().length < 3) {
      newErrors.cardHolderName = 'Nome no cartão muito curto';
    }

    if (!formData.cardNumber.trim()) {
      newErrors.cardNumber = 'Número do cartão é obrigatório';
    } else if (!validateCardNumber(formData.cardNumber)) {
      newErrors.cardNumber = 'Número de cartão inválido. Digite os 16 dígitos';
    }

    if (!formData.cardExpiry.trim()) {
      newErrors.cardExpiry = 'Digite a validade do cartão';
    } else if (!validateExpiry(formData.cardExpiry)) {
      newErrors.cardExpiry = 'Validade inválida ou cartão vencido';
    }

    if (!formData.cardCVV.trim()) {
      newErrors.cardCVV = 'CVV é obrigatório';
    } else if (!validateCVV(formData.cardCVV)) {
      newErrors.cardCVV = 'CVV deve ter 3 dígitos';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    return Object.keys(newErrors).length === 0;
  };

  const validateStepPersonalData = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Dados Pessoais
    if (!formData.name.trim()) {
      newErrors.name = 'Por favor, preencha seu nome completo';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Digite um email válido (ex: seu@email.com)';
    }

    if (!formData.whatsapp.trim()) {
      newErrors.whatsapp = 'WhatsApp é obrigatório';
    } else if (formData.whatsapp.replace(/\D/g, '').length < 11) {
      newErrors.whatsapp = 'WhatsApp incompleto. Digite com DDD';
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = 'CPF inválido. Verifique os números digitados';
    }

    // Endereço
    if (!formData.cep.trim()) {
      newErrors.cep = 'CEP é obrigatório';
    } else if (formData.cep.replace(/\D/g, '').length !== 8) {
      newErrors.cep = 'CEP incompleto';
    }

    if (!formData.logradouro.trim()) {
      newErrors.logradouro = 'Endereço é obrigatório. Digite o CEP para preencher automaticamente';
    }

    if (!formData.numero.trim()) {
      newErrors.numero = 'Número é obrigatório';
    }

    if (!formData.bairro.trim()) {
      newErrors.bairro = 'Bairro é obrigatório';
    }

    if (!formData.cidade.trim()) {
      newErrors.cidade = 'Cidade é obrigatória';
    }

    if (!formData.estado.trim()) {
      newErrors.estado = 'Estado é obrigatório';
    } else if (formData.estado.length !== 2) {
      newErrors.estado = 'Digite a sigla do estado (ex: SP)';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (paymentMethod === 'CREDIT_CARD') {
        if (validateStep2Card()) {
          setCurrentStep(3);
        }
      } else {
        if (validateStepPersonalData()) {
          setCurrentStep(3);
        }
      }
    } else if (currentStep === 3) {
      if (paymentMethod === 'CREDIT_CARD') {
        if (validateStepPersonalData()) {
          setCurrentStep(4);
        }
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    } else {
      onBack();
    }
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log('🚀 Iniciando processamento de pagamento...');

      const cardData = paymentMethod === 'CREDIT_CARD' ? {
        holderName: formData.cardHolderName,
        number: formData.cardNumber.replace(/\s/g, ''),
        expiryMonth: formData.cardExpiry.split('/')[0],
        expiryYear: '20' + formData.cardExpiry.split('/')[1],
        ccv: formData.cardCVV
      } : undefined;

      const requestBody = {
        planType: selectedPlan.planType,
        paymentMethod: paymentMethod,
        userData: {
          name: formData.name,
          email: formData.email,
          whatsapp: formData.whatsapp,
          cpf: formData.cpf,
          cep: formData.cep,
          logradouro: formData.logradouro,
          numero: formData.numero,
          complemento: formData.complemento,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado
        },
        cardData
      };

      console.log('📤 Enviando dados:', JSON.stringify(requestBody, null, 2));

      const { data: functionData, error: functionError } = await supabase.functions.invoke('process-payment', {
        body: requestBody
      });

      if (functionError) {
        console.error('❌ Erro na Edge Function:', functionError);
        let errorMessage = 'Erro ao processar pagamento. Tente novamente.';
        if (functionError.message?.includes('network') || functionError.message?.includes('fetch')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else if (functionError.message?.includes('timeout')) {
          errorMessage = 'Tempo esgotado. Tente novamente.';
        } else if (functionError.message) {
          errorMessage = functionError.message;
        }
        throw new Error(errorMessage);
      }

      console.log('✅ Resposta da Edge Function:', functionData);

      if (!functionData.success) {
        let errorMessage = 'Erro ao processar pagamento. Tente novamente.';
        if (functionData.error) {
          if (functionData.error.includes('Invalid API Key') || functionData.error.includes('not configured')) {
            errorMessage = 'Erro na configuração do sistema. Entre em contato com o suporte.';
          } else if (functionData.error.includes('customer')) {
            errorMessage = 'Erro ao criar cadastro. Verifique seus dados e tente novamente.';
          } else if (functionData.error.includes('card') || functionData.error.includes('cartão')) {
            errorMessage = 'Cartão recusado. Verifique os dados ou tente outro cartão.';
          } else if (functionData.error.includes('cpf') || functionData.error.includes('CPF')) {
            errorMessage = 'CPF inválido ou já cadastrado.';
          } else if (functionData.error.includes('email')) {
            errorMessage = 'Email já cadastrado. Use outro email.';
          } else {
            errorMessage = functionData.error;
          }
        }
        throw new Error(errorMessage);
      }

      if (paymentMethod === 'BOLETO' && functionData.boletoUrl) {
        setBoletoUrl(functionData.boletoUrl);
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('❌ Erro no checkout:', err);
      setError(err.message || 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Success screen - Redirect to Thank You Page
  if (success) {
    // Redirect to thank you page with payment method
    navigate(`/obrigado?method=${paymentMethod}`, { replace: true });
    return null;
  }

  // Checkout flow
  return (
    <div className="min-h-screen bg-brand-darker">
      {/* Header */}
      <div className="bg-brand-surface border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Checkout</h1>
            <p className="text-sm text-gray-400">Plano {selectedPlan.name}</p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="max-w-4xl mx-auto px-4">
        <CheckoutStepper currentStep={currentStep} steps={getSteps()} />
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pb-20">
        {/* Step 1: Payment Method Selection */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
            <div className="bg-brand-surface rounded-2xl p-6 sm:p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">Resumo do Pedido</h2>

              <div className="bg-black/20 rounded-xl p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedPlan.name}</h3>
                    <p className="text-sm text-gray-400">{selectedPlan.billingInfo}</p>
                  </div>
                  {selectedPlan.recommended && (
                    <span className="bg-teal-500 text-white px-2 py-1 rounded text-xs font-bold">
                      Mais Popular
                    </span>
                  )}
                </div>

                <div className="border-t border-white/10 pt-4">
                  <div className="flex justify-between text-gray-400 mb-2">
                    <span>Subtotal</span>
                    <span>{selectedPlan.price}{selectedPlan.period}</span>
                  </div>
                  {selectedPlan.installments && (
                    <div className="flex justify-between text-gray-400 mb-2">
                      <span>Parcelas</span>
                      <span>{selectedPlan.installments}x sem juros</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white font-bold text-xl mt-4">
                    <span>Total</span>
                    <span>R$ {selectedPlan.totalValue.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-4">Forma de Pagamento</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CREDIT_CARD')}
                  className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${
                    paymentMethod === 'CREDIT_CARD'
                      ? 'border-brand-primary bg-brand-primary/10 scale-105'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <CreditCard size={32} />
                  <span className="font-semibold text-lg">Cartão de Crédito</span>
                  <span className="text-xs text-gray-400">Aprovação imediata</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('BOLETO')}
                  className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${
                    paymentMethod === 'BOLETO'
                      ? 'border-brand-primary bg-brand-primary/10 scale-105'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <FileText size={32} />
                  <span className="font-semibold text-lg">Boleto</span>
                  <span className="text-xs text-gray-400">Aprovação em 1-2 dias</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
            >
              Avançar
              <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* Step 2: Card Details (only for CREDIT_CARD) */}
        {currentStep === 2 && paymentMethod === 'CREDIT_CARD' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
            <div className="bg-brand-surface rounded-2xl p-6 sm:p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">Dados do Cartão</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome no Cartão
                  </label>
                  <input
                    type="text"
                    name="cardHolderName"
                    value={formData.cardHolderName}
                    onChange={(e) => handleInputChange('cardHolderName', e.target.value.toUpperCase())}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="NOME COMO ESTÁ NO CARTÃO"
                  />
                  {errors.cardHolderName && (
                    <p className="text-red-400 text-sm mt-1">{errors.cardHolderName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Número do Cartão
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={(e) => handleInputChange('cardNumber', maskCardNumber(e.target.value))}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                  />
                  {errors.cardNumber && (
                    <p className="text-red-400 text-sm mt-1">{errors.cardNumber}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Validade
                    </label>
                    <input
                      type="text"
                      name="cardExpiry"
                      value={formData.cardExpiry}
                      onChange={(e) => handleInputChange('cardExpiry', maskCardExpiry(e.target.value))}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      placeholder="MM/AA"
                      maxLength={5}
                    />
                    {errors.cardExpiry && (
                      <p className="text-red-400 text-sm mt-1">{errors.cardExpiry}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      name="cardCVV"
                      value={formData.cardCVV}
                      onChange={(e) => handleInputChange('cardCVV', e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      placeholder="123"
                      maxLength={3}
                    />
                    {errors.cardCVV && (
                      <p className="text-red-400 text-sm mt-1">{errors.cardCVV}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleBack}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-8 py-4 rounded-xl font-bold transition-all"
              >
                Voltar
              </button>
              <button
                onClick={handleNext}
                className="flex-1 bg-brand-primary hover:bg-brand-primary/90 text-white px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                Avançar
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2/3: Personal Data */}
        {((currentStep === 2 && paymentMethod === 'BOLETO') || (currentStep === 3 && paymentMethod === 'CREDIT_CARD')) && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
            <div className="bg-brand-surface rounded-2xl p-6 sm:p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">Dados Pessoais</h2>

              <div className="space-y-6">
                {/* Personal Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      placeholder="Seu nome completo"
                    />
                    {errors.name && (
                      <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        placeholder="seu@email.com"
                      />
                      {errors.email && (
                        <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        WhatsApp
                      </label>
                      <input
                        type="tel"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={(e) => handleInputChange('whatsapp', maskPhone(e.target.value))}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                      />
                      {errors.whatsapp && (
                        <p className="text-red-400 text-sm mt-1">{errors.whatsapp}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      CPF
                    </label>
                    <input
                      type="text"
                      name="cpf"
                      value={formData.cpf}
                      onChange={(e) => handleInputChange('cpf', maskCPF(e.target.value))}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                    {errors.cpf && (
                      <p className="text-red-400 text-sm mt-1">{errors.cpf}</p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-lg font-bold text-white mb-4">Endereço</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        CEP
                      </label>
                      <input
                        type="text"
                        name="cep"
                        value={formData.cep}
                        onChange={(e) => handleInputChange('cep', maskCEP(e.target.value))}
                        onBlur={handleCEPBlur}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        placeholder="00000-000"
                        maxLength={9}
                      />
                      {errors.cep && (
                        <p className="text-red-400 text-sm mt-1">{errors.cep}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Endereço
                      </label>
                      <input
                        type="text"
                        name="logradouro"
                        value={formData.logradouro}
                        onChange={(e) => handleInputChange('logradouro', e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        placeholder="Rua, Avenida..."
                      />
                      {errors.logradouro && (
                        <p className="text-red-400 text-sm mt-1">{errors.logradouro}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Número
                        </label>
                        <input
                          type="text"
                          name="numero"
                          value={formData.numero}
                          onChange={(e) => handleInputChange('numero', e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                          placeholder="123"
                        />
                        {errors.numero && (
                          <p className="text-red-400 text-sm mt-1">{errors.numero}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Complemento
                        </label>
                        <input
                          type="text"
                          name="complemento"
                          value={formData.complemento}
                          onChange={(e) => handleInputChange('complemento', e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                          placeholder="Apto, Bloco..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Bairro
                      </label>
                      <input
                        type="text"
                        name="bairro"
                        value={formData.bairro}
                        onChange={(e) => handleInputChange('bairro', e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        placeholder="Centro"
                      />
                      {errors.bairro && (
                        <p className="text-red-400 text-sm mt-1">{errors.bairro}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Cidade
                        </label>
                        <input
                          type="text"
                          name="cidade"
                          value={formData.cidade}
                          onChange={(e) => handleInputChange('cidade', e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                          placeholder="São Paulo"
                        />
                        {errors.cidade && (
                          <p className="text-red-400 text-sm mt-1">{errors.cidade}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Estado
                        </label>
                        <input
                          type="text"
                          name="estado"
                          value={formData.estado}
                          onChange={(e) => handleInputChange('estado', e.target.value.toUpperCase())}
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                          placeholder="SP"
                          maxLength={2}
                        />
                        {errors.estado && (
                          <p className="text-red-400 text-sm mt-1">{errors.estado}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleBack}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-8 py-4 rounded-xl font-bold transition-all"
              >
                Voltar
              </button>
              <button
                onClick={handleNext}
                className="flex-1 bg-brand-primary hover:bg-brand-primary/90 text-white px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                Avançar
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Final Step: Confirmation */}
        {((currentStep === 3 && paymentMethod === 'BOLETO') || (currentStep === 4 && paymentMethod === 'CREDIT_CARD')) && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
            <div className="bg-brand-surface rounded-2xl p-6 sm:p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">Confirme seus Dados</h2>

              {/* Plan Summary */}
              <div className="bg-black/20 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-bold text-white mb-4">Plano Selecionado</h3>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">{selectedPlan.name}</span>
                  <span className="text-white font-bold">{selectedPlan.price}{selectedPlan.period}</span>
                </div>
                {selectedPlan.installments && (
                  <p className="text-sm text-gray-400">
                    Parcelado em {selectedPlan.installments}x sem juros
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-black/20 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-bold text-white mb-4">Forma de Pagamento</h3>
                <div className="flex items-center gap-3 text-gray-300">
                  {paymentMethod === 'CREDIT_CARD' ? (
                    <>
                      <CreditCard size={24} />
                      <div>
                        <p className="font-semibold">Cartão de Crédito</p>
                        <p className="text-sm text-gray-400">
                          {formData.cardNumber.slice(-4).padStart(formData.cardNumber.length, '•')}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <FileText size={24} />
                      <p className="font-semibold">Boleto Bancário</p>
                    </>
                  )}
                </div>
              </div>

              {/* Personal Data */}
              <div className="bg-black/20 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Dados Pessoais</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Nome:</span>
                    <span className="text-white">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">WhatsApp:</span>
                    <span className="text-white">{formData.whatsapp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">CPF:</span>
                    <span className="text-white">{formData.cpf}</span>
                  </div>
                  <div className="border-t border-white/10 my-2 pt-2">
                    <p className="text-gray-400 mb-1">Endereço:</p>
                    <p className="text-white text-xs">
                      {formData.logradouro}, {formData.numero}
                      {formData.complemento && ` - ${formData.complemento}`}
                      <br />
                      {formData.bairro} - {formData.cidade}/{formData.estado}
                      <br />
                      CEP: {formData.cep}
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mt-6">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleBack}
                disabled={isProcessing}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-8 py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Confirmar Pagamento
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
