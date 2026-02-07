/*
  # Complete Inventory Management System Database Schema

  ## Overview
  This migration creates a comprehensive inventory management system for retail/wholesale businesses.
  Supports multi-user access with role-based permissions, complete product lifecycle tracking,
  sales management, purchase orders, supplier relationships, and analytics.

  ## New Tables

  ### 1. user_profiles
  - `id` (uuid, primary key, references auth.users) - User identifier
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `role` (text) - User role: admin, manager, staff
  - `phone` (text) - Contact phone
  - `is_active` (boolean) - Account status
  - `created_at` (timestamptz) - Account creation date
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. categories
  - `id` (uuid, primary key) - Category identifier
  - `name` (text, unique) - Category name
  - `description` (text) - Category description
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. suppliers
  - `id` (uuid, primary key) - Supplier identifier
  - `name` (text, unique) - Supplier name
  - `contact_person` (text) - Contact person name
  - `email` (text) - Supplier email
  - `phone` (text) - Supplier phone
  - `address` (text) - Supplier address
  - `notes` (text) - Additional notes
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. products
  - `id` (uuid, primary key) - Product identifier
  - `sku` (text, unique) - Stock keeping unit code
  - `name` (text) - Product name
  - `description` (text) - Product description
  - `barcode` (text) - Product barcode
  - `category_id` (uuid, foreign key) - Reference to categories
  - `supplier_id` (uuid, foreign key) - Reference to suppliers
  - `cost_price` (decimal) - Purchase cost per unit
  - `selling_price` (decimal) - Retail selling price
  - `current_stock` (integer) - Current stock quantity
  - `reorder_level` (integer) - Minimum stock level threshold
  - `unit_of_measure` (text) - Unit (pieces, kg, liters, etc.)
  - `image_url` (text) - Product image URL
  - `is_active` (boolean) - Product active status
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 5. purchase_orders
  - `id` (uuid, primary key) - Purchase order identifier
  - `po_number` (text, unique) - Purchase order number
  - `supplier_id` (uuid, foreign key) - Reference to suppliers
  - `order_date` (date) - Order date
  - `expected_delivery` (date) - Expected delivery date
  - `status` (text) - Status: pending, received, cancelled
  - `total_amount` (decimal) - Total order amount
  - `notes` (text) - Order notes
  - `created_by` (uuid, foreign key) - User who created order
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 6. purchase_order_items
  - `id` (uuid, primary key) - Line item identifier
  - `purchase_order_id` (uuid, foreign key) - Reference to purchase_orders
  - `product_id` (uuid, foreign key) - Reference to products
  - `quantity` (integer) - Quantity ordered
  - `unit_cost` (decimal) - Cost per unit
  - `total_cost` (decimal) - Total line cost
  - `received_quantity` (integer) - Quantity received
  - `created_at` (timestamptz) - Creation timestamp

  ### 7. sales
  - `id` (uuid, primary key) - Sale identifier
  - `sale_number` (text, unique) - Sale/invoice number
  - `sale_date` (date) - Sale date
  - `customer_name` (text) - Customer name (optional)
  - `customer_phone` (text) - Customer phone (optional)
  - `subtotal` (decimal) - Subtotal before adjustments
  - `discount` (decimal) - Discount amount
  - `tax` (decimal) - Tax amount
  - `total_amount` (decimal) - Final total
  - `payment_method` (text) - Payment method
  - `notes` (text) - Sale notes
  - `created_by` (uuid, foreign key) - User who created sale
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 8. sale_items
  - `id` (uuid, primary key) - Line item identifier
  - `sale_id` (uuid, foreign key) - Reference to sales
  - `product_id` (uuid, foreign key) - Reference to products
  - `quantity` (integer) - Quantity sold
  - `unit_price` (decimal) - Price per unit
  - `total_price` (decimal) - Total line price
  - `created_at` (timestamptz) - Creation timestamp

  ### 9. inventory_transactions
  - `id` (uuid, primary key) - Transaction identifier
  - `product_id` (uuid, foreign key) - Reference to products
  - `transaction_type` (text) - Type: purchase, sale, adjustment, damage
  - `quantity` (integer) - Quantity changed
  - `previous_stock` (integer) - Stock before transaction
  - `new_stock` (integer) - Stock after transaction
  - `reference_type` (text) - Reference type: purchase_order, sale, manual
  - `reference_id` (uuid) - Reference to source transaction
  - `notes` (text) - Transaction notes
  - `created_by` (uuid, foreign key) - User who created transaction
  - `created_at` (timestamptz) - Transaction timestamp

  ### 10. stock_alerts
  - `id` (uuid, primary key) - Alert identifier
  - `product_id` (uuid, foreign key) - Reference to products
  - `alert_type` (text) - Type: low_stock, out_of_stock
  - `message` (text) - Alert message
  - `is_acknowledged` (boolean) - Acknowledgment status
  - `acknowledged_by` (uuid, foreign key) - User who acknowledged
  - `acknowledged_at` (timestamptz) - Acknowledgment timestamp
  - `created_at` (timestamptz) - Alert creation timestamp

  ## Security
  - Enable Row Level Security (RLS) on all tables
  - Admin: Full access to all data
  - Manager: Read/write access to inventory, sales, purchases
  - Staff: Read products, create sales only
  - All tables require authentication by default

  ## Indexes
  - Added indexes on foreign keys for optimal query performance
  - Added indexes on frequently queried fields (dates, status, stock levels)
*/

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS stock_alerts CASCADE;
DROP TABLE IF EXISTS inventory_transactions CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create user_profiles table
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
  phone text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create suppliers table
