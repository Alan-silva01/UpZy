-- Enable Realtime for all tables
-- This migration enables real-time subscriptions for INSERT, UPDATE, and DELETE operations

-- Enable Realtime on vendas table (if not already enabled)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'vendas'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE vendas;
    END IF;
END $$;

-- Enable Realtime on vendedores table (if not already enabled)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'vendedores'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE vendedores;
    END IF;
END $$;

-- Enable Realtime on metas table (if not already enabled)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'metas'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE metas;
    END IF;
END $$;

-- Enable Realtime on lojas table (if not already enabled)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'lojas'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE lojas;
    END IF;
END $$;

-- Enable Realtime on users table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE users;
    END IF;
END $$;

-- Enable Realtime on cupons table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cupons') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE cupons;
    END IF;
END $$;

-- Enable Realtime on payments table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE payments;
    END IF;
END $$;

-- Enable Realtime on produtos table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'produtos') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE produtos;
    END IF;
END $$;

-- Enable Realtime on clientes table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clientes') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE clientes;
    END IF;
END $$;

-- Verify Realtime is enabled
COMMENT ON PUBLICATION supabase_realtime IS 'Realtime enabled for all application tables';
