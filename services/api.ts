import { supabase } from '../lib/supabase';
import { VendedorDB, VendaDB, UsuarioDB } from '../types/database';
import { Seller, Sale, StoreStats } from '../types';
import { formatarNomeProprio, normalizarEmail } from '../utils/formatters';

// ============================================
// FUNÇÃO AUXILIAR - GERAR AVATAR
// ============================================

function gerarAvatarUrl(nome: string): string {
  // Gerar avatar com primeira letra branca no fundo preto
  const primeiraLetra = nome.charAt(0).toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(primeiraLetra)}&background=000000&color=ffffff&size=200&bold=true&format=svg`;
}

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

  // Verificar se há meta ativa
  const metaAtiva = await buscarMetaAtiva(lojaId);

  let dataInicio = '';
  let dataFim = '';

  if (metaAtiva) {
    dataInicio = metaAtiva.data_inicio;
    dataFim = metaAtiva.data_fim;
    console.log(`🎯 Meta ativa encontrada!`);
  }

  // Calcular meta padrão (divisão igual entre todos)
  const metaPadrao = metaAtiva && data.length > 0
    ? metaAtiva.valor_total / data.length
    : 0;

  console.log(`📊 Meta da loja: R$ ${metaAtiva?.valor_total || 0}`);
  console.log(`📊 Total de vendedores: ${data.length}`);
  console.log(`📊 Meta padrão por vendedor: R$ ${metaPadrao}`);

  // Buscar vendas para cada vendedor
  const vendedoresComVendas = await Promise.all(
    data.map(async (vendedor: any) => {
      let vendasTotal = 0;

      // Se houver meta ativa, buscar vendas do período da meta
      // Senão, buscar vendas do mês atual
      if (metaAtiva) {
        vendasTotal = await calcularVendasVendedorNaMeta(vendedor.id, dataInicio, dataFim);
      } else {
        vendasTotal = await calcularVendasVendedorMes(vendedor.id);
      }

      const ultimaVenda = await buscarUltimaVenda(vendedor.id);

      // Todos usam a meta padrão (divisão igual)
      const metaVendedor = metaAtiva ? metaPadrao : 0;

      console.log(`💼 Vendedor ${vendedor.usuarios.nome}: R$ ${vendasTotal} vendido | Meta: R$ ${metaVendedor}`);

      return {
        id: vendedor.id,
        name: vendedor.usuarios.nome,
        avatar: vendedor.usuarios.avatar || `https://picsum.photos/100/100?random=${vendedor.id}`,
        currentSales: vendasTotal,
        target: metaVendedor,
        lastSaleTime: ultimaVenda?.data_venda
      };
    })
  );

  console.log('✅ Vendedores com vendas:', vendedoresComVendas);

  return vendedoresComVendas;
}

