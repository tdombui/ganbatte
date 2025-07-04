-- Ensure SMS consent columns exist in twilio_customers table
DO $$ 
BEGIN
    -- Add sms_consent column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'twilio_customers' 
        AND column_name = 'sms_consent'
    ) THEN
        ALTER TABLE twilio_customers ADD COLUMN sms_consent BOOLEAN DEFAULT false;
    END IF;

    -- Add consent_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'twilio_customers' 
        AND column_name = 'consent_date'
    ) THEN
        ALTER TABLE twilio_customers ADD COLUMN consent_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add index for consent queries if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_twilio_customers_sms_consent ON twilio_customers(sms_consent); 