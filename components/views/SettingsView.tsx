import React, { useState, useEffect } from 'react';
import { Store as StoreIcon, CreditCard, LogOut, CheckCircle, Shield, User, Loader2 } from 'lucide-react';
import { verificarSessao, buscarLojaIdUsuario } from '../../services/auth';
import { supabase } from '../../lib/supabase';
import { ImageCropUpload } from '../ui/ImageCropUpload';

interface SettingsViewProps {
  onLogout: () => void;
}

interface StoreData {
  id: string;
  nome: string;
  plano: string;
  status: string;
  avatar_url?: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onLogout }) => {
  const [storeName, setStoreName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeAvatar, setStoreAvatar] = useState<string>('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const user = await verificarSessao();
      if (user) {
        setUserEmail(user.email);
        const lojaId = await buscarLojaIdUsuario(user.id);
        if (lojaId) {
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
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File, croppedDataUrl: string) => {
    if (!storeData?.id) return;

    try {
      // Upload para o storage do Supabase
      const fileExt = file.name.split('.').pop();
      const fileName = `${storeData.id}-${Date.now()}.${fileExt}`;
      const filePath = `lojas/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update database
      const { error: updateError } = await supabase
        .from('lojas')
        .update({ avatar_url: publicUrl })
        .eq('id', storeData.id);

      if (updateError) {
        throw updateError;
      }

      setStoreAvatar(publicUrl);
      alert('Avatar atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="pt-32 pb-28 space-y-6 flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-32 pb-28 space-y-6 animate-slide-up">
      <div className="px-1">
         <span className="text-zinc-500 text-[10px] font-semibold tracking-widest uppercase mb-0.5">SaaS</span>
         <h1 className="text-xl font-bold text-white tracking-tight">Configurações</h1>
      </div>

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
               <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">ATIVO</span>
            </div>

            <div>
               <div className="text-zinc-400 text-[10px] uppercase tracking-widest mb-1">Plano Atual</div>
               <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 tracking-tighter">
                 {storeData?.plano || 'FREE'}
               </div>
               <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                  {storeData?.plano === 'PRO' ? 'Renova em 30 dias' : 'Upgrade disponível'}
               </div>
            </div>

            <div className="flex justify-between items-end">
               <div className="text-[10px] text-zinc-400 font-mono">**** **** **** 4242</div>
               <button className="px-4 py-2 bg-white text-black text-xs font-bold rounded-xl hover:bg-zinc-200 transition-colors">
                  Upgrade
               </button>
            </div>
         </div>
      </div>

      {/* Store Settings */}
      <div className="glass-card rounded-[2rem] p-6 space-y-6">
         <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
               <StoreIcon size={20} />
            </div>
            <div>
               <h3 className="text-white font-bold text-sm">Dados da Loja</h3>
               <p className="text-[10px] text-zinc-500">Informações visíveis para a equipe</p>
            </div>
         </div>

         {/* Avatar da Loja */}
         <ImageCropUpload
           currentImage={storeAvatar}
           onUpload={handleAvatarUpload}
           label="Avatar da Loja"
         />

         <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold ml-1">Nome da Loja</label>
            <div className="relative">
               <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
               />
               <button className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                  <CheckCircle size={16} />
               </button>
            </div>
         </div>
      </div>

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