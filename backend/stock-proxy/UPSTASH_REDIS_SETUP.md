# Upstash Redis Setup Guide

## Why Upstash Redis?
- **Persistent Cache**: Survives Vercel serverless restarts
- **Free Tier**: 10,000 commands/day (enough for cron + user requests)
- **Auto-Expiry**: 24-hour TTL on all cache entries
- **REST API**: Works perfectly with Vercel serverless functions
- **Instant Loads**: Pre-computed analysis served from cache

## Step 1: Create Upstash Account
1. Go to: https://upstash.com/
2. Sign up with GitHub (or email)
3. Confirm email

## Step 2: Create Redis Database
1. Click **"Create Database"** button
2. Configure:
   - **Name**: `stock-analyzer-cache`
   - **Type**: Select **Regional** (faster, cheaper)
   - **Region**: Choose closest to your Vercel region (e.g., `us-east-1`)
   - **TLS**: ✅ Enabled (default)
   - **Eviction**: `allkeys-lru` (auto-remove old keys when full)
3. Click **"Create"**

## Step 3: Get Redis Credentials
1. Click on your database: `stock-analyzer-cache`
2. Scroll to **REST API** section
3. Copy these two values:
   - `UPSTASH_REDIS_REST_URL` (looks like: `https://us1-careful-shark-12345.upstash.io`)
   - `UPSTASH_REDIS_REST_TOKEN` (looks like: `AYasdfQN...long token...`)

## Step 4: Add to Vercel Environment Variables
1. Go to: https://vercel.com/dashboard
2. Select project: **stock-analyzer-backend**
3. Click **Settings** → **Environment Variables**
4. Add these two variables:

### Variable 1:
- **Key**: `UPSTASH_REDIS_REST_URL`
- **Value**: (paste from Upstash dashboard)
- **Environment**: ✅ Production ✅ Preview ✅ Development

### Variable 2:
- **Key**: `UPSTASH_REDIS_REST_TOKEN`
- **Value**: (paste from Upstash dashboard)
- **Environment**: ✅ Production ✅ Preview ✅ Development

5. Click **Save**

## Step 5: Redeploy Backend
```powershell
cd c:\executables\stock-analyzer-mobile\backend\stock-proxy
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
vercel --prod
```

## Step 6: Verify Cache is Working
After deployment, the cron job will run twice daily:
- **6:00 AM IST** (12:30 AM UTC)
- **10:00 AM IST** (4:30 AM UTC)

Check cache status:
```powershell
curl "https://stock-analyzer-backend-nu.vercel.app/api/health" | ConvertFrom-Json
```

Expected response:
```json
{
  "status": "ok",
  "cache": "active",
  "lastUpdate": "2026-01-16T04:30:00.000Z",
  "stocksAnalyzed": 499
}
```

## Troubleshooting

### Error: "UPSTASH_REDIS_REST_URL is not defined"
- Check Vercel environment variables are saved
- Redeploy after adding env vars

### Error: "Failed to connect to Redis"
- Verify Upstash database is active
- Check TLS is enabled
- Ensure credentials are correct

### Cache still empty?
- Wait for next cron run (6 AM or 10 AM IST)
- Or manually trigger: `curl -X POST https://stock-analyzer-backend-nu.vercel.app/api/trigger`

## Free Tier Limits
- **10,000 commands/day**
- **100 MB data**
- **100 concurrent connections**

Our usage:
- Cron (2x/day): ~100 SET commands = 200 commands/day
- User requests: ~10 GET commands/user
- **Supports 980 users/day easily!** 🎉

## Cost if Exceeding Free Tier
- Pay-as-you-go: $0.20 per 100k commands
- 10k users/day = 100k GET commands = **$0.20/day** = **$6/month**

Still very affordable for scale!
