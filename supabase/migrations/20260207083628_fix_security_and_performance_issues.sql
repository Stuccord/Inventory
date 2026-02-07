/*
  # Fix Security and Performance Issues

  ## 1. Performance Improvements - Add Missing Foreign Key Indexes
  
  Adding indexes for all unindexed foreign keys to improve query performance:
  - inventory_transactions.created_by
  - orders.created_by
  - purchase_orders.created_by
  - return_items.order_item_id
  - returns.approved_by, processed_by
  - stock_alerts.acknowledged_by
  - stock_tally.approved_by, counted_by

  ## 2. RLS Performance Optimization
  
  Wrapping all auth.uid() and auth.jwt() calls with SELECT to prevent re-evaluation
  for each row, significantly improving query performance at scale.

  ## 3. Security Fixes - Remove Overly Permissive Policies
  
  Fixing RLS policies that bypass security by being always true:
  - audit_logs: Restrict INSERT to admins only
  - inventory_transactions: Add creator tracking
  - order_items: Link to order creator
  - orders: Add creator tracking
  - sale_items: Link to sale creator
  - sales: Add creator tracking
  - stock_alerts: Restrict to system/admin only

  ## 4. Function Security
  
  Setting SECURITY DEFINER and immutable search_path for all functions to prevent
  search path manipulation attacks.
*/

-- ============================================================================
-- PART 1: ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_by 
  ON inventory_transactions(created_by);

CREATE INDEX IF NOT EXISTS idx_orders_created_by 
  ON orders(created_by);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_by 
  ON purchase_orders(created_by);

CREATE INDEX IF NOT EXISTS idx_return_items_order_item_id 
  ON return_items(order_item_id);

CREATE INDEX IF NOT EXISTS idx_returns_approved_by 
  ON returns(approved_by);

CREATE INDEX IF NOT EXISTS idx_returns_processed_by 
  ON returns(processed_by);

CREATE INDEX IF NOT EXISTS idx_stock_alerts_acknowledged_by 
  ON stock_alerts(acknowledged_by);

CREATE INDEX IF NOT EXISTS idx_stock_tally_approved_by 
  ON stock_tally(approved_by);

CREATE INDEX IF NOT EXISTS idx_stock_tally_counted_by 
  ON stock_tally(counted_by);

-- ============================================================================
-- PART 2: OPTIMIZE RLS POLICIES - WRAP auth.uid() WITH SELECT
-- ============================================================================

-- Drop and recreate user_profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON user_profiles;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- Fix categories policies
DROP POLICY IF EXISTS "Admins and managers can manage categories" ON categories;

CREATE POLICY "Admins and managers can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  );

-- Fix suppliers policies
DROP POLICY IF EXISTS "Admins and managers can manage suppliers" ON suppliers;

CREATE POLICY "Admins and managers can manage suppliers"
  ON suppliers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  );

-- Fix products policies
DROP POLICY IF EXISTS "Admins and managers can manage products" ON products;

CREATE POLICY "Admins and managers can manage products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  );

-- Fix purchase_orders policies
DROP POLICY IF EXISTS "Admins and managers can manage purchase orders" ON purchase_orders;

CREATE POLICY "Admins and managers can manage purchase orders"
  ON purchase_orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  );

-- Fix purchase_order_items policies
DROP POLICY IF EXISTS "Admins and managers can manage purchase order items" ON purchase_order_items;

CREATE POLICY "Admins and managers can manage purchase order items"
  ON purchase_order_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  );

-- Fix sales policies
DROP POLICY IF EXISTS "Admins and managers can update sales" ON sales;
DROP POLICY IF EXISTS "Admins can delete sales" ON sales;

CREATE POLICY "Admins and managers can update sales"
  ON sales FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete sales"
  ON sales FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- Fix sale_items policies
DROP POLICY IF EXISTS "Admins and managers can manage sale items" ON sale_items;

CREATE POLICY "Admins and managers can manage sale items"
  ON sale_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  );

-- Fix orders policies
DROP POLICY IF EXISTS "Admins and managers can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;

CREATE POLICY "Admins and managers can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- Fix returns policies
DROP POLICY IF EXISTS "Admins and managers can create returns" ON returns;
DROP POLICY IF EXISTS "Admins and managers can update returns" ON returns;

CREATE POLICY "Admins and managers can create returns"
  ON returns FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can update returns"
  ON returns FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  );

-- Fix return_items policies
DROP POLICY IF EXISTS "Admins and managers can manage return items" ON return_items;

CREATE POLICY "Admins and managers can manage return items"
  ON return_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  );

-- Fix stock_tally policies
DROP POLICY IF EXISTS "Admins and managers can create tallies" ON stock_tally;
DROP POLICY IF EXISTS "Admins and managers can update tallies" ON stock_tally;

CREATE POLICY "Admins and managers can create tallies"
  ON stock_tally FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can update tallies"
  ON stock_tally FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  );

-- Fix stock_tally_items policies
DROP POLICY IF EXISTS "Admins and managers can manage tally items" ON stock_tally_items;

CREATE POLICY "Admins and managers can manage tally items"
  ON stock_tally_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  );

-- Fix audit_logs policies
DROP POLICY IF EXISTS "All authenticated users can view audit logs" ON audit_logs;

CREATE POLICY "All authenticated users can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid())
    )
  );

