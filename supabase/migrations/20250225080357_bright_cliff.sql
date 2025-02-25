/*
  # Fix profile creation policies

  1. Changes
    - Simplify profile creation approach
    - Remove complex RPC functions in favor of direct policies
    - Add specific policy for profile creation during signup

  2. Security
    - Maintain RLS security
    - Allow profile creation during signup
    - Preserve read/update policies
*/

-- First, clean up any existing policies
DROP POLICY IF EXISTS "Profiles are readable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;

-- Drop unused functions
DROP FUNCTION IF EXISTS check_username_exists(TEXT);
DROP FUNCTION IF EXISTS create_new_profile(UUID, TEXT);

-- Create new, simplified policies
CREATE POLICY "Profiles are readable by everyone"
  ON profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add index for username lookups if not exists
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles (username);