import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'admin' | 'manager' | 'staff' | 'auditor';

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  description: string;
  created_at: string;
};

export type Supplier = {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  description: string;
  barcode: string;
  category_id: string | null;
  supplier_id: string | null;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  reorder_level: number;
  unit_of_measure: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductWithDetails = Product & {
  categories?: Category | null;
  suppliers?: Supplier | null;
};

export type PurchaseOrder = {
  id: string;
  po_number: string;
  supplier_id: string | null;
  order_date: string;
  expected_delivery: string | null;
  status: 'pending' | 'received' | 'cancelled';
  total_amount: number;
  notes: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PurchaseOrderWithDetails = PurchaseOrder & {
  suppliers?: Supplier | null;
  user_profiles?: UserProfile | null;
};

export type PurchaseOrderItem = {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  received_quantity: number;
  created_at: string;
};

export type PurchaseOrderItemWithProduct = PurchaseOrderItem & {
  products?: Product;
};

export type Sale = {
  id: string;
  sale_number: string;
  sale_date: string;
  customer_name: string;
  customer_phone: string;
  subtotal: number;
  discount: number;
  tax: number;
  total_amount: number;
  payment_method: string;
  notes: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SaleWithDetails = Sale & {
  user_profiles?: UserProfile | null;
};

export type SaleItem = {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
};

export type SaleItemWithProduct = SaleItem & {
  products?: Product;
};

export type InventoryTransaction = {
  id: string;
  product_id: string;
  transaction_type: 'purchase' | 'sale' | 'adjustment' | 'damage';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference_type: string;
  reference_id: string | null;
  notes: string;
  created_by: string | null;
  created_at: string;
};

export type InventoryTransactionWithDetails = InventoryTransaction & {
  products?: Product;
  user_profiles?: UserProfile | null;
};

export type StockAlert = {
  id: string;
  product_id: string;
  alert_type: 'low_stock' | 'out_of_stock';
  message: string;
  is_acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
};

export type StockAlertWithProduct = StockAlert & {
  products?: Product;
};

export type Order = {
  id: string;
  order_number: string;
  order_date: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  subtotal: number;
  discount: number;
  tax: number;
  total_amount: number;
  payment_method: string;
  payment_status: 'paid' | 'pending' | 'partial';
  order_status: 'pending' | 'processing' | 'completed' | 'cancelled';
  notes: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
};

export type Return = {
  id: string;
  return_number: string;
  order_id: string | null;
  return_date: string;
  return_type: 'full' | 'partial';
  return_reason: string;
  refund_amount: number;
  restock: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes: string;
  processed_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReturnItem = {
  id: string;
  return_id: string;
  product_id: string;
  order_item_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  condition: 'good' | 'damaged' | 'expired';
  restock: boolean;
  created_at: string;
};

export type StockTally = {
  id: string;
  tally_number: string;
  tally_date: string;
  location: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  total_variance: number;
  notes: string;
  counted_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StockTallyItem = {
  id: string;
  tally_id: string;
  product_id: string;
  system_quantity: number;
  counted_quantity: number;
  variance: number;
  variance_reason: string;
  notes: string;
  created_at: string;
};

export type AuditLog = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};
