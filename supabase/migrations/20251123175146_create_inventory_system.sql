/*
  # Inventory Management System Database Schema

  ## Overview
  This migration creates a complete inventory management system with support for:
  - Product catalog management
  - Category organization
  - Supplier tracking
  - Inventory transaction history
  - Stock level monitoring

  ## New Tables

  ### 1. categories
  - `id` (uuid, primary key) - Unique category identifier
  - `name` (text, unique) - Category name
  - `description` (text) - Category description
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. suppliers
  - `id` (uuid, primary key) - Unique supplier identifier
  - `name` (text, unique) - Supplier name
  - `contact_person` (text) - Contact person name
  - `email` (text) - Supplier email
  - `phone` (text) - Supplier phone number
  - `address` (text) - Supplier address
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. products
  - `id` (uuid, primary key) - Unique product identifier
  - `sku` (text, unique) - Stock keeping unit code
  - `name` (text) - Product name
  - `description` (text) - Product description
  - `category_id` (uuid, foreign key) - Reference to categories table
  - `supplier_id` (uuid, foreign key) - Reference to suppliers table
  - `unit_price` (decimal) - Product price per unit
  - `current_stock` (integer) - Current stock quantity
  - `minimum_stock` (integer) - Minimum stock level threshold
  - `reorder_point` (integer) - Reorder point threshold
  - `unit_of_measure` (text) - Unit of measurement (e.g., pieces, kg, liters)
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. inventory_transactions
  - `id` (uuid, primary key) - Unique transaction identifier
  - `product_id` (uuid, foreign key) - Reference to products table
  - `transaction_type` (text) - Type of transaction (IN, OUT, ADJUSTMENT)
  - `quantity` (integer) - Transaction quantity (positive for IN, negative for OUT)
  - `previous_stock` (integer) - Stock level before transaction
  - `new_stock` (integer) - Stock level after transaction
  - `notes` (text) - Transaction notes
  - `reference_number` (text) - External reference number
  - `created_at` (timestamptz) - Transaction timestamp

  ## Security
  - Enable Row Level Security (RLS) on all tables
  - Add policies for authenticated users to manage all data
  - All tables are locked down by default and require authentication
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  contact_person text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  unit_price decimal(10, 2) DEFAULT 0,
  current_stock integer DEFAULT 0,
  minimum_stock integer DEFAULT 0,
  reorder_point integer DEFAULT 0,
  unit_of_measure text DEFAULT 'pieces',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create inventory transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('IN', 'OUT', 'ADJUSTMENT')),
  quantity integer NOT NULL,
  previous_stock integer NOT NULL,
  new_stock integer NOT NULL,
  notes text DEFAULT '',
  reference_number text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(current_stock);
CREATE INDEX IF NOT EXISTS idx_transactions_product ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON inventory_transactions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Authenticated users can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for suppliers
CREATE POLICY "Authenticated users can view suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert suppliers"
  ON suppliers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update suppliers"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete suppliers"
  ON suppliers FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for products
CREATE POLICY "Authenticated users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for inventory_transactions
CREATE POLICY "Authenticated users can view transactions"
  ON inventory_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert transactions"
  ON inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to automatically update product updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on products table
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();