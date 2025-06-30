-- Create twilio_customers table for SMS-based job creation
CREATE TABLE IF NOT EXISTS twilio_customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_twilio_customers_phone ON twilio_customers(phone_number);

-- Add RLS policies
ALTER TABLE twilio_customers ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (for admin management)
CREATE POLICY "Allow authenticated users to manage twilio customers" ON twilio_customers
    FOR ALL USING (auth.role() = 'authenticated');

-- Allow service role to manage twilio customers (for webhook operations)
CREATE POLICY "Allow service role to manage twilio customers" ON twilio_customers
    FOR ALL USING (auth.role() = 'service_role');

-- Add created_via column to jobs table to track job creation method
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS created_via VARCHAR(50) DEFAULT 'web'; 