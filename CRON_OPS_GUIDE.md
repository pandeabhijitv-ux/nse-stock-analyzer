# 🔧 Cron Job Operations & Troubleshooting Guide

**Last Updated:** February 4, 2026  
**Backend URL:** https://stock-analyzer-backend-nu.vercel.app  
**Deployment Location:** `proxy-server/` folder

---

## 📅 Cron Schedule Overview

### Dual Daily Runs
We run stock analysis **twice daily** to ensure fresh data throughout the trading day:

| Run | Time (IST) | Time (UTC) | Cron Expression | Purpose |
|-----|-----------|-----------|----------------|---------|
| **Morning** | 6:00 AM | 12:30 AM | `30 0 * * *` | Pre-market analysis for day traders |
| **Mid-Day** | 10:00 AM | 4:30 AM | `30 4 * * *` | Updated analysis after market opens |

### Why Two Runs?
- **6 AM Run**: Fresh analysis before market opens (9:15 AM IST)
- **10 AM Run**: Captures early morning price movements and volume

---

## 🚀 Quick Commands Reference

### 1. Check Backend Health
```powershell
# PowerShell
Invoke-WebRequest -Uri "https://stock-analyzer-backend-nu.vercel.app/api/health" -UseBasicParsing | Select-Object -ExpandProperty Content
```

```bash
# Bash/Linux/Mac
curl https://stock-analyzer-backend-nu.vercel.app/api/health
```

**Expected Response (Healthy):**
```json
{
  "success": true,
  "status": "fresh",
  "metadata": {
    "lastUpdated": 1770177159602,
    "stocksAnalyzed": 97,
    "totalStocks": 100,
    "successRate": "97.00%",
    "duration": "3668ms"
  },
  "nextUpdate": "6:00 AM & 10:00 AM IST daily"
}
```

**Status Indicators:**
- ✅ `"status": "fresh"` = Data updated within last 24 hours
- ⚠️ `"status": "stale"` = Data older than 24 hours (cron might be failing)
- ❌ `"status": "no-data"` = No analysis has run yet

---

### 2. Manually Trigger Cron Job

Use this when:
- Cron failed to run automatically
- Need immediate fresh analysis
- Testing after deployment

```powershell
# PowerShell
$headers = @{ "user-agent" = "vercel-cron/1.0" }
Invoke-WebRequest -Method POST -Uri "https://stock-analyzer-backend-nu.vercel.app/api/cron/analyze-stocks" -Headers $headers -UseBasicParsing -TimeoutSec 180
```

```bash
# Bash/Linux/Mac
curl -X POST https://stock-analyzer-backend-nu.vercel.app/api/cron/analyze-stocks \
  -H "user-agent: vercel-cron/1.0" \
  --max-time 180
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Stock analysis completed",
  "stats": {
    "stocksAnalyzed": 97,
    "totalStocks": 100,
    "duration": 3867,
    "categories": 9
  }
}
```

**⏱️ Note:** Analysis takes 3-5 seconds. Be patient and wait for response.

---

### 3. Test Analysis Endpoints

Verify cached data is accessible:

```powershell
# PowerShell - Test Swing Trading Category
Invoke-WebRequest -Uri "https://stock-analyzer-backend-nu.vercel.app/api/analysis?category=swing" -UseBasicParsing | ConvertFrom-Json | Select-Object success, @{Name='StockCount';Expression={$_.data.Count}}
```

```bash
# Bash - Test All Categories
for category in swing target longterm momentum quality breakout shortterm; do
  echo "Testing $category..."
  curl -s "https://stock-analyzer-backend-nu.vercel.app/api/analysis?category=$category" | jq '.success, .data | length'
done
```

**Expected:** Each category returns 20 stocks

---

### 4. Deploy Backend Changes

Use when you've modified backend code:

```powershell
# PowerShell
cd proxy-server
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
vercel --prod
```

```bash
# Bash/Linux/Mac
cd proxy-server
vercel --prod
```

**What Gets Deployed:**
- `proxy-server/` folder (NOT `backend/stock-proxy`)
- All API endpoints in `proxy-server/api/`
- Cron configuration from `proxy-server/vercel.json`

---

## 🔍 Troubleshooting Scenarios

### Scenario 1: Status Shows "stale"

**Symptom:**
```json
{ "status": "stale" }
```

**Diagnosis:**
Cron hasn't run in 24+ hours. Either:
1. Cron jobs are failing
2. Authorization is blocking Vercel cron
3. Vercel plan doesn't support cron

