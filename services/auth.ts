import { supabase } from '../lib/supabase';
import { User } from '../types';
import { formatarNomeProprio } from '../utils/formatters';

// ============================================
// AUTENTICAÇÃO
// ============================================

export interface CredenciaisLogin {
  email: string;
  senha: string;
}

export interface DadosRegistro extends CredenciaisLogin {
  nome: string;
  nomeLoja: string;
}

// Registrar novo admin (cria loja e usuário)
export async function registrarAdmin(dados: DadosRegistro): Promise<{ sucesso: boolean; mensagem: string; user?: User }> {
  try {
    console.log('📝 Iniciando registro de admin:', { email: dados.email, nomeLoja: dados.nomeLoja });

    // Formatar nome
    const nomeFormatado = formatarNomeProprio(dados.nome);
    const lojaFormatada = formatarNomeProprio(dados.nomeLoja);

    // 1. Criar usuário na autenticação do Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: dados.email,
      password: dados.senha,
      options: {
        data: {
          nome: nomeFormatado,
          papel: 'ADMIN'
        }
      }
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário na auth:', authError);
      return { sucesso: false, mensagem: authError.message };
    }

    if (!authData.user) {
      console.error('❌ authData.user é null');
      return { sucesso: false, mensagem: 'Erro ao criar usuário' };
    }

    console.log('✅ Usuário criado na auth:', authData.user.id);

    // 2. Criar loja
    console.log('📦 Criando loja...');
    const { data: loja, error: lojaError } = await supabase
      .from('lojas')
      .insert({
        nome: lojaFormatada,
        plano: 'FREE',
        status: 'INACTIVE', // Começa inativa até ativar a conta
        data_renovacao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
      })
      .select()
      .single();

    if (lojaError || !loja) {
      console.error('❌ Erro ao criar loja:', lojaError);
      return { sucesso: false, mensagem: `Erro ao criar loja: ${lojaError?.message || 'desconhecido'}` };
    }

    console.log('✅ Loja criada:', loja.id);

    // 3. Criar registro de usuário na tabela usuarios
    console.log('👤 Criando registro de usuário...');
    const { error: usuarioError } = await supabase
      .from('usuarios')
      .insert({
        id: authData.user.id,
        loja_id: loja.id,
        email: dados.email,
        nome: nomeFormatado,
        papel: 'ADMIN',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nomeFormatado}`,
        senha_hash: 'handled_by_supabase_auth'
      });

    if (usuarioError) {
      console.error('❌ Erro ao criar registro de usuário:', usuarioError);
      return { sucesso: false, mensagem: `Erro ao criar perfil: ${usuarioError.message}` };
    }

    console.log('✅ Registro de usuário criado');

    const user: User = {
      id: authData.user.id,
      name: nomeFormatado,
      email: dados.email,
      role: 'ADMIN',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nomeFormatado}`
    };

    console.log('🎉 Registro completo! User:', user);

    return {
      sucesso: true,
      mensagem: 'Conta criada com sucesso!',
      user
    };
  } catch (error: any) {
    console.error('❌ Erro geral no registro:', error);
    return { sucesso: false, mensagem: error.message || 'Erro desconhecido' };
  }
}

