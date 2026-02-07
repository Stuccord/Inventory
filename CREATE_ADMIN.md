# Create Your First Admin Account - Quick Guide

## Step 1: Create Auth User in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open your project: `https://hksduqakukxebupfocto.supabase.co`
3. Click **Authentication** (left sidebar)
4. Click **Users** tab
5. Click **Add User** button (top right, green button)
6. Fill in the form:
   ```
   Email: admin@yourcompany.com
   Password: YourStrongPassword123!
   Auto Confirm User: ✅ CHECK THIS BOX
   ```
7. Click **Create User**
8. **COPY THE USER ID** - It looks like: `a1b2c3d4-1234-5678-abcd-1234567890ab`

---

## Step 2: Create Admin Profile

### Option A: Using SQL Editor (Fastest)

1. In Supabase Dashboard, click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Paste this SQL (replace YOUR_USER_ID and YOUR_EMAIL):

```sql
INSERT INTO user_profiles (id, email, full_name, role, is_active)
VALUES (
  'YOUR_USER_ID',  -- Paste the UUID you copied above
  'admin@yourcompany.com',  -- Your email
  'Admin User',  -- Your name
  'admin',  -- Role (must be lowercase)
  true
);
```

4. Click **Run** (or press Ctrl+Enter)
5. You should see: "Success. No rows returned"

### Option B: Using Table Editor

1. In Supabase Dashboard, click **Table Editor** (left sidebar)
2. Select **user_profiles** table
3. Click **Insert row** button
4. Fill in:
   - **id**: Paste the User ID you copied (UUID)
   - **email**: `admin@yourcompany.com`
   - **full_name**: `Admin User`
   - **role**: Type `admin` (lowercase)
   - **phone**: (optional) Your phone number
   - **is_active**: `true`
5. Click **Save**

---

## Step 3: Sign In to Your System

1. Open your app: http://localhost:5173
2. Enter:
   - **Email**: `admin@yourcompany.com`
   - **Password**: The password you set in Step 1
3. Click **Sign In**
4. **You're in!** 🎉

---

## Quick Test

Once logged in:

1. ✅ Click **Categories** - Add a category (e.g., "Electronics")
2. ✅ Click **Products** - Add a product
3. ✅ Click **Orders** - Create a test order
4. ✅ Click **View Invoice** button
5. ✅ Click **Print** button - Test receipt printing!

---

## Troubleshooting

### "Invalid login credentials"?
- Make sure you checked **Auto Confirm User**
- Go to Authentication → Users → Find your user → Confirm they are "Confirmed"
- Try resetting the password

### "User profile not found"?
- Go to Table Editor → user_profiles
- Check if your user ID is there
- Make sure **is_active** is `true`
- Make sure **role** is exactly `admin` (lowercase)

### Still not working?
- Sign out completely
- Clear browser cache
- Try signing in again

---

## Example: Complete Working Example

Here's a complete example with fake data you can use for testing:

**Step 1: Create Auth User**
```
Email: admin@example.com
Password: Admin123!
Auto Confirm User: ✅
```

**Step 2: Run SQL**
```sql
-- Replace 'abc-123-def' with your actual user ID from step 1
INSERT INTO user_profiles (id, email, full_name, role, is_active)
VALUES (
  'abc-123-def',
  'admin@example.com',
  'Test Admin',
  'admin',
  true
);
```

**Step 3: Sign In**
```
Email: admin@example.com
Password: Admin123!
```

---

## Security Tips

🔐 Use a strong password (12+ characters, mix of letters/numbers/symbols)
🔐 Don't share your admin credentials
🔐 Create separate staff accounts for your team (in Users menu)
🔐 Change default passwords immediately

---

## What's Next?

After signing in:

1. **Add Categories** - Product types (Electronics, Clothing, etc.)
2. **Add Suppliers** - Your vendors (optional)
3. **Add Products** - Your inventory items
4. **Create Staff** - Team accounts with appropriate roles
5. **Start Selling** - Create orders and print receipts!

---

**Need more help? See ADMIN_SETUP.md for detailed guide.**
