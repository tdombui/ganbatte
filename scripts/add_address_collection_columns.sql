-- Add address collection fields to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS needs_pickup_address BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS needs_dropoff_address BOOLEAN DEFAULT FALSE;

-- Add comment to document the purpose
COMMENT ON COLUMN jobs.needs_pickup_address IS 'Indicates if the job needs a complete pickup address';
COMMENT ON COLUMN jobs.needs_dropoff_address IS 'Indicates if the job needs a complete dropoff address'; 