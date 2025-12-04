import React, { useState } from 'react';
import { User } from '../../types';
import { Fingerprint, Lock, ArrowRight, Store, Mail, Loader2, AlertCircle } from 'lucide-react';
import { fazerLogin, registrarAdmin } from '../../services/auth';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    nomeLoja: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSuccessMessage('');
    setIsLoading(true);

    if (!formData.email) {
      setErro('Digite seu email');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await import('../../lib/supabase').then(m => m.supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`
      }));

      if (error) throw error;

      setSuccessMessage('Email de recuperação enviado! Verifique sua caixa de entrada.');
      setTimeout(() => {
        setShowForgotPassword(false);
        setSuccessMessage('');
      }, 3000);
    } catch (error: any) {
      setErro(error.message || 'Erro ao enviar email de recuperação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (isRegistering) {
        // Registro de novo admin
        if (!formData.nomeLoja || !formData.nome || !formData.email || !formData.senha) {
          setErro('Preencha todos os campos');
          setIsLoading(false);
          return;
        }

        const resultado = await registrarAdmin({
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha,
          nomeLoja: formData.nomeLoja
        });

        if (resultado.sucesso && resultado.user) {
          onLogin(resultado.user);
        } else {
          setErro(resultado.mensagem);
        }
      } else {
        // Login
        if (!formData.email || !formData.senha) {
          setErro('Preencha email e senha');
          setIsLoading(false);
          return;
        }

        const resultado = await fazerLogin({
          email: formData.email,
          senha: formData.senha
        });

        if (resultado.sucesso && resultado.user) {
          onLogin(resultado.user);
        } else {
          setErro(resultado.mensagem);
        }
      }
    } catch (error: any) {
      setErro(error.message || 'Erro ao processar requisição');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-black">
       {/* Background Effects */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 via-black to-black opacity-60"></div>
          <div className="absolute top-[20%] right-[-10%] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[10%] left-[-10%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px]"></div>
       </div>

      <div className="w-full max-w-sm relative z-10 animate-slide-up -mt-20">
        {/* Logo no topo */}
        <div className="text-center mb-8 flex flex-col items-center gap-3">
          <img src="/favicon_pwa.png" alt="UpZy Logo" className="w-20 h-20 object-contain" />
          <h1 className="text-white text-2xl font-bold tracking-wider">UpZy</h1>
        </div>

        <div className="glass-card rounded-[2.5rem] p-8 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-500">
          {/* Mensagem de erro */}
          {erro && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 animate-slide-up">
              <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-red-200 text-xs">{erro}</p>
            </div>
          )}

          {/* Mensagem de sucesso */}
          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2 animate-slide-up">
              <AlertCircle size={16} className="text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-emerald-200 text-xs">{successMessage}</p>
            </div>
          )}

          <form onSubmit={showForgotPassword ? handleForgotPassword : handleSubmit} className="space-y-4 mb-6">

            {showForgotPassword && (
              <div className="mb-4 animate-slide-up">
                <h2 className="text-white text-xl font-bold mb-2">Recuperar Senha</h2>
                <p className="text-zinc-400 text-sm">Digite seu email e enviaremos um link para redefinir sua senha.</p>
              </div>
            )}

            {isRegistering && !showForgotPassword && (
              <div className="space-y-4 animate-slide-up">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors">
                    <Store size={20} />
                  </div>
                  <input
                    type="text"
                    placeholder="Nome da Loja"
                    value={formData.nomeLoja}
                    onChange={(e) => setFormData({...formData, nomeLoja: e.target.value})}
                    required={isRegistering}
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:bg-zinc-900/80 transition-all"
                  />
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors">
                    <Fingerprint size={20} />
                  </div>
                  <input
                    type="text"
                    placeholder="Seu Nome Completo"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    required={isRegistering}
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:bg-zinc-900/80 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors">
                <Mail size={20} />
              </div>
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 focus:bg-zinc-900/80 transition-all"
              />
            </div>

            {!showForgotPassword && !isRegistering && (
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  placeholder="Senha"
                  value={formData.senha}
                  onChange={(e) => setFormData({...formData, senha: e.target.value})}
                  required
                  minLength={6}
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 focus:bg-zinc-900/80 transition-all"
                />
              </div>
            )}

            {isRegistering && !showForgotPassword && (
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  placeholder="Senha"
                  value={formData.senha}
                  onChange={(e) => setFormData({...formData, senha: e.target.value})}
                  required
                  minLength={6}
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:bg-zinc-900/80 transition-all"
                />
              </div>
            )}

            {!isRegistering && !showForgotPassword && (
              <div className="flex items-center justify-between text-xs animate-slide-up">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/10 bg-zinc-900/50 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 focus:ring-2 cursor-pointer"
                  />
                  <span className="text-zinc-400 group-hover:text-white transition-colors">Lembrar-me</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setErro('');
                  }}
                  className="text-zinc-400 hover:text-white transition-colors underline decoration-zinc-600 hover:decoration-white underline-offset-2"
                >
                  Esqueci a senha
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 group mt-6"
            >
               {isLoading ? (
                 <>
                   <Loader2 size={18} className="animate-spin" />
                   Processando...
                 </>
               ) : (
                 <>
                   {showForgotPassword ? 'Enviar Link de Recuperação' : isRegistering ? 'Criar Conta' : 'Entrar'}
                   <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                 </>
               )}
            </button>
          </form>

          {/* Toggle */}
          <div className="text-center">
            {showForgotPassword ? (
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setErro('');
                  setSuccessMessage('');
                }}
                disabled={isLoading}
                className="text-zinc-500 hover:text-white transition-colors text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 w-full disabled:opacity-50"
              >
                Voltar para <span className="underline decoration-emerald-500 decoration-2 underline-offset-4 text-white">Login</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setErro('');
                }}
                disabled={isLoading}
                className="text-zinc-500 hover:text-white transition-colors text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 w-full disabled:opacity-50"
              >
                 {isRegistering ? (
                   <>Já tem uma conta? <span className="underline decoration-emerald-500 decoration-2 underline-offset-4 text-white">Entrar</span></>
                 ) : (
                   <>Não tem conta? <span className="underline decoration-indigo-500 decoration-2 underline-offset-4 text-white">Criar Loja</span></>
                 )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