export async function cadastrarVendedor(dados: {
  lojaId: string;
  nome: string;
  email: string;
  senha: string;
}): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    console.log('📝 Iniciando cadastro de vendedor:', { email: dados.email, loja: dados.lojaId });

    // Formatar nome e email
    const nomeFormatado = formatarNomeProprio(dados.nome);
    const emailNormalizado = normalizarEmail(dados.email);

    // 1. Criar usuário na autenticação do Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: emailNormalizado,
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
        email: emailNormalizado,
        nome: nomeFormatado,
        papel: 'SELLER',
        avatar: gerarAvatarUrl(nomeFormatado),
        senha_hash: 'handled_by_supabase_auth'
      });

    if (usuarioError) {
      console.error('❌ Erro ao criar registro de usuário:', usuarioError);
      return { sucesso: false, mensagem: `Erro ao criar perfil: ${usuarioError.message}` };
    }

    console.log('✅ Registro de usuário criado');

    // 3. Criar vendedor (meta padrão será 0)
    console.log('💼 Criando vendedor...');
    const { error: vendedorError } = await supabase
      .from('vendedores')
      .insert({
        loja_id: dados.lojaId,
        usuario_id: authData.user.id,
        meta: 0
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
  // Verificar se há meta ativa para filtrar vendas
  const metaAtiva = await buscarMetaAtiva(lojaId);

  let query = supabase
    .from('vendas')
    .select('*')
    .eq('loja_id', lojaId);

  // Se houver meta ativa, filtrar vendas pelo período
  if (metaAtiva) {
    console.log(`🎯 Filtrando vendas pelo período da meta: ${metaAtiva.data_inicio} a ${metaAtiva.data_fim}`);
    query = query
      .gte('data_venda', metaAtiva.data_inicio)
      .lte('data_venda', metaAtiva.data_fim);
  }

  const { data, error } = await query
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
    itemsCount: 1, // Removido quantidade_itens do banco
    timestamp: venda.data_venda,
    sellerId: venda.vendedor_id,
    customerName: venda.nome_cliente || 'Cliente não informado',
    orderId: venda.numero_pedido,
    paymentMethod: venda.metodo_pagamento,
    paymentType: venda.tipo_pagamento,
    installments: venda.parcelas
  }));
}

/**
 * Busca TODAS as vendas da loja SEM filtrar por meta
 * Para uso no timeline de vendas recentes
 */
export async function buscarTodasVendas(lojaId: string, limite: number = 100): Promise<Sale[]> {
  console.log('📋 Buscando TODAS as vendas para loja:', lojaId);

  const { data, error } = await supabase
    .from('vendas')
    .select('*')
    .eq('loja_id', lojaId)
    .order('data_venda', { ascending: false })
    .limit(limite);

  if (error) {
    console.error('Erro ao buscar todas as vendas:', error);
    return [];
  }

  if (!data) return [];

  console.log(`✅ ${data.length} vendas encontradas (sem filtro de meta)`);

  return data.map((venda: VendaDB) => ({
    id: venda.id,
    amount: venda.valor,
    itemsCount: 1,
    timestamp: venda.data_venda,
    sellerId: venda.vendedor_id,
    customerName: venda.nome_cliente || 'Cliente não informado',
    orderId: venda.numero_pedido,
    paymentMethod: venda.metodo_pagamento,
    paymentType: venda.tipo_pagamento,
    installments: venda.parcelas
  }));
}

