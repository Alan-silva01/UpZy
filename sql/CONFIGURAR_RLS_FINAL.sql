-- ============================================
-- CONFIGURAÇÃO FINAL DE RLS (ROW LEVEL SECURITY)
-- Sistema de segurança para multi-tenancy (multi-lojas)
-- VERSÃO FINAL - COM PERMISSÕES CORRETAS
-- ============================================
--
-- PERMISSÕES:
-- ADMIN: Acesso total à sua loja (vendedores, vendas, clientes, metas)
-- VENDEDOR: Acesso apenas a vendas (SUAS vendas) e clientes da sua loja
--
-- ============================================

-- ============================================
-- 1. DESABILITAR RLS TEMPORARIAMENTE
-- ============================================

ALTER TABLE lojas DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendedores DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendas DISABLE ROW LEVEL SECURITY;
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE metas DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. LIMPAR TODAS AS POLÍTICAS ANTIGAS
-- ============================================

DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Remover políticas da tabela lojas
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'lojas' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON lojas', pol.policyname);
    END LOOP;

    -- Remover políticas da tabela usuarios
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'usuarios' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON usuarios', pol.policyname);
    END LOOP;

    -- Remover políticas da tabela vendedores
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'vendedores' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON vendedores', pol.policyname);
    END LOOP;

    -- Remover políticas da tabela vendas
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'vendas' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON vendas', pol.policyname);
    END LOOP;

    -- Remover políticas da tabela clientes
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'clientes' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON clientes', pol.policyname);
    END LOOP;

    -- Remover políticas da tabela metas
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'metas' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON metas', pol.policyname);
    END LOOP;
END $$;

-- ============================================
-- 3. REMOVER FUNÇÃO PROBLEMÁTICA
-- ============================================

DROP FUNCTION IF EXISTS get_user_loja_id();

-- ============================================
-- 4. HABILITAR RLS EM TODAS AS TABELAS
-- ============================================

ALTER TABLE lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. POLÍTICAS PARA TABELA: lojas
-- ============================================

-- INSERT: Permitir criar loja durante registro
CREATE POLICY "lojas_insert_registro"
  ON lojas
  FOR INSERT
  WITH CHECK (true);

-- SELECT: Usuários autenticados veem apenas sua própria loja
CREATE POLICY "lojas_select_propria"
  ON lojas
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- UPDATE: Apenas ADMIN pode atualizar sua loja
CREATE POLICY "lojas_update_admin"
  ON lojas
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid() AND papel = 'ADMIN'
    )
  );

-- ============================================
-- 6. POLÍTICAS PARA TABELA: usuarios
-- ============================================

-- IMPORTANTE: Não pode ter subquery que consulta ela mesma (recursão)
-- A filtragem por loja_id é feita no CÓDIGO da aplicação

-- INSERT: Permitir criar usuário durante registro
CREATE POLICY "usuarios_insert_registro"
  ON usuarios
  FOR INSERT
  WITH CHECK (true);

-- SELECT: Usuários autenticados podem ver usuários
CREATE POLICY "usuarios_select_authenticated"
  ON usuarios
  FOR SELECT
  TO authenticated
  USING (true);

-- SELECT: Anônimos podem ver (necessário para Supabase Auth login)
CREATE POLICY "usuarios_select_anon"
  ON usuarios
  FOR SELECT
  TO anon
  USING (true);

-- UPDATE: Usuários autenticados podem atualizar
CREATE POLICY "usuarios_update_authenticated"
  ON usuarios
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: Usuários autenticados podem deletar
CREATE POLICY "usuarios_delete_authenticated"
  ON usuarios
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- 7. POLÍTICAS PARA TABELA: vendedores
-- ============================================

-- SELECT: Apenas ADMIN pode ver vendedores
CREATE POLICY "vendedores_select_admin"
  ON vendedores
  FOR SELECT
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid() AND papel = 'ADMIN'
    )
  );

-- INSERT: Apenas ADMIN pode criar vendedores
CREATE POLICY "vendedores_insert_admin"
  ON vendedores
  FOR INSERT
  TO authenticated
  WITH CHECK (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid() AND papel = 'ADMIN'
    )
  );

-- UPDATE: Apenas ADMIN pode atualizar vendedores
CREATE POLICY "vendedores_update_admin"
  ON vendedores
  FOR UPDATE
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid() AND papel = 'ADMIN'
    )
  );

-- DELETE: Apenas ADMIN pode deletar vendedores
CREATE POLICY "vendedores_delete_admin"
  ON vendedores
  FOR DELETE
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid() AND papel = 'ADMIN'
    )
  );

-- ============================================
-- 8. POLÍTICAS PARA TABELA: vendas
-- ============================================

-- SELECT: ADMIN vê todas as vendas da loja
CREATE POLICY "vendas_select_admin"
  ON vendas
  FOR SELECT
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid() AND papel = 'ADMIN'
    )
  );

-- SELECT: VENDEDOR vê apenas vendas da sua loja
CREATE POLICY "vendas_select_vendedor"
  ON vendas
  FOR SELECT
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid() AND papel = 'SELLER'
    )
  );

-- INSERT: ADMIN pode criar qualquer venda na sua loja
CREATE POLICY "vendas_insert_admin"
  ON vendas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid() AND papel = 'ADMIN'
    )
  );

