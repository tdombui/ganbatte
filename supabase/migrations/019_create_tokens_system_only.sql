-- Create enterprise subscriptions table
CREATE TABLE IF NOT EXISTS enterprise_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    plan_name VARCHAR(100) NOT NULL,
    monthly_amount DECIMAL(10,2) NOT NULL,
    tokens_per_month INTEGER NOT NULL,
    miles_per_token INTEGER NOT NULL DEFAULT 100,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'unpaid')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tokens table for tracking usage
CREATE TABLE IF NOT EXISTS tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_id UUID REFERENCES enterprise_subscriptions(id) ON DELETE CASCADE NOT NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    tokens_used INTEGER NOT NULL DEFAULT 1,
    miles_covered INTEGER NOT NULL,
    description TEXT,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_enterprise_subscriptions_customer_id ON enterprise_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_subscriptions_stripe_subscription_id ON enterprise_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_tokens_subscription_id ON tokens(subscription_id);
CREATE INDEX IF NOT EXISTS idx_tokens_job_id ON tokens(job_id);

-- Enable RLS
ALTER TABLE enterprise_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for enterprise_subscriptions (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enterprise_subscriptions' AND policyname = 'Customers can view own subscriptions') THEN
        CREATE POLICY "Customers can view own subscriptions" ON enterprise_subscriptions
            FOR SELECT USING (
                customer_id IN (
                    SELECT id FROM customers WHERE id = auth.uid()
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enterprise_subscriptions' AND policyname = 'Staff can view all subscriptions') THEN
        CREATE POLICY "Staff can view all subscriptions" ON enterprise_subscriptions
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.role IN ('staff', 'admin')
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enterprise_subscriptions' AND policyname = 'Staff can create subscriptions') THEN
        CREATE POLICY "Staff can create subscriptions" ON enterprise_subscriptions
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.role IN ('staff', 'admin')
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enterprise_subscriptions' AND policyname = 'Staff can update subscriptions') THEN
        CREATE POLICY "Staff can update subscriptions" ON enterprise_subscriptions
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.role IN ('staff', 'admin')
                )
            );
    END IF;
END $$;

-- RLS Policies for tokens (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tokens' AND policyname = 'Customers can view own tokens') THEN
        CREATE POLICY "Customers can view own tokens" ON tokens
            FOR SELECT USING (
                subscription_id IN (
                    SELECT id FROM enterprise_subscriptions WHERE customer_id = auth.uid()
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tokens' AND policyname = 'Staff can view all tokens') THEN
        CREATE POLICY "Staff can view all tokens" ON tokens
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.role IN ('staff', 'admin')
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tokens' AND policyname = 'Staff can create tokens') THEN
        CREATE POLICY "Staff can create tokens" ON tokens
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.role IN ('staff', 'admin')
                )
            );
    END IF;
END $$;

-- Function to calculate tokens needed for a job
CREATE OR REPLACE FUNCTION calculate_tokens_for_job(job_distance_meters INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Convert meters to miles and calculate tokens needed
    -- 1 token = 100 miles, round up
    RETURN CEIL(job_distance_meters::DECIMAL / 160934.4 / 100);
END;
$$ LANGUAGE plpgsql;

-- Function to check if customer has enough tokens
CREATE OR REPLACE FUNCTION check_token_availability(customer_uuid UUID, tokens_needed INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    available_tokens INTEGER;
    used_tokens INTEGER;
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

-- Create trigger for updated_at
CREATE TRIGGER update_enterprise_subscriptions_updated_at
    BEFORE UPDATE ON enterprise_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 