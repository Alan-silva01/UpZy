import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ArrowRight, Loader2, FileText, Download } from 'lucide-react';

const ThankYouPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  // Get payment method and boleto URL from URL params
  const paymentMethod = searchParams.get('method') || 'CREDIT_CARD';
  const boletoUrl = searchParams.get('boleto') || null;
  const isBoleto = paymentMethod === 'BOLETO';

  useEffect(() => {
    // Only auto-redirect if NOT boleto
    if (isBoleto) {
      return; // Don't auto-redirect for boleto
    }

    // Countdown timer for credit card
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect to app root
          navigate('/', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, isBoleto]);

  const handleGoToApp = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none opacity-50"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none opacity-30"></div>

      <div className="max-w-2xl w-full relative z-10">
        {/* Success Card */}
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border border-white/10 text-center shadow-2xl">
          {/* Success Icon */}
          <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <Check size={48} className="text-emerald-500" strokeWidth={3} />
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {isBoleto ? 'Boleto Gerado com Sucesso!' : 'Pagamento Confirmado!'}
          </h1>

          {/* Description */}
          <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
            {isBoleto
              ? 'Seu boleto foi gerado. Pague até o vencimento para ativar sua assinatura. Você receberá um email com todas as informações.'
              : 'Parabéns! Seu pagamento foi processado com sucesso. Sua conta já está ativa e pronta para uso. Você receberá um email de confirmação em breve.'}
          </p>

          {/* Benefits */}
          <div className="bg-black/30 rounded-2xl p-6 mb-8">
            <h2 className="text-white font-bold mb-4 text-lg">O que acontece agora?</h2>
            <ul className="space-y-3 text-left text-gray-300 text-sm">
              {isBoleto ? (
                <>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={14} className="text-emerald-400" />
                    </div>
                    <span>Visualize ou baixe seu boleto usando o botão abaixo</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={14} className="text-emerald-400" />
                    </div>
                    <span>Pague o boleto até a data de vencimento</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={14} className="text-emerald-400" />
                    </div>
                    <span>Após a confirmação do pagamento, sua conta será ativada</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={14} className="text-emerald-400" />
                    </div>
                    <span>Você receberá um email de confirmação com os detalhes</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={14} className="text-emerald-400" />
                    </div>
                    <span>Você será redirecionado automaticamente para o app</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={14} className="text-emerald-400" />
                    </div>
                    <span>Faça login com o email cadastrado para acessar</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={14} className="text-emerald-400" />
                    </div>
                    <span>Comece a usar todas as funcionalidades imediatamente</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Boleto Button - Only show for boleto */}
          {isBoleto && boletoUrl && (
            <a
              href={boletoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] hover:scale-105 flex items-center justify-center gap-2 mx-auto mb-4"
            >
              <FileText size={20} />
              Visualizar Boleto
              <Download size={20} />
            </a>
          )}

          {/* Countdown - Only show for credit card */}
          {!isBoleto && (
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 bg-gray-800/50 border border-white/10 rounded-full px-4 py-2">
                <Loader2 size={16} className="text-emerald-400 animate-spin" />
                <span className="text-gray-300 text-sm">
                  Redirecionando em <span className="text-emerald-400 font-bold">{countdown}</span> segundos...
                </span>
              </div>
            </div>
          )}

          {/* CTA Button */}
          <button
            onClick={handleGoToApp}
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:scale-105 flex items-center justify-center gap-2 mx-auto"
          >
            Ir para o App Agora
            <ArrowRight size={20} />
          </button>

          {/* Footer Note */}
          <p className="text-gray-500 text-xs mt-8">
            Precisa de ajuda? Entre em contato pelo email: suporte@upzy.com.br
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;
