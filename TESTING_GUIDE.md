# 🚀 Quick Testing Guide for Stock Analyzer

## ✅ Core Logic Test - PASSED!

Your app's business logic is working perfectly:
- ✅ 10 Sectors with 100 stocks
- ✅ Technical indicators (RSI, MACD, etc.)
- ✅ Fundamental scoring system
- ✅ Overall score calculation

## 📱 How to Test the Full Mobile App

### The Node.js Issue
You're running Node 17+ which has a compatibility issue with Expo's Metro bundler.

### 🎯 SOLUTION: Use Node 16 (5 minutes)

#### Step 1: Install NVM for Windows
Download and install from: https://github.com/coreybutler/nvm-windows/releases
- Get `nvm-setup.exe` (latest version)
- Run installer with default settings

#### Step 2: Install Node 16
Open a NEW PowerShell window (as Administrator):
```powershell
nvm install 16.20.0
nvm use 16.20.0
node --version  # Should show v16.20.0
```

#### Step 3: Run Your App
```powershell
cd C:\Users\Abhijit.Pande\stock-analyzer-mobile
npm start
```

You'll see:
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

#### Step 4: Test on Your Phone
1. **Download "Expo Go"** from App Store or Play Store
2. **Scan the QR code** from terminal
3. **App loads** on your phone (wait 30-60 sec)

---

## 🌐 Alternative: Test in Web Browser (No Phone Needed)

If you just want to see it quickly:

```powershell
cd C:\Users\Abhijit.Pande\stock-analyzer-mobile
npm start -- --web
```

This will open the app in your browser at `http://localhost:19006`

**Note**: Some mobile-specific features may not work perfectly in web mode, but you can:
- ✅ See the UI
- ✅ Navigate between screens
- ✅ Test stock analysis
- ✅ View charts and scores

---

## 🧪 What You Can Test

Once the app loads:

### 1. **Home Screen**
- See 10 colorful sector cards
- Tap any sector (e.g., "Technology")

### 2. **Stock List Screen**
- See 10 stocks ranked by score
- Notice the scores (0-100)
- Top stocks have higher scores
- Tap on any stock (e.g., "AAPL")

### 3. **Stock Detail Screen**
Test all 3 tabs:

**Overview Tab:**
- See Buy/Sell/Hold recommendation
- Overall score visualization
- Price chart (1 year)
- Score breakdown bars

**Fundamental Tab:**
- Valuation metrics (P/E, P/B, etc.)
- Profitability (ROE, margins)
- Growth metrics
- Financial health
- Dividend info

**Technical Tab:**
- RSI indicator
- MACD analysis
- Moving averages
- Bollinger Bands
- Volume analysis
- Support/Resistance levels

### 4. **Bottom Navigation**
- **Analyze** tab: Main analysis
- **Screener** tab: Custom filters (UI demo)
- **Watchlist** tab: Saved stocks

---

## ⚡ Quick Commands Reference

```powershell
# Start app (after installing Node 16)
npm start

# Start in web mode
npm start -- --web

# Clear cache and restart
npm start -- --clear

# Run logic test
node test-app.js
```

---

## 🐛 Troubleshooting

### App loads slowly?
- **Normal!** First load takes 10-30 seconds
- Fetching data for 10 stocks from Yahoo Finance

### Can't connect on phone?
- Use same WiFi network
- Disable VPN
- Try tunnel mode: `npm start -- --tunnel`

### Still having Node issues?
Check your Node version:
```powershell
node --version
```
Should be v16.x.x, not v17+ or v20+

---

## 📊 Expected Results

### Example Stock Analysis (AAPL):
- **Overall Score**: 75-85/100
- **Recommendation**: Buy or Strong Buy
- **P/E Ratio**: ~20-30
- **ROE**: 100%+
- **Debt/Equity**: <2.0
- **RSI**: 40-60 (Neutral)
- **Trend**: Likely Uptrend

### Stock Rankings:
Stocks with best scores will be at top:
1. #1: ~80-90 score
2. #2: ~75-85 score
3. #3: ~70-80 score
...and so on

---

## 🎯 Success Criteria

Your app is working if:
- ✅ Sectors load on home screen
- ✅ Stock list shows ranked stocks
- ✅ Each stock has a score (0-100)
- ✅ Stock detail shows all metrics
- ✅ Charts render correctly
- ✅ Recommendations make sense
- ✅ Navigation works smoothly

---

## 📞 Need More Help?

1. Check if Node 16 is active: `node --version`
2. Clear cache: `npm start -- --clear`
3. Try web mode: `npm start -- --web`
4. Test logic: `node test-app.js`

---

**Your app is ready to test! Just install Node 16 and run `npm start`** 🚀
