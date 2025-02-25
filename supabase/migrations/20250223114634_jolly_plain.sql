/*
  # Fix Profile RLS Policies
  
  1. Changes
    - Drop and recreate profile policies with proper enabling
    - Add explicit policy for authenticated users
    
  2. Security
    - Maintains existing security model
    - Fixes profile creation during registration
    - Ensures proper access control
*/

-- First disable RLS temporarily to clean up policies
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create base policy for authenticated operations
CREATE POLICY "Enable all operations for authenticated users on own profile"
    ON profiles
    FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Add specific policies for public access and creation
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles
    FOR SELECT
    USING (true);

CREATE POLICY "Allow profile creation during signup"
    ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);