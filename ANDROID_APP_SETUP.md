# Android App Setup Guide

## Overview
Convert your PWA into a native Android app using Capacitor, connecting to deployed backend.

---

## PART 1: Deploy Backend to Railway (5 minutes)

### Step 1: Sign Up for Railway
1. Go to https://railway.app
2. Click "Login" → "Login with GitHub"
3. Authorize Railway

### Step 2: Deploy Backend
1. Click "New Project" → "Deploy from GitHub repo"
2. Select repository: `pandeabhijitv-ux/nse-stock-analyzer`
3. Click "Add variables" and set:
   ```
   SAMCO_USER_ID = RA7334
   SAMCO_PASSWORD = Shriram@@26J
   PORT = 3002
   ```
4. Set **Root Directory**: `backend/samco`
5. Click "Deploy"
6. Wait 2-3 minutes for deployment
7. Copy your app URL (e.g., `https://your-app.up.railway.app`)

### Step 3: Update PWA with Backend URL
Replace in `pwa/index.html` line ~1090:
```javascript
const SAMCO_API = 'https://your-app.up.railway.app'; // Your Railway URL
```

Commit and push:
```bash
git add pwa/index.html backend/samco/railway.json backend/samco/Procfile
git commit -m "Add Railway deployment config and update backend URL"
git push
```

---

## PART 2: Create Android App with Capacitor

### Step 1: Install Capacitor
```bash
cd C:\executables\stock-analyzer-mobile
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### Step 2: Initialize Capacitor
```bash
npx cap init
```
When prompted:
- App name: `Stock Analyzer`
- App ID: `com.stockanalyzer.app`
- Web directory: `pwa`

### Step 3: Add Android Platform
```bash
npx cap add android
```

### Step 4: Copy PWA to Android
```bash
npx cap sync
```

### Step 5: Open in Android Studio
```bash
npx cap open android
```

Android Studio will open. Click **Run** (green play button) to install on:
- Connected Android phone (USB debugging enabled)
- Android Emulator

---

## PART 3: Build APK for Distribution

### Option A: Using Android Studio
1. In Android Studio: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`
3. Transfer APK to phone and install

### Option B: Using Command Line
```bash
cd android
./gradlew assembleDebug
```
APK: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Quick Setup (All Commands)

```powershell
# 1. Deploy backend (done manually on Railway.app)

# 2. Update PWA with Railway URL (edit pwa/index.html)

# 3. Install Capacitor
cd C:\executables\stock-analyzer-mobile
npm install @capacitor/core @capacitor/cli @capacitor/android

# 4. Initialize and build
npx cap init "Stock Analyzer" "com.stockanalyzer.app" pwa
npx cap add android
npx cap sync
npx cap open android
```

---

## File Structure After Setup
```
stock-analyzer-mobile/
├── android/              ← New Android project
├── pwa/                  ← Your PWA (web app)
├── backend/samco/        ← Backend (deployed to Railway)
│   ├── server.js
│   ├── railway.json      ← New
│   └── Procfile          ← New
├── capacitor.config.json ← New
└── package.json
```

---

## Testing the Android App

1. **Deploy backend to Railway** (get public URL)
2. **Update PWA** with Railway URL
3. **Run** `npx cap sync` to copy latest PWA
4. **Open** Android Studio: `npx cap open android`
5. **Run** on device/emulator
6. **Test** Options Trading screen - should load real Samco data

---

## Troubleshooting

**App shows blank screen:**
- Check backend URL in PWA is correct Railway URL
- Run `npx cap sync` after any PWA changes
- Check Android Studio logcat for errors

**Can't connect to backend:**
- Verify Railway backend is running (check Railway dashboard)
- Test backend URL in browser: `https://your-app.up.railway.app/`
- Check internet permission in `android/app/src/main/AndroidManifest.xml`

**Build fails:**
- Install Android Studio with SDK 33+
- Set Java JDK 17 in Android Studio settings

---

## Next Steps

1. ✅ **Deploy Backend** (Railway - 5 min)
2. ✅ **Update PWA** with Railway URL
3. ✅ **Install Capacitor** and create Android project
4. ✅ **Test** in Android Studio
5. ✅ **Build APK** and install on phone

**Ready to start?** Let me know when you've deployed to Railway and I'll help with the next steps!
