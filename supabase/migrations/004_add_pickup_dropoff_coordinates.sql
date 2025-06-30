-- Add pickup and dropoff coordinate fields to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS pickup_lat DECIMAL(10, 8);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS pickup_lng DECIMAL(11, 8);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS dropoff_lat DECIMAL(10, 8);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS dropoff_lng DECIMAL(11, 8);

-- Add indexes for better performance when querying pickup and dropoff locations
CREATE INDEX IF NOT EXISTS idx_jobs_pickup_location ON jobs(pickup_lat, pickup_lng) WHERE pickup_lat IS NOT NULL AND pickup_lng IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_dropoff_location ON jobs(dropoff_lat, dropoff_lng) WHERE dropoff_lat IS NOT NULL AND dropoff_lng IS NOT NULL; 