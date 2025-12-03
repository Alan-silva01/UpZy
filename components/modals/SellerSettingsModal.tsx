import React, { useState, useEffect } from 'react';
import { X, User, Lock, Save, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { capitalizeName } from '../../utils/formatters';

interface SellerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentName: string;
  onNameUpdate: (newName: string) => void;
}

export const SellerSettingsModal: React.FC<SellerSettingsModalProps> = ({
  isOpen,
  onClose,
  userId,
  currentName,
  onNameUpdate
}) => {
  const [nome, setNome] = useState(currentName);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [mensagemNome, setMensagemNome] = useState('');
  const [mensagemSenha, setMensagemSenha] = useState('');

  // Sincroniza o nome quando currentName mudar
  useEffect(() => {
    setNome(currentName);
  }, [currentName]);

  if (!isOpen) return null;

  const handleSalvarNome = async () => {
    if (!nome.trim()) {
      setMensagemNome('Por favor, digite um nome válido.');
      return;
    }

    setSalvandoNome(true);
    setMensagemNome('');

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ nome: nome.trim() })
        .eq('id', userId);

      if (error) throw error;

      onNameUpdate(nome.trim());
      setMensagemNome('Nome atualizado com sucesso!');

      setTimeout(() => {
        setMensagemNome('');
      }, 3000);
    } catch (error: any) {
      console.error('Erro ao atualizar nome:', error);
      setMensagemNome('Erro ao atualizar nome. Tente novamente.');
    } finally {
      setSalvandoNome(false);
    }
  };

  const handleRedefinirSenha = async () => {
    setMensagemSenha('');

    // Validações
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setMensagemSenha('Por favor, preencha todos os campos.');
      return;
    }

    if (novaSenha.length < 6) {
      setMensagemSenha('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setMensagemSenha('As senhas não coincidem.');
      return;
    }

    setSalvandoSenha(true);

    try {
      // Primeiro, verifica a senha atual tentando fazer login
      const { data: userData } = await supabase
        .from('usuarios')
        .select('email')
        .eq('id', userId)
        .single();

      if (!userData) {
        throw new Error('Usuário não encontrado');
      }

      // Tenta fazer login com a senha atual para validar
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: senhaAtual
      });

      if (signInError) {
        setMensagemSenha('Senha atual incorreta.');
        setSalvandoSenha(false);
        return;
      }

      // Atualiza a senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (updateError) throw updateError;

      setMensagemSenha('Senha redefinida com sucesso!');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');

      setTimeout(() => {
        setMensagemSenha('');
      }, 3000);
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      setMensagemSenha('Erro ao redefinir senha. Tente novamente.');
    } finally {
      setSalvandoSenha(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      {/* Modal Content */}
      <div className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-[2.5rem] rounded-b-none sm:rounded-[2.5rem] relative overflow-hidden animate-slide-up shadow-2xl flex flex-col max-h-[85vh] mb-4">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/50 backdrop-blur-md sticky top-0 z-20">
          <h2 className="text-xl font-bold text-white">Configurações</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto thin-scrollbar pb-10">
          {/* Seção: Alterar Nome */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <User size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Alterar Nome</h3>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Nome Completo</label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(capitalizeName(e.target.value))}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Seu nome completo"
                />
              </div>

              <button
                onClick={handleSalvarNome}
                disabled={salvandoNome || nome.trim() === currentName}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {salvandoNome ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Salvar Nome
                  </>
                )}
              </button>

              {mensagemNome && (
                <div className={`text-xs text-center py-2 px-3 rounded-lg ${mensagemNome.includes('sucesso') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {mensagemNome}
                </div>
              )}
            </div>
          </div>

          {/* Divisor */}
          <div className="border-t border-zinc-800"></div>

          {/* Seção: Redefinir Senha */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-purple-400">
              <Lock size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Redefinir Senha</h3>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Senha Atual</label>
                <input
                  type="password"
                  value={senhaAtual}
                  onChange={e => setSenhaAtual(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Digite sua senha atual"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Nova Senha</label>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Digite a nova senha"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={confirmarSenha}
                  onChange={e => setConfirmarSenha(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Confirme a nova senha"
                />
              </div>

              <button
                onClick={handleRedefinirSenha}
                disabled={salvandoSenha}
                className="w-full bg-purple-500 hover:bg-purple-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold py-3 rounded-xl shadow-lg shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {salvandoSenha ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    Redefinir Senha
                  </>
                )}
              </button>

              {mensagemSenha && (
                <div className={`text-xs text-center py-2 px-3 rounded-lg ${mensagemSenha.includes('sucesso') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {mensagemSenha}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