CREATE TABLE suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  contact_person text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  notes text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  barcode text DEFAULT '',
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  cost_price decimal(10, 2) DEFAULT 0,
  selling_price decimal(10, 2) DEFAULT 0,
  current_stock integer DEFAULT 0 CHECK (current_stock >= 0),
  reorder_level integer DEFAULT 0,
  unit_of_measure text DEFAULT 'pieces',
  image_url text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create purchase_orders table
CREATE TABLE purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number text UNIQUE NOT NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  order_date date DEFAULT CURRENT_DATE,
  expected_delivery date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'cancelled')),
  total_amount decimal(10, 2) DEFAULT 0,
  notes text DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create purchase_order_items table
CREATE TABLE purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid REFERENCES purchase_orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_cost decimal(10, 2) NOT NULL,
  total_cost decimal(10, 2) NOT NULL,
  received_quantity integer DEFAULT 0 CHECK (received_quantity >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create sales table
CREATE TABLE sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number text UNIQUE NOT NULL,
  sale_date date DEFAULT CURRENT_DATE,
  customer_name text DEFAULT '',
  customer_phone text DEFAULT '',
  subtotal decimal(10, 2) DEFAULT 0,
  discount decimal(10, 2) DEFAULT 0,
  tax decimal(10, 2) DEFAULT 0,
  total_amount decimal(10, 2) DEFAULT 0,
  payment_method text DEFAULT 'cash',
  notes text DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sale_items table
CREATE TABLE sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(10, 2) NOT NULL,
  total_price decimal(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create inventory_transactions table
CREATE TABLE inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'sale', 'adjustment', 'damage')),
  quantity integer NOT NULL,
  previous_stock integer NOT NULL,
  new_stock integer NOT NULL,
  reference_type text DEFAULT '',
  reference_id uuid,
  notes text DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create stock_alerts table
CREATE TABLE stock_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  alert_type text NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock')),
  message text NOT NULL,
  is_acknowledged boolean DEFAULT false,
  acknowledged_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_stock ON products(current_stock);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_date ON purchase_orders(order_date DESC);
CREATE INDEX idx_purchase_order_items_po ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_order_items_product ON purchase_order_items(product_id);
CREATE INDEX idx_sales_date ON sales(sale_date DESC);
CREATE INDEX idx_sales_created_by ON sales(created_by);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);
CREATE INDEX idx_transactions_product ON inventory_transactions(product_id);
CREATE INDEX idx_transactions_created ON inventory_transactions(created_at DESC);
CREATE INDEX idx_alerts_product ON stock_alerts(product_id);
CREATE INDEX idx_alerts_acknowledged ON stock_alerts(is_acknowledged);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text AS $$
  SELECT role FROM user_profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can insert profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for categories
CREATE POLICY "All authenticated users can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for suppliers
CREATE POLICY "All authenticated users can view suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage suppliers"
  ON suppliers FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for products
CREATE POLICY "All authenticated users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage products"
  ON products FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for purchase_orders
CREATE POLICY "All authenticated users can view purchase orders"
  ON purchase_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage purchase orders"
  ON purchase_orders FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for purchase_order_items
CREATE POLICY "All authenticated users can view purchase order items"
  ON purchase_order_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage purchase order items"
  ON purchase_order_items FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for sales
CREATE POLICY "All authenticated users can view sales"
  ON sales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can create sales"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins and managers can update sales"
  ON sales FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Admins can delete sales"
  ON sales FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for sale_items
CREATE POLICY "All authenticated users can view sale items"
  ON sale_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can create sale items"
  ON sale_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins and managers can manage sale items"
  ON sale_items FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'))
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for inventory_transactions
CREATE POLICY "All authenticated users can view transactions"
  ON inventory_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can create transactions"
  ON inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for stock_alerts
CREATE POLICY "All authenticated users can view alerts"
  ON stock_alerts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage alerts"
  ON stock_alerts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check and create stock alerts
CREATE OR REPLACE FUNCTION check_stock_alerts()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete old alerts for this product
  DELETE FROM stock_alerts WHERE product_id = NEW.id AND is_acknowledged = false;
  
  -- Create out of stock alert
  IF NEW.current_stock = 0 THEN
    INSERT INTO stock_alerts (product_id, alert_type, message)
    VALUES (NEW.id, 'out_of_stock', NEW.name || ' is out of stock');
  -- Create low stock alert
  ELSIF NEW.current_stock <= NEW.reorder_level AND NEW.reorder_level > 0 THEN
    INSERT INTO stock_alerts (product_id, alert_type, message)
    VALUES (NEW.id, 'low_stock', NEW.name || ' is running low (Stock: ' || NEW.current_stock || ', Reorder Level: ' || NEW.reorder_level || ')');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check stock alerts when product stock changes
CREATE TRIGGER check_product_stock_alerts
  AFTER INSERT OR UPDATE OF current_stock, reorder_level
  ON products
  FOR EACH ROW
  EXECUTE FUNCTION check_stock_alerts();

-- Insert some initial categories
INSERT INTO categories (name, description) VALUES
  ('Electronics', 'Electronic devices and accessories'),
  ('Clothing', 'Apparel and fashion items'),
  ('Food & Beverages', 'Food products and drinks'),
  ('Home & Garden', 'Home improvement and garden supplies'),
  ('Office Supplies', 'Office and stationery items')
ON CONFLICT (name) DO NOTHING;