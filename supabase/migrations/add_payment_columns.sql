-- Add payment status and related fields to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled'));
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS stripe_payment_link_id VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for payment-related queries
CREATE INDEX IF NOT EXISTS idx_jobs_payment_status ON jobs(payment_status);
CREATE INDEX IF NOT EXISTS idx_jobs_stripe_payment_intent_id ON jobs(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_jobs_stripe_payment_link_id ON jobs(stripe_payment_link_id); 