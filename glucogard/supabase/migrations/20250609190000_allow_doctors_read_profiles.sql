-- Add RLS policy to allow doctors to read all profiles.
-- This is necessary for doctors to view patient names and other profile information.

CREATE POLICY "Doctors can read all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS p_check
      WHERE p_check.user_id = auth.uid() AND p_check.role = 'doctor'
    )
  );

-- Note: This policy grants read access to all rows in the 'profiles' table
-- if the requesting user has the 'doctor' role.
-- The existing policy "Users can read own profile" will still allow
-- any authenticated user (patient or doctor) to read their own profile.
-- RLS policies are combined with OR for SELECT statements if multiple policies match.
