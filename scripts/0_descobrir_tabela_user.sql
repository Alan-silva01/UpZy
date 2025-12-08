-- Script para descobrir onde estão os dados de pagamento do usuário

-- 1. Verificar se existe uma tabela chamada "users" (plural)
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'users'
) as tabela_users_existe;

-- 2. Listar todas as tabelas no schema public
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 3. Verificar estrutura da tabela auth.users (do Supabase Auth)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'auth'
AND table_name = 'users'
ORDER BY ordinal_position;

-- 4. Ver se os dados estão em auth.users.raw_user_meta_data
SELECT
  id,
  email,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'plano_ativo' as plano_ativo,
  raw_user_meta_data->>'data_expiracao' as data_expiracao,
  raw_user_meta_data->>'status' as status,
  raw_user_meta_data->>'asaas_customer_id' as asaas_customer_id
FROM auth.users
WHERE email = 'shopmarcas@gmail.com';

-- 5. Verificar se existe uma view ou tabela personalizada
SELECT schemaname, viewname
FROM pg_views
WHERE viewname LIKE '%user%'
ORDER BY viewname;

-- Após executar este script, você saberá onde estão os dados
-- e poderemos ajustar o script de sincronização
