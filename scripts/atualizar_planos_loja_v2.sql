-- Script para atualizar a estrutura de planos na tabela lojas
-- Versão 2: Com verificação e migração adequada dos dados

-- ============================================
-- 1. VERIFICAR VALORES ATUAIS
-- ============================================

-- Ver todos os planos existentes e suas quantidades
SELECT
  plano,
  COUNT(*) as quantidade
FROM lojas
GROUP BY plano
ORDER BY plano;

-- ============================================
-- 2. MIGRAR DADOS EXISTENTES PRIMEIRO
-- ============================================

-- Converter todos os valores possíveis para o novo formato
UPDATE lojas
SET plano = CASE
  -- Mapeamento dos planos antigos
  WHEN plano = 'STARTER' THEN 'PRO - Mensal'
  WHEN plano = 'PRO' THEN 'PRO - Semestral'
  WHEN plano = 'ENTERPRISE' THEN 'PRO - Anual'
  WHEN plano = 'FREE' THEN 'FREE'

  -- Mapeamento de possíveis variações (case insensitive)
  WHEN UPPER(plano) = 'STARTER' THEN 'PRO - Mensal'
  WHEN UPPER(plano) = 'PRO' THEN 'PRO - Semestral'
  WHEN UPPER(plano) = 'ENTERPRISE' THEN 'PRO - Anual'
  WHEN UPPER(plano) = 'FREE' THEN 'FREE'

  -- Se já estiver no novo formato, manter
  WHEN plano = 'PRO - Mensal' THEN 'PRO - Mensal'
  WHEN plano = 'PRO - Semestral' THEN 'PRO - Semestral'
  WHEN plano = 'PRO - Anual' THEN 'PRO - Anual'

  -- Para qualquer outro valor não mapeado, definir como FREE
  ELSE 'FREE'
END;

-- ============================================
-- 3. VERIFICAR SE TODOS OS VALORES FORAM MIGRADOS
-- ============================================

-- Esta query deve retornar apenas: FREE, PRO - Mensal, PRO - Semestral, PRO - Anual
SELECT DISTINCT plano
FROM lojas
ORDER BY plano;

-- ============================================
-- 4. REMOVER CONSTRAINT ANTIGA (se existir)
-- ============================================

ALTER TABLE lojas
DROP CONSTRAINT IF EXISTS lojas_plano_check;

-- ============================================
-- 5. ADICIONAR NOVO CONSTRAINT
-- ============================================

ALTER TABLE lojas
ADD CONSTRAINT lojas_plano_check
CHECK (plano IN ('FREE', 'PRO - Mensal', 'PRO - Semestral', 'PRO - Anual'));

-- ============================================
-- 6. ATUALIZAR COMENTÁRIO DA COLUNA
-- ============================================

COMMENT ON COLUMN lojas.plano IS 'Plano ativo da loja: FREE, PRO - Mensal, PRO - Semestral, PRO - Anual';

-- ============================================
-- 7. VERIFICAR RESULTADO FINAL
-- ============================================

-- Ver todos os planos atuais
SELECT
  id,
  nome,
  plano,
  status,
  data_renovacao
FROM lojas
ORDER BY plano, nome;

-- Contar por tipo de plano
SELECT
  plano,
  COUNT(*) as quantidade
FROM lojas
GROUP BY plano
ORDER BY plano;

-- ============================================
-- EXEMPLO DE USO FUTURO
-- ============================================

/*
-- Webhook do Asaas - Como atualizar o plano:

-- Para plano MENSAL
UPDATE lojas
SET
  plano = 'PRO - Mensal',
  status = 'ACTIVE',
  data_renovacao = NOW() + INTERVAL '1 month'
WHERE id = (SELECT loja_id FROM usuarios WHERE asaas_customer_id = 'cus_xxxxx');

-- Para plano SEMESTRAL
UPDATE lojas
SET
  plano = 'PRO - Semestral',
  status = 'ACTIVE',
  data_renovacao = NOW() + INTERVAL '6 months'
WHERE id = (SELECT loja_id FROM usuarios WHERE asaas_customer_id = 'cus_xxxxx');

-- Para plano ANUAL
UPDATE lojas
SET
  plano = 'PRO - Anual',
  status = 'ACTIVE',
  data_renovacao = NOW() + INTERVAL '1 year'
WHERE id = (SELECT loja_id FROM usuarios WHERE asaas_customer_id = 'cus_xxxxx');

-- Para cancelamento/expiração
UPDATE lojas
SET
  plano = 'FREE',
  status = 'INACTIVE',
  data_renovacao = NULL
WHERE id = (SELECT loja_id FROM usuarios WHERE asaas_customer_id = 'cus_xxxxx');
*/
