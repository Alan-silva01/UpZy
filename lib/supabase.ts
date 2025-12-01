import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Config:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length,
  allEnvVars: import.meta.env
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente faltando!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '[CONFIGURADO]' : '[NÃO CONFIGURADO]');

  // Mostrar mensagem na tela para debug em produção
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #000; color: #fff; padding: 20px; text-align: center;">
        <h1 style="color: #ef4444; font-size: 24px; margin-bottom: 20px;">⚠️ Erro de Configuração</h1>
        <p style="margin-bottom: 10px;">As variáveis de ambiente do Supabase não estão configuradas.</p>
        <p style="color: #999; font-size: 14px; margin-bottom: 20px;">Configure as variáveis na Vercel:</p>
        <div style="background: #111; padding: 15px; border-radius: 8px; font-family: monospace; text-align: left; max-width: 600px;">
          <p style="margin: 5px 0;">VITE_SUPABASE_URL = ${supabaseUrl || '[NÃO CONFIGURADO]'}</p>
          <p style="margin: 5px 0;">VITE_SUPABASE_ANON_KEY = ${supabaseAnonKey ? '[CONFIGURADO]' : '[NÃO CONFIGURADO]'}</p>
        </div>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">Veja DEPLOY.md para instruções</p>
      </div>
    `;
  }

  throw new Error('Faltam as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('✅ Supabase client criado com sucesso');
