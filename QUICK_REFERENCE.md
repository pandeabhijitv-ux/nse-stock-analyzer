# 🎯 Quick Reference Card

## 🚀 Essential Commands

### Start the App
```bash
npm start
# or
expo start
```

### Run on Devices
```bash
expo start          # Show QR code
i                   # Run on iOS simulator
a                   # Run on Android emulator
```

### Troubleshooting
```bash
npm install                    # Install dependencies
expo start --clear            # Clear cache
rm -rf node_modules && npm install    # Full reset
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `App.js` | Main app entry point |
| `src/services/stockAPI.js` | Change stock symbols here |
| `src/services/analysisEngine.js` | Adjust scoring weights |
| `package.json` | Dependencies & scripts |

---

## 🎨 Customization Quick Guide

### Change Stock Symbols
Edit `src/services/stockAPI.js`:
```javascript
export const SECTORS = {
  'Technology': ['AAPL', 'MSFT', 'GOOGL', ...],
  // Add your symbols
};
```

### Adjust Score Weights
Edit `src/services/analysisEngine.js`:
```javascript
const defaultWeights = {
  valuation: 0.20,      // Change these
  profitability: 0.20,
  growth: 0.20,
  financialHealth: 0.15,
  dividend: 0.10,
  technical: 0.15,
};
```

### Change Colors
Edit screen files (e.g., `HomeScreen.js`):
```javascript
const sectorColors = {
  'Technology': ['#667eea', '#764ba2'],  // Change hex codes
  // ...
};
```

---

## 📊 Understanding Scores

| Score | Rating | Action |
|-------|--------|--------|
| 75-100 | Excellent | Strong Buy |
| 60-74 | Good | Buy |
| 45-59 | Fair | Hold |
| 30-44 | Poor | Sell |
| 0-29 | Very Poor | Strong Sell |

---

## 🔑 Key Metrics Explained

### Fundamental
- **P/E Ratio**: Price ÷ Earnings (lower is better, < 20)
- **ROE**: Return on Equity (higher is better, > 15%)
- **Debt/Equity**: Debt ÷ Equity (lower is better, < 1.0)
- **Free Cash Flow**: Cash after expenses (positive is good)

### Technical
- **RSI**: 0-100 scale (< 30 oversold, > 70 overbought)
- **MACD**: Momentum indicator (positive = bullish)
- **Trend**: Uptrend/Downtrend/Sideways
- **Volume**: High volume = high interest

---

## 🎯 App Flow

```
1. Home → Select Sector
2. Stock List → See Rankings
3. Stock Detail → View Analysis
   ├── Overview (Recommendation)
   ├── Fundamental (Ratios)
   └── Technical (Indicators)
4. Bottom Nav
   ├── Analyze (Main)
   ├── Screener (Filters)
   └── Watchlist (Saved)
```

---

## ⚡ Performance Tips

1. **First Load**: Takes 10-30 seconds (fetching data)
2. **Reduce Stocks**: Edit stockAPI.js to analyze fewer stocks
3. **Cache Data**: Pull-to-refresh to update
4. **Good Internet**: Requires stable connection

---

## 🐛 Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| Can't connect | Same WiFi network + no VPN |
| Module not found | `npm install` |
| Slow loading | Normal for first time |
| App crashes | `expo start --clear` |
| Port in use | `expo start --port 19001` |

---

## 📚 Quick Links

- [README.md](README.md) - Full documentation
- [QUICKSTART.md](QUICKSTART.md) - Getting started
- [INSTALLATION.md](INSTALLATION.md) - Detailed setup
- [FEATURES.md](FEATURES.md) - All features
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Overview

---

## 📱 Device Requirements

- **iOS**: iPhone 7+ with iOS 13+
- **Android**: Android 6.0+
- **RAM**: 2GB minimum
- **Storage**: 100MB for app

---

## 🎓 Learning Resources

- **React Native**: https://reactnative.dev/
- **Expo**: https://docs.expo.dev/
- **Financial Analysis**: Investopedia.com
- **Technical Analysis**: TradingView.com

---

## 🔧 Development Mode

```bash
# Clear cache
expo start --clear

# Use tunnel (for network issues)
expo start --tunnel

# Production mode
expo start --no-dev --minify

# Check for updates
npm outdated
```

---

## 📦 Project Structure

```
src/
├── screens/          # UI components
│   ├── HomeScreen
│   ├── StockListScreen
│   ├── StockDetailScreen
│   ├── ScreenerScreen
│   └── WatchlistScreen
└── services/         # Business logic
    ├── stockAPI      # Data fetching
    ├── technicalAnalysis  # Indicators
    └── analysisEngine     # Scoring
```

---

## 🎨 Color Scheme

| Element | Color |
|---------|-------|
| Primary | #2196F3 (Blue) |
| Success | #4CAF50 (Green) |
| Warning | #FFC107 (Yellow) |
| Danger | #F44336 (Red) |
| Background | #f5f7fa (Light Gray) |

---

## 🚀 Deployment

```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android

# Publish updates
expo publish
```

---

## 💡 Pro Tips

1. **Test on real device** for best experience
2. **Pull down to refresh** stock data
3. **Sort stocks** by score/price/change
4. **Check all 3 tabs** for complete analysis
5. **Compare sectors** to find opportunities

---

## ⚠️ Limitations

- Yahoo Finance API rate limits
- No historical comparison (yet)
- US stocks only (for now)
- Real-time calculations (may be slow)

---

## 📞 Need Help?

1. Check documentation files
2. Review code comments
3. Search Expo docs
4. Check React Native docs

---

**Keep this file handy for quick reference! 📌**
