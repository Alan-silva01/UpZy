import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const ConfirmEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [mensagem, setMensagem] = useState('Confirmando seu email...');

  useEffect(() => {
    const confirmarEmail = async () => {
      try {
        // O Supabase processa automaticamente o hash da URL
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session) {
          console.log('✅ Email confirmado! Sessão criada:', session.user.id);
          setStatus('success');
          setMensagem('Email confirmado com sucesso!');

          // Redirecionar para o app após 2 segundos
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2000);
        } else {
          // Se não tem sessão, verificar se há hash na URL
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const type = hashParams.get('type');

          if (accessToken && type === 'signup') {
            // Confirmar manualmente se necessário
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });

            if (setSessionError) throw setSessionError;

            setStatus('success');
            setMensagem('Email confirmado com sucesso!');

            setTimeout(() => {
              navigate('/', { replace: true });
            }, 2000);
          } else {
            throw new Error('Link inválido ou expirado');
          }
        }
      } catch (error: any) {
        console.error('❌ Erro ao confirmar email:', error);
        setStatus('error');
        setMensagem(error.message || 'Erro ao confirmar email. O link pode estar expirado.');
      }
    };

    confirmarEmail();
  }, [navigate]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-black">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 via-black to-black opacity-60"></div>
        <div className={`absolute top-[20%] right-[-10%] w-[300px] h-[300px] ${status === 'error' ? 'bg-red-500/10' : 'bg-emerald-500/10'} rounded-full blur-[100px] ${status === 'loading' ? 'animate-pulse' : ''}`}></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center gap-3">
          <img src="/logo.svg" alt="UpZy Logo" className="w-20 h-20 object-contain" />
          <h1 className="text-white text-2xl font-bold tracking-wider">UpZy</h1>
        </div>

        <div className="glass-card rounded-[2.5rem] p-8 border border-white/10 shadow-2xl backdrop-blur-xl text-center">
          {/* Icon */}
          <div className={`mx-auto w-20 h-20 bg-gradient-to-br ${status === 'error' ? 'from-red-500 to-red-600' : 'from-emerald-500 to-emerald-600'} rounded-full flex items-center justify-center mb-6 ${status === 'success' ? 'animate-bounce-in' : ''} shadow-lg ${status === 'error' ? 'shadow-red-500/30' : 'shadow-emerald-500/30'}`}>
            {status === 'loading' && <Loader2 size={40} className="text-white animate-spin" />}
            {status === 'success' && <CheckCircle size={40} className="text-white" />}
            {status === 'error' && <AlertCircle size={40} className="text-white" />}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-3">
            {status === 'loading' && 'Confirmando Email...'}
            {status === 'success' && 'Email Confirmado!'}
            {status === 'error' && 'Erro na Confirmação'}
          </h2>

          {/* Message */}
          <p className="text-zinc-400 mb-6 leading-relaxed">
            {mensagem}
          </p>

          {/* Loading or Redirect Info */}
          {status === 'loading' && (
            <div className="flex items-center justify-center gap-2 text-emerald-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Processando...</span>
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-center justify-center gap-2 text-emerald-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Redirecionando para o app...</span>
            </div>
          )}

          {status === 'error' && (
            <button
              onClick={() => navigate('/')}
              className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Voltar para Login
            </button>
          )}
        </div>
      </div>
    </main>
  );
};

export default ConfirmEmailPage;
