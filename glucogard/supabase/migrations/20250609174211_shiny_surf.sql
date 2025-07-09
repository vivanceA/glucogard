/*
  # GlucoGard AI - Complete Database Schema

  1. New Tables
    - `profiles` - User profile information with role-based access
    - `patients` - Patient-specific health data
    - `doctors` - Healthcare provider information
    - `health_submissions` - Patient health assessment submissions
    - `risk_predictions` - AI-generated diabetes risk assessments
    - `recommendations` - Personalized health recommendations

  2. Security
    - Enable RLS on all tables
    - Role-based access policies for patients and doctors
    - Secure data isolation between users

  3. Performance
    - Optimized indexes for common queries
    - Foreign key relationships for data integrity
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table for user information
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text CHECK (role IN ('patient', 'doctor')) NOT NULL,
  full_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Patients table for patient-specific data
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  age integer,
  gender text,
  weight numeric,
  height numeric,
  created_at timestamptz DEFAULT now()
);

-- Doctors table for healthcare provider data
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  specialization text,
  created_at timestamptz DEFAULT now()
);

-- Health submissions table for assessment data
CREATE TABLE IF NOT EXISTS health_submissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  answers jsonb NOT NULL,
  status text CHECK (status IN ('pending', 'reviewed')) DEFAULT 'pending',
  submitted_at timestamptz DEFAULT now()
);

-- Risk predictions table for AI assessments
CREATE TABLE IF NOT EXISTS risk_predictions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id uuid REFERENCES health_submissions(id) ON DELETE CASCADE NOT NULL,
  risk_score integer CHECK (risk_score >= 0 AND risk_score <= 100) NOT NULL,
  risk_category text CHECK (risk_category IN ('low', 'moderate', 'critical')) NOT NULL,
  generated_at timestamptz DEFAULT now()
);

-- Recommendations table for health advice
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id uuid REFERENCES health_submissions(id) ON DELETE CASCADE NOT NULL,
  doctor_id uuid REFERENCES doctors(id) ON DELETE SET NULL,
  content text NOT NULL,
  type text CHECK (type IN ('lifestyle', 'clinical')) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Patients policies
CREATE POLICY "Patients can read own data"
  ON patients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Patients can update own data"
  ON patients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Patients can insert own data"
  ON patients
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Doctors can read patient data"
  ON patients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'doctor'
    )
  );

-- Doctors policies
CREATE POLICY "Doctors can read own data"
  ON doctors
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Doctors can update own data"
  ON doctors
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Doctors can insert own data"
  ON doctors
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Health submissions policies
CREATE POLICY "Patients can read own submissions"
  ON health_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = health_submissions.patient_id
      AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "Patients can insert own submissions"
  ON health_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = health_submissions.patient_id
      AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can read all submissions"
  ON health_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'doctor'
    )
  );

CREATE POLICY "Doctors can update submission status"
  ON health_submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'doctor'
    )
  );

-- Risk predictions policies
CREATE POLICY "Patients can read own predictions"
  ON risk_predictions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM health_submissions
      JOIN patients ON patients.id = health_submissions.patient_id
      WHERE health_submissions.id = risk_predictions.submission_id
      AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert predictions"
  ON risk_predictions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Doctors can read all predictions"
  ON risk_predictions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'doctor'
    )
  );

-- Recommendations policies
CREATE POLICY "Patients can read own recommendations"
  ON recommendations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM health_submissions
      JOIN patients ON patients.id = health_submissions.patient_id
      WHERE health_submissions.id = recommendations.submission_id
      AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert recommendations"
  ON recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Doctors can read all recommendations"
  ON recommendations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'doctor'
    )
  );

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

CREATE POLICY "Doctors can update recommendations"
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

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_health_submissions_patient_id ON health_submissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_submissions_status ON health_submissions(status);
CREATE INDEX IF NOT EXISTS idx_health_submissions_submitted_at ON health_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_risk_predictions_submission_id ON risk_predictions(submission_id);
CREATE INDEX IF NOT EXISTS idx_risk_predictions_category ON risk_predictions(risk_category);
CREATE INDEX IF NOT EXISTS idx_recommendations_submission_id ON recommendations(submission_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_doctor_id ON recommendations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_type ON recommendations(type);

-- Unique constraints
ALTER TABLE profiles ADD CONSTRAINT unique_user_profile UNIQUE (user_id);
ALTER TABLE patients ADD CONSTRAINT unique_user_patient UNIQUE (user_id);
ALTER TABLE doctors ADD CONSTRAINT unique_user_doctor UNIQUE (user_id);