// Login
export async function fazerLogin(credenciais: CredenciaisLogin): Promise<{ sucesso: boolean; mensagem: string; user?: User }> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credenciais.email,
      password: credenciais.senha
    });

    if (authError) {
      console.error('Erro no login:', authError);
      return { sucesso: false, mensagem: 'Email ou senha incorretos' };
    }

    if (!authData.user) {
      return { sucesso: false, mensagem: 'Erro ao fazer login' };
    }

    // Buscar dados do usuário
    const { data: usuarioDB, error: usuarioError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (usuarioError || !usuarioDB) {
      console.error('Erro ao buscar usuário:', usuarioError);
      return { sucesso: false, mensagem: 'Erro ao buscar dados do usuário' };
    }

    // Se for vendedor, buscar o ID do vendedor
    let sellerId: string | undefined;
    if (usuarioDB.papel === 'SELLER') {
      const { data: vendedor } = await supabase
        .from('vendedores')
        .select('id')
        .eq('usuario_id', authData.user.id)
        .single();

      sellerId = vendedor?.id;
    }

    const user: User = {
      id: authData.user.id,
      name: usuarioDB.nome,
      email: usuarioDB.email,
      role: usuarioDB.papel as 'ADMIN' | 'SELLER',
      avatar: usuarioDB.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${usuarioDB.nome}`,
      sellerId
    };

    return {
      sucesso: true,
      mensagem: 'Login realizado com sucesso!',
      user
    };
  } catch (error: any) {
    console.error('Erro no login:', error);
    return { sucesso: false, mensagem: error.message || 'Erro desconhecido' };
  }
}

// Logout
export async function fazerLogout(): Promise<void> {
  await supabase.auth.signOut();
}

// Verificar sessão atual
export async function verificarSessao(): Promise<User | null> {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) return null;

    const { data: usuarioDB } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (!usuarioDB) return null;

    let sellerId: string | undefined;
    if (usuarioDB.papel === 'SELLER') {
      const { data: vendedor } = await supabase
        .from('vendedores')
        .select('id')
        .eq('usuario_id', authUser.id)
        .single();

      sellerId = vendedor?.id;
    }

    return {
      id: authUser.id,
      name: usuarioDB.nome,
      email: usuarioDB.email,
      role: usuarioDB.papel as 'ADMIN' | 'SELLER',
      avatar: usuarioDB.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${usuarioDB.nome}`,
      sellerId
    };
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
    return null;
  }
}

// Buscar loja_id do usuário
export async function buscarLojaIdUsuario(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('loja_id')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('Erro ao buscar loja_id:', error);
      return null;
    }

    return data.loja_id;
  } catch (error) {
    console.error('Erro ao buscar loja_id:', error);
    return null;
  }
}

// Buscar nome da loja
export async function buscarNomeLoja(lojaId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('lojas')
      .select('nome')
      .eq('id', lojaId)
      .single();

    if (error || !data) {
      console.error('Erro ao buscar nome da loja:', error);
      return null;
    }

    return data.nome;
  } catch (error) {
    console.error('Erro ao buscar nome da loja:', error);
    return null;
  }
}

// ============================================
// GERENCIAMENTO DE STATUS DA LOJA
// ============================================

export interface StatusLoja {
  status: 'ACTIVE' | 'INACTIVE' | 'PAST_DUE';
  plano: 'FREE' | 'PRO - Mensal' | 'PRO - Semestral' | 'PRO - Anual';
  bloqueado: boolean;
}

// Verificar status da loja
export async function verificarStatusLoja(lojaId: string): Promise<StatusLoja | null> {
  try {
    const { data, error } = await supabase
      .from('lojas')
      .select('status, plano')
      .eq('id', lojaId)
      .single();

    if (error || !data) {
      console.error('Erro ao verificar status da loja:', error);
      return null;
    }

    return {
      status: data.status,
      plano: data.plano,
      bloqueado: data.status === 'INACTIVE'
    };
  } catch (error) {
    console.error('Erro ao verificar status da loja:', error);
    return null;
  }
}

// Ativar loja (apenas admin pode fazer isso manualmente ou via sistema de pagamento)
export async function ativarLoja(lojaId: string): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    const { error } = await supabase
      .from('lojas')
      .update({ status: 'ACTIVE' })
      .eq('id', lojaId);

    if (error) {
      console.error('Erro ao ativar loja:', error);
      return { sucesso: false, mensagem: 'Erro ao ativar loja' };
    }

    return { sucesso: true, mensagem: 'Loja ativada com sucesso!' };
  } catch (error: any) {
    console.error('Erro ao ativar loja:', error);
    return { sucesso: false, mensagem: error.message || 'Erro desconhecido' };
  }
}

// Desativar loja
export async function desativarLoja(lojaId: string): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    const { error } = await supabase
      .from('lojas')
      .update({ status: 'INACTIVE' })
      .eq('id', lojaId);

    if (error) {
      console.error('Erro ao desativar loja:', error);
      return { sucesso: false, mensagem: 'Erro ao desativar loja' };
    }

    return { sucesso: true, mensagem: 'Loja desativada com sucesso!' };
  } catch (error: any) {
    console.error('Erro ao desativar loja:', error);
    return { sucesso: false, mensagem: error.message || 'Erro desconhecido' };
  }
}

