-- Add driver location fields to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS driver_lat DECIMAL(10, 8);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS driver_lng DECIMAL(11, 8);

-- Add index for better performance when querying driver locations
CREATE INDEX IF NOT EXISTS idx_jobs_driver_location ON jobs(driver_lat, driver_lng) WHERE driver_lat IS NOT NULL AND driver_lng IS NOT NULL; 