# Production Setup Guide - Inventory Management System

## Initial Setup Instructions

This guide will help you get your inventory management system up and running for production use.

---

## Step 1: Create Your First Admin Account

Since public signup is disabled for security, you need to create the first admin account directly through Supabase.

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**
3. Click **Add User** → **Create new user**
4. Enter:
   - Email: your admin email (e.g., `admin@yourcompany.com`)
   - Password: a secure password
   - Auto Confirm User: **Yes** (check this box)
5. Click **Create User**

6. Next, go to **Table Editor** → **user_profiles**
7. Click **Insert** → **Insert row**
8. Enter:
   - `id`: Copy the user ID from the auth.users table (the UUID you just created)
   - `email`: Same email as above
   - `full_name`: Your full name (e.g., "John Admin")
   - `role`: Select **admin**
   - `phone`: Your phone number (optional)
   - `is_active`: **true**
9. Click **Save**

---

## Step 2: Sign In

1. Open your application
2. Enter the admin email and password you just created
3. Click **Sign In**

---

## Step 3: Initial System Configuration

### Create Product Categories

1. Click **Categories** in the sidebar
2. Click **Add Category**
3. Add your product categories

### Add Suppliers

1. Click **Suppliers** in the sidebar
2. Click **Add Supplier**
3. Enter supplier information

### Add Products

1. Click **Products** in the sidebar
2. Click **Add Product**
3. Fill in all required product details

---

## Step 4: Create Additional Users

1. Click **Users** in the sidebar
2. Click **Add User**
3. Assign appropriate roles

---

## System Roles

- **Admin**: Full system access
- **Manager**: Inventory, orders, returns, tally, reports
- **Staff**: Create orders, view products
- **Auditor**: Read-only access to reports

---

For detailed documentation, see DOCUMENTATION.md
