# 🚀 Deployment Guide: NSE Stock Analyzer

## Part 1: Upload to GitHub

### Step 1: Initialize Git Repository

```powershell
cd C:\executables\stock-analyzer-mobile
git init
git add .
git commit -m "Initial commit: NSE Stock Analyzer with 10 sectors and 100 stocks"
```

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `nse-stock-analyzer`
3. Description: "AI-Powered NSE Stock Analysis App for Indian Market"
4. Choose Public or Private
5. **DO NOT** initialize with README (we already have one)
6. Click "Create repository"

### Step 3: Push to GitHub

```powershell
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/nse-stock-analyzer.git
git branch -M main
git push -u origin main
```

---

## Part 2: Build Android App Bundle (.aab) for Google Play

### Prerequisites

1. **Expo Account**: Sign up at https://expo.dev
2. **Google Play Developer Account**: $25 one-time fee at https://play.google.com/console

### Step 1: Install EAS CLI

```powershell
npm install -g eas-cli
```

### Step 2: Login to Expo

```powershell
eas login
```

Enter your Expo credentials.

### Step 3: Configure EAS Build

```powershell
eas build:configure
```

This creates/updates `eas.json` (already done ✅)

### Step 4: Build Android App Bundle (.aab)

```powershell
eas build --platform android --profile production
```

**What happens:**
1. EAS uploads your code to Expo servers
2. Builds the app in the cloud (10-20 minutes)
3. Generates a `.aab` file
4. Provides download link

### Step 5: Download the .aab File

After build completes, you'll see:
```
✔ Build successful
https://expo.dev/accounts/YOUR_ACCOUNT/projects/nse-stock-analyzer/builds/BUILD_ID
```

Click the link and download the `.aab` file.

---

## Part 3: Upload to Google Play Console

### Step 1: Create App in Play Console

1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in details:
   - **App name**: NSE Stock Analyzer
   - **Default language**: English (India)
   - **App or game**: App
   - **Free or paid**: Free
4. Accept declarations and create app

### Step 2: Set Up Store Listing

Fill in required information:
- **Short description**: "AI-powered stock analysis for NSE market"
- **Full description**: (Use content from README)
- **App icon**: 512x512 PNG
- **Feature graphic**: 1024x500 PNG
- **Screenshots**: At least 2 (take from web-test.html)
- **Category**: Finance
- **Contact email**: Your email

### Step 3: Upload the .aab File

1. Go to "Production" → "Create new release"
2. Click "Upload" and select your `.aab` file
3. Add release notes:
   ```
   Initial release:
   - 10 major NSE sectors
   - 100 top Indian stocks
   - Technical & Fundamental analysis
   - Buy/Sell/Hold recommendations
   ```
4. Click "Save" → "Review release"

### Step 4: Complete Content Rating

1. Go to "Content rating"
2. Fill out questionnaire (select "No" for most questions)
3. Get rating certificate

### Step 5: Set Up Privacy Policy

Create a simple privacy policy (required):
```
Privacy Policy for NSE Stock Analyzer

We do not collect, store, or share any personal information.
The app uses publicly available stock market data from Yahoo Finance API.
No user accounts or login required.
No data is stored on our servers.
```

Upload it to GitHub pages or your website, then add the URL in Play Console.

### Step 6: Complete App Content

- **Target audience**: 18+
- **Store presence**: News apps
- **Government apps**: No
- **Data safety**: No data collected

### Step 7: Submit for Review

1. Go to "Publishing overview"
2. Complete all required sections (green checkmarks)
3. Click "Send for review"
4. Wait 2-7 days for approval

---

## Alternative: Quick APK Build (Testing Only)

For testing without Play Store:

```powershell
eas build --platform android --profile preview
```

This creates an `.apk` file you can install directly on Android devices.

---

## Troubleshooting

### Issue: Node version incompatibility

**Solution**: Install Node 16 or 18
```powershell
nvm install 18
nvm use 18
```

### Issue: EAS build fails

**Solution**: Check `app.json` for errors
- Ensure all required fields are filled
- Verify package name is unique: `com.nsestockanalyzer.mobile`

### Issue: Google Play rejects app

**Common reasons:**
- Missing privacy policy
- Incomplete content rating
- Low-quality screenshots
- Misleading store listing

---

## Cost Summary

| Item | Cost |
|------|------|
| GitHub | Free |
| Expo Account | Free |
| EAS Build | Free (with limits) or $29/month |
| Google Play Developer | $25 (one-time) |
| **Total First Time** | **$25-54** |

---

## Next Steps After Publishing

1. **Monitor reviews** in Play Console
2. **Track analytics** (downloads, ratings)
3. **Update regularly** with bug fixes
4. **Add new features**:
   - Watchlist sync across devices
   - Price alerts
   - Portfolio tracking
   - More sectors/stocks
5. **Consider monetization**:
   - Premium features
   - Ads (AdMob)
   - Subscription model

---

## Support

- **Expo Build Issues**: https://docs.expo.dev/build/introduction/
- **Google Play Help**: https://support.google.com/googleplay/android-developer
- **GitHub Issues**: Open an issue in your repository

Good luck with your app launch! 🚀📈
