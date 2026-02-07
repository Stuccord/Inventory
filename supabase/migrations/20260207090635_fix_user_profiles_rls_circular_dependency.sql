/*
  # Fix User Profiles RLS Circular Dependency

  ## Problem
  The user_profiles table has a circular dependency in its RLS policies. When a user logs in,
  the query to fetch their profile triggers the "Admins can view all profiles" policy, which
  tries to query user_profiles again to check if they're an admin. This creates an infinite
  recursion or query error.

  ## Solution
  1. Create a security definer function that bypasses RLS to check user role
  2. Update user_profiles policies to use this function instead of direct table queries
  3. This breaks the circular dependency while maintaining security

  ## Security Notes
  - The get_user_role_secure function uses SECURITY DEFINER to bypass RLS
  - It only returns the role for the current authenticated user
  - This is safe because it only exposes data about the requester themselves
*/

-- ============================================================================
-- PART 1: CREATE SECURE ROLE CHECKING FUNCTION
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_user_role_secure() CASCADE;

-- Create a security definer function that bypasses RLS to check the current user's role
CREATE OR REPLACE FUNCTION get_user_role_secure()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM user_profiles
  WHERE id = auth.uid();
  
  RETURN user_role;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_role_secure() TO authenticated;

-- ============================================================================
-- PART 2: UPDATE USER_PROFILES RLS POLICIES
-- ============================================================================

-- Drop all existing user_profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON user_profiles;

-- Create new policies using the security definer function

-- Policy 1: Users can always view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy 2: Admins can view all profiles (uses security definer function)
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (get_user_role_secure() = 'admin');

-- Policy 3: Admins can insert new profiles
CREATE POLICY "Admins can insert profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role_secure() = 'admin');

-- Policy 4: Admins can update any profile
CREATE POLICY "Admins can update profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (get_user_role_secure() = 'admin')
  WITH CHECK (get_user_role_secure() = 'admin');

-- Policy 5: Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (get_user_role_secure() = 'admin');
