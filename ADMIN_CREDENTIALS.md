# Your Admin Account - Ready to Use!

## Step 1: Create Auth User (Takes 2 minutes)

### Go to Supabase Dashboard:
1. Open: https://supabase.com/dashboard/project/hksduqakukxebupfocto
2. Click **Authentication** (left sidebar)
3. Click **Users** tab
4. Click **Add User** (green button, top right)

### Fill in the form:
```
Email: admin@example.com
Password: Admin123!
Auto Confirm User: ✅ MUST CHECK THIS BOX
```

5. Click **Create User**
6. **COPY THE USER ID** that appears (looks like: abc-123-def-456)

---

## Step 2: Create Admin Profile (Takes 30 seconds)

### Option A: Using SQL Editor (Fastest!)

1. In Supabase Dashboard, click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Paste this SQL (replace YOUR_USER_ID):

```sql
INSERT INTO user_profiles (id, email, full_name, role, is_active)
VALUES (
  'YOUR_USER_ID_HERE',  -- Replace with the UUID from Step 1
  'admin@example.com',
  'System Admin',
  'admin',
  true
);
```

4. Click **Run** (or Ctrl+Enter)
5. You should see: "Success. No rows returned"

### Option B: Using Table Editor

1. Click **Table Editor** (left sidebar)
2. Select **user_profiles** table
3. Click **Insert row**
4. Fill in:
   - **id**: Paste the User ID from Step 1
   - **email**: `admin@example.com`
   - **full_name**: `System Admin`
   - **role**: `admin` (lowercase!)
   - **is_active**: `true`
5. Click **Save**

---

## Step 3: Sign In! (Takes 10 seconds)

### Your Login Credentials:
```
Email: admin@example.com
Password: Admin123!
```

### Sign in here:
**http://localhost:5173**

---

## ✅ What's Working Now

- ✅ Dev server running at http://localhost:5173
- ✅ Supabase connected and working
- ✅ Database tables all created
- ✅ RLS security enabled
- ✅ Ready to sign in!

---

## Quick Test After Sign In:

1. Click **Categories** → Add a test category
2. Click **Products** → Add a test product
3. Click **Orders** → Create a test order
4. Click **View Invoice** → Click **Print**

**Everything should work!**

---

## Troubleshooting

### "Invalid login credentials"?
- Make sure you checked **Auto Confirm User** in Step 1
- Go back to Authentication → Users → Check the user shows as "Confirmed"

### "User profile not found"?
- Go to Table Editor → user_profiles
- Check if your user ID is there
- Make sure the role is exactly `admin` (lowercase)

### Still not working?
- Clear browser cache
- Try signing in again
- Make sure you're using: http://localhost:5173

---

## Your Supabase Project Details

**Project URL:** https://hksduqakukxebupfocto.supabase.co
**Dashboard:** https://supabase.com/dashboard/project/hksduqakukxebupfocto
**Status:** ✅ Connected and working!

---

## Next Steps

Once you're signed in:

1. **Add Categories** - Product types (Electronics, Food, etc.)
2. **Add Products** - Your inventory items
3. **Create Orders** - Test the sales workflow
4. **Print Receipts** - Test receipt printing
5. **Add Team Members** - Create accounts for your staff

---

**Need help?** See [START_HERE.md](./START_HERE.md) for complete documentation.
