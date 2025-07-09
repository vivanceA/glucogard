-- Function to check if the currently authenticated user is a doctor.
-- SECURITY DEFINER allows this function to bypass the calling user's RLS
-- for its internal query on public.profiles, thus preventing recursion.
CREATE OR REPLACE FUNCTION public.is_current_user_doctor()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE public.profiles.user_id = auth.uid() AND public.profiles.role = 'doctor'
  );
$$;

-- Drop the old, recursive policy if it exists.
-- It's good practice to ensure it's dropped before attempting to create a new one
-- especially if the name is the same or similar.
DROP POLICY IF EXISTS "Doctors can read all profiles" ON public.profiles;

-- Re-create the policy for doctors to read all profiles, using the helper function.
CREATE POLICY "Doctors can read all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_current_user_doctor());

-- Reminder:
-- The policy "Users can read own profile" should still exist and function as intended:
-- CREATE POLICY "Users can read own profile"
--   ON profiles
--   FOR SELECT
--   TO authenticated
--   USING (auth.uid() = user_id);
-- RLS policies for SELECT are combined with OR, so a doctor can read all profiles,
-- and any user (patient or doctor) can read their own.
