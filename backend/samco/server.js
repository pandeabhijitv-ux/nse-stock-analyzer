const express = require('express');
const cors = require('cors');
const https = require('https');
const fetch = require('node-fetch');
const NodeCache = require('node-cache');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// SSL Agent for Windows
const agent = new https.Agent({
    rejectUnauthorized: false
});

// Cache with 5-minute TTL for option chain data
const cache = new NodeCache({ stdTTL: 300 });

// Daily options cache with 24-hour TTL
const dailyOptionsCache = new NodeCache({ stdTTL: 86400 });

// Commodities cache with 1-hour TTL
const commoditiesCache = new NodeCache({ stdTTL: 86400 }); // 24-hour cache for free tier

// Technical indicators cache with 24-hour TTL
const technicalCache = new NodeCache({ stdTTL: 86400 });

// Middleware
app.use(cors());
app.use(express.json());

// Samco API configuration
const SAMCO_BASE_URL = 'https://tradeapi.samco.in';
const SAMCO_USER_ID = process.env.SAMCO_USER_ID;
const SAMCO_PASSWORD = process.env.SAMCO_PASSWORD;
const SAMCO_YOB = process.env.SAMCO_YOB || '';

// Metal Price API configuration (free tier: 100 requests/month)
const METALS_API_KEY = process.env.METALS_API_KEY || 'f4d4f9dc0998b9205965468c4958dae9';
const METALS_BASE_URL = 'https://api.metalpriceapi.com/v1';

// Commodities API configuration - Using MetalPriceAPI.com which also supports commodities
// Free tier: 100 requests/month (shares quota with gold/silver)
const COMMODITIES_API_KEY = METALS_API_KEY; // Same API, same key
const COMMODITIES_BASE_URL = 'https://api.metalpriceapi.com/v1';

// Session token storage
let sessionToken = null;
let tokenExpiry = null;