-- ============================================================================
-- PART 3: FIX OVERLY PERMISSIVE RLS POLICIES (SECURITY VULNERABILITIES)
-- ============================================================================

-- Fix audit_logs INSERT - Should only allow admins
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- Fix inventory_transactions INSERT - Track creator properly
DROP POLICY IF EXISTS "All authenticated users can create transactions" ON inventory_transactions;

CREATE POLICY "All authenticated users can create transactions"
  ON inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

-- Fix order_items INSERT - Verify user can create orders
DROP POLICY IF EXISTS "All authenticated users can create order items" ON order_items;

CREATE POLICY "All authenticated users can create order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id 
      AND o.created_by = (select auth.uid())
    )
  );

-- Fix orders INSERT - Track creator
DROP POLICY IF EXISTS "All authenticated users can create orders" ON orders;

CREATE POLICY "All authenticated users can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

-- Fix sale_items INSERT - Verify user can create sales
DROP POLICY IF EXISTS "All authenticated users can create sale items" ON sale_items;

CREATE POLICY "All authenticated users can create sale items"
  ON sale_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales s
      WHERE s.id = sale_items.sale_id 
      AND s.created_by = (select auth.uid())
    )
  );

-- Fix sales INSERT - Track creator
DROP POLICY IF EXISTS "All authenticated users can create sales" ON sales;

CREATE POLICY "All authenticated users can create sales"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

-- Fix stock_alerts - Restrict to admin/manager only
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

-- ============================================================================
-- PART 4: FIX FUNCTION SECURITY - SET SECURITY DEFINER AND SEARCH PATH
-- ============================================================================

-- Drop existing functions with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS check_stock_alerts() CASCADE;
DROP FUNCTION IF EXISTS process_return(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS process_tally(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Recreate get_user_role function with security definer
CREATE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM user_profiles
  WHERE id = user_id;
  
  RETURN COALESCE(user_role, 'user');
END;
$$;

-- Recreate check_stock_alerts function with security definer (as TRIGGER function)
CREATE FUNCTION check_stock_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.current_stock <= NEW.minimum_stock_level AND NEW.is_active = true THEN
    INSERT INTO stock_alerts (product_id, alert_type, message, severity)
    SELECT 
      NEW.id,
      'low_stock',
      'Product ' || NEW.name || ' is below minimum stock level',
      CASE 
        WHEN NEW.current_stock = 0 THEN 'critical'
        WHEN NEW.current_stock <= NEW.minimum_stock_level / 2 THEN 'high'
        ELSE 'medium'
      END
    WHERE NOT EXISTS (
      SELECT 1 FROM stock_alerts
      WHERE product_id = NEW.id
        AND alert_type = 'low_stock'
        AND acknowledged_at IS NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate process_return function with security definer
CREATE FUNCTION process_return(return_id uuid, processor_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  return_record RECORD;
  item_record RECORD;
BEGIN
  SELECT * INTO return_record FROM returns WHERE id = return_id;
  
  IF return_record.status != 'approved' THEN
    RAISE EXCEPTION 'Return must be approved before processing';
  END IF;

  FOR item_record IN 
    SELECT * FROM return_items WHERE return_id = return_id
  LOOP
    UPDATE products
    SET current_stock = current_stock + item_record.quantity
    WHERE id = item_record.product_id;

    INSERT INTO inventory_transactions (
      product_id, transaction_type, quantity, 
      reference_type, reference_id, created_by
    )
    VALUES (
      item_record.product_id, 'return', item_record.quantity,
      'return', return_id, processor_id
    );
  END LOOP;

  UPDATE returns
  SET status = 'processed',
      processed_by = processor_id,
      processed_at = NOW()
  WHERE id = return_id;
END;
$$;

-- Recreate process_tally function with security definer
CREATE FUNCTION process_tally(tally_id uuid, approver_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  tally_record RECORD;
  item_record RECORD;
  variance integer;
BEGIN
  SELECT * INTO tally_record FROM stock_tally WHERE id = tally_id;
  
  IF tally_record.status != 'pending' THEN
    RAISE EXCEPTION 'Tally must be pending to process';
  END IF;

  FOR item_record IN 
    SELECT * FROM stock_tally_items WHERE tally_id = tally_id
  LOOP
    variance := item_record.counted_quantity - item_record.system_quantity;
    
    IF variance != 0 THEN
      UPDATE products
      SET current_stock = item_record.counted_quantity
      WHERE id = item_record.product_id;

      INSERT INTO inventory_transactions (
        product_id, transaction_type, quantity,
        reference_type, reference_id, notes, created_by
      )
      VALUES (
        item_record.product_id,
        CASE WHEN variance > 0 THEN 'adjustment_in' ELSE 'adjustment_out' END,
        ABS(variance),
        'tally', tally_id,
        'Stock tally adjustment: ' || item_record.notes,
        approver_id
      );
    END IF;
  END LOOP;

  UPDATE stock_tally
  SET status = 'approved',
      approved_by = approver_id,
      approved_at = NOW()
  WHERE id = tally_id;
END;
$$;

-- Recreate update_updated_at_column function (trigger function)
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate triggers that were dropped
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER check_product_stock_alerts
  AFTER INSERT OR UPDATE OF current_stock ON products
  FOR EACH ROW
  EXECUTE FUNCTION check_stock_alerts();