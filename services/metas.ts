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
