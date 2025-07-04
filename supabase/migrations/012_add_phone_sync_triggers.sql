-- Add phone synchronization triggers to maintain consistency
-- This eliminates the need for manual sync in application code

-- Function to sync phone number from profiles to user metadata
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

-- Function to sync phone number from profiles to twilio_customers
CREATE OR REPLACE FUNCTION sync_phone_to_twilio()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if phone number or sms_opt_in changed
    IF OLD.phone IS DISTINCT FROM NEW.phone OR OLD.sms_opt_in IS DISTINCT FROM NEW.sms_opt_in THEN
        IF NEW.phone IS NOT NULL AND NEW.sms_opt_in = true THEN
            -- Insert or update twilio_customers
            INSERT INTO twilio_customers (phone_number, email, name, sms_opt_in, created_at, updated_at)
            VALUES (NEW.phone, NEW.email, COALESCE(NEW.full_name, NEW.email), true, NOW(), NOW())
            ON CONFLICT (phone_number) 
            DO UPDATE SET 
                email = EXCLUDED.email,
                name = EXCLUDED.name,
                sms_opt_in = EXCLUDED.sms_opt_in,
                updated_at = NOW();
        ELSIF OLD.phone IS NOT NULL AND (NEW.phone IS NULL OR NEW.sms_opt_in = false) THEN
            -- Remove from twilio_customers if phone cleared or SMS disabled
            DELETE FROM twilio_customers WHERE phone_number = OLD.phone;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_sync_phone_to_metadata ON profiles;
CREATE TRIGGER trigger_sync_phone_to_metadata
    AFTER UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_phone_to_metadata();

DROP TRIGGER IF EXISTS trigger_sync_phone_to_twilio ON profiles;
CREATE TRIGGER trigger_sync_phone_to_twilio
    AFTER UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_phone_to_twilio();

-- Function to get user phone number with fallback logic
CREATE OR REPLACE FUNCTION get_user_phone(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    phone_number TEXT;
BEGIN
    -- Try profiles table first (source of truth)
    SELECT phone INTO phone_number
    FROM profiles 
    WHERE id = user_id;
    
    -- If not found in profiles, try user metadata
    IF phone_number IS NULL THEN
        SELECT raw_user_meta_data->>'phone_number' INTO phone_number
        FROM auth.users 
        WHERE id = user_id;
    END IF;
    
    -- If still not found, try twilio_customers
    IF phone_number IS NULL THEN
        SELECT tc.phone_number INTO phone_number
        FROM twilio_customers tc
        JOIN profiles p ON tc.email = p.email
        WHERE p.id = user_id
        LIMIT 1;
    END IF;
    
    RETURN phone_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check SMS opt-in status
CREATE OR REPLACE FUNCTION get_user_sms_opt_in(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    sms_opt_in BOOLEAN;
BEGIN
    -- Check profiles table first
    SELECT p.sms_opt_in INTO sms_opt_in
    FROM profiles p
    WHERE p.id = user_id;
    
    -- If not found, check if they have a phone number (fallback)
    IF sms_opt_in IS NULL THEN
        SELECT (p.phone IS NOT NULL) INTO sms_opt_in
        FROM profiles p
        WHERE p.id = user_id;
    END IF;
    
    RETURN COALESCE(sms_opt_in, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 