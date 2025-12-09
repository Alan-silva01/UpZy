-- Create payments table to track all transactions
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Plan information
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'semester', 'annual')),
  amount DECIMAL(10, 2) NOT NULL,

  -- Payment status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded')),

  -- Asaas integration
  asaas_payment_id TEXT UNIQUE,
  asaas_subscription_id TEXT,

  -- Payment method
  billing_type TEXT NOT NULL CHECK (billing_type IN ('CREDIT_CARD', 'BOLETO')),

  -- Installment info (for semester/annual plans)
  installments INTEGER DEFAULT 1,
  installment_number INTEGER,

  -- Boleto specific
  boleto_url TEXT,
  boleto_barcode TEXT,

  -- Timestamps
  paid_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Additional info
  error_message TEXT,
  metadata JSONB
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_asaas_payment_id ON public.payments(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_asaas_subscription_id ON public.payments(asaas_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only view their own payments
CREATE POLICY "Users can view own payments"
  ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own payments
CREATE POLICY "Users can create own payments"
  ON public.payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Service role can update any payment (for webhooks)
CREATE POLICY "Service role can update payments"
  ON public.payments
  FOR UPDATE
  USING (true);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.payments IS 'Stores all payment transactions and their status';
COMMENT ON COLUMN public.payments.billing_type IS 'Payment method: CREDIT_CARD or BOLETO';
COMMENT ON COLUMN public.payments.asaas_payment_id IS 'Asaas payment/charge ID';
COMMENT ON COLUMN public.payments.asaas_subscription_id IS 'Asaas subscription ID (for recurring payments)';
COMMENT ON COLUMN public.payments.installments IS 'Total number of installments (1 for monthly, 6 for semester, 12 for annual)';
