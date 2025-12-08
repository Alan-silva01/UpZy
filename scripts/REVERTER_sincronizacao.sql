-- Script para REVERTER todas as alterações de sincronização
-- Execute este script no Supabase SQL Editor para desfazer as mudanças

-- ============================================
-- 1. REMOVER TRIGGERS
-- ============================================

-- Remover trigger de sincronização auth.users → usuarios
DROP TRIGGER IF EXISTS trigger_sync_auth_users_to_usuarios ON auth.users;

-- Remover trigger de sincronização user → usuarios (se existir)
DROP TRIGGER IF EXISTS trigger_sync_user_to_usuarios ON "user";

-- Remover trigger de sincronização usuarios → lojas
DROP TRIGGER IF EXISTS trigger_sincronizar_plano ON usuarios;

-- Remover triggers de updated_at
DROP TRIGGER IF EXISTS trigger_atualizar_updated_at_usuarios ON usuarios;
DROP TRIGGER IF EXISTS trigger_atualizar_updated_at_lojas ON lojas;

-- ============================================
-- 2. REMOVER FUNÇÕES
-- ============================================

-- Remover função de sincronização auth.users → usuarios
DROP FUNCTION IF EXISTS sincronizar_auth_user_para_usuarios();

-- Remover função de sincronização user → usuarios
DROP FUNCTION IF EXISTS sincronizar_user_para_usuarios();

-- Remover função de sincronização usuarios → lojas
DROP FUNCTION IF EXISTS sincronizar_plano_com_loja();

-- Remover função de atualizar updated_at
DROP FUNCTION IF EXISTS atualizar_updated_at();

-- ============================================
-- 3. REMOVER CAMPOS ADICIONADOS (OPCIONAL)
-- ============================================

-- ATENÇÃO: Isto vai REMOVER os campos e APAGAR OS DADOS!
-- Só execute se você realmente quer remover os campos

/*
-- Remover campos da tabela usuarios
ALTER TABLE usuarios
DROP COLUMN IF EXISTS plano_ativo,
DROP COLUMN IF EXISTS data_expiracao,
DROP COLUMN IF EXISTS asaas_customer_id,
DROP COLUMN IF EXISTS status,
DROP COLUMN IF EXISTS whatsapp,
DROP COLUMN IF EXISTS cpf,
DROP COLUMN IF EXISTS billing_name,
DROP COLUMN IF EXISTS cep,
DROP COLUMN IF EXISTS logradouro,
DROP COLUMN IF EXISTS numero,
DROP COLUMN IF EXISTS complemento,
DROP COLUMN IF EXISTS bairro,
DROP COLUMN IF EXISTS cidade,
DROP COLUMN IF EXISTS estado,
DROP COLUMN IF EXISTS updated_at;

-- Remover campo updated_at da tabela lojas
ALTER TABLE lojas
DROP COLUMN IF EXISTS updated_at;
*/

-- ============================================
-- 4. REMOVER ÍNDICES
-- ============================================

DROP INDEX IF EXISTS idx_usuarios_plano_ativo;
DROP INDEX IF EXISTS idx_usuarios_data_expiracao;
DROP INDEX IF EXISTS idx_usuarios_status;
DROP INDEX IF EXISTS idx_usuarios_asaas_customer_id;

-- ============================================
-- 5. REMOVER CONSTRAINTS
-- ============================================

ALTER TABLE usuarios
DROP CONSTRAINT IF EXISTS check_plano_ativo;

ALTER TABLE usuarios
DROP CONSTRAINT IF EXISTS check_status_usuario;

-- ============================================
-- 6. REMOVER COMENTÁRIOS
-- ============================================

COMMENT ON COLUMN usuarios.plano_ativo IS NULL;
COMMENT ON COLUMN usuarios.data_expiracao IS NULL;
COMMENT ON COLUMN usuarios.asaas_customer_id IS NULL;
COMMENT ON COLUMN usuarios.status IS NULL;

-- ============================================
-- CONCLUÍDO
-- ============================================

-- Verificar o que foi removido
SELECT 'Triggers removidos' as tipo, count(*) as total
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%sincroniza%'
  OR trigger_name LIKE '%atualizar_updated_at%';

SELECT 'Funções removidas' as tipo, count(*) as total
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%sincroniza%'
  OR routine_name LIKE '%atualizar_updated_at%';

-- Listar triggers restantes (para verificar)
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Listar funções restantes (para verificar)
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
