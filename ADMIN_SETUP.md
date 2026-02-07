# Admin Sign-In Guide

## How to Sign In as Admin

### First Time? Create Your Admin Account

**Option 1: Using Supabase Dashboard (Recommended)**

1. Open your [Supabase Project Dashboard](https://supabase.com/dashboard)
2. Click on your project
3. Go to **Authentication** → **Users** (left sidebar)
4. Click **Add User** button (top right)
5. Fill in:
   - **Email**: `admin@yourcompany.com` (use your actual email)
   - **Password**: Create a strong password (min 6 characters)
   - **Auto Confirm User**: ✅ **CHECK THIS BOX** (important!)
6. Click **Create User**
7. **Copy the User ID** (the long UUID string) - you'll need this!

8. Now go to **Table Editor** → **user_profiles**
9. Click **Insert row** button
10. Fill in:
    - **id**: Paste the User ID you copied
    - **email**: Same email as above
    - **full_name**: Your name (e.g., "Admin User")
    - **role**: Select **admin** from dropdown
    - **phone**: Your phone number (optional)
    - **is_active**: true
11. Click **Save**

**Option 2: Using SQL Query (Advanced)**

Run this in Supabase SQL Editor:

```sql
-- First, create the auth user (replace with your email and password)
-- You'll need to do this through the Supabase Dashboard first, then get the user_id

-- Then insert the profile (replace YOUR_USER_ID with the actual UUID)
INSERT INTO user_profiles (id, email, full_name, role, is_active)
VALUES (
  'YOUR_USER_ID',  -- Replace with actual user ID from auth.users
  'admin@yourcompany.com',
  'Admin User',
  'admin',
  true
);
```

---

## Sign In to Your System

1. Open your application: `http://localhost:5173` (or your deployed URL)
2. You'll see the login page
3. Enter:
   - **Email**: The admin email you created
   - **Password**: The password you set
4. Click **Sign In**
5. You're in! 🎉

---

## Troubleshooting

### "Invalid login credentials" error?
- Double-check your email and password
- Make sure you checked **Auto Confirm User** when creating the account
- Try resetting the password in Supabase Dashboard

### "User profile not found" error?
- Go to Supabase → Table Editor → user_profiles
- Make sure there's a row with your user ID
- Check that **is_active** is set to **true**

### Can't see admin features?
- Check the **role** column in user_profiles table
- Must be set to **admin** (not Admin, ADMIN, or anything else)
- Sign out and sign in again

---

## What Can Admin Do?

As an admin, you have full access to:

✅ **Dashboard** - Overview of your business
✅ **Products** - Add, edit, delete products
✅ **Categories** - Manage product categories
✅ **Orders** - Create and view all orders
✅ **Returns** - Process customer returns
✅ **Stock Tally** - Conduct inventory counts
✅ **Stock Movement** - Monitor all stock changes
✅ **Suppliers** - Manage supplier information
✅ **Users** - Create and manage team accounts
✅ **Print Receipts** - Print order invoices

---

## Quick Start After Sign In

1. **Add Categories** → Click Categories → Add your product types
2. **Add Suppliers** (optional) → Click Suppliers → Add vendor info
3. **Add Products** → Click Products → Add your inventory
4. **Create Staff** → Click Users → Add your team members

---

## Need to Reset Admin Password?

1. Go to Supabase Dashboard
2. Authentication → Users
3. Find your admin user
4. Click the three dots (...) → **Send Password Reset Email**
5. Check your email and follow the link
6. Set a new password

---

## Printing Receipts

When viewing an order:

1. Click **View Invoice** button
2. Review the invoice details
3. Click **Print** button (blue button at top)
4. Your browser's print dialog will open
5. Select printer or "Save as PDF"
6. Print!

**Tip**: The invoice is automatically formatted for 80mm thermal printers or standard A4 paper.

---

## Contact Support

If you're still having issues:
- Check SETUP.md for detailed instructions
- Review DOCUMENTATION.md for system features
- Check BUSINESS_GUIDE.md for daily operations

---

**You're all set! Welcome to your inventory management system! 🚀**
