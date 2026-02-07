# Inventory Management System - Setup Guide

## Overview

A complete, production-ready inventory management system built with React, TypeScript, Tailwind CSS, and Supabase. Designed for retail/wholesale businesses with multi-user support and role-based access control.

## Features

### Core Functionality
- **User Authentication & Roles**: Admin, Manager, and Staff roles with different permission levels
- **Product Management**: Complete CRUD operations for products with categories and suppliers
- **Stock Management**: Real-time inventory tracking with automatic stock updates
- **Sales Entry**: Point-of-sale functionality with automatic inventory deduction
- **Purchase Orders**: Track purchases and incoming stock
- **Dashboard & Analytics**: Real-time business metrics and insights
- **Stock Alerts**: Automatic low-stock and out-of-stock notifications
- **Reports & Export**: Generate and export stock, sales, and purchase reports as CSV
- **Search & Filter**: Advanced filtering and search capabilities

### User Roles & Permissions

#### Admin
- Full system access
- Manage users and all data
- Access all reports and analytics
- Configure system settings

#### Manager
- Inventory management (add/edit/delete products)
- Purchase order management
- Sales and reporting access
- Supplier and category management

#### Staff
- View product catalog
- Create sales transactions
- View basic inventory levels
- Limited reporting access

## Setup Instructions

### 1. Database is Already Configured

The Supabase database is already set up with:
- User profiles with role-based access
- Products, categories, and suppliers
- Sales and purchase order tracking
- Inventory transactions history
- Stock alert system
- Automatic triggers for stock monitoring

### 2. Create User Accounts

Since Supabase Auth is configured, you need to create user accounts. Here's how:

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Click "Add User" or "Invite User"
4. Create accounts with these emails (or use your own):
   - `admin@inventory.com` - For Admin role
   - `manager@inventory.com` - For Manager role
   - `staff@inventory.com` - For Staff role

5. After creating each user in Auth, run this SQL to create their profile:

```sql
-- For Admin user
INSERT INTO user_profiles (id, email, full_name, role, phone)
VALUES (
  'USER_ID_FROM_AUTH_USERS_TABLE',
  'admin@inventory.com',
  'System Administrator',
  'admin',
  '+1-555-0001'
);

-- For Manager user
INSERT INTO user_profiles (id, email, full_name, role, phone)
VALUES (
  'USER_ID_FROM_AUTH_USERS_TABLE',
  'manager@inventory.com',
  'Inventory Manager',
  'manager',
  '+1-555-0002'
);

-- For Staff user
INSERT INTO user_profiles (id, email, full_name, role, phone)
VALUES (
  'USER_ID_FROM_AUTH_USERS_TABLE',
  'staff@inventory.com',
  'Sales Staff',
  'staff',
  '+1-555-0003'
);
```

Replace `USER_ID_FROM_AUTH_USERS_TABLE` with the actual UUID from the auth.users table.

#### Option B: Using Supabase Auth API
You can also create users programmatically using the Supabase Auth API, but you'll need to use the service role key (keep it secure!).

### 3. Add Sample Data (Optional)

Sample categories and suppliers are already added. To add sample products, run:

```sql
-- Sample products
INSERT INTO products (sku, name, description, category_id, supplier_id, cost_price, selling_price, current_stock, reorder_level, unit_of_measure) VALUES
  ('ELEC-001', 'Wireless Mouse', 'Ergonomic wireless mouse with USB receiver', (SELECT id FROM categories WHERE name = 'Electronics'), (SELECT id FROM suppliers WHERE name = 'Tech Distributors Inc'), 15.00, 29.99, 50, 10, 'pieces'),
  ('ELEC-002', 'USB-C Cable', 'High-speed USB-C charging cable 2m', (SELECT id FROM categories WHERE name = 'Electronics'), (SELECT id FROM suppliers WHERE name = 'Tech Distributors Inc'), 5.00, 12.99, 100, 20, 'pieces'),
  ('CLOT-001', 'Cotton T-Shirt', 'Premium cotton t-shirt, multiple colors', (SELECT id FROM categories WHERE name = 'Clothing'), (SELECT id FROM suppliers WHERE name = 'Fashion Wholesale Co'), 8.00, 19.99, 75, 15, 'pieces'),
  ('FOOD-001', 'Organic Coffee Beans', 'Fair trade organic coffee beans 1kg', (SELECT id FROM categories WHERE name = 'Food & Beverages'), (SELECT id FROM suppliers WHERE name = 'Global Food Suppliers'), 12.00, 24.99, 30, 10, 'kg'),
  ('OFF-001', 'A4 Paper Ream', 'Premium white A4 paper 500 sheets', (SELECT id FROM categories WHERE name = 'Office Supplies'), (SELECT id FROM suppliers WHERE name = 'Office Pro Supplies'), 4.50, 9.99, 200, 30, 'reams');
```

