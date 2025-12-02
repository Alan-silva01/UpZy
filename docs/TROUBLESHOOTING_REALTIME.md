# Troubleshooting Real-time UpZy

## 🚨 Real-time não está funcionando

Se o Real-time não está atualizando as telas automaticamente, siga este guia passo a passo.

---

## ✅ Checklist Completo

### 1️⃣ Verificar se Real-time está habilitado no Supabase

**Execute este script SQL no Supabase SQL Editor:**

```sql
-- Ver quais tabelas têm Real-time habilitado
SELECT
    schemaname,
    tablename
FROM
    pg_publication_tables
WHERE
    pubname = 'supabase_realtime'
ORDER BY
    tablename;
```

**Resultado esperado:** Deve mostrar todas estas tabelas:
- ✅ clientes
- ✅ lojas
- ✅ metas
- ✅ usuarios
- ✅ vendas
- ✅ vendedores

**❌ Se alguma tabela estiver faltando:**
Execute o script [sql/HABILITAR_REALTIME.sql](../sql/HABILITAR_REALTIME.sql)

---

### 2️⃣ Verificar políticas RLS

**Execute este script SQL:**

```sql
-- Ver todas as políticas RLS
SELECT
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM
    pg_policies
WHERE
    schemaname = 'public'
ORDER BY
    tablename, policyname;
```

**Verificar:**
- ✅ Cada tabela deve ter políticas `*_select_*` para `authenticated`
- ✅ As políticas devem usar `USING (loja_id IN (SELECT loja_id FROM usuarios WHERE id = auth.uid()))`
- ✅ **NÃO** deve haver filtros por `papel` nas subqueries

**❌ Se as políticas estiverem erradas:**
Execute o script [sql/CONFIGURAR_RLS_FINAL.sql](../sql/CONFIGURAR_RLS_FINAL.sql)

---

### 3️⃣ Verificar logs no console do navegador

Abra o **Developer Tools** (F12) e vá em **Console**.

**Procure por estas mensagens:**

#### ✅ Conexão bem-sucedida:
```
🔴 [Realtime] Conectando à tabela: vendas (loja: abc-123, filter: nenhum)
✅ [Realtime] CONECTADO com sucesso à tabela vendas
```

#### ❌ Se aparecer "lojaId vazio":
```
⚠️ [Realtime] lojaId vazio para tabela vendas, não conectando
```
**Solução:** O componente está sendo renderizado antes de `lojaId` estar disponível. Verifique se `lojaId` está sendo passado corretamente.

#### ❌ Se aparecer CHANNEL_ERROR:
```
❌ [Realtime] ERRO na conexão vendas: ...
```
**Possíveis causas:**
1. Real-time não habilitado na tabela (ver passo 1)
2. RLS bloqueando acesso (ver passo 2)
3. Problemas de rede/conexão

---

### 4️⃣ Testar manualmente no console

Cole este código no console do navegador (F12):

```javascript
// Importar supabase (já deve estar disponível na página)
const testChannel = window.supabase
  .channel('test_realtime')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'vendas'
    },
    (payload) => {
      console.log('🧪 TESTE Real-time:', payload);
    }
  )
  .subscribe((status) => {
    console.log('🧪 Status:', status);
  });
```

**Depois:**
1. Vá em outra aba/janela
2. Crie uma venda no sistema
3. Volte para a aba com o console
4. **Você deve ver a mensagem `🧪 TESTE Real-time:`**

**❌ Se não aparecer nada:**
- Real-time não está habilitado (ver passo 1)
- RLS está bloqueando (ver passo 2)

---

### 5️⃣ Verificar filtros de loja_id

Quando uma mudança acontece, você deve ver:

```
📡 [Realtime] Mudança detectada em vendas: {...}
📡 [Realtime] Event Type: INSERT
📡 [Realtime] Payload.new: { id: '...', loja_id: 'abc-123', ... }
✅ [Realtime] Evento ACEITO! Disparando callback...
```

**❌ Se aparecer "Ignorando evento (loja diferente)":**
```
⏭️ [Realtime] Ignorando evento (loja diferente): xyz-789 vs abc-123
```
**Isso é NORMAL!** Significa que o filtro está funcionando corretamente. O evento é de outra loja.

---

### 6️⃣ Verificar callbacks definidos

Se você vir:
```
⚠️ [Realtime] INSERT detectado mas onInsert não definido
```

**Significa:** Você esqueceu de passar o callback `onInsert`.

**Solução:** Verifique o componente:
```typescript
useRealtimeSubscription({
  table: 'vendas',
  lojaId,
  onInsert: () => {  // ← Certifique-se que está definido
    carregarDados(true);
  },
  onUpdate: () => {  // ← E este também
    carregarDados(true);
  },
  onDelete: () => {  // ← E este
    carregarDados(true);
  }
});
```

---

