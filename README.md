# Stock Analyzer Mobile App

A comprehensive React Native mobile application for fundamental and technical stock analysis. This app analyzes stocks across multiple parameters to help investors make informed decisions.

## 🎯 Features

### Fundamental Analysis
- **Valuation Metrics**: P/E Ratio, PEG Ratio, Price-to-Book, Price-to-Sales, EV/Revenue, EV/EBITDA
- **Profitability**: Profit Margin, Operating Margin, ROE, ROA
- **Growth Metrics**: Revenue Growth, Earnings Growth, Quarterly Earnings Growth
- **Financial Health**: Debt-to-Equity, Current Ratio, Quick Ratio, Free Cash Flow
- **Dividend Information**: Dividend Yield, Dividend Rate, Payout Ratio
- **Risk Metrics**: Beta, Market Cap

### Technical Analysis
- **Momentum Indicators**: RSI, Stochastic Oscillator, MACD
- **Trend Indicators**: Moving Averages (SMA 20/50/200, EMA 12/26), Trend Detection
- **Volatility**: Bollinger Bands, ATR (Average True Range)
- **Support & Resistance Levels**
- **Volume Analysis**: Average Volume, Volume Ratio, High Volume Detection

### Additional Features
- **Sector-based Analysis**: Browse stocks by 10 major sectors
- **AI-Powered Scoring**: Composite scores based on all metrics
- **Buy/Sell Recommendations**: Automated recommendations with reasons
- **Interactive Charts**: Price history visualization
- **Stock Screener**: Filter stocks by custom criteria (coming soon)
- **Watchlist**: Save and track favorite stocks
- **Real-time Data**: Fetches live data from Yahoo Finance API

## 🏗️ Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **Charts**: React Native Chart Kit
- **Data Source**: Yahoo Finance API (via yfinance equivalent)
- **Storage**: AsyncStorage for watchlist
- **UI**: Custom components with Linear Gradients

## 📱 Screenshots

- Home screen with sector selection
- Stock list with ranking and scores
- Detailed analysis with tabs (Overview, Fundamental, Technical)
- Interactive price charts
- Stock screener
- Watchlist management

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Studio (for Android emulator)
- Physical device with Expo Go app (optional)

### Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd stock-analyzer-mobile
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```
   or
   ```bash
   expo start
   ```

4. **Run on device/simulator**:
   - **iOS**: Press `i` in the terminal or scan QR code with Camera app
   - **Android**: Press `a` in the terminal or scan QR code with Expo Go app
   - **Web**: Press `w` in the terminal (for testing only)

## 📖 How to Use

### 1. Select a Sector
- Open the app and choose from 10 major sectors
- Each sector contains 10 popular stocks

### 2. View Top Stocks
- Stocks are ranked by overall score (0-100)
- See key metrics at a glance: P/E, ROE, Debt/Equity, RSI
- Sort by score, price, or change percentage

### 3. Analyze Individual Stocks
- Tap any stock to view detailed analysis
- **Overview Tab**: See recommendation, overall score, score breakdown, and price chart
- **Fundamental Tab**: Deep dive into all fundamental metrics
- **Technical Tab**: View all technical indicators and signals

### 4. Understanding Scores
- **75-100**: Excellent (Strong Buy)
- **60-74**: Good (Buy)
- **45-59**: Fair (Hold)
- **30-44**: Poor (Sell)
- **0-29**: Very Poor (Strong Sell)

### 5. Watchlist
- Add stocks to watchlist from the detail screen
- Track your favorite stocks in one place
- Quick access to full analysis

## 🎨 App Structure

```
stock-analyzer-mobile/
├── App.js                          # Main navigation setup
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js           # Sector selection
│   │   ├── StockListScreen.js     # Top stocks by sector
│   │   ├── StockDetailScreen.js   # Detailed analysis
│   │   ├── ScreenerScreen.js      # Custom filters
│   │   └── WatchlistScreen.js     # Saved stocks
│   └── services/
│       ├── stockAPI.js             # Yahoo Finance API calls
│       ├── technicalAnalysis.js   # Technical indicators
│       └── analysisEngine.js      # Scoring & recommendations
└── package.json
```

## 🔧 Configuration

### Changing Stock Universe
Edit `SECTORS` object in `src/services/stockAPI.js` to customize stock symbols for each sector.

### Adjusting Scoring Weights
Modify weights in `calculateOverallScore()` function in `src/services/analysisEngine.js`:
```javascript
const defaultWeights = {
  valuation: 0.20,
  profitability: 0.20,
  growth: 0.20,
  financialHealth: 0.15,
  dividend: 0.10,
  technical: 0.15,
};
```

### Adding More Technical Indicators
Add new calculations in `src/services/technicalAnalysis.js` and update the UI in `StockDetailScreen.js`.

## 📊 Data Source

This app uses Yahoo Finance public API to fetch:
- Real-time stock prices
- Historical price data
- Fundamental financial metrics
- Company information

**Note**: Yahoo Finance API is free but has rate limits. For production use, consider:
- Alpha Vantage API (free tier available)
- IEX Cloud API
- Paid financial data providers

## ⚠️ Limitations

- Data is fetched in real-time (no caching) - may be slow for multiple stocks
- Yahoo Finance API may have rate limits
- Some stocks may have missing data (shows as N/A)
- Screener functionality is UI-only (backend coming soon)
- No historical comparison or backtesting yet

## 🚧 Coming Soon

- [ ] Advanced stock screener with live filtering
- [ ] Portfolio tracking and performance
- [ ] News sentiment analysis
- [ ] Alerts and notifications
- [ ] Comparison tool (compare 2-3 stocks side by side)
- [ ] Historical analysis and backtesting
- [ ] Export reports to PDF
- [ ] Dark mode support
- [ ] Multiple market support (India, Europe, etc.)

## 🛠️ Development

### Running Tests
```bash
npm test
```

### Building for Production

**iOS**:
```bash
expo build:ios
```

**Android**:
```bash
expo build:android
```

### Publishing Updates
```bash
expo publish
```

## 📝 License

This project is for educational purposes. Stock market data is provided by Yahoo Finance.

## ⚠️ Disclaimer

**This app is for informational purposes only and should not be considered financial advice. Always do your own research and consult with a qualified financial advisor before making investment decisions. Past performance does not guarantee future results.**

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📧 Support

For questions or support, please open an issue on the repository.

---

**Happy Investing! 📈**
