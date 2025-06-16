# 🚀 Railway Database Setup Guide

Your ScaleMate app has deployed successfully! The health check is failing because the database tables haven't been created yet. Here's how to fix it:

## Option 1: Railway CLI (Recommended)

1. **Install Railway CLI** (if not already installed):
```bash
npm install -g @railway/cli
```

2. **Login to Railway**:
```bash
railway login
```

3. **Connect to your project**:
```bash
railway link
```

4. **Run the database setup**:
```bash
railway run node scripts/setup-production.js
```

## Option 2: Railway Console

1. Go to your **Railway Dashboard**
2. Click on your **ScaleMate project**
3. Go to the **Console** tab
4. Run this command:
```bash
node scripts/setup-production.js
```

## Option 3: Manual Migration

If the setup script doesn't work, run the migration directly:

```bash
railway run npx drizzle-kit push:pg --verbose
```

Then seed the database:
```bash
railway run node scripts/seed.js
```

## What Happens After Setup:

✅ **20+ Tables Created** - Complete profile-based architecture
✅ **Industry Configurations** - Real Estate, Healthcare, E-commerce setups
✅ **Anonymous Tracking** - Visitor behavior scoring system
✅ **AI Quote Calculator** - Conversation-based quote generation
✅ **Lead Management** - Advanced scoring and re-engagement
✅ **Health Check Passes** - App shows as fully healthy

## Expected Timeline:

- **Database Setup**: 30-60 seconds
- **Health Check Recovery**: 1-2 minutes
- **Full System Online**: 2-3 minutes

## Verify Success:

After running the setup, check:
1. **Health Endpoint**: `https://your-app.railway.app/api/health`
2. **Should return**: `{"status":"healthy","tablesExist":true}`

## If You Get Errors:

1. **Check DATABASE_URL** is set in Railway environment variables
2. **Verify PostgreSQL** add-on is connected
3. **Check Railway logs** for detailed error messages

Your intelligent ScaleMate platform will be live and ready to convert visitors into qualified leads! 🎯 