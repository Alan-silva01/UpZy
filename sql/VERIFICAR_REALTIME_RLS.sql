-- ============================================
-- VERIFICAÇÃO COMPLETA: REALTIME + RLS
-- ============================================

-- 1. Verificar quais tabelas têm Real-time habilitado
SELECT
    schemaname,
    tablename,
    'Real-time HABILITADO' as status
FROM
    pg_publication_tables
WHERE
    pubname = 'supabase_realtime'
ORDER BY
    tablename;

-- ============================================
-- 2. Verificar políticas RLS que afetam Real-time
-- ============================================
-- Real-time RESPEITA as políticas SELECT!
-- Se SELECT é bloqueado, Real-time também é bloqueado

SELECT
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operacao,
    CASE
        WHEN cmd = 'SELECT' THEN '🔴 CRÍTICO para Real-time'
        WHEN cmd = 'DELETE' THEN '⚠️ Afeta eventos DELETE'
        ELSE 'ℹ️ Não afeta Real-time diretamente'
    END as impacto_realtime
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND tablename IN ('vendas', 'vendedores', 'metas', 'clientes', 'lojas', 'usuarios')
ORDER BY
    tablename, cmd, policyname;

-- ============================================
-- 3. Verificar se há REPLICA IDENTITY configurada
-- ============================================
-- Para DELETE funcionar corretamente no Real-time,
-- as tabelas precisam de REPLICA IDENTITY

SELECT
    schemaname,
    tablename,
    CASE
        WHEN relreplident = 'd' THEN 'DEFAULT (apenas PK) ✅'
        WHEN relreplident = 'f' THEN 'FULL (todos os campos) ⭐ MELHOR'
        WHEN relreplident = 'n' THEN 'NOTHING ❌ PROBLEMA!'
        WHEN relreplident = 'i' THEN 'INDEX'
        ELSE 'DESCONHECIDO'
    END as replica_identity
FROM
    pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE
    n.nspname = 'public'
    AND c.relname IN ('vendas', 'vendedores', 'metas', 'clientes', 'lojas', 'usuarios')
    AND c.relkind = 'r'
ORDER BY
    c.relname;

-- ============================================
-- 4. CORREÇÃO: Configurar REPLICA IDENTITY FULL
-- ============================================
-- Isso garante que payload.old tenha TODOS os campos
-- necessários para filtros funcionarem em DELETE

ALTER TABLE vendas REPLICA IDENTITY FULL;
ALTER TABLE vendedores REPLICA IDENTITY FULL;
ALTER TABLE metas REPLICA IDENTITY FULL;
ALTER TABLE clientes REPLICA IDENTITY FULL;
ALTER TABLE lojas REPLICA IDENTITY FULL;
ALTER TABLE usuarios REPLICA IDENTITY FULL;

-- ============================================
-- 5. Verificar novamente (deve mostrar FULL)
-- ============================================

SELECT
    schemaname,
    tablename,
    CASE
        WHEN relreplident = 'd' THEN 'DEFAULT (apenas PK) ✅'
        WHEN relreplident = 'f' THEN 'FULL (todos os campos) ⭐ MELHOR'
        WHEN relreplident = 'n' THEN 'NOTHING ❌ PROBLEMA!'
        WHEN relreplident = 'i' THEN 'INDEX'
        ELSE 'DESCONHECIDO'
    END as replica_identity
FROM
    pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE
    n.nspname = 'public'
    AND c.relname IN ('vendas', 'vendedores', 'metas', 'clientes', 'lojas', 'usuarios')
    AND c.relkind = 'r'
ORDER BY
    c.relname;

-- ============================================
-- RESUMO DO QUE FOI FEITO:
-- ============================================
--
-- ✅ Configurado REPLICA IDENTITY FULL em todas as tabelas
--
-- Isso significa:
-- - payload.old terá TODOS os campos do registro deletado
-- - Filtros de loja_id funcionarão em eventos DELETE
-- - Real-time poderá filtrar corretamente por loja
--
-- IMPORTANTE:
-- - Real-time respeita as políticas RLS SELECT
-- - Se usuário pode ver o registro (SELECT), receberá eventos
-- - Se RLS bloqueia SELECT, Real-time também bloqueia
--
-- ============================================
