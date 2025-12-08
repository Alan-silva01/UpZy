# Setup de Sincronização - Tabela User → Usuarios → Lojas

## Problema Identificado

Você tem **duas tabelas** com dados do usuário:
1. **Tabela `user`** - Contém os dados de pagamento (plano_ativo, data_expiracao, asaas_customer_id, etc.)
2. **Tabela `usuarios`** - Usada pelo sistema, mas estava com campos vazios

## Solução

Criar sincronização automática em cascata:
```
user → usuarios → lojas
```

## Passo a Passo

### 1. Execute os Scripts SQL no Supabase

Execute os scripts **NA ORDEM** no SQL Editor do Supabase:

#### Ordem de Execução:

**1º Script:** `adicionar_campos_plano_usuario.sql`
- Adiciona os campos necessários na tabela `usuarios`
- Cria o trigger de sincronização `usuarios` → `lojas`

**2º Script:** `sincronizar_tabela_user_customizada.sql`
- Copia os dados existentes de `user` → `usuarios`
- Cria o trigger de sincronização `user` → `usuarios`

### 2. Como Executar no Supabase

```bash
# 1. Acesse o Supabase Dashboard
# 2. Vá em "SQL Editor" no menu lateral
# 3. Clique em "New Query"
# 4. Cole o conteúdo do primeiro script
# 5. Clique em "Run" ou pressione Ctrl+Enter
# 6. Repita para o segundo script
```

### 3. Verificar a Sincronização

Após executar os scripts, verifique se funcionou:

```sql
-- Ver dados do usuário
SELECT
  u.id,
  u.email,
  u.nome,
  u.plano_ativo,
  u.data_expiracao,
  u.status,
  u.asaas_customer_id
FROM usuarios u
WHERE u.email = 'shopmarcas@gmail.com';

-- Ver dados da loja sincronizados
SELECT
  l.id,
  l.nome,
  l.plano,
  l.status,
  l.data_renovacao
FROM lojas l
JOIN usuarios u ON u.loja_id = l.id
WHERE u.email = 'shopmarcas@gmail.com';
```

**Resultado esperado:**
- `usuarios.plano_ativo` = 'semester'
- `usuarios.data_expiracao` = '2026-06-08 14:47:53.612+00'
- `usuarios.status` = 'ativo'
- `lojas.plano` = 'PRO' (semester → PRO)
- `lojas.status` = 'ACTIVE'
- `lojas.data_renovacao` = '2026-06-08 14:47:53.612+00'

## Fluxo de Sincronização

### Automático (via Triggers SQL)

```
┌─────────────────────────────────────────────────────────────┐
│                    WEBHOOK DO ASAAS                         │
│                  (Pagamento Confirmado)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Tabela "user"  │
              │  - plano_ativo  │
              │  - data_expir.  │
              │  - status       │
              └────────┬────────┘
                       │ Trigger 1
                       ▼
              ┌──────────────────┐
              │ Tabela "usuarios"│
              │  - plano_ativo   │
              │  - data_expir.   │
              │  - status        │
              └────────┬─────────┘
                       │ Trigger 2
                       ▼
              ┌──────────────────┐
              │  Tabela "lojas"  │
              │  - plano (PRO)   │
              │  - status        │
              │  - data_renov.   │
              └──────────────────┘
```

### Manual (via TypeScript - fallback)

```typescript
import { sincronizarPlanoUsuarioComLoja } from './services/auth';

// Forçar sincronização
await sincronizarPlanoUsuarioComLoja(userId);
```

## Webhook do Asaas

Configure o webhook para atualizar a tabela `user`:

```javascript
// Endpoint do webhook
app.post('/webhook/asaas', async (req, res) => {
  const { event, payment } = req.body;

  if (event === 'PAYMENT_CONFIRMED') {
    const { customer, billingType } = payment;

    // Calcular data de expiração
    const dataExpiracao = calcularDataExpiracao(billingType);

    // Atualizar tabela "user"
    await supabase
      .from('user')
      .update({
        plano_ativo: billingType, // 'monthly', 'semester', 'annual'
        data_expiracao: dataExpiracao,
        status: 'ativo',
        updated_at: new Date().toISOString()
      })
      .eq('asaas_customer_id', customer);

    // Os triggers SQL farão o resto automaticamente!
    // user → usuarios → lojas
  }

  res.json({ received: true });
});

function calcularDataExpiracao(billingType) {
  const hoje = new Date();

  switch (billingType) {
    case 'monthly':
      hoje.setMonth(hoje.getMonth() + 1);
      break;
    case 'semester':
      hoje.setMonth(hoje.getMonth() + 6);
      break;
    case 'annual':
      hoje.setFullYear(hoje.getFullYear() + 1);
      break;
  }

  return hoje.toISOString();
}
```

