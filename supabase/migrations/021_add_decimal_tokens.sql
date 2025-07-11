-- Migration to support decimal tokens instead of integer tokens
-- This prevents giving away free miles by rounding up

-- Update tokens table to support decimal tokens
ALTER TABLE tokens 
ALTER COLUMN tokens_used TYPE DECIMAL(10,2);

-- Update enterprise_subscriptions table to support decimal tokens
ALTER TABLE enterprise_subscriptions 
ALTER COLUMN tokens_per_month TYPE DECIMAL(10,2);

-- Update the calculate_tokens_for_job function to return decimal
CREATE OR REPLACE FUNCTION calculate_tokens_for_job(job_distance_meters INTEGER)
RETURNS DECIMAL(10,2) AS $$
BEGIN
    -- Convert meters to miles and calculate tokens needed
    -- 1 token = 100 miles, no rounding up
    RETURN (job_distance_meters::DECIMAL / 160934.4 / 100);
END;
$$ LANGUAGE plpgsql;

-- Update the check_token_availability function to work with decimals
CREATE OR REPLACE FUNCTION check_token_availability(customer_uuid UUID, tokens_needed DECIMAL(10,2))
RETURNS BOOLEAN AS $$
DECLARE
    available_tokens DECIMAL(10,2);
    used_tokens DECIMAL(10,2);
BEGIN
    -- Get total tokens from active subscription
    SELECT tokens_per_month INTO available_tokens
    FROM enterprise_subscriptions
    WHERE customer_id = customer_uuid AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF available_tokens IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get used tokens for current month
    SELECT COALESCE(SUM(tokens_used), 0) INTO used_tokens
    FROM tokens t
    JOIN enterprise_subscriptions es ON t.subscription_id = es.id
    WHERE es.customer_id = customer_uuid 
    AND es.status = 'active'
    AND t.used_at >= DATE_TRUNC('month', NOW());
    
    RETURN (available_tokens - used_tokens) >= tokens_needed;
END;
$$ LANGUAGE plpgsql;

-- Add a function to get precise token usage for a customer
CREATE OR REPLACE FUNCTION get_customer_token_usage(customer_uuid UUID)
RETURNS TABLE(
    total_tokens DECIMAL(10,2),
    used_tokens DECIMAL(10,2),
    remaining_tokens DECIMAL(10,2),
    subscription_id UUID,
    plan_name VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        es.tokens_per_month as total_tokens,
        COALESCE(SUM(t.tokens_used), 0) as used_tokens,
        (es.tokens_per_month - COALESCE(SUM(t.tokens_used), 0)) as remaining_tokens,
        es.id as subscription_id,
        es.plan_name
    FROM enterprise_subscriptions es
    LEFT JOIN tokens t ON t.subscription_id = es.id 
        AND t.used_at >= DATE_TRUNC('month', NOW())
    WHERE es.customer_id = customer_uuid 
    AND es.status = 'active'
    GROUP BY es.id, es.tokens_per_month, es.plan_name
    ORDER BY es.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql; 