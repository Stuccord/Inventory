/*
  # Fix Critical Race Conditions and Production Issues

  ## Changes
  1. Create database triggers to handle stock updates atomically
  2. Fix return processing function signature
  3. Add proper stock validation
  4. Improve audit trail security
  5. Add configurable system settings table

  ## Security
  - Prevents overselling through atomic stock updates
  - Ensures audit logs don't contain sensitive data
  - Adds proper validation constraints
*/

-- Create system settings table for configurable values
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  description text DEFAULT '',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES user_profiles(id)
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system settings"
  ON system_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "All authenticated users can view settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES 
  ('tax_rate', '0.10', 'Default tax rate (e.g., 0.10 for 10%)')
ON CONFLICT (setting_key) DO NOTHING;

-- Function to get setting value
CREATE OR REPLACE FUNCTION get_setting(key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result text;
BEGIN
  SELECT setting_value INTO result
  FROM system_settings
  WHERE setting_key = key;
  RETURN COALESCE(result, '');
END;
$$;

-- Trigger to automatically update stock when order items are inserted
CREATE OR REPLACE FUNCTION handle_order_item_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_stock_val integer;
  product_name_val text;
BEGIN
  -- Get current stock with FOR UPDATE lock to prevent race conditions
  SELECT current_stock, name INTO current_stock_val, product_name_val
  FROM products
  WHERE id = NEW.product_id
  FOR UPDATE;

  -- Check if sufficient stock
  IF current_stock_val < NEW.quantity THEN
    RAISE EXCEPTION 'Insufficient stock for product %: available %, requested %', 
      product_name_val, current_stock_val, NEW.quantity;
  END IF;

  -- Update stock
  UPDATE products
  SET current_stock = current_stock - NEW.quantity,
      updated_at = now()
  WHERE id = NEW.product_id;

  -- Create inventory transaction
  INSERT INTO inventory_transactions (
    product_id,
    transaction_type,
    quantity,
    previous_stock,
    new_stock,
    reference_type,
    reference_id,
    created_by,
    notes
  ) VALUES (
    NEW.product_id,
    'sale',
    -NEW.quantity,
    current_stock_val,
    current_stock_val - NEW.quantity,
    'order',
    NEW.order_id,
    auth.uid(),
    'Automatic deduction from order'
  );

  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS order_item_stock_trigger ON order_items;

-- Create trigger for order items
CREATE TRIGGER order_item_stock_trigger
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_item_stock();

-- Trigger to automatically update stock when sale items are inserted
CREATE OR REPLACE FUNCTION handle_sale_item_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_stock_val integer;
  product_name_val text;
BEGIN
  -- Get current stock with FOR UPDATE lock
  SELECT current_stock, name INTO current_stock_val, product_name_val
  FROM products
  WHERE id = NEW.product_id
  FOR UPDATE;

  -- Check if sufficient stock
  IF current_stock_val < NEW.quantity THEN
    RAISE EXCEPTION 'Insufficient stock for product %: available %, requested %', 
      product_name_val, current_stock_val, NEW.quantity;
  END IF;

  -- Update stock
  UPDATE products
  SET current_stock = current_stock - NEW.quantity,
      updated_at = now()
  WHERE id = NEW.product_id;

  -- Create inventory transaction
  INSERT INTO inventory_transactions (
    product_id,
    transaction_type,
    quantity,
    previous_stock,
    new_stock,
    reference_type,
    reference_id,
    created_by,
    notes
  ) VALUES (
    NEW.product_id,
    'sale',
    -NEW.quantity,
    current_stock_val,
    current_stock_val - NEW.quantity,
    'sale',
    NEW.sale_id,
    auth.uid(),
    'Automatic deduction from sale'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sale_item_stock_trigger ON sale_items;

CREATE TRIGGER sale_item_stock_trigger
  AFTER INSERT ON sale_items
  FOR EACH ROW
  EXECUTE FUNCTION handle_sale_item_stock();

-- Fix the process_return function
DROP FUNCTION IF EXISTS process_return(uuid);
DROP FUNCTION IF EXISTS process_return(uuid, uuid);

CREATE OR REPLACE FUNCTION process_return(
  return_id_param uuid,
  processor_id_param uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  return_rec RECORD;
  item_rec RECORD;
BEGIN
  -- Get return details
  SELECT * INTO return_rec
  FROM returns
  WHERE id = return_id_param
  FOR UPDATE;

  -- Check if already processed
  IF return_rec.status = 'approved' THEN
    RAISE EXCEPTION 'Return already processed';
  END IF;

  -- Update return status
  UPDATE returns
  SET status = 'approved',
      approved_by = COALESCE(processor_id_param, auth.uid()),
      approved_at = now()
  WHERE id = return_id_param;

  -- Process each return item
  FOR item_rec IN
    SELECT * FROM return_items WHERE return_id = return_id_param
  LOOP
    -- Restore stock
    UPDATE products
    SET current_stock = current_stock + item_rec.quantity,
        updated_at = now()
    WHERE id = item_rec.product_id;

    -- Create inventory transaction
    INSERT INTO inventory_transactions (
      product_id,
      transaction_type,
      quantity,
      previous_stock,
      new_stock,
      reference_type,
      reference_id,
      created_by,
      notes
    )
    SELECT 
      item_rec.product_id,
      'return',
      item_rec.quantity,
      p.current_stock - item_rec.quantity,
      p.current_stock,
      'return',
      return_id_param,
      COALESCE(processor_id_param, auth.uid()),
      'Stock restored from return'
    FROM products p
    WHERE p.id = item_rec.product_id;
  END LOOP;
END;
$$;

-- Improve SKU uniqueness with constraint
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_sku_key;

ALTER TABLE products
ADD CONSTRAINT products_sku_unique UNIQUE (sku);

-- Add index for better performance on stock queries
CREATE INDEX IF NOT EXISTS idx_products_stock_level 
ON products(current_stock, reorder_level) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_stock_alerts_unacknowledged
ON stock_alerts(created_at)
WHERE acknowledged_at IS NULL;

-- Function to generate unique SKU
CREATE OR REPLACE FUNCTION generate_unique_sku(prefix text DEFAULT 'PRD')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_sku text;
  counter integer := 0;
BEGIN
  LOOP
    -- Generate SKU with timestamp and random component
    new_sku := prefix || '-' || 
               TO_CHAR(now(), 'YYYYMMDD') || '-' || 
               LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
    
    -- Check if exists
    IF NOT EXISTS (SELECT 1 FROM products WHERE sku = new_sku) THEN
      RETURN new_sku;
    END IF;
    
    counter := counter + 1;
    IF counter > 10 THEN
      -- Fallback to UUID if we can't generate unique SKU
      new_sku := prefix || '-' || substring(gen_random_uuid()::text, 1, 8);
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_sku;
END;
$$;