export async function criarVenda(venda: {
  lojaId: string;
  vendedorId: string;
  numeroPedido?: string;
  valor: number;
  nomeCliente?: string;
  metodoPagamento?: 'pix' | 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'boleto' | 'promissoria';
  tipoPagamento?: 'avista' | 'parcelado';
  parcelas?: number;
  dataVenda?: string;
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
      nome_cliente: nomeClienteFormatado,
      metodo_pagamento: venda.metodoPagamento,
      tipo_pagamento: venda.tipoPagamento,
      parcelas: venda.parcelas || 1,
      data_venda: venda.dataVenda || new Date().toISOString()
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

  // Verificar se há meta ativa
  const metaAtiva = await buscarMetaAtiva(lojaId);

  let dataInicio: string;
  let dataFim: string;
  let metaTotal: number;

  if (metaAtiva) {
    // Se houver meta ativa, usar datas e valor da meta
    dataInicio = metaAtiva.data_inicio;
    dataFim = metaAtiva.data_fim;
    metaTotal = metaAtiva.valor_total;
    console.log(`🎯 Meta ativa! Período: ${dataInicio} a ${dataFim}, Meta: R$ ${metaTotal}`);
  } else {
    // Senão, usar mês atual e soma das metas individuais
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const fimMes = new Date();
    fimMes.setMonth(fimMes.getMonth() + 1);
    fimMes.setDate(0);
    fimMes.setHours(23, 59, 59, 999);

    dataInicio = inicioMes.toISOString();
    dataFim = fimMes.toISOString();

    // Buscar meta total (soma das metas de todos vendedores)
    const { data: vendedores } = await supabase
      .from('vendedores')
      .select('meta')
      .eq('loja_id', lojaId);

    metaTotal = vendedores?.reduce((acc, v) => acc + v.meta, 0) || 50000;
    console.log('📅 Usando mês atual. Meta total:', metaTotal);
  }

  // Vendas do período
  const { data: vendasPeriodo, error: errorPeriodo } = await supabase
    .from('vendas')
    .select('valor, data_venda, loja_id, vendedor_id')
    .eq('loja_id', lojaId)
    .gte('data_venda', dataInicio)
    .lte('data_venda', dataFim);

  console.log('📈 Vendas do período:', vendasPeriodo);
  if (errorPeriodo) console.error('❌ Erro ao buscar vendas do período:', errorPeriodo);

  const totalVendasPeriodo = vendasPeriodo?.reduce((acc, v) => acc + v.valor, 0) || 0;
  console.log('💰 Total vendas período:', totalVendasPeriodo);

  // Vendas do dia (sempre usa dia atual independente da meta)
  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);

  const { data: vendasDia } = await supabase
    .from('vendas')
    .select('valor')
    .eq('loja_id', lojaId)
    .gte('data_venda', inicioDia.toISOString());

  const totalVendasDia = vendasDia?.reduce((acc, v) => acc + v.valor, 0) || 0;

  // Calcular meta diária baseada no período
  const diasPeriodo = Math.ceil((new Date(dataFim).getTime() - new Date(dataInicio).getTime()) / (1000 * 60 * 60 * 24));
  const metaDiaria = metaTotal / diasPeriodo;

  const stats = {
    totalSales: totalVendasPeriodo,
    monthlyTarget: metaTotal,
    dailyTarget: metaDiaria,
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
// DADOS DE PERFORMANCE - GRÁFICO ACUMULATIVO
// ============================================

export async function buscarDadosPerformance(
  lojaId: string,
  periodo: 'meta' | 'semana' | 'mes'
): Promise<{ name: string; sales: number }[]> {
  console.log('📊 [PERFORMANCE] Iniciando busca de dados para loja:', lojaId, 'período:', periodo);

  let dataInicio: string;
  let dataFim: string;
  let nomePeriodo: string;

  if (periodo === 'meta') {
    // Buscar meta ativa
    const metaAtiva = await buscarMetaAtiva(lojaId);

    if (metaAtiva) {
      dataInicio = metaAtiva.data_inicio.split('T')[0];
      dataFim = metaAtiva.data_fim.split('T')[0];
      nomePeriodo = 'Meta Ativa';
      console.log(`🎯 [PERFORMANCE] Meta ativa encontrada: ${dataInicio} a ${dataFim}`);
    } else {
      // Fallback: mês atual
      const hoje = new Date();
      const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      dataInicio = primeiroDia.toISOString().split('T')[0];
      dataFim = ultimoDia.toISOString().split('T')[0];
      nomePeriodo = 'Mês Atual (sem meta)';
      console.log(`⚠️ [PERFORMANCE] Nenhuma meta ativa. Usando mês atual: ${dataInicio} a ${dataFim}`);
    }
  } else if (periodo === 'semana') {
    // Semana atual (últimos 7 dias)
    const hoje = new Date();
    const seteDiasAtras = new Date(hoje);
    seteDiasAtras.setDate(hoje.getDate() - 6);
    dataInicio = seteDiasAtras.toISOString().split('T')[0];
    dataFim = hoje.toISOString().split('T')[0];
    nomePeriodo = 'Esta Semana';
    console.log(`📅 [PERFORMANCE] Esta Semana: ${dataInicio} a ${dataFim}`);
  } else {
    // Este Mês (do dia 1 até hoje ou último dia do mês)
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    dataInicio = primeiroDia.toISOString().split('T')[0];
    dataFim = ultimoDia.toISOString().split('T')[0];
    nomePeriodo = 'Este Mês';
    console.log(`📅 [PERFORMANCE] Este Mês: ${dataInicio} a ${dataFim}`);
  }

  // Buscar TODAS as vendas da loja no período
  const { data: vendas, error } = await supabase
    .from('vendas')
    .select('valor, data_venda, vendedor_id')
    .eq('loja_id', lojaId)
    .gte('data_venda', dataInicio + 'T00:00:00')
    .lte('data_venda', dataFim + 'T23:59:59')
    .order('data_venda', { ascending: true });

  if (error) {
    console.error('❌ [PERFORMANCE] Erro ao buscar vendas:', error);
    return [];
  }

  if (!vendas || vendas.length === 0) {
    console.warn('⚠️ [PERFORMANCE] Nenhuma venda encontrada no período');
    return [];
  }

  console.log(`✅ [PERFORMANCE] ${vendas.length} vendas encontradas no período`);

  // Criar mapa de vendas por dia (não acumulativo ainda)
  const vendasPorDia: { [key: string]: number } = {};

  // Calcular todos os dias do período
  const inicio = new Date(dataInicio + 'T00:00:00');
  const fim = new Date(dataFim + 'T00:00:00');
  const diasNoPeriodo = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Inicializar todos os dias com 0
  for (let i = 0; i < diasNoPeriodo; i++) {
    const dia = new Date(inicio);
    dia.setDate(inicio.getDate() + i);
    const chave = dia.toISOString().split('T')[0];
    vendasPorDia[chave] = 0;
  }

  // Somar vendas por dia
  vendas.forEach((venda) => {
    const chave = venda.data_venda.split('T')[0];
    if (vendasPorDia.hasOwnProperty(chave)) {
      vendasPorDia[chave] += venda.valor;
    }
  });

  // Ordenar as datas (mais antiga primeiro para mais recente)
  const datasOrdenadas = Object.keys(vendasPorDia).sort();

  // Gerar dados diários (não acumulativos)
  // Ordem cronológica: passado (esquerda) → presente (direita)
  const dadosDiarios: { name: string; sales: number }[] = [];

  datasOrdenadas.forEach((chave) => {
    const data = new Date(chave + 'T00:00:00');

    // Sempre mostrar o número do dia no eixo X
    const label = data.getDate().toString();

    dadosDiarios.push({
      name: label,
      sales: Math.round(vendasPorDia[chave])
    });
  });

  const totalGeral = datasOrdenadas.reduce((acc, chave) => acc + vendasPorDia[chave], 0);
  console.log(`📈 [PERFORMANCE] Gráfico diário gerado com ${dadosDiarios.length} pontos (cronológico: passado→presente)`);
  console.log(`💰 [PERFORMANCE] Total geral do período: R$ ${totalGeral.toFixed(2)}`);

  return dadosDiarios;
}

// ============================================
// METAS ATIVAS
// ============================================

/**
 * Busca a meta ativa da loja
 * Apenas uma meta pode estar ativa por vez
 */
export async function buscarMetaAtiva(lojaId: string) {
  console.log('🎯 Buscando meta ativa para loja:', lojaId);

  // Primeiro, buscar TODAS as metas para debug
  const { data: todasMetas } = await supabase
    .from('metas')
    .select('*')
    .eq('loja_id', lojaId);

  console.log('📋 TODAS as metas da loja:', todasMetas);

  const { data, error } = await supabase
    .from('metas')
    .select('*')
    .eq('loja_id', lojaId)
    .eq('status', 'ACTIVE')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Nenhuma meta ativa encontrada
      console.log('⚠️ Nenhuma meta ativa encontrada');
      return null;
    }
    console.error('❌ Erro ao buscar meta ativa:', error);
    return null;
  }

  console.log('✅ Meta ativa encontrada:', data);
  return data;
}

