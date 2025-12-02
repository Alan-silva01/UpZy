-- ============================================
-- HABILITAR REALTIME EM TODAS AS TABELAS
-- ============================================
--
-- IMPORTANTE: Execute este script no SQL Editor do Supabase
-- para habilitar Real-time em todas as tabelas do UpZy
--
-- ============================================

-- Habilitar publicação (replication) para Real-time
-- Isso permite que o Supabase transmita mudanças nas tabelas

-- OPÇÃO 1: Se as tabelas JÁ ESTÃO na publicação, use SET:
ALTER PUBLICATION supabase_realtime SET TABLE vendas, vendedores, metas, clientes, lojas, usuarios;

-- OPÇÃO 2: Se der erro "relation already member", use este bloco:
-- DO $$
-- BEGIN
--     -- Tentar adicionar cada tabela, ignorando erro se já existe
--     BEGIN
--         ALTER PUBLICATION supabase_realtime ADD TABLE vendas;
--     EXCEPTION WHEN duplicate_object THEN
--         RAISE NOTICE 'vendas já está na publicação';
--     END;

--     BEGIN
--         ALTER PUBLICATION supabase_realtime ADD TABLE vendedores;
--     EXCEPTION WHEN duplicate_object THEN
--         RAISE NOTICE 'vendedores já está na publicação';
--     END;

--     BEGIN
--         ALTER PUBLICATION supabase_realtime ADD TABLE metas;
--     EXCEPTION WHEN duplicate_object THEN
--         RAISE NOTICE 'metas já está na publicação';
--     END;

--     BEGIN
--         ALTER PUBLICATION supabase_realtime ADD TABLE clientes;
--     EXCEPTION WHEN duplicate_object THEN
--         RAISE NOTICE 'clientes já está na publicação';
--     END;

--     BEGIN
--         ALTER PUBLICATION supabase_realtime ADD TABLE lojas;
--     EXCEPTION WHEN duplicate_object THEN
--         RAISE NOTICE 'lojas já está na publicação';
--     END;

--     BEGIN
--         ALTER PUBLICATION supabase_realtime ADD TABLE usuarios;
--     EXCEPTION WHEN duplicate_object THEN
--         RAISE NOTICE 'usuarios já está na publicação';
--     END;
-- END $$;

-- ============================================
-- PRONTO! REAL-TIME HABILITADO
-- ============================================

-- VERIFICAR SE FUNCIONOU:
-- Execute esta query para ver quais tabelas têm Real-time habilitado:
SELECT
    schemaname,
    tablename
FROM
    pg_publication_tables
WHERE
    pubname = 'supabase_realtime'
ORDER BY
    tablename;

-- ============================================
-- IMPORTANTE: RLS e Real-time
-- ============================================
--
-- O Real-time RESPEITA as políticas RLS!
--
-- Isso significa:
-- ✅ Usuários só recebem eventos de registros que eles podem VER (SELECT)
-- ✅ Se RLS bloqueia SELECT, Real-time também bloqueia
-- ✅ Multi-tenancy está SEGURO com Real-time
--
-- As políticas RLS em CONFIGURAR_RLS_FINAL.sql já estão corretas:
-- - Filtram por loja_id
-- - Permitem SELECT para authenticated users
-- - Isso permite Real-time funcionar corretamente!
--
-- ============================================
