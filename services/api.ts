import { supabase } from '../lib/supabase';
import { VendedorDB, VendaDB, UsuarioDB } from '../types/database';
import { Seller, Sale, StoreStats } from '../types';
import { formatarNomeProprio } from '../utils/formatters';

// ============================================
// VENDEDORES
// ============================================

export async function buscarVendedores(lojaId: string): Promise<Seller[]> {
  console.log('👥 Buscando vendedores para loja:', lojaId);

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
    console.error('❌ Erro ao buscar vendedores:', error);
    return [];
  }

  if (!data) {
    console.log('⚠️ Nenhum vendedor encontrado');
    return [];
  }

  console.log('✅ Vendedores encontrados:', data.length);

  // Buscar vendas do mês para cada vendedor
  const vendedoresComVendas = await Promise.all(
    data.map(async (vendedor: any) => {
      const vendasMes = await calcularVendasVendedorMes(vendedor.id);
      const ultimaVenda = await buscarUltimaVenda(vendedor.id);

      console.log(`💼 Vendedor ${vendedor.usuarios.nome}: R$ ${vendasMes} vendido`);

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

  console.log('✅ Vendedores com vendas:', vendedoresComVendas);

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

    // Formatar nome
    const nomeFormatado = formatarNomeProprio(dados.nome);

    // 1. Criar usuário na autenticação do Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: dados.email,
      password: dados.senha,
      options: {
        data: {
          nome: nomeFormatado,
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
        nome: nomeFormatado,
        papel: 'SELLER',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nomeFormatado}`,
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
  // Formatar nome do cliente
  const nomeClienteFormatado = venda.nomeCliente ? formatarNomeProprio(venda.nomeCliente) : undefined;

  const { error } = await supabase
    .from('vendas')
    .insert({
      loja_id: venda.lojaId,
      vendedor_id: venda.vendedorId,
      numero_pedido: venda.numeroPedido,
      valor: venda.valor,
      quantidade_itens: venda.quantidadeItens,
      nome_cliente: nomeClienteFormatado,
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
  console.log('📊 Calculando estatísticas para loja:', lojaId);

  // Primeiro vamos buscar TODAS as vendas para debug
  const { data: todasVendas } = await supabase
    .from('vendas')
    .select('*');

  console.log('🔍 TODAS as vendas no banco (sem filtro):', todasVendas);

  // Vendas do mês
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  console.log('📅 Buscando vendas desde:', inicioMes.toISOString());
  console.log('🏪 Filtrando por loja_id:', lojaId);

  const { data: vendasMes, error: errorMes } = await supabase
    .from('vendas')
    .select('valor, data_venda, loja_id, vendedor_id')
    .eq('loja_id', lojaId)
    .gte('data_venda', inicioMes.toISOString());

  console.log('📈 Vendas do mês (filtradas):', vendasMes);
  if (errorMes) console.error('❌ Erro ao buscar vendas do mês:', errorMes);

  const totalVendasMes = vendasMes?.reduce((acc, v) => acc + v.valor, 0) || 0;
  console.log('💰 Total vendas mês:', totalVendasMes);

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

  console.log('🎯 Vendedores e metas:', vendedores);

  const metaMensal = vendedores?.reduce((acc, v) => acc + v.meta, 0) || 50000;

  const stats = {
    totalSales: totalVendasMes,
    monthlyTarget: metaMensal,
    dailyTarget: metaMensal / 30,
    salesToday: totalVendasDia
  };

  console.log('✅ Estatísticas finais:', stats);

  return stats;
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

async function calcularVendasVendedorMes(vendedorId: string): Promise<number> {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  console.log(`📅 Calculando vendas do vendedor ${vendedorId} desde ${inicioMes.toISOString()}`);

  const { data, error } = await supabase
    .from('vendas')
    .select('valor, data_venda')
    .eq('vendedor_id', vendedorId)
    .gte('data_venda', inicioMes.toISOString());

  if (error) {
    console.error(`❌ Erro ao calcular vendas do vendedor ${vendedorId}:`, error);
    return 0;
  }

  if (!data || data.length === 0) {
    console.log(`⚠️ Nenhuma venda encontrada para vendedor ${vendedorId}`);
    return 0;
  }

  console.log(`✅ Vendas do vendedor ${vendedorId}:`, data);

  const total = data.reduce((acc, v) => acc + v.valor, 0);
  console.log(`💰 Total: R$ ${total}`);

  return total;
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

// ============================================
// DADOS DE PERFORMANCE
// ============================================

export async function buscarDadosPerformance(
  lojaId: string,
  periodo: 'semana' | 'mes'
): Promise<{ name: string; sales: number }[]> {
  const dataFim = new Date();
  const dataInicio = new Date();

  if (periodo === 'semana') {
    // Últimos 7 dias
    dataInicio.setDate(dataInicio.getDate() - 6);
  } else {
    // Últimos 30 dias
    dataInicio.setDate(dataInicio.getDate() - 29);
  }

  dataInicio.setHours(0, 0, 0, 0);
  dataFim.setHours(23, 59, 59, 999);

  const { data: vendas, error } = await supabase
    .from('vendas')
    .select('valor, data_venda')
    .eq('loja_id', lojaId)
    .gte('data_venda', dataInicio.toISOString())
    .lte('data_venda', dataFim.toISOString());

  if (error || !vendas) {
    console.error('Erro ao buscar dados de performance:', error);
    return [];
  }

  // Agrupar vendas por dia
  const vendasPorDia: { [key: string]: number } = {};

  if (periodo === 'semana') {
    // Últimos 7 dias
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    for (let i = 6; i >= 0; i--) {
      const dia = new Date();
      dia.setDate(dia.getDate() - i);
      dia.setHours(0, 0, 0, 0);
      const diaSemana = diasSemana[dia.getDay()];
      const chave = dia.toISOString().split('T')[0];
      vendasPorDia[chave] = 0;
    }
  } else {
    // Últimos 30 dias
    for (let i = 29; i >= 0; i--) {
      const dia = new Date();
      dia.setDate(dia.getDate() - i);
      dia.setHours(0, 0, 0, 0);
      const chave = dia.toISOString().split('T')[0];
      vendasPorDia[chave] = 0;
    }
  }

  // Somar vendas por dia
  vendas.forEach((venda) => {
    const dataVenda = new Date(venda.data_venda);
    const chave = dataVenda.toISOString().split('T')[0];
    if (vendasPorDia.hasOwnProperty(chave)) {
      vendasPorDia[chave] += venda.valor;
    }
  });

  // Converter para formato do gráfico
  if (periodo === 'semana') {
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return Object.keys(vendasPorDia)
      .sort()
      .map((chave) => {
        const data = new Date(chave + 'T00:00:00');
        const diaSemana = diasSemana[data.getDay()];
        return {
          name: diaSemana,
          sales: Math.round(vendasPorDia[chave])
        };
      });
  } else {
    // Para mês, mostrar apenas alguns dias (a cada 3 dias)
    const resultado = Object.keys(vendasPorDia)
      .sort()
      .map((chave, index) => {
        const data = new Date(chave + 'T00:00:00');
        const dia = data.getDate();
        return {
          name: `${dia}`,
          sales: Math.round(vendasPorDia[chave])
        };
      })
      .filter((_, index) => index % 3 === 0); // Mostrar a cada 3 dias

    return resultado;
  }
}
