-- ============================================
-- CONFIGURAÇÃO COMPLETA DE RLS (ROW LEVEL SECURITY)
-- Sistema de segurança para multi-tenancy (multi-lojas)
-- ============================================
--
-- REGRAS:
-- 1. ADMIN: Acesso total à sua loja (CRUD completo)
-- 2. VENDEDOR: Pode ver tudo da loja, mas editar/excluir apenas suas próprias vendas
-- 3. ISOLAMENTO: Cada loja vê apenas seus próprios dados
-- 4. REGISTRO: Permitir criação de nova loja durante cadastro
--
-- ============================================

-- ============================================
-- 1. LIMPAR POLÍTICAS ANTIGAS
-- ============================================

-- Lojas
DROP POLICY IF EXISTS "Permitir criar lojas durante registro" ON lojas;
DROP POLICY IF EXISTS "Ver apenas própria loja" ON lojas;
DROP POLICY IF EXISTS "Atualizar apenas própria loja" ON lojas;
DROP POLICY IF EXISTS "Admin atualiza propria loja" ON lojas;
DROP POLICY IF EXISTS "Usuarios veem propria loja" ON lojas;
DROP POLICY IF EXISTS "Criar loja durante registro" ON lojas;

-- Usuários
DROP POLICY IF EXISTS "Permitir criar usuarios durante registro" ON usuarios;
DROP POLICY IF EXISTS "Ver usuarios da mesma loja" ON usuarios;
DROP POLICY IF EXISTS "Atualizar apenas proprio perfil" ON usuarios;
DROP POLICY IF EXISTS "Admin gerencia usuarios" ON usuarios;
DROP POLICY IF EXISTS "Ver usuarios da loja" ON usuarios;
DROP POLICY IF EXISTS "Criar usuario durante registro" ON usuarios;

-- Vendedores
DROP POLICY IF EXISTS "Admin pode criar vendedores" ON vendedores;
DROP POLICY IF EXISTS "Ver vendedores da mesma loja" ON vendedores;
DROP POLICY IF EXISTS "Admin pode atualizar vendedores" ON vendedores;
DROP POLICY IF EXISTS "Admin pode deletar vendedores" ON vendedores;
DROP POLICY IF EXISTS "Admin gerencia vendedores" ON vendedores;
DROP POLICY IF EXISTS "Usuarios veem vendedores da loja" ON vendedores;

-- Vendas
DROP POLICY IF EXISTS "Permitir criar vendas" ON vendas;
DROP POLICY IF EXISTS "Ver vendas da mesma loja" ON vendas;
DROP POLICY IF EXISTS "Admin pode atualizar vendas" ON vendas;
DROP POLICY IF EXISTS "Admin pode deletar vendas" ON vendas;
DROP POLICY IF EXISTS "Vendedor atualiza proprias vendas" ON vendas;
DROP POLICY IF EXISTS "Vendedor deleta proprias vendas" ON vendas;
DROP POLICY IF EXISTS "Criar vendas na loja" ON vendas;
DROP POLICY IF EXISTS "Ver vendas da loja" ON vendas;
DROP POLICY IF EXISTS "Admin atualiza vendas" ON vendas;
DROP POLICY IF EXISTS "Admin deleta vendas" ON vendas;

-- Clientes
DROP POLICY IF EXISTS "Permitir criar clientes" ON clientes;
DROP POLICY IF EXISTS "Ver clientes da mesma loja" ON clientes;
DROP POLICY IF EXISTS "Atualizar clientes da mesma loja" ON clientes;
DROP POLICY IF EXISTS "Admin pode deletar clientes" ON clientes;
DROP POLICY IF EXISTS "Criar clientes na loja" ON clientes;
DROP POLICY IF EXISTS "Ver clientes da loja" ON clientes;
DROP POLICY IF EXISTS "Atualizar clientes da loja" ON clientes;
DROP POLICY IF EXISTS "Admin deleta clientes" ON clientes;

-- Metas
DROP POLICY IF EXISTS "Usuarios veem metas da propria loja" ON metas;
DROP POLICY IF EXISTS "Admins gerenciam metas" ON metas;
DROP POLICY IF EXISTS "Ver metas da loja" ON metas;
DROP POLICY IF EXISTS "Admin gerencia metas" ON metas;

-- ============================================
-- 2. HABILITAR RLS EM TODAS AS TABELAS
-- ============================================

