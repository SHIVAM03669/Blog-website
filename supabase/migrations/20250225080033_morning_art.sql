/*
  # Fix profile creation policies

  1. Changes
    - Update RLS policies for profiles table to allow proper profile creation
    - Ensure authenticated users can create their own profile
    - Fix profile creation during signup

  2. Security
    - Maintain secure access controls
    - Allow profile creation only for the authenticated user
*/

-- First, clean up existing policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users on own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;

-- Create new, more specific policies
CREATE POLICY "Users can create their own profile"
    ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read any profile"
    ON profiles
    FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Add index for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles (username);