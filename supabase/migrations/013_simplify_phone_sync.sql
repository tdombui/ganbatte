-- Simplified bulletproof phone synchronization
-- profiles table is the single source of truth
-- twilio_customers only for SMS compliance

-- Remove complex triggers and replace with simple, reliable ones
DROP TRIGGER IF EXISTS trigger_sync_phone_to_metadata ON profiles;
DROP TRIGGER IF EXISTS trigger_sync_phone_to_twilio ON profiles;
DROP FUNCTION IF EXISTS sync_phone_to_metadata();
DROP FUNCTION IF EXISTS sync_phone_to_twilio();

-- Simple trigger: sync phone to user metadata only
CREATE OR REPLACE FUNCTION sync_phone_to_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if phone number actually changed
    IF OLD.phone IS DISTINCT FROM NEW.phone THEN
        -- Update user metadata with new phone number
        UPDATE auth.users 
        SET raw_user_meta_data = 
            CASE 
                WHEN NEW.phone IS NULL THEN 
                    raw_user_meta_data - 'phone_number'
                ELSE 
                    raw_user_meta_data || jsonb_build_object('phone_number', NEW.phone)
            END
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER trigger_sync_phone_to_metadata
    AFTER UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_phone_to_metadata();

-- Function to get user phone number (profiles table is source of truth)
CREATE OR REPLACE FUNCTION get_user_phone(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    phone_number TEXT;
BEGIN
    -- Get from profiles table (source of truth)
    SELECT phone INTO phone_number
    FROM profiles 
    WHERE id = user_id;
    
    RETURN phone_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check SMS opt-in status (profiles table is source of truth)
CREATE OR REPLACE FUNCTION get_user_sms_opt_in(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    sms_opt_in BOOLEAN;
BEGIN
    -- Check profiles table (source of truth)
    SELECT p.sms_opt_in INTO sms_opt_in
    FROM profiles p
    WHERE p.id = user_id;
    
    RETURN COALESCE(sms_opt_in, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync SMS opt-in to twilio_customers (for compliance only)
CREATE OR REPLACE FUNCTION sync_sms_to_twilio(user_id UUID)
RETURNS VOID AS $$
DECLARE
    profile_record RECORD;
BEGIN
    -- Get profile data
    SELECT phone, sms_opt_in, email, full_name INTO profile_record
    FROM profiles 
    WHERE id = user_id;
    
    -- Only sync if user has phone and SMS is enabled
    IF profile_record.phone IS NOT NULL AND profile_record.sms_opt_in = true THEN
        -- Insert or update twilio_customers for SMS compliance
        INSERT INTO twilio_customers (phone_number, email, name, sms_opt_in, created_at, updated_at)
        VALUES (profile_record.phone, profile_record.email, COALESCE(profile_record.full_name, profile_record.email), true, NOW(), NOW())
        ON CONFLICT (phone_number) 
        DO UPDATE SET 
            email = EXCLUDED.email,
            name = EXCLUDED.name,
            sms_opt_in = EXCLUDED.sms_opt_in,
            updated_at = NOW();
    ELSIF profile_record.phone IS NOT NULL AND profile_record.sms_opt_in = false THEN
        -- Remove from twilio_customers if SMS disabled
        DELETE FROM twilio_customers WHERE phone_number = profile_record.phone;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user phone and SMS preferences (bulletproof)
CREATE OR REPLACE FUNCTION update_user_phone_and_sms(
    user_id UUID,
    phone_number TEXT,
    sms_opt_in BOOLEAN
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update profiles table (source of truth)
    UPDATE profiles 
    SET phone = phone_number, sms_opt_in = sms_opt_in
    WHERE id = user_id;
    
    -- Sync to twilio_customers for SMS compliance
    PERFORM sync_sms_to_twilio(user_id);
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 