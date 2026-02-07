/*
  # Add Returns, Tally, and Audit System

  ## New Tables

  ### 1. orders (replacing sales)
  - Enhanced order management with customer tracking
  - Order status workflow
  - Multiple items per order

  ### 2. order_items
  - Line items for orders
  - Track quantities and prices

  ### 3. returns
  - Order return management
  - Full or partial returns
  - Restock or mark damaged

  ### 4. return_items
  - Individual items being returned
  - Return reasons and quantities

  ### 5. stock_tally
  - Physical inventory counting
  - Variance tracking
  - Approval workflow

  ### 6. stock_tally_items
  - Individual product counts
  - System vs actual quantities

  ### 7. audit_logs
  - Track all system activities
  - User actions with timestamps

  ## Changes
  - Rename sales to orders for better clarity
  - Add comprehensive audit trail
  - Implement return workflow
  - Add tally/stock counting system
*/

-- Create orders table (enhanced from sales)
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  order_date date DEFAULT CURRENT_DATE,
  customer_name text DEFAULT '',
  customer_phone text DEFAULT '',
  customer_email text DEFAULT '',
  subtotal decimal(10, 2) DEFAULT 0,
  discount decimal(10, 2) DEFAULT 0,
  tax decimal(10, 2) DEFAULT 0,
  total_amount decimal(10, 2) DEFAULT 0,
  payment_method text DEFAULT 'cash',
  payment_status text DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'partial')),
  order_status text DEFAULT 'completed' CHECK (order_status IN ('pending', 'processing', 'completed', 'cancelled')),
  notes text DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(10, 2) NOT NULL,
  total_price decimal(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create returns table
CREATE TABLE IF NOT EXISTS returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number text UNIQUE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  return_date date DEFAULT CURRENT_DATE,
  return_type text DEFAULT 'full' CHECK (return_type IN ('full', 'partial')),
  return_reason text NOT NULL,
  refund_amount decimal(10, 2) DEFAULT 0,
  restock boolean DEFAULT true,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  notes text DEFAULT '',
  processed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create return_items table
CREATE TABLE IF NOT EXISTS return_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid REFERENCES returns(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  order_item_id uuid REFERENCES order_items(id) ON DELETE SET NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(10, 2) NOT NULL,
  total_price decimal(10, 2) NOT NULL,
  condition text DEFAULT 'good' CHECK (condition IN ('good', 'damaged', 'expired')),
  restock boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create stock_tally table
CREATE TABLE IF NOT EXISTS stock_tally (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tally_number text UNIQUE NOT NULL,
  tally_date date DEFAULT CURRENT_DATE,
  location text DEFAULT 'main',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'approved')),
  total_variance integer DEFAULT 0,
  notes text DEFAULT '',
  counted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create stock_tally_items table
CREATE TABLE IF NOT EXISTS stock_tally_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tally_id uuid REFERENCES stock_tally(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  system_quantity integer NOT NULL,
  counted_quantity integer NOT NULL,
  variance integer GENERATED ALWAYS AS (counted_quantity - system_quantity) STORED,
  variance_reason text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_name);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_returns_order ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_returns_date ON returns(return_date DESC);
CREATE INDEX IF NOT EXISTS idx_return_items_return ON return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_return_items_product ON return_items(product_id);
CREATE INDEX IF NOT EXISTS idx_tally_status ON stock_tally(status);
CREATE INDEX IF NOT EXISTS idx_tally_date ON stock_tally(tally_date DESC);
CREATE INDEX IF NOT EXISTS idx_tally_items_tally ON stock_tally_items(tally_id);
CREATE INDEX IF NOT EXISTS idx_tally_items_product ON stock_tally_items(product_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_tally ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_tally_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
CREATE POLICY "All authenticated users can view orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins and managers can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Admins can delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for order_items
CREATE POLICY "All authenticated users can view order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can create order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for returns
CREATE POLICY "All authenticated users can view returns"
  ON returns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can create returns"
  ON returns FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can update returns"
  ON returns FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for return_items
CREATE POLICY "All authenticated users can view return items"
  ON return_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage return items"
  ON return_items FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for stock_tally
CREATE POLICY "All authenticated users can view tallies"
  ON stock_tally FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can create tallies"
  ON stock_tally FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Admins and managers can update tallies"
  ON stock_tally FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for stock_tally_items
CREATE POLICY "All authenticated users can view tally items"
  ON stock_tally_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage tally items"
  ON stock_tally_items FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for audit_logs
CREATE POLICY "All authenticated users can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager', 'auditor'));

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_returns_updated_at
  BEFORE UPDATE ON returns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_tally_updated_at
  BEFORE UPDATE ON stock_tally
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to process return and update inventory
CREATE OR REPLACE FUNCTION process_return(return_id_param uuid)
RETURNS void AS $$
DECLARE
  return_item RECORD;
BEGIN
  FOR return_item IN 
    SELECT ri.product_id, ri.quantity, ri.restock
    FROM return_items ri
    WHERE ri.return_id = return_id_param
  LOOP
    IF return_item.restock THEN
      UPDATE products
      SET current_stock = current_stock + return_item.quantity
      WHERE id = return_item.product_id;
      
      INSERT INTO inventory_transactions (
        product_id,
        transaction_type,
        quantity,
        previous_stock,
        new_stock,
        reference_type,
        reference_id,
        notes,
        created_by
      )
      SELECT 
        return_item.product_id,
        'adjustment',
        return_item.quantity,
        p.current_stock - return_item.quantity,
        p.current_stock,
        'return',
        return_id_param,
        'Return restocked',
        (SELECT processed_by FROM returns WHERE id = return_id_param)
      FROM products p
      WHERE p.id = return_item.product_id;
    END IF;
  END LOOP;
  
  UPDATE returns
  SET status = 'completed', updated_at = now()
  WHERE id = return_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process tally and update inventory
CREATE OR REPLACE FUNCTION process_tally(tally_id_param uuid)
RETURNS void AS $$
DECLARE
  tally_item RECORD;
BEGIN
  FOR tally_item IN 
    SELECT sti.product_id, sti.system_quantity, sti.counted_quantity, sti.variance
    FROM stock_tally_items sti
    WHERE sti.tally_id = tally_id_param AND sti.variance != 0
  LOOP
    UPDATE products
    SET current_stock = tally_item.counted_quantity
    WHERE id = tally_item.product_id;
    
    INSERT INTO inventory_transactions (
      product_id,
      transaction_type,
      quantity,
      previous_stock,
      new_stock,
      reference_type,
      reference_id,
      notes,
      created_by
    )
    SELECT 
      tally_item.product_id,
      'adjustment',
      tally_item.variance,
      tally_item.system_quantity,
      tally_item.counted_quantity,
      'tally',
      tally_id_param,
      'Stock tally adjustment',
      (SELECT approved_by FROM stock_tally WHERE id = tally_id_param)
    FROM products p
    WHERE p.id = tally_item.product_id;
  END LOOP;
  
  UPDATE stock_tally
  SET status = 'approved', updated_at = now()
  WHERE id = tally_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;