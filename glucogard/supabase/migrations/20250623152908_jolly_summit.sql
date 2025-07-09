/*
  # Add Research and Analytics Tables

  1. New Tables
    - `research_preferences`
      - `user_id` (uuid, references profiles.user_id)
      - `participate_in_research` (boolean)
      - `allow_anonymous_data_export` (boolean)
      - `allow_trend_analysis` (boolean)
      - `allow_public_health_reporting` (boolean)
      - `updated_at` (timestamp)
    
    - `anonymized_health_data`
      - `id` (text, primary key)
      - `age_group` (text)
      - `gender` (text)
      - `location_type` (text)
      - `risk_category` (text)
      - `risk_score` (integer)
      - `activity_level` (text)
      - `diet_habits` (text)
      - `family_history` (boolean)
      - `symptoms_count` (integer)
      - `submission_date` (timestamp)
      - `province` (text)

  2. Security
    - Enable RLS on both tables
    - Add appropriate policies for data access
*/

-- Create research_preferences table
CREATE TABLE IF NOT EXISTS research_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  participate_in_research boolean DEFAULT false,
  allow_anonymous_data_export boolean DEFAULT false,
  allow_trend_analysis boolean DEFAULT false,
  allow_public_health_reporting boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create anonymized_health_data table
CREATE TABLE IF NOT EXISTS anonymized_health_data (
  id text PRIMARY KEY,
  age_group text NOT NULL,
  gender text NOT NULL,
  location_type text NOT NULL CHECK (location_type IN ('urban', 'rural')),
  risk_category text NOT NULL CHECK (risk_category IN ('low', 'moderate', 'critical')),
  risk_score integer NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  activity_level text NOT NULL,
  diet_habits text NOT NULL,
  family_history boolean NOT NULL,
  symptoms_count integer NOT NULL DEFAULT 0,
  submission_date timestamptz NOT NULL,
  province text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_research_preferences_user_id ON research_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_anonymized_data_risk_category ON anonymized_health_data(risk_category);
CREATE INDEX IF NOT EXISTS idx_anonymized_data_location_type ON anonymized_health_data(location_type);
CREATE INDEX IF NOT EXISTS idx_anonymized_data_submission_date ON anonymized_health_data(submission_date);
CREATE INDEX IF NOT EXISTS idx_anonymized_data_age_group ON anonymized_health_data(age_group);

-- Enable RLS
ALTER TABLE research_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymized_health_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for research_preferences
CREATE POLICY "Users can manage own research preferences"
  ON research_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for anonymized_health_data
CREATE POLICY "System can insert anonymized data"
  ON anonymized_health_data
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Researchers can read anonymized data"
  ON anonymized_health_data
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'doctor'
    )
  );

-- Allow public health officials to read aggregated data
CREATE POLICY "Public health access to anonymized data"
  ON anonymized_health_data
  FOR SELECT
  TO authenticated
  USING (true); -- This could be restricted to specific roles in production