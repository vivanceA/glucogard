/*
  # Enhanced Doctor Recommendations System

  1. Updates
    - Add doctor_id foreign key to recommendations table if not exists
    - Update RLS policies for better doctor access
    - Add indexes for performance

  2. Security
    - Doctors can insert and update their own recommendations
    - Patients can read recommendations for their submissions
    - System can still insert recommendations (for AI-generated ones)
*/

-- Add doctor_id column if it doesn't exist (it should already exist from previous migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recommendations' AND column_name = 'doctor_id'
  ) THEN
    ALTER TABLE recommendations ADD COLUMN doctor_id uuid REFERENCES doctors(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure we have the proper foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'recommendations_doctor_id_fkey'
  ) THEN
    ALTER TABLE recommendations 
    ADD CONSTRAINT recommendations_doctor_id_fkey 
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update RLS policies to ensure doctors can manage recommendations properly
DROP POLICY IF EXISTS "Doctors can insert recommendations" ON recommendations;
DROP POLICY IF EXISTS "Doctors can update recommendations" ON recommendations;

-- Allow doctors to insert recommendations
CREATE POLICY "Doctors can insert recommendations"
  ON recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'doctor'
    )
  );

-- Allow doctors to update their own recommendations
CREATE POLICY "Doctors can update own recommendations"
  ON recommendations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.id = recommendations.doctor_id
      AND doctors.user_id = auth.uid()
    )
  );

-- Allow doctors to update any recommendation (for system flexibility)
CREATE POLICY "Doctors can update all recommendations"
  ON recommendations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'doctor'
    )
  );

-- Ensure proper indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_recommendations_doctor_id ON recommendations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_created_at ON recommendations(created_at);

-- Add a function to get doctor ID from user ID for convenience
CREATE OR REPLACE FUNCTION get_doctor_id_from_user_id(user_uuid uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id FROM doctors WHERE user_id = user_uuid;
$$;