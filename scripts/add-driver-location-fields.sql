-- Add driver location fields to jobs table
-- Run this script in your Supabase SQL editor or database client

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS driver_lat DECIMAL(10, 8);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS driver_lng DECIMAL(11, 8);

-- Add index for better performance when querying driver locations
CREATE INDEX IF NOT EXISTS idx_jobs_driver_location ON jobs(driver_lat, driver_lng) WHERE driver_lat IS NOT NULL AND driver_lng IS NOT NULL;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
AND column_name IN ('driver_lat', 'driver_lng'); 