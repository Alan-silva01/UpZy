-- Script para diagnosticar triggers e constraints na tabela lojas

-- ============================================
-- 1. VER TODOS OS TRIGGERS NA TABELA LOJAS
-- ============================================

SELECT
  trigger_name,
  event_manipulation as evento,
  action_statement as acao,
  action_timing as quando
FROM information_schema.triggers
WHERE event_object_table = 'lojas'
ORDER BY trigger_name;

-- ============================================
-- 2. VER TODAS AS FUNÇÕES RELACIONADAS
-- ============================================

SELECT
  routine_name as funcao,
  routine_definition as definicao
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%loja%' OR routine_name LIKE '%plano%')
ORDER BY routine_name;

-- ============================================
-- 3. VER TODOS OS CONSTRAINTS DA TABELA LOJAS
-- ============================================

SELECT
  conname as constraint_name,
  contype as tipo,
  pg_get_constraintdef(oid) as definicao
FROM pg_constraint
WHERE conrelid = 'lojas'::regclass
ORDER BY conname;

-- ============================================
-- 4. VER ESTRUTURA COMPLETA DA COLUNA PLANO
-- ============================================

SELECT
  column_name,
  data_type,
  character_maximum_length,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'lojas' AND column_name = 'plano';

-- ============================================
-- 5. VER VALORES ATUAIS (SEM MODIFICAR)
-- ============================================

SELECT
  id,
  nome,
  plano,
  '"' || plano || '"' as plano_entre_aspas,
  LENGTH(plano) as tamanho,
  status
FROM lojas
ORDER BY nome;
