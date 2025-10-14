-- Add location tracking fields to tasks table
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS start_location point,
  ADD COLUMN IF NOT EXISTS completion_location point;

-- Add location tracking field to employees table
ALTER TABLE employees 
  ADD COLUMN IF NOT EXISTS location_updated_at timestamp with time zone;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_start_location ON tasks USING gist(start_location);
CREATE INDEX IF NOT EXISTS idx_tasks_completion_location ON tasks USING gist(completion_location);
CREATE INDEX IF NOT EXISTS idx_employees_location_updated_at ON employees(location_updated_at);

-- Add comments for documentation
COMMENT ON COLUMN tasks.start_location IS 'Employee geolocation when "Started" button is pressed';
COMMENT ON COLUMN tasks.completion_location IS 'Employee geolocation when "Completed" button is pressed';
COMMENT ON COLUMN employees.location_updated_at IS 'Timestamp of last location update for tracking freshness';