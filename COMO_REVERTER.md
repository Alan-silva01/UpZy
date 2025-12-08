# Como Reverter a Sincronização Automática

## ✅ Alterações Já Revertidas no Código

As seguintes alterações no código TypeScript já foram revertidas:

### [services/auth.ts](services/auth.ts)
- ❌ Removida sincronização automática no `fazerLogin()` (linha ~165-167)
- ❌ Removida sincronização automática no `verificarSessao()` (linha ~215-218)

**As funções ainda existem mas não são mais chamadas automaticamente:**
- `sincronizarPlanoUsuarioComLoja()` - ainda disponível para uso manual
- `buscarPlanoUsuario()` - ainda disponível para uso manual
- `mapearPlanoUsuarioParaLoja()` - função auxiliar

## 🗄️ Para Reverter no Banco de Dados

Execute o script **[REVERTER_sincronizacao.sql](scripts/REVERTER_sincronizacao.sql)** no Supabase SQL Editor.

### O que o script faz:

#### 1. Remove Triggers
- `trigger_sync_auth_users_to_usuarios` - sincronização auth.users → usuarios
- `trigger_sync_user_to_usuarios` - sincronização user → usuarios
- `trigger_sincronizar_plano` - sincronização usuarios → lojas
- `trigger_atualizar_updated_at_usuarios` - atualização automática de updated_at
- `trigger_atualizar_updated_at_lojas` - atualização automática de updated_at

#### 2. Remove Funções
- `sincronizar_auth_user_para_usuarios()`
- `sincronizar_user_para_usuarios()`
- `sincronizar_plano_com_loja()`
- `atualizar_updated_at()`

#### 3. Remove Índices
- `idx_usuarios_plano_ativo`
- `idx_usuarios_data_expiracao`
- `idx_usuarios_status`
- `idx_usuarios_asaas_customer_id`

#### 4. Remove Constraints
- `check_plano_ativo`
- `check_status_usuario`

#### 5. Remove Comentários
- Limpa comentários de documentação dos campos

## ⚠️ Campos NÃO Removidos

O script **NÃO remove** os campos da tabela `usuarios`:
- `plano_ativo`
- `data_expiracao`
- `asaas_customer_id`
- `status`
- `whatsapp`, `cpf`, `billing_name`
- `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `estado`
- `updated_at`

### Para Remover os Campos (CUIDADO!)

Se você **REALMENTE** quer remover os campos e **APAGAR TODOS OS DADOS**, descomente a seção 3 do script:

```sql
ALTER TABLE usuarios
DROP COLUMN IF EXISTS plano_ativo,
DROP COLUMN IF EXISTS data_expiracao,
-- ... etc
```

**⚠️ ATENÇÃO:** Isso vai **APAGAR TODOS OS DADOS** desses campos permanentemente!

## 📊 Estado Atual

### O que continua funcionando:
✅ Card de configurações mostra plano e status corretamente
✅ Funções de busca de plano ainda disponíveis
✅ Campos na tabela `usuarios` mantidos (com dados preservados)

### O que foi desabilitado:
❌ Sincronização automática no login
❌ Sincronização automática via triggers SQL
❌ Atualização automática de planos

## 🔄 Gerenciamento Manual

Agora você precisa gerenciar manualmente:

### 1. Atualizar Plano Via SQL
```sql
-- Atualizar dados do usuário
UPDATE usuarios
SET
  plano_ativo = 'semester',
  data_expiracao = '2026-06-08T14:47:53.612Z',
  status = 'ativo'
WHERE email = 'usuario@example.com';

-- Atualizar loja manualmente
UPDATE lojas
SET
  plano = 'PRO',
  status = 'ACTIVE',
  data_renovacao = '2026-06-08T14:47:53.612Z'
WHERE id = (
  SELECT loja_id FROM usuarios WHERE email = 'usuario@example.com'
);
```

### 2. Ou Usar Função Manual (TypeScript)
```typescript
import { sincronizarPlanoUsuarioComLoja } from './services/auth';

// Chamar manualmente quando necessário
await sincronizarPlanoUsuarioComLoja(userId);
```

## 📝 Arquivos de Sincronização

Se quiser limpar os arquivos relacionados:

```bash
# Scripts SQL de sincronização (opcional apagar)
scripts/adicionar_campos_plano_usuario.sql
scripts/sincronizar_user_com_usuarios.sql
scripts/sincronizar_tabela_user_customizada.sql
scripts/1_sincronizar_auth_users_para_usuarios.sql
scripts/0_descobrir_tabela_user.sql

# Documentação (opcional apagar)
INTEGRACAO_PLANOS.md
SETUP_SINCRONIZACAO.md
EXECUTAR_AGORA.md
```

## ✅ Verificar Reversão

Após executar o script, verifique:

```sql
-- Ver triggers restantes
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- Ver funções restantes
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%sincroniza%';
```

Você **NÃO** deve ver triggers ou funções relacionadas a sincronização.

## 💡 Resumo

| Item | Status |
|------|--------|
| Código TypeScript | ✅ Revertido |
| Triggers SQL | ⏳ Executar script |
| Funções SQL | ⏳ Executar script |
| Campos da tabela | ✅ Mantidos |
| Dados preservados | ✅ Sim |
| Card de configurações | ✅ Funcionando |

Execute apenas o script SQL e está tudo revertido!
