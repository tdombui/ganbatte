-- Add default_address column to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS default_address TEXT;

-- Add comment to clarify the difference between billing_address and default_address
COMMENT ON COLUMN customers.billing_address IS 'Billing address for invoices and payments';
COMMENT ON COLUMN customers.default_address IS 'Default delivery address for jobs (used when customer says "my shop", "the shop", etc.)'; 