## Using the System

### First Login

1. Start the development server (already running)
2. Open the application in your browser
3. Sign in with one of the accounts you created
4. You'll be taken to the dashboard

### Dashboard

The main dashboard shows:
- Total products and inventory value
- Monthly sales statistics
- Low stock and out of stock alerts
- Recent sales transactions
- Product list with search and filters

### Managing Products

**Admin & Manager only:**
1. Click "Products" in the navigation
2. Use "Add Product" to create new products
3. Fill in product details including:
   - SKU (unique identifier)
   - Name and description
   - Category and supplier
   - Cost price and selling price
   - Current stock and reorder level
   - Unit of measure
4. Edit or delete products as needed

### Creating Sales

**All users can create sales:**
1. Click "Sales" in the navigation
2. Click "New Sale"
3. Add products to the sale:
   - Select product from dropdown
   - Enter quantity
   - Click "Add"
4. Fill in customer details (optional)
5. Add discount or tax if needed
6. Select payment method
7. Click "Complete Sale"

The system will:
- Automatically deduct stock
- Create inventory transaction records
- Trigger low-stock alerts if needed

### Managing Purchases

**Manager & Admin only:**
1. Click "Purchases" in the navigation
2. View existing purchase orders
3. Track order status (pending, received, cancelled)
4. When goods are received, update stock accordingly

### Viewing Reports

**All users have access:**
1. Click "Reports" in the navigation
2. Select report type:
   - **Stock Summary**: Current inventory levels
   - **Sales Report**: Last 30 days of sales
   - **Low Stock**: Products needing restock
   - **Purchase History**: Recent purchase orders
3. Click "Export CSV" to download data

### Settings

**Manager & Admin only:**
1. Click "Settings" in the navigation
2. Manage categories:
   - Add new product categories
   - Edit or delete existing categories
3. Manage suppliers:
   - Add supplier information
   - Update contact details
   - Deactivate suppliers

## Stock Alerts

The system automatically monitors stock levels:
- **Low Stock Alert**: Triggered when stock reaches or falls below reorder level
- **Out of Stock Alert**: Triggered when stock reaches zero

Alerts appear on the dashboard and can be acknowledged to clear them.

## Data Security

- Row Level Security (RLS) is enabled on all tables
- Users can only access data based on their role
- Admin has full access
- Manager can view and modify inventory-related data
- Staff can view products and create sales only
- All database operations are logged in inventory_transactions

## Backup & Maintenance

### Database Backups
Supabase provides automatic backups. For additional security:
1. Use the Reports feature to export critical data regularly
2. Download CSV exports of inventory and sales data

### Monitoring
- Check the dashboard daily for stock alerts
- Review sales reports weekly
- Monitor low stock items to ensure timely reordering

## Troubleshooting

### Cannot login
- Verify user account exists in Supabase Auth
- Ensure user_profile entry exists for the user
- Check that password is correct

### Products not showing
- Verify product `is_active` field is true
- Check user role has permission to view products

### Cannot create sales
- Ensure products have sufficient stock
- Verify all required fields are filled
- Check that user has permission to create sales

### Alerts not working
- Alerts are generated automatically by database triggers
- Check product reorder_level is set correctly
- Verify triggers are enabled in database

## Support

For technical issues:
1. Check browser console for error messages
2. Verify Supabase connection in .env file
3. Review database logs in Supabase dashboard
4. Check that all required tables exist

## System Architecture

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Vite for building

### Backend
- Supabase (PostgreSQL database)
- Row Level Security for data protection
- Automatic triggers for stock monitoring
- Real-time data synchronization

### Database Tables
- user_profiles: User accounts and roles
- categories: Product categories
- suppliers: Supplier information
- products: Product catalog
- purchase_orders: Purchase tracking
- purchase_order_items: PO line items
- sales: Sales transactions
- sale_items: Sale line items
- inventory_transactions: All stock movements
- stock_alerts: Low stock notifications

## Future Enhancements

Potential features to add:
- Barcode scanning for products
- Multi-location inventory support
- Advanced analytics and forecasting
- Email notifications for alerts
- Mobile app version
- Purchase order approval workflow
- Returns and refunds management
- Batch/lot number tracking

---

**Version:** 1.0.0
**Last Updated:** 2024-11-24
