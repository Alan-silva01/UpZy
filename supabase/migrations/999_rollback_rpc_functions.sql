-- =====================================================
-- ROLLBACK: Remove RPC functions que causaram conflito
-- Execute IMEDIATAMENTE no SQL Editor do Supabase
-- =====================================================

-- Drop all RPC functions created
DROP FUNCTION IF EXISTS get_vendedores_com_vendas(UUID);
DROP FUNCTION IF EXISTS get_dashboard_data(UUID);
DROP FUNCTION IF EXISTS get_recent_sales(UUID, INT);
DROP FUNCTION IF EXISTS get_seller_ranking(UUID);
DROP FUNCTION IF EXISTS get_vendas_por_periodo(UUID, TIMESTAMPTZ, TIMESTAMPTZ);

-- Verify they were removed
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'get_%'
ORDER BY routine_name;

-- Should return no rows after this
