# ⚡ Guia Rápido - Execute Agora

## 🎯 Problema
Os dados de pagamento estão em `auth.users` mas a tabela `usuarios` está vazia.

## ✅ Solução em 2 Passos

### Passo 1: Adicionar Campos na Tabela Usuarios

Execute no **Supabase SQL Editor**:

```bash
scripts/adicionar_campos_plano_usuario.sql
```

Este script:
- ✅ Adiciona os campos necessários na tabela `usuarios`
- ✅ Cria trigger `usuarios` → `lojas`

### Passo 2: Sincronizar auth.users → usuarios

Execute no **Supabase SQL Editor**:

```bash
scripts/1_sincronizar_auth_users_para_usuarios.sql
```

Este script:
- ✅ Copia os dados de `auth.users.raw_user_meta_data` para `usuarios`
- ✅ Cria trigger `auth.users` → `usuarios`
- ✅ Sincroniza todos os usuários com suas lojas

## 🔍 Verificar se Funcionou

Após executar os 2 scripts, execute esta query:

```sql
SELECT
  u.email,
  u.plano_ativo,
  u.status,
  u.data_expiracao,
  l.nome as loja,
  l.plano as loja_plano,
  l.status as loja_status
FROM usuarios u
LEFT JOIN lojas l ON l.id = u.loja_id
WHERE u.email = 'shopmarcas@gmail.com';
```

**Resultado esperado:**
```
plano_ativo: semester
status: ativo
data_expiracao: 2026-06-08 14:47:53.612+00
loja_plano: PRO
loja_status: ACTIVE
```

## 🔄 Fluxo Automático Configurado

Depois de executar os scripts, tudo funciona automaticamente:

```
Webhook Asaas
    ↓
auth.users.raw_user_meta_data (atualização)
    ↓ (trigger automático)
usuarios (sincronização)
    ↓ (trigger automático)
lojas (atualização do plano)
```

## 🚨 Se der erro "relation user does not exist"

Significa que os dados estão em `auth.users` (correto).
Use o script `1_sincronizar_auth_users_para_usuarios.sql`

## 📝 Como o Webhook Deve Atualizar

Quando o Asaas confirmar o pagamento, seu webhook deve fazer:

```typescript
// No seu backend
const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
  userId,
  {
    user_metadata: {
      plano_ativo: 'semester',
      data_expiracao: '2026-06-08T14:47:53.612Z',
      status: 'ativo',
      asaas_customer_id: 'cus_000007287348',
      whatsapp: '(99) 99137-2552',
      cpf: '03788100060',
      billing_name: 'Joao da Silva Santos',
      // ... outros campos
    }
  }
);

// Os triggers SQL farão o resto automaticamente!
```

Ou direto no SQL:

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
  'plano_ativo', 'semester',
  'data_expiracao', '2026-06-08T14:47:53.612Z',
  'status', 'ativo',
  'asaas_customer_id', 'cus_000007287348'
)
WHERE email = 'shopmarcas@gmail.com';
```

## ✨ Pronto!

Após executar os 2 scripts:
1. ✅ Dados sincronizados
2. ✅ Triggers automáticos ativos
3. ✅ Login sincroniza planos
4. ✅ Sistema 100% funcional

## 🐛 Troubleshooting

### Dados não sincronizaram?

```sql
-- Ver dados em auth.users
SELECT
  email,
  raw_user_meta_data->>'plano_ativo' as plano,
  raw_user_meta_data->>'status' as status
FROM auth.users
WHERE email = 'shopmarcas@gmail.com';

-- Ver dados em usuarios
SELECT email, plano_ativo, status
FROM usuarios
WHERE email = 'shopmarcas@gmail.com';
```

### Forçar sincronização manual

```sql
-- Re-executar o passo 1 do script 1_sincronizar_auth_users_para_usuarios.sql
-- (a parte do UPDATE usuarios)
```
