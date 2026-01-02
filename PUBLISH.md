# 🚀 Quick Commands Reference

## GitHub Upload

```powershell
# Already done! ✅
# Your code is ready to push

# Method 1: Use the automated script
.\deploy.ps1

# Method 2: Manual steps
# 1. Create repo on GitHub: https://github.com/new
#    Name: nse-stock-analyzer
# 2. Push code:
git remote add origin https://github.com/YOUR_USERNAME/nse-stock-analyzer.git
git branch -M main
git push -u origin main
```

## Build .aab for Google Play

```powershell
# Install EAS CLI (one time)
npm install -g eas-cli

# Login to Expo
eas login

# Build Android App Bundle
eas build --platform android --profile production

# Download .aab file from the provided link
# Upload to https://play.google.com/console
```

## Quick Build for Testing (APK)

```powershell
# Build APK for direct installation (no Play Store)
eas build --platform android --profile preview
```

## Update App After Changes

```powershell
# Update version in app.json first!
# Change "version": "1.0.0" to "1.0.1"
# Change "versionCode": 1 to 2

# Commit changes
git add .
git commit -m "Version 1.0.1: Bug fixes and improvements"
git push

# Build new version
eas build --platform android --profile production
```

## Costs

- **GitHub**: Free
- **Expo Account**: Free
- **EAS Builds**: Free tier (limited builds) or $29/month unlimited
- **Google Play Developer**: $25 one-time registration fee

## What's in the .aab file?

The Android App Bundle (.aab) contains:
- Compiled app code
- All 10 sectors and 100 NSE stocks
- Technical and fundamental analysis logic
- Beautiful UI with charts
- Optimized for all Android devices

## Time Estimates

- GitHub upload: 2 minutes
- EAS build process: 15-20 minutes
- Google Play review: 2-7 days

## Support Links

- **Expo Dashboard**: https://expo.dev
- **Google Play Console**: https://play.google.com/console
- **Deployment Guide**: See DEPLOYMENT_GUIDE.md

---

Your app is ready to publish! 🎉
