-- Function to handle new user setup: creates profile and role-specific records
CREATE OR REPLACE FUNCTION public.handle_new_user_setup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
-- It's good practice to qualify table names with their schema (e.g., public.profiles)
-- instead of relying on search_path in SECURITY DEFINER functions.
AS $$
DECLARE
  v_role TEXT;
  v_full_name TEXT;
  v_user_id UUID;
BEGIN
  -- Extract data from the new auth.users record
  v_user_id := NEW.id;
  -- Access raw_user_meta_data which contains data passed in options from client
  v_role := NEW.raw_user_meta_data->>'role';
  v_full_name := NEW.raw_user_meta_data->>'full_name';

  -- The 'profiles' table schema specifies 'role' and 'full_name' as NOT NULL.
  -- If these are not provided in raw_user_meta_data, the INSERT will fail,
  -- which is the correct behavior to ensure data integrity.
  INSERT INTO public.profiles (user_id, role, full_name)
  VALUES (v_user_id, v_role, v_full_name);

  -- Insert into role-specific table based on the role
  IF v_role = 'patient' THEN
    INSERT INTO public.patients (user_id)
    VALUES (v_user_id);
  ELSIF v_role = 'doctor' THEN
    INSERT INTO public.doctors (user_id)
    VALUES (v_user_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to call the function after a new user is inserted into auth.users
-- Drop the trigger first if it might already exist from previous attempts or different versions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_setup();

-- Reminder:
-- This setup requires that 'role' and 'full_name' are passed in the `options.data` object
-- during `supabase.auth.signUp()` from the client-side.
-- For example:
-- supabase.auth.signUp({
--   email,
--   password,
--   options: {
--     data: {
--       role: 'patient', // or 'doctor'
--       full_name: 'User Full Name'
--     }
--   }
-- })
