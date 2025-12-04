# Instruções: Atualizar Status da Loja no Supabase

## Problema
O banco de dados está com uma constraint que não permite o valor `INACTIVE` na coluna `status` da tabela `lojas`.

**Erro:**
```
ERRO: 23514: nova linha para a relação "lojas" viola a restrição de verificação "lojas_status_check"
```

## Solução

### Passo 1: Acessar o SQL Editor do Supabase

1. Acesse seu projeto no Supabase
2. No menu lateral, clique em **SQL Editor**
3. Clique em **New Query** (ou use uma query existente)

### Passo 2: Executar o Script de Migração

Copie e cole o seguinte SQL no editor:

```sql
-- Remover a constraint antiga
ALTER TABLE lojas DROP CONSTRAINT IF EXISTS lojas_status_check;

-- Adicionar nova constraint com INACTIVE incluído
ALTER TABLE lojas ADD CONSTRAINT lojas_status_check
  CHECK (status IN ('ACTIVE', 'INACTIVE', 'PAST_DUE'));
```

### Passo 3: Executar a Query

1. Clique no botão **Run** (ou pressione `Ctrl + Enter` / `Cmd + Enter`)
2. Você deve ver a mensagem: **Success. No rows returned**

### Passo 4: Verificar a Alteração

Execute esta query para confirmar:

```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'lojas_status_check';
```

**Resultado esperado:**
```
lojas_status_check | CHECK ((status = ANY (ARRAY['ACTIVE'::text, 'INACTIVE'::text, 'PAST_DUE'::text])))
```

### Passo 5: (Opcional) Atualizar Lojas Existentes

Se você quiser que todas as lojas existentes fiquem **ATIVAS** por padrão:

```sql
UPDATE lojas
SET status = 'ACTIVE'
WHERE status IS NULL OR status NOT IN ('ACTIVE', 'INACTIVE', 'PAST_DUE');
```

Ou se quiser que fiquem **INATIVAS**:

```sql
UPDATE lojas
SET status = 'INACTIVE'
WHERE status IS NULL OR status NOT IN ('ACTIVE', 'INACTIVE', 'PAST_DUE');
```

## Testar o Sistema

Após a migração, teste criando uma nova conta:

1. Faça logout da aplicação
2. Clique em **Criar Loja**
3. Preencha os dados e crie a conta
4. A loja deve ser criada com `status = 'INACTIVE'`
5. Você deve ver o banner de conta inativa no topo
6. Ao tentar cadastrar vendedor ou venda, deve aparecer o modal de bloqueio

## Ativar uma Loja Manualmente

### Opção 1: Via SQL (Supabase)

```sql
UPDATE lojas
SET status = 'ACTIVE'
WHERE id = 'ID_DA_LOJA_AQUI';
```

### Opção 2: Via Console do Navegador (Temporário para testes)

1. Abra o DevTools (F12)
2. Vá na aba **Console**
3. Execute:

```javascript
const { ativarLoja } = await import('./services/auth');
await ativarLoja('ID_DA_LOJA_AQUI');
location.reload();
```

### Opção 3: Criar Interface de Administração (Recomendado)

Você pode criar uma tela de admin para gerenciar o status das lojas. Exemplo:

```typescript
import { ativarLoja, desativarLoja } from './services/auth';

// No componente:
const handleAtivarLoja = async (lojaId: string) => {
  const resultado = await ativarLoja(lojaId);
  if (resultado.sucesso) {
    alert('Loja ativada com sucesso!');
    // Recarregar dados
  }
};

const handleDesativarLoja = async (lojaId: string) => {
  const resultado = await desativarLoja(lojaId);
  if (resultado.sucesso) {
    alert('Loja desativada com sucesso!');
    // Recarregar dados
  }
};
```

## Estrutura da Tabela Lojas

Após a migração, a tabela `lojas` deve ter:

| Coluna | Tipo | Valores Permitidos |
|--------|------|-------------------|
| id | uuid | - |
| nome | text | - |
| plano | text | 'FREE', 'PRO', 'ENTERPRISE' |
| **status** | **text** | **'ACTIVE', 'INACTIVE', 'PAST_DUE'** |
| data_renovacao | timestamp | - |
| avatar_url | text (opcional) | - |

## Valores dos Status

- **ACTIVE**: Loja ativa, pode usar todas as funcionalidades
- **INACTIVE**: Loja inativa, pode apenas visualizar (modo demonstração)
- **PAST_DUE**: Loja com pagamento atrasado (pode implementar lógica específica)

## Troubleshooting

### Erro: "permission denied for table lojas"
Execute a migration como usuário com permissões administrativas no Supabase.

### Constraint ainda não atualizada
1. Verifique se executou o SQL corretamente
2. Tente remover e recriar a constraint:
```sql
ALTER TABLE lojas DROP CONSTRAINT lojas_status_check CASCADE;
ALTER TABLE lojas ADD CONSTRAINT lojas_status_check
  CHECK (status IN ('ACTIVE', 'INACTIVE', 'PAST_DUE'));
```

### Lojas existentes não funcionam
Execute a query de atualização para definir um status válido para todas as lojas.

## Próximos Passos

1. ✅ Executar a migração no Supabase
2. ✅ Testar criação de nova conta
3. ✅ Verificar bloqueios funcionando
4. 📋 Criar interface para ativar/desativar lojas
5. 📋 Integrar com sistema de pagamento
6. 📋 Adicionar período de trial (opcional)
7. 📋 Configurar notificações por email