**Fix Steps:**

**Step 1:** Check Vercel Dashboard
- Go to: https://vercel.com/pandeabhijitvs-projects/stock-analyzer-backend
- Navigate to: Cron Jobs tab
- Verify both cron jobs are listed:
  - `/api/cron/analyze-stocks` at `30 0 * * *`
  - `/api/cron/analyze-stocks` at `30 4 * * *`

**Step 2:** Check Vercel Logs
- Dashboard → Logs
- Filter by: `/api/cron/analyze-stocks`
- Look for errors around 6:00 AM or 10:00 AM IST

**Step 3:** Manually Trigger
```powershell
$headers = @{ "user-agent" = "vercel-cron/1.0" }
Invoke-WebRequest -Method POST -Uri "https://stock-analyzer-backend-nu.vercel.app/api/cron/analyze-stocks" -Headers $headers -UseBasicParsing
```

**Step 4:** Verify Fix
Wait 2 minutes, then check health:
```powershell
Invoke-WebRequest -Uri "https://stock-analyzer-backend-nu.vercel.app/api/health" -UseBasicParsing | Select-Object -ExpandProperty Content
```

Should now show `"status": "fresh"`

---

### Scenario 2: Cron Returns 401 Unauthorized

**Symptom:**
```json
{ "error": "Unauthorized - Invalid or missing CRON_SECRET" }
```

**Diagnosis:**
Authorization code is rejecting Vercel's cron headers.

**Fix:**

**Step 1:** Verify Authorization Code
Open `proxy-server/api/cron/analyze-stocks.js` and ensure lines 6-12 look like this:

```javascript
// Allow both Vercel Cron (via special header) and manual triggers (via Bearer token)
const authHeader = req.headers.authorization;
const isVercelCron = req.headers['x-vercel-cron'] || req.headers['user-agent']?.includes('vercel-cron');

if (!isVercelCron && (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`)) {
  return res.status(401).json({ error: 'Unauthorized - Invalid or missing CRON_SECRET' });
}
```

**Step 2:** If code is wrong, fix and redeploy:
```powershell
cd proxy-server
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
vercel --prod
```

**Step 3:** Test again
```powershell
$headers = @{ "user-agent" = "vercel-cron/1.0" }
Invoke-WebRequest -Method POST -Uri "https://stock-analyzer-backend-nu.vercel.app/api/cron/analyze-stocks" -Headers $headers -UseBasicParsing
```

---

### Scenario 3: Cron Returns 404 Not Found

**Symptom:**
```
The page could not be found
NOT_FOUND
```

**Diagnosis:**
Wrong deployment or routing issue.

**Fix:**

**Step 1:** Verify Correct Folder
Make sure you're deploying `proxy-server/` (NOT `backend/stock-proxy/`):

```powershell
cd c:\executables\stock-analyzer-mobile
cd proxy-server
vercel --prod
```

**Step 2:** Check File Exists
```powershell
Test-Path proxy-server\api\cron\analyze-stocks.js
```

Should return `True`

**Step 3:** Check Vercel Routing
Verify `proxy-server/vercel.json` contains:
```json
{
  "crons": [
    { "path": "/api/cron/analyze-stocks", "schedule": "30 0 * * *" },
    { "path": "/api/cron/analyze-stocks", "schedule": "30 4 * * *" }
  ]
}
```

**Step 4:** Force Redeploy
```powershell
cd proxy-server
Remove-Item .vercel -Recurse -Force -ErrorAction SilentlyContinue
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
vercel --prod
```

---

### Scenario 4: Analysis Returns Empty/Few Stocks

**Symptom:**
```json
{
  "success": true,
  "data": []  // or very few stocks
}
```

**Diagnosis:**
Yahoo Finance API might be rate-limiting or blocking requests.

**Fix:**

**Step 1:** Check Cron Execution Logs
- Vercel Dashboard → Logs → Filter by `analyze-stocks`
- Look for errors like:
  - "429 Too Many Requests"
  - "403 Forbidden"
  - "ETIMEDOUT"

**Step 2:** Trigger Manual Run
```powershell
$headers = @{ "user-agent" = "vercel-cron/1.0" }
$response = Invoke-WebRequest -Method POST -Uri "https://stock-analyzer-backend-nu.vercel.app/api/cron/analyze-stocks" -Headers $headers -UseBasicParsing
$response.Content
```

Check `stocksAnalyzed` count. Should be 95-100.

**Step 3:** If Still Failing
The issue might be with Yahoo Finance. Options:
1. Wait 1 hour and retry (rate limit resets)
2. Check Yahoo Finance status: https://finance.yahoo.com
3. Consider switching to alternative data source (requires code changes)

---

### Scenario 5: Vercel Plan Limitations

**Symptom:**
Only 1 cron runs per day, or cron doesn't appear in dashboard.

**Diagnosis:**
Free/Hobby Vercel plans have cron limitations.

**Current Plan Limits:**
- **Hobby (Free):** 1 cron execution per day
- **Pro:** Multiple crons per day ✅ (what we need)
- **Enterprise:** Unlimited

**Fix:**

**Option 1: Upgrade to Pro**
- Go to Vercel Dashboard → Settings → Billing
- Upgrade to Pro plan ($20/month)

**Option 2: Use Single Cron (6 AM only)**
Edit `proxy-server/vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/analyze-stocks", "schedule": "30 0 * * *" }
  ]
}
```

Redeploy:
```powershell
cd proxy-server
vercel --prod
```

---

## 📊 Monitoring & Alerts

### Daily Health Check Script

Create a script to check backend health every morning:

**PowerShell Script** (`check-backend-health.ps1`):
```powershell
# Daily Backend Health Check
$url = "https://stock-analyzer-backend-nu.vercel.app/api/health"
$response = Invoke-WebRequest -Uri $url -UseBasicParsing | ConvertFrom-Json

