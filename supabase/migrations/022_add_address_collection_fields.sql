-- Add fields for address collection flow
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS needs_pickup_address BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS needs_dropoff_address BOOLEAN DEFAULT FALSE;

-- Add status for pending address jobs
-- Note: 'pending_address' will be a new status value 