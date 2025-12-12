import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PasswordInput } from '../../components/ui/PasswordInput';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [temToken, setTemToken] = useState(false);

  // Verificar se tem token de recuperação na URL
  useEffect(() => {
    const checkToken = async () => {
      // Supabase processa automaticamente o hash da URL
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setTemToken(true);
      } else {
        // Se não tem sessão, verificar se há hash de recovery na URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        if (accessToken && type === 'recovery') {
          setTemToken(true);
        } else {
          setErro('Link de recuperação inválido ou expirado. Solicite um novo link.');
        }
      }
    };

    checkToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setIsLoading(true);

    // Validações
    if (!novaSenha || !confirmarSenha) {
      setErro('Preencha todos os campos para continuar.');
      setIsLoading(false);
      return;
    }

    if (novaSenha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.');
      setIsLoading(false);
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas digitadas não coincidem. Verifique e tente novamente.');
      setIsLoading(false);
      return;
    }

    try {
      // Atualizar senha usando a sessão de recovery
      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (error) throw error;

      setSucesso(true);

      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);

      // Tratamento de erros específicos
      if (error.message?.includes('same as the old password') || error.message?.includes('New password should be different')) {
        setErro('A nova senha deve ser diferente da senha anterior. Escolha outra senha.');
      } else if (error.message?.includes('Password should be at least') || error.message?.includes('weak_password')) {
        setErro('A senha deve ter no mínimo 6 caracteres.');
      } else if (error.message?.includes('invalid') || error.message?.includes('expired') || error.message?.includes('Token has expired')) {
        setErro('Link de recuperação inválido ou expirado. Solicite um novo link.');
      } else {
        setErro(error.message || 'Erro ao redefinir senha. Tente novamente mais tarde.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (sucesso) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-black">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 via-black to-black opacity-60"></div>
          <div className="absolute top-[20%] right-[-10%] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse"></div>
        </div>

        <div className="w-full max-w-md relative z-10 animate-scale-in">
          {/* Logo */}
          <div className="text-center mb-8 flex flex-col items-center gap-3">
            <img src="/logo.svg" alt="UpZy Logo" className="w-20 h-20 object-contain" />
            <h1 className="text-white text-2xl font-bold tracking-wider">UpZy</h1>
          </div>

          <div className="glass-card rounded-[2.5rem] p-8 border border-white/10 shadow-2xl backdrop-blur-xl text-center">
            {/* Success Icon */}
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mb-6 animate-bounce-in shadow-lg shadow-emerald-500/30">
              <CheckCircle size={40} className="text-white" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-3">
              Senha Redefinida!
            </h2>

            {/* Message */}
            <p className="text-zinc-400 mb-6 leading-relaxed">
              Sua senha foi alterada com sucesso. Você será redirecionado para a tela de login em instantes.
            </p>

            {/* Loading */}
            <div className="flex items-center justify-center gap-2 text-emerald-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Redirecionando...</span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!temToken && erro) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-black">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 via-black to-black opacity-60"></div>
          <div className="absolute top-[20%] right-[-10%] w-[300px] h-[300px] bg-red-500/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="w-full max-w-md relative z-10 animate-scale-in">
          {/* Logo */}
          <div className="text-center mb-8 flex flex-col items-center gap-3">
            <img src="/logo.svg" alt="UpZy Logo" className="w-20 h-20 object-contain" />
            <h1 className="text-white text-2xl font-bold tracking-wider">UpZy</h1>
          </div>

          <div className="glass-card rounded-[2.5rem] p-8 border border-white/10 shadow-2xl backdrop-blur-xl text-center">
            {/* Error Icon */}
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-500/30">
              <AlertCircle size={40} className="text-white" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-3">
              Link Inválido
            </h2>

            {/* Message */}
            <p className="text-zinc-400 mb-6 leading-relaxed">
              {erro}
            </p>

            {/* Button */}
            <button
              onClick={() => navigate('/')}
              className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-2 group"
            >
              Voltar para Login
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-black">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 via-black to-black opacity-60"></div>
        <div className="absolute top-[20%] right-[-10%] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[10%] left-[-10%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center gap-3">
          <img src="/logo.svg" alt="UpZy Logo" className="w-20 h-20 object-contain" />
          <h1 className="text-white text-2xl font-bold tracking-wider">UpZy</h1>
        </div>

        <div className="glass-card rounded-[2.5rem] p-8 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          {/* Title */}
          <div className="mb-6 text-center">
            <h2 className="text-white text-2xl font-bold mb-2">Redefinir Senha</h2>
            <p className="text-zinc-400 text-sm">Digite sua nova senha abaixo</p>
          </div>

          {/* Error Message */}
          {erro && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 animate-slide-up">
              <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-red-200 text-xs">{erro}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nova Senha */}
            <PasswordInput
              placeholder="Nova Senha"
              value={novaSenha}
              onChange={setNovaSenha}
              minLength={6}
              required
              autoComplete="new-password"
            />

            {/* Confirmar Senha */}
            <PasswordInput
              placeholder="Confirmar Nova Senha"
              value={confirmarSenha}
              onChange={setConfirmarSenha}
              minLength={6}
              required
              autoComplete="new-password"
            />

            {/* Password Requirements */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-3">
              <p className="text-xs text-zinc-500 mb-2">A senha deve ter:</p>
              <ul className="space-y-1 text-xs text-zinc-600">
                <li className={novaSenha.length >= 6 ? 'text-emerald-400' : ''}>
                  • No mínimo 6 caracteres
                </li>
                <li className={novaSenha === confirmarSenha && novaSenha.length > 0 ? 'text-emerald-400' : ''}>
                  • Senhas devem ser iguais
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !temToken}
              className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 group mt-6"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Redefinindo...
                </>
              ) : (
                <>
                  Redefinir Senha
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => navigate('/')}
              disabled={isLoading}
              className="text-zinc-500 hover:text-white transition-colors text-xs uppercase tracking-widest font-bold disabled:opacity-50"
            >
              Voltar para <span className="underline decoration-emerald-500 decoration-2 underline-offset-4 text-white">Login</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ResetPasswordPage;
