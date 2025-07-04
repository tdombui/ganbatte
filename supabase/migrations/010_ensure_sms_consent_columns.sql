-- Ensure SMS consent columns exist in twilio_customers table
-- This migration will add the columns if they don't exist

-- Add sms_consent column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'twilio_customers' 
        AND column_name = 'sms_consent'
    ) THEN
        ALTER TABLE twilio_customers ADD COLUMN sms_consent BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added sms_consent column to twilio_customers table';
    ELSE
        RAISE NOTICE 'sms_consent column already exists in twilio_customers table';
    END IF;
END $$;

-- Add consent_date column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'twilio_customers' 
        AND column_name = 'consent_date'
    ) THEN
        ALTER TABLE twilio_customers ADD COLUMN consent_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added consent_date column to twilio_customers table';
    ELSE
        RAISE NOTICE 'consent_date column already exists in twilio_customers table';
    END IF;
END $$;

-- Add index for consent queries if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_twilio_customers_sms_consent ON twilio_customers(sms_consent);

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'twilio_customers' 
ORDER BY ordinal_position; 