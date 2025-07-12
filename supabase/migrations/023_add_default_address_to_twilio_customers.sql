-- Add default_address column to twilio_customers table
ALTER TABLE twilio_customers 
ADD COLUMN IF NOT EXISTS default_address TEXT;

-- Add comment to document the purpose
COMMENT ON COLUMN twilio_customers.default_address IS 'Default address for SMS customers'; 