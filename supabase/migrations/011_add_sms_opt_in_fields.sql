-- Add sms_opt_in field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS sms_opt_in BOOLEAN DEFAULT FALSE;

-- Add sms_opt_in field to twilio_customers table
ALTER TABLE twilio_customers 
ADD COLUMN IF NOT EXISTS sms_opt_in BOOLEAN DEFAULT FALSE;

-- Update existing records to have sms_opt_in = true if they have a phone_number
UPDATE profiles 
SET sms_opt_in = TRUE 
WHERE phone IS NOT NULL AND phone != '' AND sms_opt_in IS NULL;

UPDATE twilio_customers 
SET sms_opt_in = TRUE 
WHERE phone_number IS NOT NULL AND phone_number != '' AND sms_opt_in IS NULL; 