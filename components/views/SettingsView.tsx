import React, { useState, useEffect } from 'react';
import { Store as StoreIcon, CreditCard, LogOut, CheckCircle, Shield, User, Loader2, Lock, AlertCircle, ArrowUpRight, MessageCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { verificarSessao, buscarLojaIdUsuario } from '../../services/auth';
import { supabase } from '../../lib/supabase';
import { ImageCropUpload } from '../ui/ImageCropUpload';

interface SettingsViewProps {
  onLogout: () => void;
  onStoreNameUpdate?: (newName: string) => void;
  onStoreAvatarUpdate?: (newAvatar: string) => void;
}

interface StoreData {
  id: string;
  nome: string;
  plano: string;
  status: string;
  avatar_url?: string;
  data_renovacao?: string;
  final_card?: string;
  parcelas?: string;
  metodo_pagamento?: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onLogout, onStoreNameUpdate, onStoreAvatarUpdate }) => {
  const navigate = useNavigate();

  const [storeName, setStoreName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [storeAvatar, setStoreAvatar] = useState<string>('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loadingSaveName, setLoadingSaveName] = useState(false);
  const [loadingSavePassword, setLoadingSavePassword] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');
  const [editandoNome, setEditandoNome] = useState(false);
  const [editandoSenha, setEditandoSenha] = useState(false);
  const [editandoAvatar, setEditandoAvatar] = useState(false);
  const [buscandoBoleto, setBuscandoBoleto] = useState(false);
  const [boletoUrl, setBoletoUrl] = useState<string | null>(null);

  // Carregar dados imediatamente, sem aguardar cache
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoadingData(true);
    try {
      const user = await verificarSessao();
      if (user) {
        setUserEmail(user.email);
        const lojaId = await buscarLojaIdUsuario(user.id);

        if (lojaId) {
          // Buscar dados da loja
          const { data: loja } = await supabase
            .from('lojas')
            .select('*')
            .eq('id', lojaId)
            .single();

          if (loja) {
            setStoreData(loja);
            setStoreName(loja.nome);
            setStoreAvatar(loja.avatar_url || '');
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const calcularDiasRestantes = () => {
    if (!storeData?.data_renovacao) return null;

    const dataRenovacao = new Date(storeData.data_renovacao);
    const hoje = new Date();
    const diffTime = dataRenovacao.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const getTextoRenovacaoOuExpiracao = () => {
    if (storeData?.plano === 'FREE') {
      return 'Você não tem um plano ativo';
    }

    if (!storeData?.parcelas || !storeData?.data_renovacao) {
      return calcularDiasRestantes() !== null && calcularDiasRestantes()! > 0
        ? `Plano expira em ${calcularDiasRestantes()} ${calcularDiasRestantes() === 1 ? 'dia' : 'dias'}`
        : storeData?.data_renovacao
        ? `Plano expirado em: ${new Date(storeData.data_renovacao).toLocaleDateString('pt-BR')}`
        : 'Plano expirado';
    }

    // Parse das parcelas (formato: "1/12" ou "12/12")
    const [parcelaAtual, totalParcelas] = storeData.parcelas.split('/').map(Number);
    const diasRestantes = calcularDiasRestantes();

    if (!diasRestantes || diasRestantes <= 0) {
      return storeData.data_renovacao
        ? `Plano expirado em: ${new Date(storeData.data_renovacao).toLocaleDateString('pt-BR')}`
        : 'Plano expirado';
    }

    // Se for a última parcela (ex: 12/12, 6/6), mostra "Expira em"
    if (parcelaAtual === totalParcelas) {
      return `Expira em ${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}`;
    }

    // Caso contrário, mostra "Renova em"
    return `Renova em ${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}`;
  };

  const handleAvatarUpload = async (file: File, croppedDataUrl: string) => {
    if (!storeData?.id) return;

    try {
      // Converter a imagem cropada para blob
      const response = await fetch(croppedDataUrl);
      const blob = await response.blob();

      // Upload para o storage do Supabase
      const fileExt = 'jpg'; // Sempre usar jpg pois a imagem cropada é convertida para jpeg
      const fileName = `loja-${storeData.id}-${Date.now()}.${fileExt}`;

      console.log('🔄 Tentando upload...', { fileName, size: blob.size });

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError);
        throw uploadError;
      }

      console.log('✅ Upload bem-sucedido:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('📸 URL pública gerada:', publicUrl);

      // Update database
      const { error: updateError } = await supabase
        .from('lojas')
        .update({ avatar_url: publicUrl })
        .eq('id', storeData.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar banco:', updateError);
        throw updateError;
      }

      setStoreAvatar(publicUrl);

      // Notificar o App.tsx para atualizar o Header
      if (onStoreAvatarUpdate) {
        onStoreAvatarUpdate(publicUrl);
      }

      setMensagemSucesso('Avatar atualizado com sucesso!');
      setTimeout(() => setMensagemSucesso(''), 3000);
    } catch (error: any) {
      console.error('❌ Erro completo:', error);
      const errorMessage = error?.message || error?.error || 'Erro ao atualizar avatar';
      setMensagemErro(`Erro: ${errorMessage}`);
      setTimeout(() => setMensagemErro(''), 5000);
      throw error;
    }
  };

  const handleSaveStoreName = async () => {
    if (!storeData?.id || !storeName.trim()) {
      setMensagemErro('Nome da loja não pode estar vazio');
      setTimeout(() => setMensagemErro(''), 3000);
      return;
    }

    setLoadingSaveName(true);
    try {
      const { error } = await supabase
        .from('lojas')
        .update({ nome: storeName.trim() })
        .eq('id', storeData.id);

      if (error) throw error;

      // Atualizar o nome no state local
      setStoreData(prev => prev ? { ...prev, nome: storeName.trim() } : null);

      // Notificar o App.tsx para atualizar o Header
      if (onStoreNameUpdate) {
        onStoreNameUpdate(storeName.trim());
      }

      setMensagemSucesso('Nome da loja atualizado com sucesso!');
      setTimeout(() => setMensagemSucesso(''), 3000);
      setEditandoNome(false);
    } catch (error) {
      console.error('Erro ao atualizar nome da loja:', error);
      setMensagemErro('Erro ao atualizar nome da loja');
      setTimeout(() => setMensagemErro(''), 3000);
    } finally {
      setLoadingSaveName(false);
    }
  };

  const handleSavePassword = async () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setMensagemErro('Preencha todos os campos de senha');
      setTimeout(() => setMensagemErro(''), 3000);
      return;
    }

    if (novaSenha.length < 6) {
      setMensagemErro('A senha deve ter pelo menos 6 caracteres');
      setTimeout(() => setMensagemErro(''), 3000);
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setMensagemErro('As senhas não coincidem');
      setTimeout(() => setMensagemErro(''), 3000);
      return;
    }

    setLoadingSavePassword(true);
    try {
      // Primeiro, validar a senha atual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: senhaAtual
      });

      if (signInError) {
        setMensagemErro('Senha atual incorreta');
        setTimeout(() => setMensagemErro(''), 3000);
        setLoadingSavePassword(false);
        return;
      }

      // Se a senha atual estiver correta, atualizar para a nova senha
      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (error) throw error;

      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setEditandoSenha(false);
      setMensagemSucesso('Senha atualizada com sucesso!');
      setTimeout(() => setMensagemSucesso(''), 3000);
    } catch (error: any) {
      console.error('Erro ao atualizar senha:', error);
      setMensagemErro(error.message || 'Erro ao atualizar senha');
      setTimeout(() => setMensagemErro(''), 3000);
    } finally {
      setLoadingSavePassword(false);
    }
  };

  const handleBuscarBoletos = async () => {
    setBuscandoBoleto(true);
    setBoletoUrl(null);
    setMensagemErro('');

    try {
      const response = await fetch('https://autonomia-n8n-webhook.w8liji.easypanel.host/webhook/buscar_boletos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar boletos');
      }

      const data = await response.json();

      if (data.link || data.url || data.boleto_url) {
        const url = data.link || data.url || data.boleto_url;
        setBoletoUrl(url);
        setMensagemSucesso('Boleto encontrado!');
        setTimeout(() => setMensagemSucesso(''), 3000);
      } else {
        setMensagemErro('Nenhum boleto encontrado');
        setTimeout(() => setMensagemErro(''), 3000);
      }
    } catch (error) {
      console.error('Erro ao buscar boletos:', error);
      setMensagemErro('Erro ao buscar boletos. Tente novamente.');
      setTimeout(() => setMensagemErro(''), 3000);
    } finally {
      setBuscandoBoleto(false);
    }
  };

  if (loadingData && !storeData) {
    return (
      <div className="pt-header pb-28 space-y-6 flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-header pb-28 space-y-6 animate-slide-up">
      <div className="px-1">
         <span className="text-zinc-500 text-[10px] font-semibold tracking-widest uppercase mb-0.5">SaaS</span>
         <h1 className="text-xl font-bold text-white tracking-tight">Configurações</h1>
      </div>

      {/* Mensagens de Sucesso/Erro */}
      {mensagemSucesso && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-2 animate-slide-up">
          <CheckCircle size={16} className="text-emerald-400 mt-0.5 shrink-0" />
          <p className="text-emerald-200 text-xs">{mensagemSucesso}</p>
        </div>
      )}
      {mensagemErro && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2 animate-slide-up">
          <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-red-200 text-xs">{mensagemErro}</p>
        </div>
      )}

      {/* Subscription Card */}
      <div className="relative w-full aspect-[16/9] rounded-[2rem] overflow-hidden shadow-2xl group transition-transform hover:scale-[1.01]">
         {/* Metallic/Holographic Background */}
         <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
         <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px]"></div>
         <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]"></div>

         <div className="relative h-full p-6 flex flex-col justify-between z-10">
            <div className="flex justify-between items-start">
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                    <Shield size={14} className="text-white" />
                 </div>
                 <span className="font-mono text-xs text-zinc-400 tracking-wider">UPZY CARD</span>
               </div>
               {storeData?.status === 'ACTIVE' ? (
                 <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">ATIVO</span>
               ) : storeData?.status === 'PAST_DUE' ? (
                 <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">VENCIDO</span>
               ) : (
                 <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-[10px] font-bold border border-red-500/30">INATIVO</span>
               )}
            </div>

            <div>
               <div className="text-zinc-400 text-[10px] uppercase tracking-widest mb-1">Plano Atual</div>
               <div className="flex items-baseline gap-2">
                 {storeData?.plano === 'FREE' ? (
                   <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 tracking-tighter">
                     FREE
                   </div>
                 ) : (
                   <>
                     <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 tracking-tighter">
                       PRO
                     </div>
                     <div className="text-sm font-medium text-zinc-400">
                       {storeData?.plano?.replace('PRO - ', '')}
                     </div>
                   </>
                 )}
               </div>
               <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                  {getTextoRenovacaoOuExpiracao()}
               </div>
            </div>

            <div className="flex justify-between items-end">
               <div>
                 {storeData?.metodo_pagamento === 'BOLETO' && storeData?.plano !== 'FREE' ? (
                   <>
                     <div className="text-[10px] text-zinc-500 mb-1">Boleto</div>
                     <div className="text-[10px] text-zinc-400 font-mono">
                       ▌▐ ▌ ▐ ▌▐▌ ▐ ▌ ▐▌▐ ▌ ▐ ▌▐▌ ▐ ▌
                     </div>
                   </>
                 ) : storeData?.final_card && storeData?.plano !== 'FREE' ? (
                   <>
                     <div className="text-[10px] text-zinc-500 mb-1">Cartão de Crédito</div>
                     <div className="text-[10px] text-zinc-400 font-mono">
                       **** **** **** {storeData.final_card}
                     </div>
                   </>
                 ) : (
                   <>
                     <div className="text-[10px] text-zinc-500 mb-1 opacity-30">Método de Pagamento</div>
                     <div className="text-[10px] text-zinc-400 font-mono opacity-30">
                       **** **** **** ****
                     </div>
                   </>
                 )}
               </div>
               <button
                 onClick={() => navigate(`/vendas?email=${encodeURIComponent(userEmail)}#precos`)}
                 className="px-4 py-2 bg-white text-black text-xs font-bold rounded-xl hover:bg-zinc-200 transition-colors"
               >
                  Upgrade
               </button>
            </div>
         </div>
      </div>

      {/* Logo da Loja Card */}
      <div className="glass-card rounded-[2rem] overflow-hidden">
         <button
            onClick={() => setEditandoAvatar(!editandoAvatar)}
            className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
         >
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <User size={20} />
               </div>
               <div className="text-left">
                  <h3 className="text-white font-bold text-sm">Logo da Loja</h3>
                  <p className="text-[10px] text-zinc-500">Alterar imagem de perfil</p>
               </div>
            </div>
            <div className={`text-zinc-400 transition-transform ${editandoAvatar ? 'rotate-180' : ''}`}>
               <ArrowUpRight size={18} className="rotate-90" />
            </div>
         </button>

         {editandoAvatar && (
            <div className="px-6 pb-6 space-y-4 animate-slide-up">
               <ImageCropUpload
                 currentImage={storeAvatar}
                 onUpload={handleAvatarUpload}
                 label="Selecionar nova imagem"
               />
            </div>
         )}
      </div>

      {/* Nome da Loja Card */}
      <div className="glass-card rounded-[2rem] overflow-hidden">
         <button
            onClick={() => setEditandoNome(!editandoNome)}
            className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
         >
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <StoreIcon size={20} />
               </div>
               <div className="text-left">
                  <h3 className="text-white font-bold text-sm">Nome da Loja</h3>
                  <p className="text-[10px] text-zinc-500">{storeName || 'Alterar nome da loja'}</p>
               </div>
            </div>
            <div className={`text-zinc-400 transition-transform ${editandoNome ? 'rotate-180' : ''}`}>
               <ArrowUpRight size={18} className="rotate-90" />
            </div>
         </button>

         {editandoNome && (
            <div className="px-6 pb-6 space-y-4 animate-slide-up">
               <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-1">Novo Nome</label>
                  <div className="relative">
                     <input
                        type="text"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        disabled={loadingSaveName}
                        placeholder="Digite o novo nome da loja"
                        className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors text-sm disabled:opacity-50"
                     />
                  </div>
               </div>

               <div className="flex gap-3">
                  <button
                     onClick={() => {
                        setEditandoNome(false);
                        setStoreName(storeData?.nome || '');
                     }}
                     disabled={loadingSaveName}
                     className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 text-xs font-bold hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                     Cancelar
                  </button>
                  <button
                     onClick={handleSaveStoreName}
                     disabled={loadingSaveName || !storeName.trim()}
                     className="flex-1 py-3 rounded-xl bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                     {loadingSaveName ? (
                        <>
                           <Loader2 size={14} className="animate-spin" />
                           Salvando...
                        </>
                     ) : (
                        <>
                           <CheckCircle size={14} />
                           Salvar
                        </>
                     )}
                  </button>
               </div>
            </div>
         )}
      </div>

      {/* Alterar Senha Card */}
      <div className="glass-card rounded-[2rem] overflow-hidden">
         <button
            onClick={() => setEditandoSenha(!editandoSenha)}
            className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
         >
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <Lock size={20} />
               </div>
               <div className="text-left">
                  <h3 className="text-white font-bold text-sm">Alterar Senha</h3>
                  <p className="text-[10px] text-zinc-500">Modificar senha de acesso</p>
               </div>
            </div>
            <div className={`text-zinc-400 transition-transform ${editandoSenha ? 'rotate-180' : ''}`}>
               <ArrowUpRight size={18} className="rotate-90" />
            </div>
         </button>

         {editandoSenha && (
            <div className="px-6 pb-6 space-y-4 animate-slide-up">
               <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-1">Senha Atual</label>
                  <input
                     type="password"
                     value={senhaAtual}
                     onChange={(e) => setSenhaAtual(e.target.value)}
                     disabled={loadingSavePassword}
                     placeholder="Digite sua senha atual"
                     className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors text-sm disabled:opacity-50"
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-1">Nova Senha</label>
                  <input
                     type="password"
                     value={novaSenha}
                     onChange={(e) => setNovaSenha(e.target.value)}
                     disabled={loadingSavePassword}
                     placeholder="Mínimo 6 caracteres"
                     className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors text-sm disabled:opacity-50"
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-1">Confirmar Nova Senha</label>
                  <input
                     type="password"
                     value={confirmarSenha}
                     onChange={(e) => setConfirmarSenha(e.target.value)}
                     disabled={loadingSavePassword}
                     placeholder="Digite a senha novamente"
                     className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors text-sm disabled:opacity-50"
                  />
               </div>

               <div className="flex gap-3">
                  <button
                     onClick={() => {
                        setEditandoSenha(false);
                        setSenhaAtual('');
                        setNovaSenha('');
                        setConfirmarSenha('');
                     }}
                     disabled={loadingSavePassword}
                     className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 text-xs font-bold hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                     Cancelar
                  </button>
                  <button
                     onClick={handleSavePassword}
                     disabled={loadingSavePassword || !senhaAtual || !novaSenha || !confirmarSenha}
                     className="flex-1 py-3 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                     {loadingSavePassword ? (
                        <>
                           <Loader2 size={14} className="animate-spin" />
                           Salvando...
                        </>
                     ) : (
                        <>
                           <Lock size={14} />
                           Alterar Senha
                        </>
                     )}
                  </button>
               </div>
            </div>
         )}
      </div>

      {/* Suporte WhatsApp */}
      <div className="glass-card rounded-[2rem] p-6">
         <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
               <MessageCircle size={20} />
            </div>
            <div>
               <h3 className="text-white font-bold text-sm">Suporte UpZy</h3>
               <p className="text-[10px] text-zinc-500">Precisa de ajuda?</p>
            </div>
         </div>

         <a
           href="https://wa.me/5599984253218"
           target="_blank"
           rel="noopener noreferrer"
           className="w-full py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2"
         >
            <MessageCircle size={14} />
            Falar no WhatsApp
         </a>
         <p className="text-center text-[10px] text-zinc-500 mt-2">99 98425-3218</p>
      </div>

      {/* Buscar Boletos - Apenas para pagamento via boleto */}
      {storeData?.metodo_pagamento === 'BOLETO' && (
        <div className="glass-card rounded-[2rem] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Meus Boletos</h3>
              <p className="text-[10px] text-zinc-500">Buscar boletos de pagamento</p>
            </div>
          </div>

          {!boletoUrl ? (
            <button
              onClick={handleBuscarBoletos}
              disabled={buscandoBoleto}
              className="w-full py-3 rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {buscandoBoleto ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <FileText size={14} />
                  Buscar Boletos
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              <a
                href={boletoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl border border-green-500/20 bg-green-500/10 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-colors flex items-center justify-center gap-2"
              >
                <FileText size={14} />
                Ver Boleto
              </a>
              <button
                onClick={() => setBoletoUrl(null)}
                className="w-full py-2 text-zinc-500 text-[10px] hover:text-zinc-400 transition-colors"
              >
                Buscar novamente
              </button>
            </div>
          )}
        </div>
      )}

      {/* Account Info */}
      <div className="glass-card rounded-[2rem] p-6 space-y-4">
         <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
               <User size={20} />
            </div>
            <div>
               <h3 className="text-white font-bold text-sm">Minha Conta</h3>
               <p className="text-[10px] text-zinc-500">{userEmail}</p>
            </div>
         </div>

         <button
           onClick={onLogout}
           className="w-full py-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
         >
            <LogOut size={14} />
            Sair da Conta
         </button>
      </div>

       <div className="text-center">
         <p className="text-[9px] text-zinc-700">UpZy SaaS v1.0.2</p>
       </div>
    </div>
  );
};