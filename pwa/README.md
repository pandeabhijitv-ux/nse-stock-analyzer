# 📱 NSE Stock Analyzer - PWA Version

This folder contains the Progressive Web App (PWA) version that can be converted to Android .aab file.

## 📦 Files

- **index.html** - Main app (complete functionality)
- **manifest.json** - PWA configuration
- **service-worker.js** - Offline support & caching
- **icon-192.png** - App icon (192x192) - *You need to create this*
- **icon-512.png** - App icon (512x512) - *You need to create this*

## 🚀 Quick Start

### Method 1: Test Locally

```powershell
# Serve the PWA locally
npx serve .

# Open in browser
# http://localhost:3000
```

### Method 2: Deploy to GitHub Pages

```powershell
# From project root
cd ..
git checkout -b gh-pages
git add pwa/*
git commit -m "Add PWA version"
git subtree push --prefix pwa origin gh-pages

# Your PWA will be at:
# https://YOUR_USERNAME.github.io/nse-stock-analyzer
```

### Method 3: Deploy to Netlify

1. Go to https://app.netlify.com/drop
2. Drag and drop the `pwa` folder
3. Get your URL: `https://random-name.netlify.app`

## 🔧 Create .aab File

### Option 1: PWABuilder (Easiest)

1. Deploy your PWA to any hosting
2. Go to https://www.pwabuilder.com/
3. Enter your PWA URL
4. Click "Start"
5. Click "Package For Stores" → "Android"
6. Download the .aab file

### Option 2: Bubblewrap CLI

```powershell
# Install
npm install -g @bubblewrap/cli

# Initialize (from pwa folder)
bubblewrap init --manifest https://your-url.com/manifest.json

# Build
bubblewrap build

# Output: app/build/outputs/bundle/release/app-release.aab
```

## 📝 Before Converting to .aab

### 1. Create Icons

You need two PNG icons:

**icon-192.png** (192x192 pixels):
- Can use online generator: https://realfavicongenerator.net/
- Or create in any image editor

**icon-512.png** (512x512 pixels):
- Higher resolution version of the same icon

### 2. Test PWA Score

```powershell
# Install Lighthouse
npm install -g lighthouse

# Test your deployed PWA
lighthouse https://your-pwa-url.com --view
```

Aim for 90+ PWA score.

## ✅ PWA Requirements Checklist

- [x] HTTPS hosting (GitHub Pages / Netlify provides this)
- [x] manifest.json with all fields
- [x] Service worker registered
- [x] Icons (192x192 and 512x512)
- [ ] Icons created (you need to do this)
- [ ] Deployed to web hosting
- [ ] Tested on mobile device

## 🎨 Creating Icons

### Quick Method:
1. Take a screenshot of the app running
2. Crop to square
3. Resize to 192x192 and 512x512
4. Save as PNG
5. Name them `icon-192.png` and `icon-512.png`

### Professional Method:
Use a logo/icon design tool:
- Canva: https://www.canva.com
- Figma: https://www.figma.com
- Or hire on Fiverr ($5-20)

## 📊 What Works in PWA Version

✅ All 10 sectors
✅ All 100 NSE stocks
✅ Stock search and filtering
✅ Technical indicators
✅ Fundamental analysis
✅ Buy/Sell/Hold recommendations
✅ Responsive design
✅ Offline caching
✅ Install prompt
✅ Works on any device

## 🌐 Hosting Options (All Free)

1. **GitHub Pages**: https://pages.github.com/
2. **Netlify**: https://www.netlify.com/
3. **Vercel**: https://vercel.com/
4. **Firebase Hosting**: https://firebase.google.com/
5. **Cloudflare Pages**: https://pages.cloudflare.com/

## 💰 Total Cost

- PWA Hosting: **Free**
- PWABuilder: **Free**
- Icon creation: **Free** (DIY) or $5-20 (pro)
- Google Play: **$25** (one-time)

**Total: $25-45**

## 🔄 Updates

To update the app after publishing:

1. Update files in this folder
2. Push to hosting
3. Users get update automatically (no Play Store update needed!)
4. PWA automatically serves new version

## 📱 Testing on Phone

1. Deploy PWA
2. Open URL on your Android phone
3. Chrome will show "Add to Home Screen"
4. Tap it
5. App installs as icon on home screen

This is exactly how it will work as .aab!

## ⚡ Performance

PWA version is:
- **Faster to load** (cached assets)
- **Smaller download** (~2 MB vs 20-50 MB native)
- **Instant updates** (no app store approval)
- **Cross-platform** (works on iOS, Android, Desktop)

## 🆘 Troubleshooting

### Service Worker not registering
- Must use HTTPS (http://localhost is okay for testing)
- Check browser console for errors

### PWA not installable
- Check manifest.json is valid
- Ensure all icon files exist
- Must be served over HTTPS

### Icons not showing
- Check file names match manifest.json
- Ensure files are in same directory as index.html
- Clear browser cache

## 📚 Next Steps

1. Create icon files (icon-192.png, icon-512.png)
2. Deploy to free hosting
3. Test PWA on phone
4. Use PWABuilder to generate .aab
5. Upload to Google Play Console

**Need help? See PWA_TO_AAB_GUIDE.md in parent folder!**
