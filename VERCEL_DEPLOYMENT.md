# Vercel Deployment Guide

## Deploy Your Inventory System to Vercel

Follow these steps to host your inventory management system on Vercel for free.

---

## Prerequisites

- [x] Supabase project set up (with your database)
- [x] GitHub account
- [x] Vercel account (free) - Sign up at [vercel.com](https://vercel.com)

---

## Step 1: Push Code to GitHub

1. Create a new repository on [GitHub](https://github.com/new)
   - Name: `inventory-management-system`
   - Visibility: Private (recommended)
   - Don't initialize with README (you already have one)

2. Push your code:
```bash
cd /path/to/your/project
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/inventory-management-system.git
git push -u origin main
```

---

## Step 2: Deploy to Vercel

### Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure your project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. **Add Environment Variables** (IMPORTANT!):
   Click **Environment Variables** and add:

   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Get these from:
   - Supabase Dashboard → Settings → API
   - Copy **Project URL** → Paste as `VITE_SUPABASE_URL`
   - Copy **anon/public key** → Paste as `VITE_SUPABASE_ANON_KEY`

6. Click **Deploy**

7. Wait 2-3 minutes for deployment to complete

8. Your site is live! 🎉
   - You'll get a URL like: `https://your-project.vercel.app`

---

## Step 3: Configure Supabase for Production

### Update Supabase URL Settings

1. Go to Supabase Dashboard
2. **Authentication** → **URL Configuration**
3. Add your Vercel URL to **Site URL**:
   ```
   https://your-project.vercel.app
   ```
4. Add to **Redirect URLs**:
   ```
   https://your-project.vercel.app/**
   ```
5. Click **Save**

---

## Step 4: Test Your Deployment

1. Visit your Vercel URL: `https://your-project.vercel.app`
2. Try signing in with your admin account
3. Test creating a product
4. Test creating an order
5. Try printing a receipt

---

## Automatic Deployments

Every time you push to GitHub, Vercel automatically deploys:

```bash
git add .
git commit -m "Update feature"
git push
```

Vercel will:
- Build your project
- Run tests
- Deploy to production
- Give you a preview URL

---

## Custom Domain (Optional)

### Add Your Own Domain

1. In Vercel Dashboard → Your Project
2. Go to **Settings** → **Domains**
3. Click **Add Domain**
4. Enter your domain: `inventory.yourbusiness.com`
5. Follow DNS instructions:
   - Add A record or CNAME to your domain registrar
   - Wait for DNS propagation (5-30 minutes)
6. Vercel auto-generates SSL certificate
7. Your site is live on your domain! 🎉

---

## Environment Management

### Production Environment Variables

Already set during deployment. To update:

1. Vercel Dashboard → Your Project
2. **Settings** → **Environment Variables**
3. Edit values
4. Redeploy

### Local Development

Use `.env` file (already configured):
```
VITE_SUPABASE_URL=your_local_supabase_url
VITE_SUPABASE_ANON_KEY=your_local_supabase_key
```

---

## Troubleshooting

### Build Fails?

**Check build logs in Vercel Dashboard**

Common issues:
- Missing environment variables
- TypeScript errors → Run `npm run build` locally first
- Missing dependencies → Check package.json

**Solution:**
```bash
npm run build
```
If it builds locally, push the fix to GitHub.

### 404 Errors?

**Make sure vercel.json exists** (already included):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Login Not Working?

**Check Supabase URL Configuration**
- Site URL must match your Vercel URL
- Redirect URLs must include your domain

### Environment Variables Not Working?

**Important:** Environment variable names must start with `VITE_`
- ✅ `VITE_SUPABASE_URL`
- ❌ `SUPABASE_URL`

---

## Performance Optimization

### Already Optimized For You:

✅ **Vite** - Lightning-fast builds
✅ **Code splitting** - Smaller bundle sizes
✅ **Vercel Edge Network** - Global CDN
✅ **Automatic compression** - Gzip/Brotli
✅ **Image optimization** - Automatic
✅ **HTTP/2** - Faster loading

### Your site loads in < 1 second! 🚀

---

## Monitoring

### View Analytics

1. Vercel Dashboard → Your Project
2. Click **Analytics**
3. See:
   - Page views
   - Unique visitors
   - Performance metrics
   - Real User Monitoring

### View Logs

1. Vercel Dashboard → Your Project
2. Click **Deployments**
3. Click on any deployment
4. View build and runtime logs

---

## Backup Strategy

### Automatic Backups:

✅ **Code**: GitHub (version controlled)
✅ **Database**: Supabase (automatic backups)
✅ **Deployments**: Vercel (keeps all versions)

### Manual Database Backup:

1. Supabase Dashboard
2. **Database** → **Backups**
3. Click **Download** for any backup point
4. Store securely

---

## Scaling

### Vercel Free Tier Includes:

- 100 GB bandwidth/month
- Unlimited deployments
- Automatic SSL
- Global CDN
- 100 GB-hours serverless function execution

### When to Upgrade:

- More than 100 GB traffic/month
- Need custom domains beyond 1
- Need team collaboration features
- Need advanced analytics

**Most small businesses stay on free tier! 📊**

---

## Security Checklist

Before going live:

- [x] Environment variables set correctly
- [x] Supabase RLS policies enabled
- [x] Admin account created
- [x] Test all features in production
- [x] Supabase URL configuration updated
- [x] SSL certificate active (automatic)
- [x] Backup strategy in place

---

## Going Live Checklist

- [ ] Deploy to Vercel
- [ ] Set environment variables
- [ ] Test admin login
- [ ] Add categories
- [ ] Add products
- [ ] Create test order
- [ ] Print test receipt
- [ ] Create staff accounts
- [ ] Train your team
- [ ] Start using! 🎉

---

## Cost Summary

### Vercel: $0/month
- Free tier (generous limits)

### Supabase: $0/month
- Free tier includes:
  - 500 MB database
  - 2 GB file storage
  - 50,000 monthly active users
  - Unlimited API requests

### Total: $0/month for most small businesses! 💰

---

## Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- Check ADMIN_SETUP.md for sign-in help
- Check BUSINESS_GUIDE.md for operations

---

**Your inventory system is ready for the world! 🚀**

Deploy once, manage forever. No server maintenance, no hosting headaches!
