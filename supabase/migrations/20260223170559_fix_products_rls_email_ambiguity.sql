/*
  # Fix Products RLS Email Ambiguity

  1. Changes
    - Drop existing products RLS policies
    - Recreate with fully qualified column references to avoid ambiguity
  
  2. Security
    - Maintains same security model
    - Admins and managers can manage products
    - All authenticated users can view products
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins and managers can manage products" ON products;
DROP POLICY IF EXISTS "All authenticated users can view products" ON products;

-- Recreate with explicit table references
CREATE POLICY "All authenticated users can view products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can delete products"
  ON products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('admin', 'manager')
    )
  );
