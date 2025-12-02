# 🔒 Configuração de Segurança (RLS) - Row Level Security

## 📋 O que é RLS?

**Row Level Security (RLS)** é um sistema de segurança do PostgreSQL/Supabase que controla quais linhas (rows) cada usuário pode ver e modificar no banco de dados.

**Sem RLS**: Qualquer usuário autenticado pode ver TODOS os dados de TODAS as lojas ❌
**Com RLS**: Cada loja vê apenas seus próprios dados ✅

---

## 🎯 Objetivos de Segurança

### ✅ O que queremos:
1. **Isolamento total**: Loja A não pode ver dados da Loja B
2. **Admin com poderes**: Admin pode fazer tudo na SUA loja
3. **Vendedor limitado**: Vendedor só edita/deleta suas próprias vendas
4. **Registro livre**: Novos usuários podem criar conta e loja
5. **Zero erros**: App funciona EXATAMENTE como funciona agora

### ❌ O que NÃO queremos:
- Quebrar funcionalidades existentes
- Recursão infinita (erro que aconteceu antes)
- Vendedor com acesso de admin
- Loja vendo dados de outra loja

---

## 📊 Matriz de Permissões

| Tabela     | ADMIN (Ver) | ADMIN (Criar) | ADMIN (Editar) | ADMIN (Deletar) | VENDEDOR (Ver) | VENDEDOR (Editar) | VENDEDOR (Deletar) |
|------------|-------------|---------------|----------------|-----------------|----------------|-------------------|--------------------|
| lojas      | ✅ Própria  | ✅ No registro | ✅ Própria     | ❌              | ✅ Própria     | ❌                | ❌                 |
| usuarios   | ✅ Da loja  | ✅ Da loja    | ✅ Da loja     | ✅ Da loja      | ✅ Da loja     | ✅ Próprio        | ❌                 |
| vendedores | ✅ Da loja  | ✅ Da loja    | ✅ Da loja     | ✅ Da loja      | ✅ Da loja     | ❌                | ❌                 |
| vendas     | ✅ Da loja  | ✅ Da loja    | ✅ Da loja     | ✅ Da loja      | ✅ Da loja     | ✅ Próprias       | ✅ Próprias        |
| clientes   | ✅ Da loja  | ✅ Da loja    | ✅ Da loja     | ✅ Da loja      | ✅ Da loja     | ✅ Da loja        | ❌                 |
| metas      | ✅ Da loja  | ✅ Da loja    | ✅ Da loja     | ✅ Da loja      | ✅ Da loja     | ❌                | ❌                 |

---

## 🚀 Como Aplicar

### Passo 1: Execute os SQLs na ordem

Execute os arquivos SQL **NESTA ORDEM** no Supabase SQL Editor:

```bash
1. sql/simplificar_meta_ativa.sql      # Sistema de metas ativas
2. sql/CONFIGURAR_RLS_SEGURO.sql       # Políticas de segurança (RLS)
```

### Passo 2: Verificar execução

Após executar, você deve ver:

```
✅ Success. No rows returned
```

Se aparecer algum erro, copie a mensagem e me envie.

---

## 🧪 Como Testar

### Teste 1: Isolamento entre lojas

1. **Login como Admin da Loja A**
2. Execute no SQL Editor:
   ```sql
   SELECT * FROM vendas;
   ```
3. **Resultado esperado**: Apenas vendas da Loja A
4. **Login como Admin da Loja B**
5. Execute o mesmo comando
6. **Resultado esperado**: Apenas vendas da Loja B

### Teste 2: Admin vs Vendedor

**Como ADMIN:**
```sql
-- Deve funcionar (deletar qualquer venda da loja)
DELETE FROM vendas WHERE id = 'algum-id-de-venda';
```

**Como VENDEDOR:**
```sql
-- Deve funcionar (deletar apenas SUA venda)
DELETE FROM vendas WHERE vendedor_id = 'seu-vendedor-id';

-- Deve FALHAR (não pode deletar venda de outro)
DELETE FROM vendas WHERE vendedor_id = 'outro-vendedor-id';
```

### Teste 3: Verificar função auxiliar

```sql
-- Deve retornar o ID da sua loja
SELECT get_user_loja_id();
```

### Teste 4: Usar o app normalmente

1. ✅ Login funciona
2. ✅ Dashboard carrega
3. ✅ Ranking de vendedores aparece
4. ✅ Criar venda funciona
5. ✅ Criar meta funciona
6. ✅ Ativar meta funciona
7. ✅ Gráficos aparecem

**Se TUDO funcionar = RLS configurado com sucesso! 🎉**

---

## 🔧 Solução de Problemas

### Erro: "new row violates row-level security policy"

**Causa**: Você está tentando inserir dados em uma loja que não é a sua.

**Solução**: Verifique se o `loja_id` está correto.

### Erro: "infinite recursion detected"

**Causa**: Política RLS está chamando ela mesma infinitamente.

**Solução**: Use a função `get_user_loja_id()` que criamos. Ela evita recursão.

### Erro: "permission denied for table..."

**Causa**: RLS está bloqueando operação que deveria ser permitida.

**Solução**:
1. Verifique se você está autenticado (`SELECT auth.uid()` deve retornar seu ID)
2. Verifique se seu usuário está na tabela `usuarios`
3. Verifique se o papel (ADMIN/SELLER) está correto

