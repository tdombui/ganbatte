-- Update existing twilio_customers records to have sms_opt_in = TRUE
-- This fixes records that were created before the sms_opt_in column was added
UPDATE twilio_customers 
SET sms_opt_in = TRUE 
WHERE phone_number IS NOT NULL 
  AND phone_number != '' 
  AND (sms_opt_in IS NULL OR sms_opt_in = FALSE);

-- Update existing profiles records to have sms_opt_in = TRUE if they have a phone number
UPDATE profiles 
SET sms_opt_in = TRUE 
WHERE phone IS NOT NULL 
  AND phone != '' 
  AND (sms_opt_in IS NULL OR sms_opt_in = FALSE);

-- Verify the updates
SELECT 'twilio_customers' as table_name, 
       COUNT(*) as total_records,
       COUNT(CASE WHEN sms_opt_in = TRUE THEN 1 END) as sms_enabled,
       COUNT(CASE WHEN sms_opt_in = FALSE THEN 1 END) as sms_disabled
FROM twilio_customers
UNION ALL
SELECT 'profiles' as table_name, 
       COUNT(*) as total_records,
       COUNT(CASE WHEN sms_opt_in = TRUE THEN 1 END) as sms_enabled,
       COUNT(CASE WHEN sms_opt_in = FALSE THEN 1 END) as sms_disabled
FROM profiles; 