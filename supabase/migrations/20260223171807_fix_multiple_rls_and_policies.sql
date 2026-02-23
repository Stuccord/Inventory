/*
  # Fix Multiple RLS Issues and Missing Policies

  1. Changes
    - Fix order_items RLS policy to avoid email ambiguity
    - Fix orders RLS policies with explicit table aliases
    - Add DELETE policy for returns table
  
  2. Security
    - Maintains existing security model
    - Admins and managers can delete returns
    - All policies use explicit table references to avoid ambiguity
*/

-- Fix order_items policies with explicit aliases
DROP POLICY IF EXISTS "All authenticated users can create order items" ON order_items;
DROP POLICY IF EXISTS "All authenticated users can view order items" ON order_items;

CREATE POLICY "All authenticated users can view order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can create order items"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
      AND o.created_by = auth.uid()
    )
  );

-- Fix orders policies with explicit aliases
DROP POLICY IF EXISTS "Admins and managers can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;

CREATE POLICY "Admins and managers can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'admin'
    )
  );

-- Add missing DELETE policy for returns
CREATE POLICY "Admins and managers can delete returns"
  ON returns
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('admin', 'manager')
    )
  );
