-- ============================================
-- ADICIONAR NOVOS MÉTODOS DE PAGAMENTO
-- ============================================
-- Este script adiciona os novos métodos de pagamento:
-- - cartao_debito (Cartão de Débito)
-- - cartao_credito (Cartão de Crédito)
--
-- O método antigo 'cartao' será substituído pelos dois novos
--
-- NOTA: A coluna metodo_pagamento é VARCHAR, não ENUM
-- ============================================

-- Atualizar vendas existentes que usam 'cartao' para 'cartao_credito'
-- (assumindo que o padrão anterior era crédito)
UPDATE vendas
SET metodo_pagamento = 'cartao_credito'
WHERE metodo_pagamento = 'cartao';

-- Verificar a estrutura da coluna
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'vendas'
  AND column_name = 'metodo_pagamento';

-- Verificar distribuição de métodos nas vendas
SELECT
    metodo_pagamento,
    COUNT(*) as quantidade,
    SUM(valor) as valor_total
FROM vendas
WHERE metodo_pagamento IS NOT NULL
GROUP BY metodo_pagamento
ORDER BY quantidade DESC;

-- ============================================
-- PRONTO!
-- ============================================
-- Como a coluna é VARCHAR, os novos métodos podem ser
-- usados diretamente sem necessidade de ALTER TYPE:
-- - pix
-- - dinheiro
-- - cartao_debito (NOVO - já pode usar)
-- - cartao_credito (NOVO - já pode usar)
-- - boleto
-- - promissoria
-- ============================================