ALTER TABLE lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CRIAR FUNÇÃO AUXILIAR - BUSCAR LOJA DO USUÁRIO
-- ============================================
-- Esta função evita recursão infinita nas políticas
-- Usa SECURITY DEFINER para executar com privilégios do criador

CREATE OR REPLACE FUNCTION get_user_loja_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT loja_id FROM usuarios WHERE id = auth.uid();
$$;

-- ============================================
-- 4. POLÍTICAS PARA TABELA: lojas
-- ============================================

-- Permitir SELECT da própria loja
CREATE POLICY "Ver propria loja"
  ON lojas
  FOR SELECT
  USING (
    id IN (SELECT get_user_loja_id())
  );

-- Permitir INSERT durante registro (usuário ainda não existe na tabela usuarios)
CREATE POLICY "Criar loja durante registro"
  ON lojas
  FOR INSERT
  WITH CHECK (true);

-- Admin pode atualizar a própria loja
CREATE POLICY "Admin atualiza propria loja"
  ON lojas
  FOR UPDATE
  USING (
    id IN (SELECT get_user_loja_id())
    AND EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND papel = 'ADMIN'
    )
  );

-- ============================================
-- 5. POLÍTICAS PARA TABELA: usuarios
-- ============================================

-- Ver usuários da mesma loja
CREATE POLICY "Ver usuarios da loja"
  ON usuarios
  FOR SELECT
  USING (
    loja_id IN (SELECT get_user_loja_id())
  );

-- Permitir INSERT durante registro
CREATE POLICY "Criar usuario durante registro"
  ON usuarios
  FOR INSERT
  WITH CHECK (
    id = auth.uid()  -- Só pode criar registro para si mesmo
  );

-- Admin pode criar novos usuários (vendedores) na sua loja
CREATE POLICY "Admin cria usuarios"
  ON usuarios
  FOR INSERT
  WITH CHECK (
    loja_id IN (SELECT get_user_loja_id())
    AND EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND papel = 'ADMIN'
    )
  );

-- Atualizar apenas próprio perfil OU admin atualiza qualquer usuário da loja
CREATE POLICY "Atualizar perfil"
  ON usuarios
  FOR UPDATE
  USING (
    -- Próprio usuário
    id = auth.uid()
    OR
    -- Ou é admin da mesma loja
    (
      loja_id IN (SELECT get_user_loja_id())
      AND EXISTS (
        SELECT 1 FROM usuarios
        WHERE id = auth.uid()
        AND papel = 'ADMIN'
      )
    )
  );

-- Admin pode deletar usuários da loja
CREATE POLICY "Admin deleta usuarios"
  ON usuarios
  FOR DELETE
  USING (
    loja_id IN (SELECT get_user_loja_id())
    AND EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND papel = 'ADMIN'
    )
  );

-- ============================================
-- 6. POLÍTICAS PARA TABELA: vendedores
-- ============================================

-- Ver vendedores da mesma loja
CREATE POLICY "Ver vendedores da loja"
  ON vendedores
  FOR SELECT
  USING (
    loja_id IN (SELECT get_user_loja_id())
  );

-- Admin pode criar vendedores
CREATE POLICY "Admin cria vendedores"
  ON vendedores
  FOR INSERT
  WITH CHECK (
    loja_id IN (SELECT get_user_loja_id())
    AND EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND papel = 'ADMIN'
    )
  );

-- Admin pode atualizar vendedores
CREATE POLICY "Admin atualiza vendedores"
  ON vendedores
  FOR UPDATE
  USING (
    loja_id IN (SELECT get_user_loja_id())
    AND EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND papel = 'ADMIN'
    )
  );

-- Admin pode deletar vendedores
CREATE POLICY "Admin deleta vendedores"
  ON vendedores
  FOR DELETE
  USING (
    loja_id IN (SELECT get_user_loja_id())
    AND EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND papel = 'ADMIN'
    )
  );

-- ============================================
-- 7. POLÍTICAS PARA TABELA: vendas
-- ============================================

-- Ver vendas da mesma loja (admin e vendedor)
CREATE POLICY "Ver vendas da loja"
  ON vendas
  FOR SELECT
  USING (
    loja_id IN (SELECT get_user_loja_id())
  );

-- Criar vendas na própria loja (admin e vendedor)
CREATE POLICY "Criar vendas na loja"
  ON vendas
  FOR INSERT
  WITH CHECK (
    loja_id IN (SELECT get_user_loja_id())
  );

