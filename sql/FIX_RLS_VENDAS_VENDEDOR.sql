-- ============================================
-- CORREÇÃO RLS TABELA VENDAS PARA VENDEDORES
-- Permitir que vendedores vejam vendas
-- ============================================

-- 1. Desabilitar RLS temporariamente
ALTER TABLE vendas DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas da tabela vendas
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'vendas' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON vendas', pol.policyname);
    END LOOP;
END $$;

-- 3. Habilitar RLS novamente
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas corretas (SEM subquery com filtro de papel)

-- SELECT: Usuários autenticados veem vendas da sua loja
CREATE POLICY "vendas_select_usuarios_loja"
  ON vendas
  FOR SELECT
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- INSERT: Usuários autenticados podem criar vendas na sua loja
CREATE POLICY "vendas_insert_usuarios_loja"
  ON vendas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- UPDATE: Usuários autenticados podem atualizar vendas
-- (código da aplicação controla se é admin ou vendedor)
CREATE POLICY "vendas_update_usuarios_loja"
  ON vendas
  FOR UPDATE
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- DELETE: Usuários autenticados podem deletar vendas
-- (código da aplicação controla se é admin ou vendedor)
CREATE POLICY "vendas_delete_usuarios_loja"
  ON vendas
  FOR DELETE
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- ============================================
-- PRONTO! RLS CORRIGIDO PARA VENDAS
-- ============================================

-- EXPLICAÇÃO:
-- Removemos o filtro "AND papel = 'ADMIN'" ou "AND papel = 'SELLER'"
-- das subqueries para evitar problemas com RLS recursivo.
--
-- O controle de permissões por papel (admin/vendedor) é feito
-- NO CÓDIGO DA APLICAÇÃO, não nas políticas RLS.
--
-- As políticas RLS garantem apenas que:
-- ✅ Cada loja só vê suas próprias vendas
-- ✅ Isolamento total entre lojas
--
-- O código da aplicação garante que:
-- ✅ Admin pode editar/deletar todas as vendas
-- ✅ Vendedor só pode editar/deletar suas próprias vendas
-- ============================================