## 🔧 Problemas Específicos

### Problema: "Vendedor não vê suas vendas em tempo real"

**Checklist:**
1. ✅ `lojaId` está sendo passado corretamente?
2. ✅ `user.sellerId` existe e é válido?
3. ✅ Filtro está correto: `filter: \`vendedor_id=eq.\${user.sellerId}\``?

**Logs esperados:**
```
🔴 [Realtime] Conectando à tabela: vendas (loja: abc-123, filter: vendedor_id=eq.seller-456)
✅ [Realtime] CONECTADO com sucesso à tabela vendas
```

**Quando criar venda:**
```
📡 [Realtime] Mudança detectada em vendas
🔍 [Realtime] Checando filtro adicional: vendedor_id=seller-456 vs seller-456
✅ [Realtime] Evento ACEITO! Disparando callback...
➕ [Realtime] INSERT em vendas
```

---

### Problema: "Admin não vê mudanças quando vendedor cria venda"

**Possível causa:** Admin e vendedor estão em lojas diferentes.

**Verificar:**
```sql
-- Ver loja do admin
SELECT id, nome, email, loja_id, papel FROM usuarios WHERE papel = 'ADMIN';

-- Ver loja do vendedor
SELECT u.id, u.nome, u.email, u.loja_id, u.papel, v.id as vendedor_id
FROM usuarios u
LEFT JOIN vendedores v ON v.id = u.vendedor_id
WHERE u.papel = 'SELLER';
```

**Devem ter o MESMO `loja_id`!**

---

### Problema: "DELETE não funciona"

**Verificar logs:**
```
📡 [Realtime] Event Type: DELETE
📡 [Realtime] Payload.old: { id: '...', loja_id: 'abc-123', ... }
✅ [Realtime] Evento ACEITO! Disparando callback...
🗑️ [Realtime] DELETE em vendas
```

**Se aparecer `Payload.old: {}`:**
- O registro foi deletado mas não tinha dados
- **Possível causa:** RLS bloqueou o acesso ao `payload.old`

**Solução:** Verifique as políticas RLS (passo 2)

---

## 📊 Status de Conexão

### Estados possíveis:

| Status | O que significa |
|--------|----------------|
| `SUBSCRIBED` | ✅ Conectado e funcionando |
| `CHANNEL_ERROR` | ❌ Erro na conexão (ver RLS e Real-time habilitado) |
| `TIMED_OUT` | ⏱️ Timeout (problemas de rede) |
| `CLOSED` | 🔴 Canal fechado (normal ao desmontar componente) |

---

## 🧪 Teste Completo

### Cenário 1: Admin cria vendedor

1. Abra duas abas:
   - Aba 1: Login como Admin
   - Aba 2: Tela de "Gerenciar Vendedores"
2. Na Aba 1: Crie um novo vendedor
3. **Resultado esperado:** Aba 2 atualiza automaticamente sem loader

**Logs esperados (Aba 2):**
```
📡 [Realtime] Mudança detectada em vendedores
➕ [Realtime] INSERT em vendedores
🔴 Novo vendedor detectado! Recarregando lista...
```

---

### Cenário 2: Vendedor faz venda

1. Abra três abas:
   - Aba 1: Login como Vendedor
   - Aba 2: Dashboard do Admin
   - Aba 3: Dashboard do mesmo Vendedor
2. Na Aba 1: Crie uma venda
3. **Resultado esperado:**
   - Aba 2 (Admin): Atualiza gráficos e vendedores
   - Aba 3 (Vendedor): Atualiza suas vendas e meta

---

### Cenário 3: DELETE

1. Abra duas abas como Admin
2. Aba 1: Tela de Vendedores
3. Aba 2: Mesma tela
4. Na Aba 1: Delete um vendedor
5. **Resultado esperado:** Aba 2 remove o vendedor da lista

**Logs esperados (Aba 2):**
```
📡 [Realtime] Event Type: DELETE
🗑️ [Realtime] DELETE em vendedores
🔴 Vendedor deletado! Recarregando lista...
```

---

## ⚡ Próximos Passos

Se seguiu todos os passos e ainda não funciona:

1. **Execute os scripts SQL na ordem:**
   1. [sql/CONFIGURAR_RLS_FINAL.sql](../sql/CONFIGURAR_RLS_FINAL.sql)
   2. [sql/HABILITAR_REALTIME.sql](../sql/HABILITAR_REALTIME.sql)

2. **Limpe o cache do navegador:**
   - Chrome/Edge: Ctrl+Shift+Delete
   - Firefox: Ctrl+Shift+Delete
   - Safari: Cmd+Option+E

3. **Recarregue a página completamente:**
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)

4. **Verifique a conexão com Supabase:**
   ```javascript
   console.log(window.supabase.auth.getSession());
   ```

5. **Entre em contato** com os logs do console para debug adicional.