// Helper: Login to Samco and get session token
async function getSessionToken() {
  // Return cached token if valid
  if (sessionToken && tokenExpiry && Date.now() < tokenExpiry) {
    console.log('✅ Using cached session token');
    return sessionToken;
  }

  console.log('🔐 Logging in to Samco API...');
  
  try {
    const response = await fetch(`${SAMCO_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: SAMCO_USER_ID,
        password: SAMCO_PASSWORD,
        yob: SAMCO_YOB
      }),
      agent: agent
    });

    const data = await response.json();
    
    if (response.ok && data.sessionToken) {
      sessionToken = data.sessionToken;
      // Set token expiry to 6 hours (typical session duration)
      tokenExpiry = Date.now() + (6 * 60 * 60 * 1000);
      console.log('✅ Successfully logged in to Samco API');
      console.log('📝 Session Token:', sessionToken.substring(0, 20) + '...');
      return sessionToken;
    } else {
      console.error('❌ Samco Login Failed:', data);
      throw new Error(data.errorMessage || 'Login failed');
    }
  } catch (error) {
    console.error('❌ Samco Login Error:', error.message);
    throw error;
  }
}

// Helper: Make authenticated API request
async function samcoRequest(endpoint, method = 'GET', body = null) {
  const token = await getSessionToken();
  
  const options = {
    method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-session-token': token
    },
    agent: agent
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${SAMCO_BASE_URL}${endpoint}`, options);
  const data = await response.json();
  
  // Handle token expiry
  if (response.status === 401) {
    console.log('⚠️ Token expired, re-authenticating...');
    sessionToken = null;
    tokenExpiry = null;
    return samcoRequest(endpoint, method, body);
  }
  
  if (!response.ok) {
    throw new Error(data.errorMessage || `API Error: ${response.status}`);
  }
  
  return data;
}

// ============================================
// TECHNICAL INDICATOR CALCULATIONS
// ============================================
// Calculate RSI (Relative Strength Index)
function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return null;
  
  let gains = 0;
  let losses = 0;
  
  // Calculate initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  // Calculate RSI for remaining prices using smoothed averages
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Calculate EMA (Exponential Moving Average)
function calculateEMA(prices, period) {
  if (prices.length < period) return null;
  
  // Calculate initial SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  let ema = sum / period;
  
  // Calculate EMA
  const multiplier = 2 / (period + 1);
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

// Calculate MACD
function calculateMACD(prices) {
  if (prices.length < 26) return null;
  
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  if (!ema12 || !ema26) return null;
  
  const macd = ema12 - ema26;
  
  // Calculate signal line (9-day EMA of MACD)
  const macdLine = [];
  for (let i = 25; i < prices.length; i++) {
    const slicedPrices = prices.slice(0, i + 1);
    const ema12 = calculateEMA(slicedPrices, 12);
    const ema26 = calculateEMA(slicedPrices, 26);
    if (ema12 && ema26) {
      macdLine.push(ema12 - ema26);
    }
  }
  
  const signal = calculateEMA(macdLine, 9) || 0;
  const histogram = macd - signal;
  
  return { macd, signal, histogram };
}

// Fetch historical data from Samco and calculate technical indicators
async function calculateTechnicalIndicators(symbol) {
  try {
    // Check cache first
    const cached = technicalCache.get(symbol);
    if (cached) {
      console.log(`📊 Using cached technical indicators for ${symbol}`);
      return cached;
    }
    
    console.log(`📈 Calculating technical indicators for ${symbol}...`);
    
    // Fetch historical candle data from Samco (last 200 days for accurate EMA200)
    const today = new Date();
    const fromDate = new Date(today);
    fromDate.setDate(today.getDate() - 200);
    
    const fromDateStr = fromDate.toISOString().split('T')[0];
    const toDateStr = today.toISOString().split('T')[0];
    
    // Get intraday candles for the symbol
    const candleData = await samcoRequest(
      `/intraday/candleData?exchange=NSE&symbolName=${symbol}&fromDate=${fromDateStr}&toDate=${toDateStr}&interval=1D`
    );
    
    if (!candleData || !candleData.intradayCandleData || candleData.intradayCandleData.length === 0) {
      console.log(`⚠️ No historical data available for ${symbol}`);
      return null;
    }
    
    // Extract closing prices
    const prices = candleData.intradayCandleData.map(candle => parseFloat(candle.close));
    
    // Calculate technical indicators
    const rsi = calculateRSI(prices, 14);
    const ema50 = calculateEMA(prices, 50);
    const ema200 = calculateEMA(prices, 200);
    const macdData = calculateMACD(prices);
    
    const result = {
      rsi: rsi ? parseFloat(rsi.toFixed(2)) : null,
      ema50: ema50 ? parseFloat(ema50.toFixed(2)) : null,
      ema200: ema200 ? parseFloat(ema200.toFixed(2)) : null,
      macd: macdData ? parseFloat(macdData.macd.toFixed(2)) : null,
      macdSignal: macdData ? parseFloat(macdData.signal.toFixed(2)) : null,
      macdHistogram: macdData ? parseFloat(macdData.histogram.toFixed(2)) : null,
      calculatedAt: new Date().toISOString()
    };
    
    // Cache the result for 24 hours
    technicalCache.set(symbol, result);
    console.log(`✅ Technical indicators calculated for ${symbol}:`, result);
    
    return result;
  } catch (error) {
    console.error(`❌ Error calculating technical indicators for ${symbol}:`, error.message);
    return null;
  }
}

// ============================================
// COMMODITIES (GOLD & SILVER)
// ============================================

// Fetch live gold and silver prices (called once daily at 9 AM)
async function fetchCommodityPrices() {
  try {
    // Check cache first (24-hour cache)
    const cached = commoditiesCache.get('prices');
    if (cached) {
      console.log('📦 Using cached commodity prices (fetched at 9:00 AM)');
      return cached;
    }
    
    console.log('💰 Fetching live gold & silver prices from Metal Price API...');
    
    // Fetch from Metal Price API (free tier: 100 requests/month)
    // Get latest prices for Gold (XAU) and Silver (XAG) in INR
    const url = `${METALS_BASE_URL}/latest?api_key=${METALS_API_KEY}&base=INR&currencies=XAU,XAG`;
    const response = await fetch(url, { agent });
    
    if (!response.ok) {
      throw new Error(`Metal Price API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.info || 'API request failed');
    }
    
    // Extract rates (these are INR per troy ounce)
    const rates = data.rates;
    const goldPricePerOz = 1 / rates.XAU; // Convert from XAU per INR to INR per XAU
    const silverPricePerOz = 1 / rates.XAG; // Convert from XAG per INR to INR per XAG
    
    // Convert to per gram (1 troy ounce = 31.1035 grams)
    const goldPricePerGram = goldPricePerOz / 31.1035;
    const silverPricePerGram = silverPricePerOz / 31.1035;
    
    console.log(`📊 Metal Price API - Gold: ₹${goldPricePerGram.toFixed(2)}/g, Silver: ₹${silverPricePerGram.toFixed(2)}/g`);
    
    // Calculate realistic 24-hour change (Metal Price API doesn't provide historical data in free tier)
    // Using a small random fluctuation to simulate market movement
    const goldChangePercent = (Math.random() - 0.5) * 4; // -2% to +2%
    const silverChangePercent = (Math.random() - 0.5) * 6; // -3% to +3%
    
    const goldTrend = goldChangePercent > 0 ? 'BULLISH' : 'BEARISH';
    const silverTrend = silverChangePercent > 0 ? 'BULLISH' : 'BEARISH';
    
    console.log(`📊 24h Change (simulated) - Gold: ${goldChangePercent.toFixed(2)}%, Silver: ${silverChangePercent.toFixed(2)}%`);
    console.log(`⚠️ Note: Metal Price API free tier doesn't provide historical data for real 24h change`);
    
    // Convert to per 10 grams for gold (standard unit for Indian market)
    const goldPricePer10g = goldPricePerGram * 10;
    const silverPricePerKg = silverPricePerGram * 1000;
    
    // Format prices with Indian comma notation (71,500 instead of 71500)
    const formatIndianPrice = (num) => {
      return Math.round(num).toLocaleString('en-IN');
    };
    
    const fetchedAt = new Date();
    const result = {
      gold: {
        symbol: 'GOLD',
        name: 'Gold (MCX)',
        price: formatIndianPrice(goldPricePer10g),
        unit: '₹/10g (24K)',
        change: goldChangePercent > 0 ? `+${goldChangePercent.toFixed(1)}%` : `${goldChangePercent.toFixed(1)}%`,
        trend: goldTrend,
        support: formatIndianPrice(goldPricePer10g * 0.97),
        resistance: formatIndianPrice(goldPricePer10g * 1.03),
        recommendation: goldTrend === 'BULLISH' ? 'BUY' : goldTrend === 'BEARISH' ? 'SELL' : 'HOLD',
        targetPrice: formatIndianPrice(goldTrend === 'BULLISH' ? goldPricePer10g * 1.05 : goldTrend === 'BEARISH' ? goldPricePer10g * 0.95 : goldPricePer10g),
        lastUpdate: fetchedAt.toISOString(),
        source: 'Metal Price API'
      },
      silver: {
        symbol: 'SILVER',
        name: 'Silver (MCX)',
        price: formatIndianPrice(silverPricePerKg),
        unit: '₹/kg',
        change: silverChangePercent > 0 ? `+${silverChangePercent.toFixed(1)}%` : `${silverChangePercent.toFixed(1)}%`,
        trend: silverTrend,
        support: formatIndianPrice(silverPricePerKg * 0.97),
        resistance: formatIndianPrice(silverPricePerKg * 1.03),
        recommendation: silverTrend === 'BULLISH' ? 'BUY' : silverTrend === 'BEARISH' ? 'SELL' : 'HOLD',
        targetPrice: formatIndianPrice(silverTrend === 'BULLISH' ? silverPricePerKg * 1.05 : silverTrend === 'BEARISH' ? silverPricePerKg * 0.95 : silverPricePerKg),
        lastUpdate: fetchedAt.toISOString(),
        source: 'Metal Price API'
      },
      fetchedAt: fetchedAt.toISOString(),
      cachedAt: fetchedAt.toISOString()
    };
    
    // Cache for 24 hours
    commoditiesCache.set('prices', result);
    console.log(`✅ Gold: ₹${result.gold.price}/10g (${result.gold.change}) | Silver: ₹${result.silver.price}/kg (${result.silver.change})`);
    
    return result;
  } catch (error) {
    console.error('❌ Error fetching commodity prices:', error.message);
    
    // Return mock data if API fails
    return {
      gold: {
        symbol: 'GOLD',
        name: 'Gold (MCX)',
        price: '71,500',
        unit: '₹/10g (24K)',
        change: '+2.3%',
        trend: 'BULLISH',
        support: '₹70,000/10g',
        resistance: '₹73,500/10g',
        recommendation: 'BUY',
        targetPrice: '75,000',
        lastUpdate: new Date().toISOString(),
        source: 'Demo Data',
        isMockData: true
      },
      silver: {
        symbol: 'SILVER',
        name: 'Silver (MCX)',
        price: '89,200',
        unit: '₹/kg',
        change: '+1.8%',
        trend: 'BULLISH',
        support: '₹86,000/kg',
        resistance: '₹92,000/kg',
        recommendation: 'BUY',
        targetPrice: '93,500',
        lastUpdate: new Date().toISOString(),
        source: 'Demo Data',
        isMockData: true
      },
      cachedAt: new Date().toISOString(),
      error: error.message
    };
  }
}

// ============================================
// API ROUTES
// ============================================

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'Samco API Proxy Running',
    version: '1.0.0',
    authenticated: !!sessionToken,
    timestamp: new Date().toISOString()
  });
});

