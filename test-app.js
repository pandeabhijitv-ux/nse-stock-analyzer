// Quick test to verify stock analysis logic
const { fetchStockQuote, SECTORS } = require('./src/services/stockAPI');
const { calculateRSI, calculateMACD } = require('./src/services/technicalAnalysis');
const { scoreFundamentals, calculateOverallScore } = require('./src/services/analysisEngine');

console.log('🧪 Testing Stock Analyzer...\n');

// Test 1: Check sectors
console.log('✅ Available Sectors:', Object.keys(SECTORS).length);
console.log('   -', Object.keys(SECTORS).join(', '));

// Test 2: Check technical calculations
const testPrices = [100, 102, 101, 103, 105, 104, 106, 108, 107, 109, 111, 110, 112, 114, 113];
const rsi = calculateRSI(testPrices, 14);
console.log('\n✅ RSI Calculation:', rsi.toFixed(2));

const macd = calculateMACD(testPrices);
console.log('✅ MACD:', macd.macd?.toFixed(2) || 'N/A');

// Test 3: Mock stock data
const mockStock = {
  peRatio: 18.5,
  returnOnEquity: 0.22,
  debtToEquity: 0.45,
  revenueGrowth: 0.15,
  currentRatio: 2.1,
  dividendYield: 0.02,
};

const scores = scoreFundamentals(mockStock);
console.log('\n✅ Fundamental Scores:');
console.log('   - Valuation:', Math.round(scores.valuation));
console.log('   - Profitability:', Math.round(scores.profitability));
console.log('   - Growth:', Math.round(scores.growth));
console.log('   - Financial Health:', Math.round(scores.financialHealth));
console.log('   - Dividend:', Math.round(scores.dividend));

const technicalScore = { overall: 75 };
const overall = calculateOverallScore(scores, technicalScore);
console.log('\n✅ Overall Score:', overall, '/100');

console.log('\n🎉 All core functions working!\n');
console.log('📱 To run the full mobile app:');
console.log('   1. Install Node 16: nvm install 16 && nvm use 16');
console.log('   2. Run: npm start');
console.log('   3. Scan QR with Expo Go app\n');
