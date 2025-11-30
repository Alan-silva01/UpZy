import { supabase } from '../lib/supabase';
import { VendedorDB, VendaDB, UsuarioDB } from '../types/database';
import { Seller, Sale, StoreStats } from '../types';

// ============================================
// VENDEDORES
// ============================================

export async function buscarVendedores(lojaId: string): Promise<Seller[]> {
  const { data, error } = await supabase
    .from('vendedores')
    .select(`
      id,
      meta,
      usuario_id,
      usuarios!inner (
        id,
        nome,
        avatar
      )
    `)
    .eq('loja_id', lojaId);

  if (error) {
    console.error('Erro ao buscar vendedores:', error);
    return [];
  }

  if (!data) return [];

  // Buscar vendas do mês para cada vendedor
  const vendedoresComVendas = await Promise.all(
    data.map(async (vendedor: any) => {
      const vendasMes = await calcularVendasVendedorMes(vendedor.id);
      const ultimaVenda = await buscarUltimaVenda(vendedor.id);

      return {
        id: vendedor.id,
        name: vendedor.usuarios.nome,
        avatar: vendedor.usuarios.avatar || `https://picsum.photos/100/100?random=${vendedor.id}`,
        currentSales: vendasMes,
        target: vendedor.meta,
        lastSaleTime: ultimaVenda?.data_venda
      };
    })
  );

  return vendedoresComVendas;
}

export async function atualizarMetaVendedor(vendedorId: string, novaMeta: number): Promise<boolean> {
  const { error } = await supabase
    .from('vendedores')
    .update({ meta: novaMeta })
    .eq('id', vendedorId);

  if (error) {
    console.error('Erro ao atualizar meta:', error);
    return false;
  }

  return true;
}

export async function cadastrarVendedor(dados: {
  lojaId: string;
  nome: string;
  email: string;
  senha: string;
  meta: number;
}): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    console.log('📝 Iniciando cadastro de vendedor:', { email: dados.email, loja: dados.lojaId });

    // 1. Criar usuário na autenticação do Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: dados.email,
      password: dados.senha,
      options: {
        data: {
          nome: dados.nome,
          papel: 'SELLER'
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

    // 2. Criar registro de usuário na tabela usuarios
    console.log('👤 Criando registro de usuário...');
    const { error: usuarioError } = await supabase
      .from('usuarios')
      .insert({
        id: authData.user.id,
        loja_id: dados.lojaId,
        email: dados.email,
        nome: dados.nome,
        papel: 'SELLER',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${dados.nome}`,
        senha_hash: 'handled_by_supabase_auth'
      });

    if (usuarioError) {
      console.error('❌ Erro ao criar registro de usuário:', usuarioError);
      return { sucesso: false, mensagem: `Erro ao criar perfil: ${usuarioError.message}` };
    }

    console.log('✅ Registro de usuário criado');

    // 3. Criar vendedor
    console.log('💼 Criando vendedor...');
    const { error: vendedorError } = await supabase
      .from('vendedores')
      .insert({
        loja_id: dados.lojaId,
        usuario_id: authData.user.id,
        meta: dados.meta
      });

    if (vendedorError) {
      console.error('❌ Erro ao criar vendedor:', vendedorError);
      return { sucesso: false, mensagem: `Erro ao criar vendedor: ${vendedorError.message}` };
    }

    console.log('✅ Vendedor criado com sucesso!');

    return {
      sucesso: true,
      mensagem: 'Vendedor cadastrado com sucesso!'
    };
  } catch (error: any) {
    console.error('❌ Erro geral no cadastro:', error);
    return { sucesso: false, mensagem: error.message || 'Erro desconhecido' };
  }
}

// ============================================
// VENDAS
// ============================================

export async function buscarVendas(lojaId: string, limite: number = 50): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('vendas')
    .select('*')
    .eq('loja_id', lojaId)
    .order('data_venda', { ascending: false })
    .limit(limite);

  if (error) {
    console.error('Erro ao buscar vendas:', error);
    return [];
  }

  if (!data) return [];

  return data.map((venda: VendaDB) => ({
    id: venda.id,
    amount: venda.valor,
    itemsCount: venda.quantidade_itens,
    timestamp: venda.data_venda,
    sellerId: venda.vendedor_id,
    customerName: venda.nome_cliente || 'Cliente não informado'
  }));
}

export async function criarVenda(venda: {
  lojaId: string;
  vendedorId: string;
  numeroPedido?: string;
  valor: number;
  quantidadeItens: number;
  nomeCliente?: string;
  metodoPagamento?: 'pix' | 'dinheiro' | 'cartao' | 'boleto' | 'promissoria';
  tipoPagamento?: 'avista' | 'parcelado';
  parcelas?: number;
}): Promise<boolean> {
  const { error } = await supabase
    .from('vendas')
    .insert({
      loja_id: venda.lojaId,
      vendedor_id: venda.vendedorId,
      numero_pedido: venda.numeroPedido,
      valor: venda.valor,
      quantidade_itens: venda.quantidadeItens,
      nome_cliente: venda.nomeCliente,
      metodo_pagamento: venda.metodoPagamento,
      tipo_pagamento: venda.tipoPagamento,
      parcelas: venda.parcelas || 1
    });

  if (error) {
    console.error('Erro ao criar venda:', error);
    return false;
  }

  return true;
}

// ============================================
// ESTATÍSTICAS
// ============================================

export async function calcularEstatisticasLoja(lojaId: string): Promise<StoreStats> {
  // Vendas do mês
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const { data: vendasMes, error: errorMes } = await supabase
    .from('vendas')
    .select('valor')
    .eq('loja_id', lojaId)
    .gte('data_venda', inicioMes.toISOString());

  const totalVendasMes = vendasMes?.reduce((acc, v) => acc + v.valor, 0) || 0;

  // Vendas do dia
  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);

  const { data: vendasDia, error: errorDia } = await supabase
    .from('vendas')
    .select('valor')
    .eq('loja_id', lojaId)
    .gte('data_venda', inicioDia.toISOString());

  const totalVendasDia = vendasDia?.reduce((acc, v) => acc + v.valor, 0) || 0;

  // Buscar meta total (soma das metas de todos vendedores)
  const { data: vendedores, error: errorVendedores } = await supabase
    .from('vendedores')
    .select('meta')
    .eq('loja_id', lojaId);

  const metaMensal = vendedores?.reduce((acc, v) => acc + v.meta, 0) || 50000;

  return {
    totalSales: totalVendasMes,
    monthlyTarget: metaMensal,
    dailyTarget: metaMensal / 30, // Meta diária aproximada
    salesToday: totalVendasDia
  };
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

async function calcularVendasVendedorMes(vendedorId: string): Promise<number> {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('vendas')
    .select('valor')
    .eq('vendedor_id', vendedorId)
    .gte('data_venda', inicioMes.toISOString());

  if (error || !data) return 0;

  return data.reduce((acc, v) => acc + v.valor, 0);
}

async function buscarUltimaVenda(vendedorId: string): Promise<VendaDB | null> {
  const { data, error } = await supabase
    .from('vendas')
    .select('*')
    .eq('vendedor_id', vendedorId)
    .order('data_venda', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return data;
}