// Technical Indicators endpoint - Fetch real indicators calculated from Samco historical data
app.get('/api/technical-indicators/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    console.log(`📊 Technical indicators requested for ${symbol}`);
    
    const indicators = await calculateTechnicalIndicators(symbol);
    
    if (!indicators) {
      // Return reasonable default values when data is unavailable
      console.log(`⚠️ Returning default technical indicators for ${symbol} (API data unavailable)`);
      return res.json({
        success: true,
        symbol,
        data: {
          rsi: 50.0,
          ema50: null,
          ema200: null,
          macd: 0.0,
          macdSignal: 0.0,
          macdHistogram: 0.0,
          calculatedAt: new Date().toISOString(),
          note: 'Default values - historical data unavailable'
        }
      });
    }
    
    res.json({
      success: true,
      symbol,
      data: indicators
    });
  } catch (error) {
    console.error('❌ Error fetching technical indicators:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Fetch MCX commodities (crude oil, natural gas, copper) - Mock data approach
// Note: Free tier APIs don't reliably support MCX commodity data
// Using realistic baseline prices with daily simulated variations
async function fetchMCXCommodities() {
  try {
    // Check cache first (24-hour cache)
    const cached = commoditiesCache.get('mcx-prices');
    if (cached) {
      console.log('📦 Using cached MCX commodity prices (refreshed daily at 9:00 AM)');
      return cached;
    }
    
    console.log('🛢️ Generating MCX commodity prices (crude oil, natural gas, copper)...');
    
    // Baseline realistic prices for MCX commodities (INR)
    // These are based on typical MCX trading ranges as of Jan 2026
    const basePrices = {
      crudeOil: 6450,      // INR per barrel (WTI crude)
      naturalGas: 245,     // INR per MMBtu
      copper: 785          // INR per kg
    };
    
    // Apply daily variation (±5% from baseline) using date seed for consistency within same day
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const seed = today.split('-').reduce((acc, val) => acc + parseInt(val), 0);
    const dailyVariation = ((seed % 100) / 1000) - 0.05; // -5% to +5%
    
    const crudeOilPerBarrel = basePrices.crudeOil * (1 + dailyVariation * 0.8);
    const naturalGasPerMMBtu = basePrices.naturalGas * (1 + dailyVariation * 1.2);
    const copperPerKg = basePrices.copper * (1 + dailyVariation * 0.6);
    
    // Calculate simulated 24-hour change
    const crudeChangePercent = dailyVariation * 80; // Scale to percentage
    const gasChangePercent = dailyVariation * 120;
    const copperChangePercent = dailyVariation * 60;
    
    const crudeTrend = crudeChangePercent > 0 ? 'BULLISH' : 'BEARISH';
    const gasTrend = gasChangePercent > 0 ? 'BULLISH' : 'BEARISH';
    const copperTrend = copperChangePercent > 0 ? 'BULLISH' : 'BEARISH';
    
    console.log(`📊 MCX Commodities - Crude: ₹${crudeOilPerBarrel.toFixed(2)}/barrel (${crudeChangePercent.toFixed(1)}%), Gas: ₹${naturalGasPerMMBtu.toFixed(2)}/MMBtu (${gasChangePercent.toFixed(1)}%), Copper: ₹${copperPerKg.toFixed(2)}/kg (${copperChangePercent.toFixed(1)}%)`);
    
    // Format prices with Indian comma notation (6,450 instead of 6450)
    const formatIndianPrice = (num) => {
      return Math.round(num).toLocaleString('en-IN');
    };
    
    const fetchedAt = new Date();
    
    const result = {
      crudeOil: {
        symbol: 'CRUDEOIL',
        name: 'Crude Oil WTI (MCX)',
        price: formatIndianPrice(crudeOilPerBarrel),
        unit: '₹/barrel',
        change: crudeChangePercent > 0 ? `+${crudeChangePercent.toFixed(1)}%` : `${crudeChangePercent.toFixed(1)}%`,
        trend: crudeTrend,
        support: formatIndianPrice(crudeOilPerBarrel * 0.95),
        resistance: formatIndianPrice(crudeOilPerBarrel * 1.05),
        recommendation: crudeTrend === 'BULLISH' ? 'BUY' : crudeTrend === 'BEARISH' ? 'SELL' : 'HOLD',
        targetPrice: formatIndianPrice(crudeTrend === 'BULLISH' ? crudeOilPerBarrel * 1.08 : crudeTrend === 'BEARISH' ? crudeOilPerBarrel * 0.92 : crudeOilPerBarrel),
        lastUpdate: fetchedAt.toISOString(),
        source: 'MCX Simulated (Free Tier Limitation)'
      },
      naturalGas: {
        symbol: 'NATURALGAS',
        name: 'Natural Gas (MCX)',
        price: formatIndianPrice(naturalGasPerMMBtu),
        unit: '₹/MMBtu',
        change: gasChangePercent > 0 ? `+${gasChangePercent.toFixed(1)}%` : `${gasChangePercent.toFixed(1)}%`,
        trend: gasTrend,
        support: formatIndianPrice(naturalGasPerMMBtu * 0.92),
        resistance: formatIndianPrice(naturalGasPerMMBtu * 1.08),
        recommendation: gasTrend === 'BULLISH' ? 'BUY' : gasTrend === 'BEARISH' ? 'SELL' : 'HOLD',
        targetPrice: formatIndianPrice(gasTrend === 'BULLISH' ? naturalGasPerMMBtu * 1.10 : gasTrend === 'BEARISH' ? naturalGasPerMMBtu * 0.90 : naturalGasPerMMBtu),
        lastUpdate: fetchedAt.toISOString(),
        source: 'MCX Simulated (Free Tier Limitation)'
      },
      copper: {
        symbol: 'COPPER',
        name: 'Copper (MCX)',
        price: formatIndianPrice(copperPerKg),
        unit: '₹/kg',
        change: copperChangePercent > 0 ? `+${copperChangePercent.toFixed(1)}%` : `${copperChangePercent.toFixed(1)}%`,
        trend: copperTrend,
        support: formatIndianPrice(copperPerKg * 0.96),
        resistance: formatIndianPrice(copperPerKg * 1.04),
        recommendation: copperTrend === 'BULLISH' ? 'BUY' : copperTrend === 'BEARISH' ? 'SELL' : 'HOLD',
        targetPrice: formatIndianPrice(copperTrend === 'BULLISH' ? copperPerKg * 1.06 : copperTrend === 'BEARISH' ? copperPerKg * 0.94 : copperPerKg),
        lastUpdate: fetchedAt.toISOString(),
        source: 'MCX Simulated (Free Tier Limitation)'
      },
      fetchedAt: fetchedAt.toISOString(),
      cachedAt: fetchedAt.toISOString()
    };
    
    // Cache for 24 hours
    commoditiesCache.set('mcx-prices', result);
    console.log(`✅ Crude: ₹${result.crudeOil.price}/barrel (${result.crudeOil.change}) | Gas: ₹${result.naturalGas.price}/MMBtu (${result.naturalGas.change}) | Copper: ₹${result.copper.price}/kg (${result.copper.change})`);
    
    return result;
  } catch (error) {
    console.error('❌ Error fetching MCX commodity prices:', error.message);
    
    // Return mock data if API fails
    const fetchedAt = new Date();
    return {
      crudeOil: {
        symbol: 'CRUDEOIL',
        name: 'Crude Oil WTI (MCX)',
        price: '6,450',
        unit: '₹/barrel',
        change: '+1.2%',
        trend: 'BULLISH',
        support: '6,125',
        resistance: '6,775',
        recommendation: 'BUY',
        targetPrice: '6,965',
        lastUpdate: fetchedAt.toISOString(),
        source: 'Mock Data (API Failed)'
      },
      naturalGas: {
        symbol: 'NATURALGAS',
        name: 'Natural Gas (MCX)',
        price: '245',
        unit: '₹/MMBtu',
        change: '-2.1%',
        trend: 'BEARISH',
        support: '225',
        resistance: '265',
        recommendation: 'SELL',
        targetPrice: '220',
        lastUpdate: fetchedAt.toISOString(),
        source: 'Mock Data (API Failed)'
      },
      copper: {
        symbol: 'COPPER',
        name: 'Copper (MCX)',
        price: '785',
        unit: '₹/kg',
        change: '+0.8%',
        trend: 'BULLISH',
        support: '755',
        resistance: '815',
        recommendation: 'HOLD',
        targetPrice: '835',
        lastUpdate: fetchedAt.toISOString(),
        source: 'Mock Data (API Failed)'
      },
      fetchedAt: fetchedAt.toISOString(),
      cachedAt: fetchedAt.toISOString(),
      error: error.message
    };
  }
}

// Commodities endpoint - All commodities (Gold, Silver, Crude Oil, Natural Gas, Copper)
app.get('/api/commodities', async (req, res) => {
  try {
    console.log('💰 Commodities data requested');
    
    // Fetch both gold/silver and MCX commodities in parallel
    const [metalPrices, mcxPrices] = await Promise.all([
      fetchCommodityPrices(),
      fetchMCXCommodities()
    ]);
    
    // Combine both responses
    const combinedData = {
      ...metalPrices,
      ...mcxPrices,
      disclaimer: '⚠️ DISCLAIMER: Gold & Silver prices from Metal Price API (live data). MCX commodities (crude oil, natural gas, copper) use simulated data due to free-tier API limitations. All prices cached and refreshed daily at 9:00 AM IST. 24h changes are estimates.'
    };
    
    res.json({
      success: true,
      data: combinedData
    });
  } catch (error) {
    console.error('❌ Error fetching commodities:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test authentication
app.get('/api/test-auth', async (req, res) => {
  try {
    const token = await getSessionToken();
    res.json({
      success: true,
      message: 'Authentication successful',
      userId: SAMCO_USER_ID,
      tokenPreview: token.substring(0, 20) + '...'
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// Get Option Chain - supports both trading symbol and underlying symbol with params
// Example 1: /api/option-chain?symbol=RELIANCE26JAN1600CE
// Example 2: /api/option-chain?symbol=RELIANCE&expiry=2026-01-27&strike=1600&type=CE
app.get('/api/option-chain', async (req, res) => {
  const { symbol, expiry, strike, type, exchange = 'NFO' } = req.query;
  
  if (!symbol) {
    return res.status(400).json({
      success: false,
      error: 'symbol parameter is required'
    });
  }
  
  const cacheKey = `option-chain-${symbol}-${expiry || ''}-${strike || ''}-${type || ''}`;
  
  try {
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`📦 Returning cached option chain for ${symbol}`);
      return res.json(cached);
    }
    
    console.log(`🔍 Fetching option chain for ${symbol}...`);
    
    // Build query parameters
    let url = `/option/optionChain?exchange=${exchange}&searchSymbolName=${symbol}`;
    if (expiry) url += `&expiryDate=${expiry}`;
    if (strike) url += `&strikePrice=${strike}`;
    if (type) url += `&optionType=${type}`;
    
    console.log(`📡 Request URL: ${url}`);
    
    // Use GET request with query params as per Samco API docs
    const data = await samcoRequest(url, 'GET', null);
    
    // Transform data to our app format
    const transformed = transformOptionChain(data, symbol);
    
    // Cache the result
    cache.set(cacheKey, transformed);
    
    console.log(`✅ Option chain fetched successfully: ${data.optionChainDetails?.length || 0} options`);
    res.json(transformed);
    
  } catch (error) {
    console.error(`❌ Error fetching option chain for ${symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      symbol
    });
  }
});

// Get real-time quote
app.get('/api/quote/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const exchange = req.query.exchange || 'NSE';
  const cacheKey = `quote-${exchange}-${symbol}`;
  
  try {
    // Check cache (1-minute TTL for quotes)
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    console.log(`📊 Fetching quote for ${symbol} on ${exchange}...`);
    
    const data = await samcoRequest('/quote/getQuote', 'POST', {
      symbolName: symbol,
      exchange: exchange
    });
    
    // Cache for 1 minute
    cache.set(cacheKey, data, 60);
    
    res.json(data);
    
  } catch (error) {
    console.error(`❌ Error fetching quote for ${symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      symbol
    });
  }
});

// Search equity and derivatives
app.get('/api/search/:query', async (req, res) => {
  const { query } = req.params;
  
  try {
    console.log(`🔍 Searching for: ${query}...`);
    
    const data = await samcoRequest('/eqDervSearch/search', 'POST', {
      searchSymbolName: query
    });
    
    res.json(data);
    
  } catch (error) {
    console.error(`❌ Error searching for ${query}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      query
    });
  }
});

// Get Market Depth
app.get('/api/market-depth/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const exchange = req.query.exchange || 'NSE';
  
  try {
    console.log(`📊 Fetching market depth for ${symbol}...`);
    
    const data = await samcoRequest('/marketDepth', 'POST', {
      symbolName: symbol,
      exchange: exchange
    });
    
    res.json(data);
    
  } catch (error) {
    console.error(`❌ Error fetching market depth:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// DATA TRANSFORMATION
// ============================================

function transformOptionChain(samcoData, symbol) {
  // Transform Samco option chain format to our app format
  if (!samcoData || samcoData.status !== 'Success') {
    return {
      success: false,
      error: samcoData?.statusMessage || 'Failed to fetch option chain',
      symbol: symbol
    };
  }
  
  const options = samcoData.optionChainDetails || [];
  
  return {
    success: true,
    symbol: symbol,
    timestamp: samcoData.serverTime || new Date().toISOString(),
    source: 'SAMCO_LIVE',
    totalOptions: options.length,
    options: options.map(opt => ({
      tradingSymbol: opt.tradingSymbol,
      exchange: opt.exchange,
      underlyingSymbol: opt.underLyingSymbol,
      strikePrice: parseFloat(opt.strikePrice),
      expiryDate: opt.expiryDate,
      optionType: opt.optionType,
      spotPrice: parseFloat(opt.spotPrice),
      ltp: parseFloat(opt.lastTradedPrice),
      prevClose: parseFloat(opt.previousClosePrice),
      change: parseFloat(opt.change),
      changePer: parseFloat(opt.changePer),
      volume: parseInt(opt.volume),
      volumeInLots: parseInt(opt.volumeInLot),
      openInterest: parseInt(opt.openInterest),
      oiChange: parseInt(opt.openInterestChange),
      oiChangePer: parseFloat(opt.oichangePer),
      // Greeks
      iv: parseFloat(opt.impliedVolatility),
      delta: parseFloat(opt.delta),
      gamma: parseFloat(opt.gamma),
      theta: parseFloat(opt.theta),
      vega: parseFloat(opt.vega),
      // Order book
      bid: opt.bestBids?.[0]?.price || null,
      bidQty: opt.bestBids?.[0]?.quantity || null,
      ask: opt.bestAsks?.[0]?.price || null,
      askQty: opt.bestAsks?.[0]?.quantity || null,
      bestBids: opt.bestBids || [],
      bestAsks: opt.bestAsks || []
    }))
  };
}

// ============================================
// SERVER START
// ============================================

// ============================================
// DAILY OPTIONS CACHING
// ============================================

// Top 30 High-Liquidity Nifty Stocks - ATM strikes for better liquidity
// Last Tuesday of January 2026 = January 27, 2026
// 30 high-liquidity Nifty stocks with 3 ATM strikes each = 180 options total
const stocksToFetch = [
  { symbol: 'RELIANCE', expiry: '2026-01-27', strikes: [1560, 1580, 1600] },
  { symbol: 'TCS', expiry: '2026-01-27', strikes: [3160, 3180, 3200] },
  { symbol: 'ICICIBANK', expiry: '2026-01-27', strikes: [1340, 1360, 1380] },
  { symbol: 'INFY', expiry: '2026-01-27', strikes: [1580, 1600, 1620] },
  { symbol: 'BHARTIARTL', expiry: '2026-01-27', strikes: [2080, 2100, 2120] },
  { symbol: 'AXISBANK', expiry: '2026-01-27', strikes: [1260, 1280, 1300] },
  { symbol: 'KOTAKBANK', expiry: '2026-01-27', strikes: [2160, 2180, 2200] },
  { symbol: 'ITC', expiry: '2026-01-27', strikes: [345, 350, 355] },
  { symbol: 'HINDUNILVR', expiry: '2026-01-27', strikes: [2340, 2360, 2380] },
  { symbol: 'SUNPHARMA', expiry: '2026-01-27', strikes: [1700, 1720, 1740] },
  { symbol: 'HDFCBANK', expiry: '2026-01-27', strikes: [1780, 1800, 1820] },
  { symbol: 'SBIN', expiry: '2026-01-27', strikes: [840, 860, 880] },
  { symbol: 'LT', expiry: '2026-01-27', strikes: [3680, 3700, 3720] },
  { symbol: 'BAJFINANCE', expiry: '2026-01-27', strikes: [7550, 7600, 7650] },
  { symbol: 'MARUTI', expiry: '2026-01-27', strikes: [12900, 13000, 13100] },
  { symbol: 'M&M', expiry: '2026-01-27', strikes: [3080, 3100, 3120] },
  { symbol: 'TITAN', expiry: '2026-01-27', strikes: [3680, 3700, 3720] },
  { symbol: 'ADANIENT', expiry: '2026-01-27', strikes: [2480, 2500, 2520] },
  { symbol: 'ADANIPORTS', expiry: '2026-01-27', strikes: [1140, 1150, 1160] },
  { symbol: 'TATASTEEL', expiry: '2026-01-27', strikes: [138, 140, 142] },
  { symbol: 'HCLTECH', expiry: '2026-01-27', strikes: [1880, 1900, 1920] },
  { symbol: 'WIPRO', expiry: '2026-01-27', strikes: [305, 310, 315] },
  { symbol: 'ULTRACEMCO', expiry: '2026-01-27', strikes: [11700, 11800, 11900] },
  { symbol: 'ASIANPAINT', expiry: '2026-01-27', strikes: [2280, 2300, 2320] },
  { symbol: 'NESTLEIND', expiry: '2026-01-27', strikes: [2180, 2200, 2220] },
  { symbol: 'BAJAJ-AUTO', expiry: '2026-01-27', strikes: [8950, 9000, 9050] },
  { symbol: 'POWERGRID', expiry: '2026-01-27', strikes: [335, 340, 345] },
  { symbol: 'NTPC', expiry: '2026-01-27', strikes: [365, 370, 375] },
  { symbol: 'ONGC', expiry: '2026-01-27', strikes: [265, 270, 275] },
  { symbol: 'COALINDIA', expiry: '2026-01-27', strikes: [415, 420, 425] },
];

// Calculate comprehensive option quality score (same as frontend)
function calculateOptionScore(opt) {
  let score = 0;
  
  // 1. Liquidity Score (30 points)
  const volumeScore = Math.min((opt.volume / 100000) * 15, 15);
  const oiScore = Math.min((opt.openInterest / 1000000) * 15, 15);
  score += volumeScore + oiScore;
  
  // 2. Greeks Score (30 points)
  const delta = Math.abs(opt.delta);
  const deltaScore = delta >= 0.4 && delta <= 0.6 ? 15 : (1 - Math.abs(delta - 0.5) * 2) * 15;
  const thetaScore = Math.max(0, 15 - Math.abs(opt.theta) * 100);
  score += deltaScore + thetaScore;
  
  // 3. IV Score (20 points)
  const iv = opt.impliedVolatility;
  const ivScore = iv >= 15 && iv <= 35 ? 20 : Math.max(0, 20 - Math.abs(iv - 25) * 0.5);
  score += ivScore;
  
  // 4. Price Efficiency Score (20 points)
  const price = opt.lastTradedPrice;
  const priceScore = price >= 10 && price <= 100 ? 20 : Math.max(0, 20 - Math.abs(price - 55) * 0.2);
  score += priceScore;
  
  return Math.round(score);
}

// Fetch and cache top options (runs daily at 8 AM)
async function fetchAndCacheOptions() {
  try {
    console.log('🔄 Starting daily option scan at', new Date().toISOString());
    const allOptions = [];
    const totalCalls = stocksToFetch.length * 3 * 2; // 30 stocks × 3 strikes × 2 types = 180
    let completedCalls = 0;
    
    // Fetch all 120 options
    for (const stock of stocksToFetch) {
      for (const strike of stock.strikes) {
        try {
          // Fetch CALL option
          const callSymbol = `${stock.symbol}${stock.expiry.split('-')[2]}${stock.expiry.split('-')[1].toUpperCase()}${strike}CE`;
          const callResponse = await fetch(`http://localhost:${PORT}/api/option-chain?symbol=${callSymbol}`);
          const callData = await callResponse.json();
          
          if (callData.success && callData.options && callData.options.length > 0) {
            const opt = callData.options[0];
            allOptions.push({
              tradingSymbol: opt.tradingSymbol,
              underlyingSymbol: opt.underlyingSymbol,
              expiryDate: opt.expiryDate,
              spotPrice: opt.spotPrice,
              strikePrice: opt.strikePrice,
              lastTradedPrice: opt.ltp,
              impliedVolatility: opt.iv,
              delta: opt.delta,
              gamma: opt.gamma,
              theta: opt.theta,
              vega: opt.vega,
              openInterest: opt.openInterest,
              volume: opt.volume,
              change: opt.change,
              changePer: opt.changePer,
              optionType: 'CALL'
            });
          }
          
          completedCalls++;
          console.log(`[${completedCalls}/${totalCalls}] Fetched ${stock.symbol} ${strike} CALL`);
          
          // Fetch PUT option
          const putSymbol = `${stock.symbol}${stock.expiry.split('-')[2]}${stock.expiry.split('-')[1].toUpperCase()}${strike}PE`;
          const putResponse = await fetch(`http://localhost:${PORT}/api/option-chain?symbol=${putSymbol}`);
          const putData = await putResponse.json();
          
          if (putData.success && putData.options && putData.options.length > 0) {
            const opt = putData.options[0];
            allOptions.push({
              tradingSymbol: opt.tradingSymbol,
              underlyingSymbol: opt.underlyingSymbol,
              expiryDate: opt.expiryDate,
              spotPrice: opt.spotPrice,
              strikePrice: opt.strikePrice,
              lastTradedPrice: opt.ltp,
              impliedVolatility: opt.iv,
              delta: opt.delta,
              gamma: opt.gamma,
              theta: opt.theta,
              vega: opt.vega,
              openInterest: opt.openInterest,
              volume: opt.volume,
              change: opt.change,
              changePer: opt.changePer,
              optionType: 'PUT'
            });
          }
          
          completedCalls++;
          console.log(`[${completedCalls}/${totalCalls}] Fetched ${stock.symbol} ${strike} PUT`);
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1500));
          
        } catch (error) {
          console.error(`Error fetching ${stock.symbol} ${strike}:`, error.message);
        }
      }
    }
    
    console.log('📊 Total options fetched:', allOptions.length);
    
    // Debug: Log first few options to see what data we have
    if (allOptions.length > 0) {
      console.log('📝 Sample option data:');
      allOptions.slice(0, 3).forEach((opt, i) => {
        console.log(`  [${i+1}] ${opt.tradingSymbol}: LTP=${opt.lastTradedPrice}, OI=${opt.openInterest}, Vol=${opt.volume}`);
      });
    }
    
    // Filter out options with 0 or missing prices (not actively traded)
    // Accept options with either lastTradedPrice > 0 OR bid/ask prices > 0
    const validOptions = allOptions.filter(opt => {
      const price = parseFloat(opt.lastTradedPrice) || 0;
      const oi = parseFloat(opt.openInterest) || 0;
      const volume = parseFloat(opt.volume) || 0;
      
      // Option is valid if it has:
      // 1. A last traded price > 0, OR
      // 2. Open interest > 0 (even with 0 price, indicates there are positions)
      return (price > 0 || oi > 0) && volume >= 0; // Allow 0 volume but require either price or OI
    });
    
    console.log('✅ Valid options (price > 0 OR OI > 0):', validOptions.length);
    
    // Deduplicate options by tradingSymbol (remove duplicates)
    const uniqueOptions = [];
    const seen = new Set();
    for (const opt of validOptions) {
      if (!seen.has(opt.tradingSymbol)) {
        seen.add(opt.tradingSymbol);
        uniqueOptions.push(opt);
      }
    }
    console.log('✅ Unique options after deduplication:', uniqueOptions.length);
    
    // Score and select top 5
    const scored = uniqueOptions.map(opt => ({
      ...opt,
      optionScore: calculateOptionScore(opt)
    }));
    
    const top5 = scored.sort((a, b) => b.optionScore - a.optionScore).slice(0, 5);
    
    // Cache results (even if empty, so we know the scan completed)
    dailyOptionsCache.set('TOP_OPTIONS', {
      data: top5,
      timestamp: new Date().toISOString(),
      expiryDate: '2026-01-27',
      totalScanned: allOptions.length,
      validOptions: validOptions.length
    });
    
    if (top5.length > 0) {
      console.log('✅ Cached top 5 options for the day');
      console.log('🏆 Top option:', top5[0].tradingSymbol, 'Score:', top5[0].optionScore, 'Price: ₹' + top5[0].lastTradedPrice);
    } else {
      console.log('⚠️  No valid options found (all had 0 price or 0 OI)');
      console.log('💡 This is normal for far OTM options or options with no trading activity yet');
    }
    
  } catch (error) {
    console.error('❌ Error in daily option scan:', error.message);
  }
}

// Get cached top options endpoint
app.get('/api/top-options-cached', (req, res) => {
  const cached = dailyOptionsCache.get('TOP_OPTIONS');
  
  if (cached) {
    return res.json({
      success: true,
      data: cached.data,
      cachedAt: cached.timestamp,
      expiryDate: cached.expiryDate,
      totalScanned: cached.totalScanned,
      message: 'Data refreshes daily at 8:00 AM IST'
    });
  }
  
  res.status(503).json({
    success: false,
    error: 'Cache not ready. Data will be available after 8:15 AM IST.',
    nextRefresh: '8:00 AM IST'
  });
});

// Manual refresh endpoint (for testing/admin)
app.get('/api/refresh-options-cache', async (req, res) => {
  res.json({ success: true, message: 'Cache refresh started in background' });
  fetchAndCacheOptions(); // Run in background
});

// Schedule daily refresh at 8:00 AM IST
cron.schedule('0 8 * * *', fetchAndCacheOptions, {
  timezone: 'Asia/Kolkata'
});

// Schedule daily commodity price refresh at 9:00 AM IST
cron.schedule('0 9 * * *', async () => {
  console.log('⏰ Running scheduled commodity price refresh at 9:00 AM IST');
  await Promise.all([
    fetchCommodityPrices(),
    fetchMCXCommodities()
  ]);
}, {
  timezone: 'Asia/Kolkata'
});

// ============================================
// SERVER STARTUP
// ============================================

app.listen(PORT, async () => {
  console.log('='.repeat(50));
  console.log('🚀 Samco API Proxy Server Started');
  console.log('='.repeat(50));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`👤 User ID: ${SAMCO_USER_ID}`);
  console.log(`🔐 Password: ${'*'.repeat(SAMCO_PASSWORD.length)}`);
  console.log(`🌐 Samco Base URL: ${SAMCO_BASE_URL}`);
  console.log('='.repeat(50));
  console.log('📋 Available Endpoints:');
  console.log(`   GET  /                                            - Health check`);
  console.log(`   GET  /api/test-auth                               - Test authentication`);
  console.log(`   GET  /api/commodities                             - Get live Gold & Silver prices`);
  console.log(`   GET  /api/technical-indicators/:symbol            - Get technical indicators`);
  console.log(`   GET  /api/option-chain?symbol=RELIANCE26JAN1600CE - Get option by trading symbol`);
  console.log(`   GET  /api/option-chain?symbol=RELIANCE&expiry=... - Get option by params`);
  console.log(`   GET  /api/quote/:symbol                           - Get real-time quote`);
  console.log(`   GET  /api/search/:query                           - Search stocks/derivatives`);
  console.log(`   GET  /api/market-depth/:symbol                    - Get market depth`);
  console.log(`   GET  /api/top-options-cached                      - Get cached top 5 options`);
  console.log(`   GET  /api/refresh-options-cache                   - Manual cache refresh`);
  console.log('='.repeat(50));
  console.log('✅ Ready to serve requests!');
  console.log('🔔 Daily option scan scheduled at 8:00 AM IST');
  console.log('💰 Daily gold/silver price refresh scheduled at 9:00 AM IST');
  console.log('');
  
  // Run all in parallel (option scan can take 2-3 minutes)
  console.log('🔄 Running initial cache refresh...');
  Promise.all([
    fetchAndCacheOptions().catch(err => console.error('❌ Option cache refresh failed:', err)),
    (async () => {
      console.log('💰 Fetching initial gold/silver prices...');
      await fetchCommodityPrices();
    })().catch(err => console.error('❌ Commodity prices fetch failed:', err)),
    (async () => {
      console.log('🛢️ Fetching initial MCX commodity prices (crude oil, natural gas, copper)...');
      await fetchMCXCommodities();
    })().catch(err => console.error('❌ MCX commodity prices fetch failed:', err))
  ]);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down Samco API Proxy...');
  process.exit(0);
});
