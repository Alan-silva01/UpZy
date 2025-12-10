# Edge Function: Verificar Status das Lojas

Esta Edge Function verifica e atualiza automaticamente o status de todas as lojas baseado na `data_renovacao`.

## Lógica de Status

A função implementa a seguinte lógica:

1. **ACTIVE → PAST_DUE**: Quando a `data_renovacao` passou e o status é ACTIVE
2. **PAST_DUE → INACTIVE**: Quando está vencido há mais de 7 dias
3. **PAST_DUE/INACTIVE → ACTIVE**: Quando a data de renovação ainda não passou e tem plano pago

## Como Fazer Deploy

```bash
# Deploy da função
supabase functions deploy verificar-status-lojas

# Testar localmente
supabase functions serve verificar-status-lojas
```

## Configurar Cron Job (Execução Automática)

Para executar automaticamente, você pode usar o [Supabase Cron](https://supabase.com/docs/guides/functions/schedule-functions) ou um serviço externo.

### Opção 1: Usando pg_cron (Recomendado)

Execute este SQL no Supabase SQL Editor:

```sql
-- Criar extensão pg_cron se não existir
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar para rodar todos os dias às 2h da manhã (horário UTC)
SELECT cron.schedule(
  'verificar-status-lojas-diario',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://seu-projeto.supabase.co/functions/v1/verificar-status-lojas',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer SEU_ANON_KEY"}'::jsonb
    ) as request_id;
  $$
);

-- Ver jobs agendados
SELECT * FROM cron.job;

-- Remover job (se necessário)
SELECT cron.unschedule('verificar-status-lojas-diario');
```

### Opção 2: Usando serviço externo (cron-job.org, etc)

Configure um HTTP Request para:
- **URL**: `https://seu-projeto.supabase.co/functions/v1/verificar-status-lojas`
- **Método**: POST
- **Headers**:
  - `Authorization: Bearer SEU_ANON_KEY`
  - `Content-Type: application/json`
- **Frequência**: Diariamente às 2h

## Execução Manual

Você pode chamar manualmente via:

```bash
curl -X POST \
  https://seu-projeto.supabase.co/functions/v1/verificar-status-lojas \
  -H "Authorization: Bearer SEU_ANON_KEY" \
  -H "Content-Type: application/json"
```

## Resposta Esperada

```json
{
  "message": "Verificação concluída",
  "total": 150,
  "atualizadas": 5,
  "lojasAtualizadas": ["uuid1", "uuid2", "uuid3", "uuid4", "uuid5"],
  "erros": []
}
```

## Integração no Frontend

A verificação também acontece automaticamente quando:
1. Usuário faz login (via `buscarLojaIdUsuario`)
2. Pode ser chamada manualmente com `verificarEAtualizarStatusLoja(lojaId)`

Portanto, mesmo sem cron job, o sistema atualiza quando os usuários fazem login.
