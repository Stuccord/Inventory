/*
  # Fix Orders RLS Policy for Inserts

  ## Changes
  1. Drop the restrictive INSERT policy
  2. Create a new policy that allows authenticated users to create orders
  3. The created_by field will be set automatically by a trigger

  ## Security
  - Only authenticated users can create orders
  - The created_by field is automatically populated
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "All authenticated users can create orders" ON orders;

-- Create a more permissive INSERT policy for authenticated users
CREATE POLICY "Authenticated users can create orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create a trigger to automatically set created_by if not provided
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_created_by_trigger ON orders;

CREATE TRIGGER set_created_by_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_created_by();
