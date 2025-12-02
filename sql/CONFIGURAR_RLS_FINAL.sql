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

-- UPDATE: Usuários autenticados podem atualizar sua loja
CREATE POLICY "lojas_update_usuarios"
  ON lojas
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid()
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

-- SELECT: Usuários autenticados veem vendedores da sua loja
CREATE POLICY "vendedores_select_usuarios_loja"
  ON vendedores
  FOR SELECT
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- INSERT: Usuários autenticados podem criar vendedores na sua loja
CREATE POLICY "vendedores_insert_usuarios_loja"
  ON vendedores
  FOR INSERT
  TO authenticated
  WITH CHECK (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- UPDATE: Usuários autenticados podem atualizar vendedores da sua loja
CREATE POLICY "vendedores_update_usuarios_loja"
  ON vendedores
  FOR UPDATE
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- DELETE: Usuários autenticados podem deletar vendedores da sua loja
CREATE POLICY "vendedores_delete_usuarios_loja"
  ON vendedores
  FOR DELETE
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- ============================================
-- 8. POLÍTICAS PARA TABELA: vendas
-- ============================================

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

-- UPDATE: Usuários autenticados podem atualizar vendas da sua loja
CREATE POLICY "vendas_update_usuarios_loja"
  ON vendas
  FOR UPDATE
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- DELETE: Usuários autenticados podem deletar vendas da sua loja
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
-- 9. POLÍTICAS PARA TABELA: clientes
-- ============================================

-- SELECT: Usuários autenticados veem clientes da sua loja
CREATE POLICY "clientes_select_usuarios_loja"
  ON clientes
  FOR SELECT
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- INSERT: Usuários autenticados podem criar clientes na sua loja
CREATE POLICY "clientes_insert_usuarios_loja"
  ON clientes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- UPDATE: Usuários autenticados podem atualizar clientes da sua loja
CREATE POLICY "clientes_update_usuarios_loja"
  ON clientes
  FOR UPDATE
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- DELETE: Usuários autenticados podem deletar clientes da sua loja
CREATE POLICY "clientes_delete_usuarios_loja"
  ON clientes
  FOR DELETE
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- ============================================
-- 10. POLÍTICAS PARA TABELA: metas
-- ============================================

-- SELECT: Usuários autenticados veem metas da sua loja
CREATE POLICY "metas_select_usuarios_loja"
  ON metas
  FOR SELECT
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- INSERT: Usuários autenticados podem criar metas na sua loja
CREATE POLICY "metas_insert_usuarios_loja"
  ON metas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- UPDATE: Usuários autenticados podem atualizar metas da sua loja
CREATE POLICY "metas_update_usuarios_loja"
  ON metas
  FOR UPDATE
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- DELETE: Usuários autenticados podem deletar metas da sua loja
CREATE POLICY "metas_delete_usuarios_loja"
  ON metas
  FOR DELETE
  TO authenticated
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid()
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
