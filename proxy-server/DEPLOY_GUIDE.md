# Quick Deploy Guide

## Option 1: Railway (Easiest - No CLI needed)

### Step 1: Sign up
1. Go to https://railway.app/
2. Click "Login" and sign in with GitHub
3. Authorize Railway

### Step 2: Deploy
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose: **pandeabhijitv-ux/nse-stock-analyzer**
4. Click "Add variables" (optional - skip for now)
5. Click "Deploy"

### Step 3: Get Your URL
1. Click on the deployment
2. Go to "Settings" tab
3. Click "Generate Domain"
4. Copy the URL (e.g., `https://mosl-proxy.up.railway.app`)

### Step 4: Update Your App
Once you have the Railway URL, I'll update the app to use it.

---

## Option 2: Render (Also Easy - No CLI)

### Step 1: Sign up
1. Go to https://render.com/
2. Sign in with GitHub

### Step 2: Deploy
1. Click "New +" → "Web Service"
2. Connect your GitHub: **nse-stock-analyzer**
3. Settings:
   - Name: `mosl-proxy`
   - Root Directory: `proxy-server`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Free plan
4. Click "Create Web Service"

### Step 3: Get Your URL
Copy the URL (e.g., `https://mosl-proxy.onrender.com`)

---

## Option 3: Vercel (Fix SSL Issue)

If you want to use Vercel, run:
```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
cd C:\executables\stock-analyzer-mobile\proxy-server
vercel
```

---

**Recommendation**: Try **Railway** first - it's the fastest and easiest!

Let me know which service you used and the URL you got, then I'll update the app automatically.