Write-Host "Backend Health Check - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "Status: $($response.status)" -ForegroundColor $(if ($response.status -eq 'fresh') { 'Green' } else { 'Yellow' })
Write-Host "Stocks Analyzed: $($response.metadata.stocksAnalyzed)/$($response.metadata.totalStocks)"
Write-Host "Success Rate: $($response.metadata.successRate)"
Write-Host "Last Updated: $(Get-Date -UnixTimeSeconds ($response.metadata.lastUpdated / 1000) -Format 'yyyy-MM-dd HH:mm:ss')"

if ($response.status -ne 'fresh') {
    Write-Host "⚠️ WARNING: Backend data is stale! Triggering manual cron..." -ForegroundColor Red
    $headers = @{ "user-agent" = "vercel-cron/1.0" }
    Invoke-WebRequest -Method POST -Uri "https://stock-analyzer-backend-nu.vercel.app/api/cron/analyze-stocks" -Headers $headers -UseBasicParsing
    Write-Host "✅ Manual cron triggered. Wait 5 seconds..." -ForegroundColor Green
    Start-Sleep -Seconds 5
    Invoke-WebRequest -Uri $url -UseBasicParsing | ConvertFrom-Json
}
```

**Usage:**
```powershell
# Run daily at 6:30 AM IST (after first cron)
.\check-backend-health.ps1
```

**Schedule with Task Scheduler:**
```powershell
# Create scheduled task
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\path\to\check-backend-health.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At "06:30AM"
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "Backend Health Check" -Description "Checks stock analyzer backend health daily"
```

---

### Bash Monitoring Script

**Bash Script** (`check-backend-health.sh`):
```bash
#!/bin/bash
# Daily Backend Health Check

URL="https://stock-analyzer-backend-nu.vercel.app/api/health"
RESPONSE=$(curl -s $URL)

echo "Backend Health Check - $(date '+%Y-%m-%d %H:%M:%S')"
echo "$RESPONSE" | jq '.'

STATUS=$(echo "$RESPONSE" | jq -r '.status')

if [ "$STATUS" != "fresh" ]; then
    echo "⚠️ WARNING: Backend data is stale! Triggering manual cron..."
    curl -X POST $URL/api/cron/analyze-stocks -H "user-agent: vercel-cron/1.0"
    echo "✅ Manual cron triggered. Waiting 5 seconds..."
    sleep 5
    curl -s $URL | jq '.'
fi
```

**Make executable and schedule:**
```bash
chmod +x check-backend-health.sh

# Add to crontab (runs daily at 6:30 AM)
crontab -e
# Add line: 30 6 * * * /path/to/check-backend-health.sh
```

---

## 🔐 Security Notes

### Cron Authentication Methods

**Method 1: Vercel Automatic Cron (Recommended)**
- Identified by `user-agent: vercel-cron` header
- No secrets required
- Vercel handles authentication automatically
- Used for scheduled 6 AM and 10 AM runs

**Method 2: Manual Trigger with Secret (Optional)**
- Requires `Authorization: Bearer ${CRON_SECRET}` header
- Used for debugging/manual triggers
- Secret must be set in Vercel environment variables

**To Set CRON_SECRET (Optional):**
```bash
# Generate secret
SECRET=$(openssl rand -base64 32)