/**
 * Calcula total de vendas de um vendedor dentro do período da meta
 */
export async function calcularVendasVendedorNaMeta(
  vendedorId: string,
  dataInicio: string,
  dataFim: string
): Promise<number> {
  const { data, error } = await supabase
    .from('vendas')
    .select('valor')
    .eq('vendedor_id', vendedorId)
    .gte('data_venda', dataInicio)
    .lte('data_venda', dataFim);

  if (error) {
    console.error('❌ Erro ao calcular vendas do vendedor na meta:', error);
    return 0;
  }

  const total = data?.reduce((acc, venda) => acc + venda.valor, 0) || 0;
  console.log(`💰 Vendedor ${vendedorId} vendeu R$ ${total} no período da meta`);

  return total;
}

// ============================================
// EDITAR E DELETAR VENDEDOR
// ============================================

export async function atualizarVendedor(dados: {
  vendedorId: string;
  nome: string;
  meta: number;
}): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    console.log('✏️ Atualizando vendedor:', dados.vendedorId);

    // 1. Buscar o vendedor para pegar o usuario_id
    const { data: vendedor, error: vendedorError } = await supabase
      .from('vendedores')
      .select('usuario_id')
      .eq('id', dados.vendedorId)
      .single();

    if (vendedorError || !vendedor) {
      console.error('❌ Erro ao buscar vendedor:', vendedorError);
      return { sucesso: false, mensagem: 'Vendedor não encontrado' };
    }

    // 2. Atualizar nome na tabela usuarios
    const nomeFormatado = formatarNomeProprio(dados.nome);
    const { error: usuarioError } = await supabase
      .from('usuarios')
      .update({ nome: nomeFormatado })
      .eq('id', vendedor.usuario_id);

    if (usuarioError) {
      console.error('❌ Erro ao atualizar nome do usuário:', usuarioError);
      return { sucesso: false, mensagem: 'Erro ao atualizar nome' };
    }

    // 3. Atualizar meta na tabela vendedores
    const { error: metaError } = await supabase
      .from('vendedores')
      .update({ meta: dados.meta })
      .eq('id', dados.vendedorId);

    if (metaError) {
      console.error('❌ Erro ao atualizar meta:', metaError);
      return { sucesso: false, mensagem: 'Erro ao atualizar meta' };
    }

    console.log('✅ Vendedor atualizado com sucesso!');
    return { sucesso: true, mensagem: 'Vendedor atualizado com sucesso!' };
  } catch (error: any) {
    console.error('❌ Erro ao atualizar vendedor:', error);
    return { sucesso: false, mensagem: error.message || 'Erro desconhecido' };
  }
}

