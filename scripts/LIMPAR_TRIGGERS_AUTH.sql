-- Script para limpar triggers problemáticos em auth.users

-- ============================================
-- 1. LISTAR TRIGGERS EM auth.users
-- ============================================
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- ============================================
-- 2. REMOVER TRIGGER DE SINCRONIZAÇÃO
-- ============================================
DROP TRIGGER IF EXISTS trigger_sync_auth_users_to_usuarios ON auth.users;

-- ============================================
-- 3. REMOVER FUNÇÃO RELACIONADA
-- ============================================
DROP FUNCTION IF EXISTS sincronizar_auth_user_para_usuarios();

-- ============================================
-- 4. VERIFICAR SE HÁ OUTROS TRIGGERS
-- ============================================
SELECT
  'Trigger removido com sucesso!' as status;

-- Verificar triggers restantes
SELECT
  trigger_name,
  event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
ORDER BY trigger_name;