-- Admin atualiza TODAS as vendas da loja
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

-- Vendedor atualiza APENAS suas próprias vendas
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

-- Admin deleta TODAS as vendas da loja
CREATE POLICY "Admin deleta vendas"
  ON vendas
  FOR DELETE
  USING (
    loja_id IN (SELECT get_user_loja_id())
    AND EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND papel = 'ADMIN'
    )
  );

-- Vendedor deleta APENAS suas próprias vendas
CREATE POLICY "Vendedor deleta proprias vendas"
  ON vendas
  FOR DELETE
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

-- ============================================
-- 8. POLÍTICAS PARA TABELA: clientes
-- ============================================

-- Ver clientes da mesma loja
CREATE POLICY "Ver clientes da loja"
  ON clientes
  FOR SELECT
  USING (
    loja_id IN (SELECT get_user_loja_id())
  );

-- Criar clientes na própria loja (admin e vendedor)
CREATE POLICY "Criar clientes na loja"
  ON clientes
  FOR INSERT
  WITH CHECK (
    loja_id IN (SELECT get_user_loja_id())
  );

-- Atualizar clientes da própria loja (admin e vendedor)
CREATE POLICY "Atualizar clientes da loja"
  ON clientes
  FOR UPDATE
  USING (
    loja_id IN (SELECT get_user_loja_id())
  );

-- Admin pode deletar clientes
CREATE POLICY "Admin deleta clientes"
  ON clientes
  FOR DELETE
  USING (
    loja_id IN (SELECT get_user_loja_id())
    AND EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND papel = 'ADMIN'
    )
  );

-- ============================================
-- 9. POLÍTICAS PARA TABELA: metas
-- ============================================

-- Ver metas da própria loja
CREATE POLICY "Ver metas da loja"
  ON metas
  FOR SELECT
  USING (
    loja_id IN (SELECT get_user_loja_id())
  );

-- Admin pode criar metas
CREATE POLICY "Admin cria metas"
  ON metas
  FOR INSERT
  WITH CHECK (
    loja_id IN (SELECT get_user_loja_id())
    AND EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND papel = 'ADMIN'
    )
  );

-- Admin pode atualizar metas
CREATE POLICY "Admin atualiza metas"
  ON metas
  FOR UPDATE
  USING (
    loja_id IN (SELECT get_user_loja_id())
    AND EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND papel = 'ADMIN'
    )
  );

-- Admin pode deletar metas
CREATE POLICY "Admin deleta metas"
  ON metas
  FOR DELETE
  USING (
    loja_id IN (SELECT get_user_loja_id())
    AND EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND papel = 'ADMIN'
    )
  );

-- ============================================
-- 10. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================

COMMENT ON FUNCTION get_user_loja_id() IS 'Retorna o loja_id do usuário autenticado. Usa SECURITY DEFINER para evitar recursão infinita nas políticas RLS.';

-- ============================================
-- PRONTO! RLS configurado com segurança
-- ============================================

-- Para testar, faça login e execute:
-- SELECT * FROM lojas;           -- Deve mostrar apenas sua loja
-- SELECT * FROM usuarios;        -- Deve mostrar apenas usuários da sua loja
-- SELECT * FROM vendedores;      -- Deve mostrar apenas vendedores da sua loja
-- SELECT * FROM vendas;          -- Deve mostrar apenas vendas da sua loja
-- SELECT * FROM clientes;        -- Deve mostrar apenas clientes da sua loja
-- SELECT * FROM metas;           -- Deve mostrar apenas metas da sua loja

-- ============================================
-- RESUMO DAS PERMISSÕES:
-- ============================================
--
-- ADMIN:
-- ✅ Ver tudo da própria loja
-- ✅ Criar/editar/deletar: vendedores, vendas, clientes, metas
-- ✅ Editar informações da loja
-- ✅ Criar novos usuários (vendedores)
--
-- VENDEDOR (SELLER):
-- ✅ Ver tudo da própria loja
-- ✅ Criar: vendas, clientes
-- ✅ Editar/deletar: APENAS suas próprias vendas
-- ✅ Editar seu próprio perfil
-- ❌ NÃO pode: gerenciar vendedores, metas, deletar clientes
--
-- ISOLAMENTO:
-- ✅ Cada loja vê apenas seus próprios dados
-- ✅ Impossível acessar dados de outras lojas
-- ✅ Registro de novas lojas permitido
-- ============================================