export async function deletarVendedor(vendedorId: string): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    console.log('🗑️ Deletando vendedor:', vendedorId);

    // 1. Buscar o vendedor para pegar o usuario_id
    const { data: vendedor, error: vendedorError } = await supabase
      .from('vendedores')
      .select('usuario_id')
      .eq('id', vendedorId)
      .single();

    if (vendedorError || !vendedor) {
      console.error('❌ Erro ao buscar vendedor:', vendedorError);
      return { sucesso: false, mensagem: 'Vendedor não encontrado' };
    }

    // 2. Deletar vendedor (ON DELETE CASCADE vai cuidar das vendas)
    const { error: deleteVendedorError } = await supabase
      .from('vendedores')
      .delete()
      .eq('id', vendedorId);

    if (deleteVendedorError) {
      console.error('❌ Erro ao deletar vendedor:', deleteVendedorError);
      return { sucesso: false, mensagem: 'Erro ao deletar vendedor' };
    }

    // 3. Deletar usuário da tabela usuarios
    const { error: deleteUsuarioError } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', vendedor.usuario_id);

    if (deleteUsuarioError) {
      console.error('❌ Erro ao deletar usuário:', deleteUsuarioError);
      return { sucesso: false, mensagem: 'Erro ao deletar usuário' };
    }

    // 4. Deletar da autenticação do Supabase (admin API - pode falhar se não tiver permissão)
    // Nota: Isso requer admin API key, que normalmente não está disponível no client
    // O ideal é fazer isso via função serverless/API backend

    console.log('✅ Vendedor deletado com sucesso!');
    return { sucesso: true, mensagem: 'Vendedor deletado com sucesso!' };
  } catch (error: any) {
    console.error('❌ Erro ao deletar vendedor:', error);
    return { sucesso: false, mensagem: error.message || 'Erro desconhecido' };
  }
}

