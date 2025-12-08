-- SOLUÇÃO DEFINITIVA: Remove constraint primeiro, depois atualiza

-- ============================================
-- PASSO 1: REMOVER O CONSTRAINT ANTIGO
-- ============================================

ALTER TABLE lojas
DROP CONSTRAINT IF EXISTS lojas_plano_check;

-- Verificar que o constraint foi removido
SELECT
  conname as constraint_name
FROM pg_constraint
WHERE conrelid = 'lojas'::regclass
  AND contype = 'c';

-- ============================================
-- PASSO 2: AGORA PODEMOS ATUALIZAR OS VALORES
-- ============================================

-- Atualizar o valor atual de PRO para PRO - Semestral
UPDATE lojas
SET plano = CASE
  WHEN plano = 'STARTER' THEN 'PRO - Mensal'
  WHEN plano = 'PRO' THEN 'PRO - Semestral'
  WHEN plano = 'ENTERPRISE' THEN 'PRO - Anual'
  WHEN plano = 'FREE' THEN 'FREE'
  ELSE 'FREE'  -- Fallback para qualquer valor desconhecido
END;

-- Verificar os valores atualizados
SELECT
  id,
  nome,
  plano,
  LENGTH(plano) as tamanho,
  status
FROM lojas
ORDER BY nome;

-- ============================================
-- PASSO 3: ADICIONAR O NOVO CONSTRAINT
-- ============================================

ALTER TABLE lojas
ADD CONSTRAINT lojas_plano_check
CHECK (plano IN ('FREE', 'PRO - Mensal', 'PRO - Semestral', 'PRO - Anual'));

-- ============================================
-- PASSO 4: ATUALIZAR COMENTÁRIO
-- ============================================

COMMENT ON COLUMN lojas.plano IS 'Plano ativo da loja: FREE | PRO - Mensal | PRO - Semestral | PRO - Anual';

-- ============================================
-- PASSO 5: TESTAR
-- ============================================

-- Verificar que tudo está correto
SELECT
  plano,
  status,
  COUNT(*) as total
FROM lojas
GROUP BY plano, status
ORDER BY plano, status;

-- Testar constraint
DO $$
BEGIN
  BEGIN
    INSERT INTO lojas (nome, plano, status) VALUES ('Teste', 'INVALID', 'ACTIVE');
    RAISE NOTICE '❌ ERRO: Constraint NÃO está funcionando!';
    DELETE FROM lojas WHERE nome = 'Teste';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE '✅ Constraint funcionando corretamente!';
  END;
END $$;

-- ============================================
-- CONCLUÍDO
-- ============================================

SELECT
  '✅ Migração concluída com sucesso!' as status,
  COUNT(*) as total_lojas,
  COUNT(DISTINCT plano) as planos_diferentes
FROM lojas;

-- ============================================
-- COMO USAR DAQUI PRA FRENTE
-- ============================================

/*
Sempre use exatamente estes valores (case-sensitive):

'FREE'
'PRO - Mensal'
'PRO - Semestral'
'PRO - Anual'

Exemplo de atualização via webhook:

UPDATE lojas
SET
  plano = 'PRO - Semestral',
  status = 'ACTIVE',
  data_renovacao = NOW() + INTERVAL '6 months'
WHERE id = (
  SELECT loja_id FROM usuarios WHERE asaas_customer_id = 'cus_xxxxx'
);
*/
