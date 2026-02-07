/*
  # Fix Insert Permissions for Managers and Admins

  ## Changes
  
  Adding explicit WITH CHECK clauses to policies that use FOR ALL to ensure
  INSERT operations work properly for admins and managers.
  
  Tables affected:
  - categories
  - suppliers  
  - products
  - purchase_orders
  - purchase_order_items
  - sale_items
  - return_items
  - stock_tally_items
  - stock_alerts
*/

-- Fix categories policy
DROP POLICY IF EXISTS "Admins and managers can manage categories" ON categories;

CREATE POLICY "Admins and managers can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  );

-- Fix suppliers policy
DROP POLICY IF EXISTS "Admins and managers can manage suppliers" ON suppliers;

CREATE POLICY "Admins and managers can manage suppliers"
  ON suppliers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  );

-- Fix products policy
DROP POLICY IF EXISTS "Admins and managers can manage products" ON products;

CREATE POLICY "Admins and managers can manage products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  );

-- Fix purchase_orders policy
DROP POLICY IF EXISTS "Admins and managers can manage purchase orders" ON purchase_orders;

CREATE POLICY "Admins and managers can manage purchase orders"
  ON purchase_orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  );

-- Fix purchase_order_items policy
DROP POLICY IF EXISTS "Admins and managers can manage purchase order items" ON purchase_order_items;

CREATE POLICY "Admins and managers can manage purchase order items"
  ON purchase_order_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  );

-- Fix sale_items policy  
DROP POLICY IF EXISTS "Admins and managers can manage sale items" ON sale_items;

CREATE POLICY "Admins and managers can manage sale items"
  ON sale_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  );

-- Fix return_items policy
DROP POLICY IF EXISTS "Admins and managers can manage return items" ON return_items;

CREATE POLICY "Admins and managers can manage return items"
  ON return_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  );

-- Fix stock_tally_items policy
DROP POLICY IF EXISTS "Admins and managers can manage tally items" ON stock_tally_items;

CREATE POLICY "Admins and managers can manage tally items"
  ON stock_tally_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  );

-- Fix stock_alerts policy
DROP POLICY IF EXISTS "System can manage alerts" ON stock_alerts;

CREATE POLICY "System can manage alerts"
  ON stock_alerts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  );