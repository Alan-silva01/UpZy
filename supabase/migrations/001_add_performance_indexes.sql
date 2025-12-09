-- =====================================================
-- PERFORMANCE INDEXES FOR UPZY APP
-- Created: 2025-12-09
-- Purpose: Optimize query performance for 0.1s-0.3s load times
-- =====================================================

-- ============ VENDEDORES TABLE INDEXES ============
-- Index for filtering by loja_id (most common query)
CREATE INDEX IF NOT EXISTS idx_vendedores_loja_id
ON vendedores(loja_id)
WHERE deleted_at IS NULL;

-- Index for active sellers only
CREATE INDEX IF NOT EXISTS idx_vendedores_ativo
ON vendedores(ativo, loja_id)
WHERE deleted_at IS NULL;

-- Index for user authentication lookups
CREATE INDEX IF NOT EXISTS idx_vendedores_user_id
ON vendedores(user_id)
WHERE deleted_at IS NULL;

-- ============ VENDAS TABLE INDEXES ============
-- Composite index for most common query (vendas by vendedor + loja)
CREATE INDEX IF NOT EXISTS idx_vendas_vendedor_loja
ON vendas(vendedor_id, loja_id, data_venda DESC);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_vendas_data
ON vendas(data_venda DESC, loja_id)
WHERE deleted_at IS NULL;

-- Index for loja_id queries (dashboard aggregations)
CREATE INDEX IF NOT EXISTS idx_vendas_loja_id
ON vendas(loja_id, data_venda DESC)
WHERE deleted_at IS NULL;

-- Composite index for performance queries (valor + meta tracking)
CREATE INDEX IF NOT EXISTS idx_vendas_valor_data
ON vendas(loja_id, data_venda, valor)
WHERE deleted_at IS NULL;

-- ============ LOJAS TABLE INDEXES ============
-- Index for user ownership lookup
CREATE INDEX IF NOT EXISTS idx_lojas_owner_id
ON lojas(owner_id)
WHERE deleted_at IS NULL;

-- Index for active stores by plan
CREATE INDEX IF NOT EXISTS idx_lojas_plano_status
ON lojas(plano, status)
WHERE deleted_at IS NULL;

-- ============ METAS TABLE INDEXES ============
-- Composite index for active goals by loja
CREATE INDEX IF NOT EXISTS idx_metas_loja_periodo
ON metas(loja_id, data_inicio, data_fim)
WHERE deleted_at IS NULL;

-- Index for vendedor-specific goals
CREATE INDEX IF NOT EXISTS idx_metas_vendedor
ON metas(vendedor_id, loja_id, data_inicio DESC)
WHERE deleted_at IS NULL;

-- Index for active goals within date range
CREATE INDEX IF NOT EXISTS idx_metas_ativas
ON metas(loja_id, data_inicio, data_fim)
WHERE deleted_at IS NULL AND data_fim >= CURRENT_DATE;

-- ============ STATISTICS UPDATE ============
-- Update statistics for better query planning
ANALYZE vendedores;
ANALYZE vendas;
ANALYZE lojas;
ANALYZE metas;

-- =====================================================
-- NOTES:
-- - All indexes use "IF NOT EXISTS" for safe re-runs
-- - Indexes include WHERE deleted_at IS NULL for partial indexing
-- - DESC ordering on date fields for recent-first queries
-- - Run ANALYZE after creating indexes
-- =====================================================
