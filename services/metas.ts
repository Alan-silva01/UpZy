import { supabase } from '../lib/supabase';

export interface Meta {
  id: string;
  loja_id: string;
  valor_total: number;
  data_inicio: string;
  data_fim: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
}

export interface MetaVendedor {
  metaId: string;
  valorMeta: number;
  valorAtual: number;
  percentual: number;
  dataInicio: string;
  dataFim: string;
}

// Buscar meta ativa para a loja
export async function buscarMetaAtiva(lojaId: string): Promise<Meta | null> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('metas')
      .select('*')
      .eq('loja_id', lojaId)
      .eq('status', 'ACTIVE')
      .lte('data_inicio', now)
      .gte('data_fim', now)
      .order('criado_em', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Erro ao buscar meta ativa:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar meta ativa:', error);
    return null;
  }
}

// Calcular meta individual do vendedor
export async function calcularMetaVendedor(
  lojaId: string,
  vendedorId?: string
): Promise<MetaVendedor | null> {
  try {
    // Buscar meta ativa
    const meta = await buscarMetaAtiva(lojaId);
    if (!meta) return null;

    // Buscar todos os vendedores ativos na loja com suas metas
    const { data: vendedores, error: vendedoresError } = await supabase
      .from('vendedores')
      .select('id, meta')
      .eq('loja_id', lojaId);

    if (vendedoresError || !vendedores || vendedores.length === 0) {
      console.error('Erro ao buscar vendedores:', vendedoresError);
      return null;
    }

    // Calcular meta individual (divisão igual para todos)
    const metaIndividual = meta.valor_total / vendedores.length;

    if (vendedorId) {
      // Buscar o vendedor específico
      const vendedor = vendedores.find(v => v.id === vendedorId);

      if (!vendedor) {
        console.error('Vendedor não encontrado');
        return null;
      }

      // Buscar vendas do vendedor no período
      let valorAtual = 0;
      const { data: vendas, error: vendasError } = await supabase
        .from('vendas')
        .select('valor')
        .eq('vendedor_id', vendedorId)
        .gte('data', meta.data_inicio)
        .lte('data', meta.data_fim);

      if (!vendasError && vendas) {
        valorAtual = vendas.reduce((acc, venda) => acc + venda.valor, 0);
      }

      const percentual = metaIndividual > 0 ? (valorAtual / metaIndividual) * 100 : 0;

      return {
        metaId: meta.id,
        valorMeta: metaIndividual,
        valorAtual,
        percentual,
        dataInicio: meta.data_inicio,
        dataFim: meta.data_fim
      };
    } else {
      // Se não tiver vendedorId, retornar meta média
      const metaMedia = meta.valor_total / vendedores.length;

      return {
        metaId: meta.id,
        valorMeta: metaMedia,
        valorAtual: 0,
        percentual: 0,
        dataInicio: meta.data_inicio,
        dataFim: meta.data_fim
      };
    }
  } catch (error) {
    console.error('Erro ao calcular meta do vendedor:', error);
    return null;
  }
}

// Buscar todas as metas da loja
export async function buscarMetasLoja(lojaId: string): Promise<Meta[]> {
  try {
    const { data, error } = await supabase
      .from('metas')
      .select('*')
      .eq('loja_id', lojaId)
      .order('criado_em', { ascending: false });

    if (error) {
      console.error('Erro ao buscar metas:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar metas:', error);
    return [];
  }
}

// Criar nova meta
export async function criarMeta(
  lojaId: string,
  valorTotal: number,
  dataInicio: Date,
  dataFim: Date,
  criadoPor: string
): Promise<{ sucesso: boolean; mensagem: string; meta?: Meta }> {
  try {
    // Validações
    if (valorTotal <= 0) {
      return { sucesso: false, mensagem: 'O valor deve ser maior que zero' };
    }

    if (dataFim <= dataInicio) {
      return { sucesso: false, mensagem: 'A data de fim deve ser posterior à data de início' };
    }

    const { data, error } = await supabase
      .from('metas')
      .insert({
        loja_id: lojaId,
        valor_total: valorTotal,
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim.toISOString(),
        status: 'ACTIVE',
        criado_por: criadoPor
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar meta:', error);
      return { sucesso: false, mensagem: 'Erro ao criar meta' };
    }

    return {
      sucesso: true,
      mensagem: 'Meta criada com sucesso!',
      meta: data
    };
  } catch (error) {
    console.error('Erro ao criar meta:', error);
    return { sucesso: false, mensagem: 'Erro inesperado ao criar meta' };
  }
}

// Excluir meta
export async function excluirMeta(metaId: string): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    const { error } = await supabase
      .from('metas')
      .delete()
      .eq('id', metaId);

    if (error) {
      console.error('Erro ao excluir meta:', error);
      return { sucesso: false, mensagem: 'Erro ao excluir meta' };
    }

    return { sucesso: true, mensagem: 'Meta excluída com sucesso!' };
  } catch (error) {
    console.error('Erro ao excluir meta:', error);
    return { sucesso: false, mensagem: 'Erro inesperado ao excluir meta' };
  }
}

// Atualizar status da meta
export async function atualizarStatusMeta(
  metaId: string,
  novoStatus: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    const { error } = await supabase
      .from('metas')
      .update({ status: novoStatus })
      .eq('id', metaId);

    if (error) {
      console.error('Erro ao atualizar status da meta:', error);
      return { sucesso: false, mensagem: 'Erro ao atualizar status' };
    }

    return { sucesso: true, mensagem: 'Status atualizado com sucesso!' };
  } catch (error) {
    console.error('Erro ao atualizar status da meta:', error);
    return { sucesso: false, mensagem: 'Erro inesperado' };
  }
}