// Atualizar plano da loja (ativa automaticamente se for STARTER ou PRO)
export async function atualizarPlanoLoja(
  lojaId: string,
  novoPlano: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'
): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    // Se o plano for STARTER ou PRO, ativar automaticamente
    const novoStatus = (novoPlano === 'STARTER' || novoPlano === 'PRO' || novoPlano === 'ENTERPRISE') ? 'ACTIVE' : 'INACTIVE';

    const { error } = await supabase
      .from('lojas')
      .update({
        plano: novoPlano,
        status: novoStatus
      })
      .eq('id', lojaId);

    if (error) {
      console.error('Erro ao atualizar plano:', error);
      return { sucesso: false, mensagem: 'Erro ao atualizar plano' };
    }

    const mensagem = novoStatus === 'ACTIVE'
      ? `Plano atualizado para ${novoPlano} e loja ativada com sucesso!`
      : `Plano atualizado para ${novoPlano}.`;

    return { sucesso: true, mensagem };
  } catch (error: any) {
    console.error('Erro ao atualizar plano:', error);
    return { sucesso: false, mensagem: error.message || 'Erro desconhecido' };
  }
}

// ============================================
// SINCRONIZAÇÃO DE PLANOS
// ============================================

// Mapear plano do usuário para plano da loja
function mapearPlanoUsuarioParaLoja(planoUsuario: 'monthly' | 'semester' | 'annual' | null | undefined): 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE' {
  if (!planoUsuario) return 'FREE';

  switch (planoUsuario) {
    case 'monthly':
      return 'STARTER';
    case 'semester':
      return 'PRO';
    case 'annual':
      return 'ENTERPRISE';
    default:
      return 'FREE';
  }
}

// Sincronizar plano e data de expiração do usuário com a loja
export async function sincronizarPlanoUsuarioComLoja(userId: string): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    console.log('🔄 Iniciando sincronização de plano para usuário:', userId);

    // 1. Buscar dados do usuário incluindo plano_ativo e data_expiracao
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('loja_id, plano_ativo, data_expiracao, status')
      .eq('id', userId)
      .single();

    if (usuarioError || !usuario) {
      console.error('❌ Erro ao buscar usuário:', usuarioError);
      return { sucesso: false, mensagem: 'Erro ao buscar dados do usuário' };
    }

    // 2. Mapear o plano do usuário para o plano da loja
    const planoLoja = mapearPlanoUsuarioParaLoja(usuario.plano_ativo);

    // 3. Determinar status da loja baseado no status do usuário e data de expiração
    let statusLoja: 'ACTIVE' | 'INACTIVE' | 'PAST_DUE' = 'INACTIVE';

    if (usuario.status === 'ativo') {
      // Verificar se não está expirado
      if (usuario.data_expiracao) {
        const dataExpiracao = new Date(usuario.data_expiracao);
        const agora = new Date();

        if (dataExpiracao > agora) {
          statusLoja = 'ACTIVE';
        } else {
          statusLoja = 'PAST_DUE';
        }
      } else {
        // Se não tem data de expiração mas está ativo, considera ativo
        statusLoja = 'ACTIVE';
      }
    }

    // 4. Atualizar a loja com os dados do usuário
    const { error: lojaError } = await supabase
      .from('lojas')
      .update({
        plano: planoLoja,
        status: statusLoja,
        data_renovacao: usuario.data_expiracao
      })
      .eq('id', usuario.loja_id);

    if (lojaError) {
      console.error('❌ Erro ao atualizar loja:', lojaError);
      return { sucesso: false, mensagem: 'Erro ao sincronizar plano com a loja' };
    }

    console.log('✅ Plano sincronizado com sucesso!', { planoLoja, statusLoja, dataRenovacao: usuario.data_expiracao });

    return {
      sucesso: true,
      mensagem: `Plano ${planoLoja} sincronizado com sucesso!`
    };
  } catch (error: any) {
    console.error('❌ Erro ao sincronizar plano:', error);
    return { sucesso: false, mensagem: error.message || 'Erro desconhecido' };
  }
}

// Buscar informações do plano do usuário
export async function buscarPlanoUsuario(userId: string): Promise<{
  plano: 'monthly' | 'semester' | 'annual' | null;
  dataExpiracao: string | null;
  status: string | null;
} | null> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('plano_ativo, data_expiracao, status')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('Erro ao buscar plano do usuário:', error);
      return null;
    }

    return {
      plano: data.plano_ativo,
      dataExpiracao: data.data_expiracao,
      status: data.status
    };
  } catch (error) {
    console.error('Erro ao buscar plano do usuário:', error);
    return null;
  }
}
