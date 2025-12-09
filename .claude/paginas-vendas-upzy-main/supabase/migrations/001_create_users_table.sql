-- Create users table with all required fields for Asaas integration
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  whatsapp TEXT UNIQUE NOT NULL,
  cpf TEXT UNIQUE NOT NULL,

  -- Billing information
  billing_name TEXT,

  -- Address
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,

  -- Subscription info
  plano_ativo TEXT CHECK (plano_ativo IN ('monthly', 'semester', 'annual')),
  data_expiracao TIMESTAMP WITH TIME ZONE,

  -- Asaas integration
  asaas_customer_id TEXT UNIQUE,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ativo', 'cancelled', 'inactive')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_cpf ON public.users(cpf);
CREATE INDEX IF NOT EXISTS idx_users_whatsapp ON public.users(whatsapp);
CREATE INDEX IF NOT EXISTS idx_users_asaas_customer_id ON public.users(asaas_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only read their own data
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Create policy: Users can update their own data
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Create policy: Anyone can insert (for registration)
CREATE POLICY "Anyone can create user"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.users IS 'Stores user information and subscription data';
COMMENT ON COLUMN public.users.whatsapp IS 'WhatsApp number in format +5511999999999';
COMMENT ON COLUMN public.users.cpf IS 'CPF without formatting';
COMMENT ON COLUMN public.users.asaas_customer_id IS 'Asaas customer ID for payment processing';
COMMENT ON COLUMN public.users.status IS 'User subscription status: pending, ativo, cancelled, inactive';