## Testando a Sincronização

### Teste 1: Atualizar manualmente

```sql
-- Simular atualização de pagamento
UPDATE "user"
SET
  plano_ativo = 'annual',
  data_expiracao = '2026-12-08 00:00:00+00',
  status = 'ativo'
WHERE email = 'shopmarcas@gmail.com';

-- Aguardar 1 segundo e verificar
SELECT * FROM usuarios WHERE email = 'shopmarcas@gmail.com';
-- Deve ter: plano_ativo='annual', status='ativo'

SELECT l.* FROM lojas l
JOIN usuarios u ON l.id = u.loja_id
WHERE u.email = 'shopmarcas@gmail.com';
-- Deve ter: plano='ENTERPRISE', status='ACTIVE'
```

### Teste 2: Expiração de plano

```sql
-- Simular plano expirado
UPDATE "user"
SET
  data_expiracao = '2024-01-01 00:00:00+00'
WHERE email = 'shopmarcas@gmail.com';

-- Verificar
SELECT l.status FROM lojas l
JOIN usuarios u ON l.id = u.loja_id
WHERE u.email = 'shopmarcas@gmail.com';
-- Deve retornar: status='PAST_DUE'
```

## Manutenção

### Ver todos os triggers criados

```sql
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('user', 'usuarios', 'lojas')
ORDER BY event_object_table, trigger_name;
```

### Desabilitar sincronização (se necessário)

```sql
-- Desabilitar trigger user → usuarios
DROP TRIGGER IF EXISTS trigger_sync_user_to_usuarios ON "user";

-- Desabilitar trigger usuarios → lojas
DROP TRIGGER IF EXISTS trigger_sincronizar_plano ON usuarios;
```

### Re-sincronizar todos os usuários

```sql
-- Forçar sincronização completa
UPDATE "user"
SET updated_at = NOW()
WHERE plano_ativo IS NOT NULL;
```

## Troubleshooting

### Problema: Dados não estão sincronizando

**Solução 1:** Verificar se os triggers foram criados
```sql
SELECT * FROM information_schema.triggers
WHERE event_object_table = 'user';
```

**Solução 2:** Verificar logs
```sql
-- Ver últimas atualizações
SELECT id, email, plano_ativo, status, updated_at
FROM usuarios
ORDER BY updated_at DESC
LIMIT 10;
```

**Solução 3:** Sincronizar manualmente
```sql
-- Executar script de sincronização novamente
-- (copie o conteúdo do passo 1 do script sincronizar_tabela_user_customizada.sql)
```

### Problema: Email não encontrado

Se o email da tabela `user` não corresponder ao email da tabela `usuarios`:

```sql
-- Ver emails diferentes
SELECT
  u.email as user_email,
  us.email as usuarios_email
FROM "user" u
FULL OUTER JOIN usuarios us ON u.email = us.email
WHERE u.email IS NULL OR us.email IS NULL;

-- Corrigir manualmente
UPDATE usuarios
SET email = 'email-correto@example.com'
WHERE id = 'usuario-id';
```

## Status Final

Após executar os scripts corretamente, você terá:

✅ Campos adicionados na tabela `usuarios`
✅ Dados copiados de `user` → `usuarios`
✅ Trigger `user` → `usuarios` ativo
✅ Trigger `usuarios` → `lojas` ativo
✅ Sincronização automática funcionando
✅ Login automático sincroniza planos

## Suporte

Se algo não funcionar:
1. Verifique se executou os scripts na ordem correta
2. Verifique se os triggers foram criados
3. Teste com o comando de verificação acima
4. Consulte a documentação em `INTEGRACAO_PLANOS.md`
