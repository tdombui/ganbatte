-- Fix RLS Policies for customers table
-- Drop existing policies first
DROP POLICY IF EXISTS "Customers can view own data" ON customers;
DROP POLICY IF EXISTS "Customers can update own data" ON customers;
DROP POLICY IF EXISTS "Staff can view all customers" ON customers;

-- Recreate customer policies with better logic
CREATE POLICY "Customers can view own data" ON customers
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Customers can update own data" ON customers
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Customers can insert own data" ON customers
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Staff can view all customers" ON customers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('staff', 'admin')
        )
    );

-- Fix RLS Policies for staff table
-- Drop existing policies first
DROP POLICY IF EXISTS "Staff can view own data" ON staff;
DROP POLICY IF EXISTS "Admins can view all staff" ON staff;

-- Recreate staff policies with better logic
CREATE POLICY "Staff can view own data" ON staff
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Staff can update own data" ON staff
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Staff can insert own data" ON staff
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all staff" ON staff
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Add a policy to allow the trigger function to insert customer records
CREATE POLICY "Allow trigger insert for customers" ON customers
    FOR INSERT WITH CHECK (true);

-- Add a policy to allow the trigger function to insert staff records  
CREATE POLICY "Allow trigger insert for staff" ON staff
    FOR INSERT WITH CHECK (true); 