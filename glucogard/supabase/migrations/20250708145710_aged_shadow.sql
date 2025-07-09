/*
  # Diabetes Management Tables

  1. New Tables
    - `diabetes_tasks` - Daily tasks and reminders for diabetes management
    - `blood_sugar_readings` - Blood glucose monitoring records
    - `medication_reminders` - Medication schedules and reminders

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Proper indexes for performance

  3. Features
    - Task completion tracking with streaks
    - Blood sugar trend monitoring
    - Medication adherence tracking
*/

-- Diabetes tasks table for daily management
CREATE TABLE IF NOT EXISTS diabetes_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('medication', 'blood_sugar', 'exercise', 'meal', 'hydration', 'foot_check', 'weight')),
  title text NOT NULL,
  description text NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  time text, -- HH:MM format
  completed boolean DEFAULT false,
  completed_at timestamptz,
  streak integer DEFAULT 0,
  icon text NOT NULL,
  color text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Blood sugar readings table
CREATE TABLE IF NOT EXISTS blood_sugar_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reading numeric NOT NULL CHECK (reading > 0 AND reading < 1000),
  reading_type text NOT NULL CHECK (reading_type IN ('fasting', 'post_meal', 'bedtime', 'random')),
  notes text,
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Medication reminders table
CREATE TABLE IF NOT EXISTS medication_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  times text[] NOT NULL, -- Array of HH:MM times
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diabetes_tasks_user_id ON diabetes_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_diabetes_tasks_type ON diabetes_tasks(type);
CREATE INDEX IF NOT EXISTS idx_diabetes_tasks_frequency ON diabetes_tasks(frequency);
CREATE INDEX IF NOT EXISTS idx_diabetes_tasks_completed ON diabetes_tasks(completed);
CREATE INDEX IF NOT EXISTS idx_diabetes_tasks_completed_at ON diabetes_tasks(completed_at);

CREATE INDEX IF NOT EXISTS idx_blood_sugar_readings_user_id ON blood_sugar_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_blood_sugar_readings_recorded_at ON blood_sugar_readings(recorded_at);
CREATE INDEX IF NOT EXISTS idx_blood_sugar_readings_type ON blood_sugar_readings(reading_type);

CREATE INDEX IF NOT EXISTS idx_medication_reminders_user_id ON medication_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_reminders_active ON medication_reminders(active);

-- Enable Row Level Security
ALTER TABLE diabetes_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_sugar_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for diabetes_tasks
CREATE POLICY "Users can manage own diabetes tasks"
  ON diabetes_tasks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for blood_sugar_readings
CREATE POLICY "Users can manage own blood sugar readings"
  ON blood_sugar_readings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for medication_reminders
CREATE POLICY "Users can manage own medication reminders"
  ON medication_reminders
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_diabetes_tasks_updated_at
  BEFORE UPDATE ON diabetes_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medication_reminders_updated_at
  BEFORE UPDATE ON medication_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();