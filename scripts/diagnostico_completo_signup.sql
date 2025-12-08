-- Script de diagnóstico completo para identificar problema no signup

-- ============================================
-- 1. VERIFICAR TODOS OS TRIGGERS EM auth.users
-- ============================================
SELECT
  trigger_name,
  event_object_table,
  action_statement,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- ============================================
-- 2. VERIFICAR TRIGGERS NA TABELA usuarios
-- ============================================
SELECT
  trigger_name,
  event_object_table,
  action_statement,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'usuarios'
ORDER BY trigger_name;

-- ============================================
-- 3. VERIFICAR FUNÇÕES RELACIONADAS A SINCRONIZAÇÃO
-- ============================================
SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_name LIKE '%sincroniza%'
    OR routine_name LIKE '%auth%'
    OR routine_name LIKE '%user%'
  )
ORDER BY routine_name;

-- ============================================
-- 4. VERIFICAR POLÍTICAS RLS NA TABELA usuarios
-- ============================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'usuarios'
ORDER BY policyname;

-- ============================================
-- 5. VERIFICAR ESTRUTURA DA TABELA usuarios
-- ============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'usuarios'
ORDER BY ordinal_position;

-- ============================================
-- 6. VERIFICAR CONSTRAINTS DA TABELA usuarios
-- ============================================
SELECT
  conname as constraint_name,
  contype as tipo,
  pg_get_constraintdef(oid) as definicao
FROM pg_constraint
WHERE conrelid = 'usuarios'::regclass
ORDER BY conname;