### App não carrega dados após aplicar RLS

**Possíveis causas:**

1. **Função `get_user_loja_id()` não foi criada**
   - Execute novamente o SQL `CONFIGURAR_RLS_SEGURO.sql`

2. **Usuário não está autenticado**
   - Faça logout e login novamente

3. **Registro na tabela `usuarios` está faltando**
   ```sql
   -- Verificar se você existe na tabela
   SELECT * FROM usuarios WHERE id = auth.uid();
   ```

---

## 📝 Arquitetura Técnica

### Função Auxiliar: `get_user_loja_id()`

```sql
CREATE OR REPLACE FUNCTION get_user_loja_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT loja_id FROM usuarios WHERE id = auth.uid();
$$;
```

**Por que usar esta função?**

❌ **SEM a função (causa recursão infinita):**
```sql
-- Política chama SELECT usuarios
-- SELECT usuarios chama política
-- Política chama SELECT usuarios
-- ... INFINITO
CREATE POLICY "exemplo"
  ON vendas FOR SELECT
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid()
    )
  );
```

✅ **COM a função (sem recursão):**
```sql
-- Função usa SECURITY DEFINER = executa com privilégios do criador
-- Ignora RLS durante execução
CREATE POLICY "exemplo"
  ON vendas FOR SELECT
  USING (
    loja_id IN (SELECT get_user_loja_id())
  );
```

### Como funciona `auth.uid()`?

- `auth.uid()` retorna o **ID do usuário autenticado** no Supabase Auth
- Esse ID é o mesmo usado na tabela `usuarios.id`
- Quando você faz `supabase.auth.signIn()`, o Supabase seta esse valor
- Todas as queries SQL executadas pelo usuário têm acesso a `auth.uid()`

---

## 🎓 Exemplos de Políticas

### Exemplo 1: Ver vendas da própria loja

```sql
CREATE POLICY "Ver vendas da loja"
  ON vendas
  FOR SELECT
  USING (
    loja_id IN (SELECT get_user_loja_id())
  );
```

**Tradução**: Você só pode ver vendas onde `loja_id` é igual ao `loja_id` do seu usuário.

### Exemplo 2: Vendedor edita apenas suas vendas

```sql
CREATE POLICY "Vendedor atualiza proprias vendas"
  ON vendas
  FOR UPDATE
  USING (
    loja_id IN (SELECT get_user_loja_id())
    AND vendedor_id IN (
      SELECT id FROM vendedores
      WHERE usuario_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND papel = 'SELLER'
    )
  );
```

**Tradução**: Você só pode editar vendas se:
1. A venda é da sua loja
2. O `vendedor_id` da venda é o SEU ID de vendedor
3. Seu papel é 'SELLER'

### Exemplo 3: Admin faz tudo na loja

```sql
CREATE POLICY "Admin atualiza vendas"
  ON vendas
  FOR UPDATE
  USING (
    loja_id IN (SELECT get_user_loja_id())
    AND EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND papel = 'ADMIN'
    )
  );
```

**Tradução**: Você pode editar QUALQUER venda da sua loja se for ADMIN.

---

## 🔍 Queries de Debug

### Verificar políticas ativas

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('lojas', 'usuarios', 'vendedores', 'vendas', 'clientes', 'metas')
ORDER BY tablename, policyname;
```

### Verificar RLS habilitado

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('lojas', 'usuarios', 'vendedores', 'vendas', 'clientes', 'metas');
```

### Ver seu contexto

```sql
-- Seu ID de usuário
SELECT auth.uid();

-- Seu registro na tabela usuarios
SELECT * FROM usuarios WHERE id = auth.uid();

-- Sua loja
SELECT * FROM lojas WHERE id IN (SELECT get_user_loja_id());

-- Seu papel
SELECT papel FROM usuarios WHERE id = auth.uid();
```

---

## ✅ Checklist Pós-Instalação

- [ ] Executei `sql/simplificar_meta_ativa.sql`
- [ ] Executei `sql/CONFIGURAR_RLS_SEGURO.sql`
- [ ] Função `get_user_loja_id()` existe
- [ ] RLS está habilitado em todas as tabelas
- [ ] Fiz logout e login novamente
- [ ] Dashboard carrega normalmente
- [ ] Posso criar vendas
- [ ] Posso criar metas
- [ ] Vendedor NÃO pode deletar vendas de outros
- [ ] Admin PODE deletar qualquer venda da loja
- [ ] Cada loja vê apenas seus dados

---

## 🆘 Suporte

Se algo não funcionar:

1. **Capture o erro exato** (copie a mensagem completa)
2. **Execute as queries de debug** (seção acima)
3. **Verifique o console do navegador** (F12 → Console)
4. **Me envie as informações** para análise

---

## 🎯 Resumo

**Antes (sem RLS):**
- ❌ Qualquer loja via dados de outras lojas
- ❌ Vendedor podia deletar vendas de outros
- ❌ Inseguro

**Depois (com RLS):**
- ✅ Isolamento total entre lojas
- ✅ Vendedor só edita suas vendas
- ✅ Admin tem controle total da loja
- ✅ Seguro e funcional

---

**🔒 Sua aplicação agora está protegida com segurança em nível de linha!**