// ============================================
// RANKING DE CLIENTES
// ============================================

export interface ClienteRanking {
  nome: string;
  totalGasto: number;
  quantidadeCompras: number;
}

/**
 * Busca o ranking de clientes por total gasto
 * Agrupa clientes pelo nome, soma as vendas e retorna os top 5
 */
export async function buscarRankingClientes(
  lojaId: string,
  limite: number = 5,
  dataInicio?: string,
  dataFim?: string
): Promise<ClienteRanking[]> {
  console.log('🏆 Buscando ranking de clientes para loja:', lojaId);

  // Se não houver datas especificadas, usar período da meta ativa ou mês atual
  let inicio = dataInicio;
  let fim = dataFim;

  if (!inicio || !fim) {
    const metaAtiva = await buscarMetaAtiva(lojaId);

    if (metaAtiva) {
      inicio = metaAtiva.data_inicio;
      fim = metaAtiva.data_fim;
      console.log(`🎯 Usando período da meta ativa: ${inicio} a ${fim}`);
    } else {
      // Usar mês atual
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const fimMes = new Date();
      fimMes.setMonth(fimMes.getMonth() + 1);
      fimMes.setDate(0);
      fimMes.setHours(23, 59, 59, 999);

      inicio = inicioMes.toISOString();
      fim = fimMes.toISOString();
      console.log(`📅 Usando mês atual: ${inicio} a ${fim}`);
    }
  }

  // Buscar todas as vendas do período
  const { data: vendas, error } = await supabase
    .from('vendas')
    .select('nome_cliente, valor')
    .eq('loja_id', lojaId)
    .gte('data_venda', inicio)
    .lte('data_venda', fim)
    .not('nome_cliente', 'is', null);

  if (error) {
    console.error('❌ Erro ao buscar vendas para ranking:', error);
    return [];
  }

  if (!vendas || vendas.length === 0) {
    console.log('⚠️ Nenhuma venda com cliente encontrada');
    return [];
  }

  console.log(`✅ ${vendas.length} vendas encontradas`);

  // Agrupar vendas por nome de cliente (case-insensitive e normalizado)
  const clientesMap = new Map<string, { totalGasto: number; quantidadeCompras: number }>();

  vendas.forEach((venda) => {
    const nomeNormalizado = venda.nome_cliente.toLowerCase().trim();

    if (clientesMap.has(nomeNormalizado)) {
      const cliente = clientesMap.get(nomeNormalizado)!;
      cliente.totalGasto += venda.valor;
      cliente.quantidadeCompras += 1;
    } else {
      clientesMap.set(nomeNormalizado, {
        totalGasto: venda.valor,
        quantidadeCompras: 1
      });
    }
  });

  // Converter para array e ordenar por total gasto
  const ranking: ClienteRanking[] = Array.from(clientesMap.entries())
    .map(([nome, dados]) => ({
      nome: nome.split(' ').map(palavra =>
        palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase()
      ).join(' '), // Capitalizar nome
      totalGasto: dados.totalGasto,
      quantidadeCompras: dados.quantidadeCompras
    }))
    .sort((a, b) => b.totalGasto - a.totalGasto)
    .slice(0, limite);

  console.log('🏆 Ranking de clientes:', ranking);

  return ranking;
}
