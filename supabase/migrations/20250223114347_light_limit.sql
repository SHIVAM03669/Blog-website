/*
  # Fix Profile Policies
  
  1. Changes
    - Drop and recreate profile policies in correct order
    - Ensure insert policy is properly configured
    
  2. Security
    - Maintains existing security model
    - Fixes profile creation during registration
*/

-- First, drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;

-- Recreate policies in correct order
CREATE POLICY "Users can create their own profile"
    ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles
    FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles
    FOR UPDATE
    USING (auth.uid() = id);