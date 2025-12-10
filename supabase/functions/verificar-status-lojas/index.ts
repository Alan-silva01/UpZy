// Edge Function para verificar e atualizar status de todas as lojas
// Deve ser executada periodicamente (via cron) para manter os status atualizados

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Loja {
  id: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PAST_DUE';
  data_renovacao: string | null;
  plano: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Buscar todas as lojas
    const { data: lojas, error: fetchError } = await supabaseClient
      .from('lojas')
      .select('id, status, data_renovacao, plano');

    if (fetchError) {
      throw new Error(`Erro ao buscar lojas: ${fetchError.message}`);
    }

    if (!lojas || lojas.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhuma loja encontrada', atualizadas: 0 }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const agora = new Date();
    const lojasAtualizadas: string[] = [];
    const erros: { lojaId: string; erro: string }[] = [];

    // Processar cada loja
    for (const loja of lojas as Loja[]) {
      try {
        // Se não tem data de renovação, pular
        if (!loja.data_renovacao) {
          continue;
        }

        const dataRenovacao = new Date(loja.data_renovacao);
        let novoStatus: 'ACTIVE' | 'INACTIVE' | 'PAST_DUE' = loja.status;
        let precisaAtualizar = false;

        // Verificar se a data de renovação já passou
        if (dataRenovacao < agora) {
          // Se está ACTIVE e passou da data, mudar para PAST_DUE
          if (loja.status === 'ACTIVE') {
            novoStatus = 'PAST_DUE';
            precisaAtualizar = true;
          }
          // Se está PAST_DUE há mais de 7 dias, mudar para INACTIVE
          else if (loja.status === 'PAST_DUE') {
            const diasVencido = Math.floor((agora.getTime() - dataRenovacao.getTime()) / (1000 * 60 * 60 * 24));
            if (diasVencido > 7) {
              novoStatus = 'INACTIVE';
              precisaAtualizar = true;
            }
          }
        }
        // IMPORTANTE: Apenas mudar PAST_DUE para ACTIVE se a data de renovação foi atualizada
        // NUNCA mudar de INACTIVE para ACTIVE automaticamente - isso só deve acontecer via pagamento
        else if (dataRenovacao >= agora && loja.status === 'PAST_DUE') {
          if (loja.plano && loja.plano !== 'FREE') {
            novoStatus = 'ACTIVE';
            precisaAtualizar = true;
          }
        }

        // Atualizar se necessário
        if (precisaAtualizar) {
          const { error: updateError } = await supabaseClient
            .from('lojas')
            .update({ status: novoStatus })
            .eq('id', loja.id);

          if (updateError) {
            erros.push({
              lojaId: loja.id,
              erro: updateError.message
            });
          } else {
            lojasAtualizadas.push(loja.id);
            console.log(`✅ Loja ${loja.id}: ${loja.status} → ${novoStatus}`);
          }
        }
      } catch (lojaError) {
        erros.push({
          lojaId: loja.id,
          erro: lojaError instanceof Error ? lojaError.message : 'Erro desconhecido'
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Verificação concluída',
        total: lojas.length,
        atualizadas: lojasAtualizadas.length,
        lojasAtualizadas,
        erros: erros.length > 0 ? erros : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro na verificação de status:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
