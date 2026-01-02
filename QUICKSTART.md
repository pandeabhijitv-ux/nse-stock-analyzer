# 🚀 Quick Start Guide

## Installation & Setup

### Step 1: Install Node.js
Download and install Node.js from [nodejs.org](https://nodejs.org/) (LTS version recommended)

### Step 2: Install Expo CLI
```bash
npm install -g expo-cli
```

### Step 3: Install Dependencies
Navigate to the project folder and run:
```bash
cd stock-analyzer-mobile
npm install
```

### Step 4: Start the App
```bash
npm start
```
or
```bash
expo start
```

This will open Expo DevTools in your browser.

### Step 5: Run on Your Device

#### Option A: Physical Device (Recommended for best experience)
1. **iOS**: Download "Expo Go" from App Store
2. **Android**: Download "Expo Go" from Play Store
3. Scan the QR code from the terminal with:
   - iOS: Camera app
   - Android: Expo Go app

#### Option B: Simulator/Emulator
- **iOS Simulator** (Mac only): Press `i` in terminal
- **Android Emulator**: Press `a` in terminal
  - Requires Android Studio to be installed

## 📱 Testing the App

### 1. Home Screen
- You'll see 10 sectors (Technology, Healthcare, Financial, etc.)
- Tap any sector to view stocks

### 2. Stock List
- View top 10 stocks in that sector
- Stocks are ranked by overall score
- Tap any stock to see detailed analysis

### 3. Stock Detail
- **Overview**: Recommendation, scores, price chart
- **Fundamental**: All financial metrics
- **Technical**: Technical indicators (RSI, MACD, etc.)

### 4. Bottom Navigation
- **Analyze**: Main stock analysis
- **Screener**: Filter stocks (UI demo)
- **Watchlist**: Saved stocks

## ⚙️ Troubleshooting

### "Unable to resolve module"
```bash
npm install
expo start --clear
```

### "Network request failed"
- Check your internet connection
- Yahoo Finance API may be rate-limited
- Try again after a few minutes

### App crashes on startup
```bash
rm -rf node_modules
npm install
expo start --clear
```

### Slow loading
- Yahoo Finance API fetches real-time data
- Loading 10 stocks may take 10-30 seconds
- This is normal for the free API

## 🎯 Next Steps

1. **Explore Different Sectors**: Try Technology, Healthcare, Financial sectors
2. **Compare Scores**: See which stocks rank highest
3. **Check Recommendations**: Look at Buy/Sell/Hold signals
4. **Review Technical Indicators**: Understand RSI, MACD signals
5. **Customize**: Edit stock symbols in `src/services/stockAPI.js`

## 📊 Understanding the App

### Overall Score (0-100)
Combines fundamental and technical analysis:
- Valuation (20%)
- Profitability (20%)
- Growth (20%)
- Financial Health (15%)
- Dividend (10%)
- Technical (15%)

### Recommendation Actions
- **Strong Buy** (75-100): Excellent metrics
- **Buy** (60-74): Good potential
- **Hold** (45-59): Mixed signals
- **Sell** (30-44): Concerning metrics
- **Strong Sell** (0-29): Poor fundamentals

### Key Metrics to Watch
- **P/E Ratio**: Lower is generally better (< 20)
- **ROE**: Higher is better (> 15%)
- **Debt/Equity**: Lower is better (< 1.0)
- **RSI**: 30-70 is neutral, <30 oversold, >70 overbought
- **Trend**: Uptrend is bullish, Downtrend is bearish

## 🔧 Customization

### Change Stock Symbols
Edit `src/services/stockAPI.js`:
```javascript
export const SECTORS = {
  'Technology': ['AAPL', 'MSFT', 'GOOGL', ...],
  // Add your own symbols
};
```

### Adjust Scoring Weights
Edit `src/services/analysisEngine.js`:
```javascript
const defaultWeights = {
  valuation: 0.20,    // Change these values
  profitability: 0.20,
  growth: 0.20,
  // ...
};
```

## 📞 Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review the code comments in source files
- Open an issue if you find bugs

---

**Happy Analyzing! 📈**
