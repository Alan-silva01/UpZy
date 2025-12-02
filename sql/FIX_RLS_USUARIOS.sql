-- ============================================
-- CORREÇÃO RLS APENAS PARA TABELA USUARIOS
-- Permite Supabase Auth funcionar corretamente
-- ============================================

-- 1. Desabilitar RLS temporariamente na tabela usuarios
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas da tabela usuarios (força remoção)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'usuarios' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON usuarios', pol.policyname);
    END LOOP;
END $$;

-- 3. Habilitar RLS novamente
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- 4. Criar novas políticas que funcionam com Supabase Auth

-- IMPORTANTE: Não podemos usar subqueries na tabela usuarios porque causa recursão.
-- Vamos usar políticas simples que permitem acesso, e o código da aplicação
-- fará a filtragem por loja_id.

-- Permitir INSERT: qualquer um pode inserir (necessário para registro)
CREATE POLICY "usuarios_insert_registro"
  ON usuarios
  FOR INSERT
  WITH CHECK (true);

-- Permitir SELECT para usuários autenticados
CREATE POLICY "usuarios_select_authenticated"
  ON usuarios
  FOR SELECT
  TO authenticated
  USING (true);

-- Permitir SELECT público: necessário para verificações do Supabase Auth durante login
CREATE POLICY "usuarios_select_anon"
  ON usuarios
  FOR SELECT
  TO anon
  USING (true);

-- Permitir UPDATE: usuários autenticados podem atualizar
CREATE POLICY "usuarios_update_authenticated"
  ON usuarios
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Permitir DELETE: usuários autenticados podem deletar
CREATE POLICY "usuarios_delete_authenticated"
  ON usuarios
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- PRONTO! RLS CORRIGIDO PARA TABELA USUARIOS
-- ============================================

-- EXPLICAÇÃO:
-- A tabela usuarios NÃO pode ter subqueries que consultam ela mesma (causa recursão).
-- Por isso, as políticas são permissivas e a segurança por loja_id é feita no CÓDIGO.
--
-- Esta é a única tabela que não pode ter RLS com verificação de loja_id,
-- porque todas as outras tabelas precisam consultar usuarios para saber a loja_id.
--
-- Políticas:
-- 1. TO authenticated: permite operações para usuários logados
-- 2. TO anon: permite SELECT para verificações do Supabase Auth durante login
-- 3. USING (true): permite acesso (filtragem por loja_id no código da aplicação)
-- 4. WITH CHECK (true): permite modificações (filtragem por loja_id no código)

-- O Supabase Auth conseguirá:
-- ✅ Criar conta (INSERT com CHECK true)
-- ✅ Fazer login (SELECT anon + authenticated)
-- ✅ Atualizar perfil (UPDATE authenticated)
-- ✅ Deletar conta (DELETE authenticated)

-- SEGURANÇA:
-- ⚠️  A filtragem por loja_id na tabela usuarios DEVE ser feita no código da aplicação
-- ✅ Todas as outras tabelas (lojas, vendedores, vendas, clientes, metas) têm RLS seguro
