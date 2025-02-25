/*
  # Add Profile Insert Policy
  
  1. Changes
    - Add RLS policy to allow authenticated users to insert their own profile
    
  2. Security
    - Policy ensures users can only create a profile with their own auth.uid
*/

-- Add policy for profile creation
CREATE POLICY "Users can create their own profile"
    ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);