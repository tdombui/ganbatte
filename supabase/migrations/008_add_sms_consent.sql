-- Add SMS consent fields to twilio_customers table
ALTER TABLE twilio_customers 
ADD COLUMN sms_consent BOOLEAN DEFAULT false,
ADD COLUMN consent_date TIMESTAMP WITH TIME ZONE;

-- Add index for consent queries
CREATE INDEX idx_twilio_customers_sms_consent ON twilio_customers(sms_consent); 