# Add to Vercel
vercel env add CRON_SECRET production
# Paste the secret when prompted

# Test manual trigger
curl -X POST https://stock-analyzer-backend-nu.vercel.app/api/cron/analyze-stocks \
  -H "Authorization: Bearer YOUR_SECRET_HERE"
```

---

## 📝 Deployment Checklist

Use this checklist when deploying backend changes:

### Pre-Deployment
- [ ] Test changes locally (if applicable)
- [ ] Review `proxy-server/vercel.json` for cron config
- [ ] Verify authorization code in `api/cron/analyze-stocks.js`
- [ ] Commit changes to git

### Deployment
- [ ] Navigate to correct folder: `cd proxy-server`
- [ ] Deploy to Vercel: `vercel --prod`
- [ ] Wait for deployment to complete (15-20 seconds)
- [ ] Note deployment URL from terminal output

### Post-Deployment
- [ ] Test health endpoint: `curl .../api/health`
- [ ] Manually trigger cron: `curl -X POST .../api/cron/analyze-stocks`
- [ ] Verify analysis endpoints: `curl .../api/analysis?category=swing`
- [ ] Check Vercel Dashboard → Cron Jobs tab
- [ ] Monitor logs for errors over next 24 hours

---

## 🆘 Emergency Contacts & Resources

### Vercel Dashboard
- **URL:** https://vercel.com/pandeabhijitvs-projects/stock-analyzer-backend
- **Sections:**
  - Deployments: View deployment history
  - Logs: Real-time logs and errors
  - Cron Jobs: Scheduled cron status
  - Settings: Environment variables, domains

### Key Files
- `proxy-server/vercel.json` - Cron schedule configuration
- `proxy-server/api/cron/analyze-stocks.js` - Cron handler
- `proxy-server/api/health/index.js` - Health check endpoint
- `proxy-server/api/analysis/index.js` - Analysis API

### Documentation
- `CRON_FIX_SUMMARY.md` - Recent fix details
- `DEPLOYMENT_SUMMARY.md` - Full deployment guide
- `proxy-server/README.md` - Backend setup guide
- `CRON_OPS_GUIDE.md` - This file

### Support
- **Yahoo Finance API Status:** https://finance.yahoo.com
- **Vercel Status:** https://www.vercel-status.com
- **Vercel Support:** https://vercel.com/support

---

## 📖 Common Commands Summary

```powershell
# === HEALTH CHECKS ===
# Check backend status
Invoke-WebRequest -Uri "https://stock-analyzer-backend-nu.vercel.app/api/health" -UseBasicParsing

# === MANUAL CRON TRIGGER ===
# Trigger fresh analysis
$headers = @{ "user-agent" = "vercel-cron/1.0" }
Invoke-WebRequest -Method POST -Uri "https://stock-analyzer-backend-nu.vercel.app/api/cron/analyze-stocks" -Headers $headers -UseBasicParsing

# === DEPLOYMENT ===
# Deploy backend changes
cd proxy-server
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
vercel --prod

# === TESTING ===
# Test analysis endpoint
Invoke-WebRequest -Uri "https://stock-analyzer-backend-nu.vercel.app/api/analysis?category=swing" -UseBasicParsing

# === GIT ===
# Commit changes
git add .
git commit -m "Update cron configuration"
git push

# === LOGS ===
# View Vercel logs (in dashboard)
# https://vercel.com/pandeabhijitvs-projects/stock-analyzer-backend/logs
```

---

## 🎯 Success Indicators

Your cron system is healthy when:

✅ Health endpoint returns `"status": "fresh"`  
✅ `lastUpdated` timestamp is < 4 hours old  
✅ `successRate` is > 95%  
✅ `stocksAnalyzed` is 95-100  
✅ Analysis endpoints return 20 stocks per category  
✅ Response time is < 200ms  
✅ Vercel logs show successful cron executions at 6 AM and 10 AM IST  
✅ No 401/404/500 errors in last 24 hours  

---

**Guide Version:** 1.0  
**Last Updated:** February 4, 2026  
**Maintained By:** Abhijit Pande  
**Next Review:** After any cron failure or deployment change
