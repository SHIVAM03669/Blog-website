/*
  # Fix profile creation during signup

  1. Changes
    - Add stored procedures to handle profile creation and username checks
    - These procedures bypass RLS to allow initial profile creation
    - Maintain security by validating inputs and checking constraints

  2. Security
    - Procedures run with security definer to bypass RLS safely
    - Input validation to prevent injection
    - Proper error handling
*/

-- Function to check if a username exists
CREATE OR REPLACE FUNCTION check_username_exists(username_to_check TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE username = username_to_check
  );
END;
$$;

-- Function to create a new profile
CREATE OR REPLACE FUNCTION create_new_profile(
  user_id UUID,
  username_input TEXT
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate inputs
  IF user_id IS NULL OR username_input IS NULL THEN
    RAISE EXCEPTION 'User ID and username are required';
  END IF;

  -- Insert the profile
  INSERT INTO profiles (id, username, created_at)
  VALUES (user_id, username_input, now());

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Username is already taken';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create profile: %', SQLERRM;
END;
$$;

-- Ensure RLS is still enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Update policies to be more specific
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read any profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Recreate policies
CREATE POLICY "Profiles are readable by everyone"
  ON profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add index for username lookups if not exists
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles (username);