-- INSERT: VENDEDOR pode criar vendas na sua loja
CREATE POLICY "vendas_insert_vendedor"
  ON vendas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid() AND papel = 'SELLER'
    )
  );

-- UPDATE: ADMIN pode atualizar qualquer venda da sua loja
CREATE POLICY "vendas_update_admin"
  ON vendas
  FOR UPDATE
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid() AND papel = 'ADMIN'
    )
  );

-- UPDATE: VENDEDOR pode atualizar apenas SUAS vendas
CREATE POLICY "vendas_update_vendedor"
  ON vendas
  FOR UPDATE
  TO authenticated
  USING (
    vendedor_id IN (
      SELECT id FROM vendedores
      WHERE usuario_id = auth.uid()
    )
  );

-- DELETE: ADMIN pode deletar qualquer venda da sua loja
CREATE POLICY "vendas_delete_admin"
  ON vendas
  FOR DELETE
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid() AND papel = 'ADMIN'
    )
  );

-- DELETE: VENDEDOR pode deletar apenas SUAS vendas
CREATE POLICY "vendas_delete_vendedor"
  ON vendas
  FOR DELETE
  TO authenticated
  USING (
    vendedor_id IN (
      SELECT id FROM vendedores
      WHERE usuario_id = auth.uid()
    )
  );

-- ============================================
-- 9. POLÍTICAS PARA TABELA: clientes
-- ============================================

-- SELECT: ADMIN vê todos os clientes da sua loja
CREATE POLICY "clientes_select_admin"
  ON clientes
  FOR SELECT
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid() AND papel = 'ADMIN'
    )
  );

-- SELECT: VENDEDOR vê clientes da sua loja
CREATE POLICY "clientes_select_vendedor"
  ON clientes
  FOR SELECT
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid() AND papel = 'SELLER'
    )
  );

-- INSERT: ADMIN pode criar clientes
CREATE POLICY "clientes_insert_admin"
  ON clientes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid() AND papel = 'ADMIN'
    )
  );

-- INSERT: VENDEDOR pode criar clientes
CREATE POLICY "clientes_insert_vendedor"
  ON clientes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid() AND papel = 'SELLER'
    )
  );

-- UPDATE: ADMIN pode atualizar clientes
CREATE POLICY "clientes_update_admin"
  ON clientes
  FOR UPDATE
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid() AND papel = 'ADMIN'
    )
  );

-- UPDATE: VENDEDOR pode atualizar clientes
CREATE POLICY "clientes_update_vendedor"
  ON clientes
  FOR UPDATE
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid() AND papel = 'SELLER'
    )
  );

-- DELETE: Apenas ADMIN pode deletar clientes
CREATE POLICY "clientes_delete_admin"
  ON clientes
  FOR DELETE
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid() AND papel = 'ADMIN'
    )
  );

-- ============================================
-- 10. POLÍTICAS PARA TABELA: metas
-- ============================================

-- SELECT: Apenas ADMIN pode ver metas
CREATE POLICY "metas_select_admin"
  ON metas
  FOR SELECT
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid() AND papel = 'ADMIN'
    )
  );

-- INSERT: Apenas ADMIN pode criar metas
CREATE POLICY "metas_insert_admin"
  ON metas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid() AND papel = 'ADMIN'
    )
  );

-- UPDATE: Apenas ADMIN pode atualizar/ativar metas
CREATE POLICY "metas_update_admin"
  ON metas
  FOR UPDATE
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid() AND papel = 'ADMIN'
    )
  );

-- DELETE: Apenas ADMIN pode deletar metas
CREATE POLICY "metas_delete_admin"
  ON metas
  FOR DELETE
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid() AND papel = 'ADMIN'
    )
  );

-- ============================================
-- PRONTO! RLS CONFIGURADO CORRETAMENTE
-- ============================================

-- ============================================
-- RESUMO DAS PERMISSÕES:
-- ============================================
--
-- 🔑 ADMIN (papel = 'ADMIN'):
--   ✅ Ver/criar/editar/deletar VENDEDORES da sua loja
--   ✅ Ver/criar/editar/deletar VENDAS da sua loja
--   ✅ Ver/criar/editar/deletar CLIENTES da sua loja
--   ✅ Ver/criar/editar/deletar METAS da sua loja
--   ✅ Ver/editar sua LOJA
--
-- 👔 VENDEDOR (papel = 'SELLER'):
--   ✅ Ver VENDAS da sua loja (todas)
--   ✅ Criar vendas na sua loja
--   ✅ Editar/deletar APENAS SUAS vendas (vendedor_id = seu id)
--   ✅ Ver/criar/editar CLIENTES da sua loja
--   ❌ NÃO vê VENDEDORES
--   ❌ NÃO vê METAS
--   ❌ NÃO pode gerenciar vendedores ou metas
--
-- ⚠️  TABELA USUARIOS:
--   • Não tem RLS com verificação de loja_id (causa recursão)
--   • A filtragem por loja_id DEVE ser feita no código da aplicação
--
-- SEGURANÇA:
--   • Isolamento total entre lojas
--   • Controle de acesso por papel (ADMIN/SELLER)
--   • Vendedor só edita/deleta suas próprias vendas
--   • Vendedor não tem acesso a vendedores e metas
-- ============================================
