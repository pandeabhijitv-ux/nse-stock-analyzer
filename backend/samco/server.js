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

// Middleware
app.use(cors());
app.use(express.json());

// Samco API configuration
const SAMCO_BASE_URL = 'https://tradeapi.samco.in';
const SAMCO_USER_ID = process.env.SAMCO_USER_ID;
const SAMCO_PASSWORD = process.env.SAMCO_PASSWORD;
const SAMCO_YOB = process.env.SAMCO_YOB || '';

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

// Top 30 High-Liquidity Nifty Stocks (same as frontend)
const stocksToFetch = [
  { symbol: 'RELIANCE', expiry: '2026-01-27', strikes: [1550, 1580] },
  { symbol: 'TCS', expiry: '2026-01-27', strikes: [3150, 3220] },
  { symbol: 'ICICIBANK', expiry: '2026-01-27', strikes: [1340, 1370] },
  { symbol: 'INFY', expiry: '2026-01-27', strikes: [1570, 1610] },
  { symbol: 'BHARTIARTL', expiry: '2026-01-27', strikes: [2060, 2110] },
  { symbol: 'AXISBANK', expiry: '2026-01-27', strikes: [1260, 1290] },
  { symbol: 'KOTAKBANK', expiry: '2026-01-27', strikes: [2150, 2190] },
  { symbol: 'ITC', expiry: '2026-01-27', strikes: [340, 350] },
  { symbol: 'HINDUNILVR', expiry: '2026-01-27', strikes: [2340, 2380] },
  { symbol: 'SUNPHARMA', expiry: '2026-01-27', strikes: [1690, 1730] },
  { symbol: 'MARUTI', expiry: '2026-01-27', strikes: [16810, 17160] },
  { symbol: 'TATASTEEL', expiry: '2026-01-27', strikes: [180, 190] },
  { symbol: 'HCLTECH', expiry: '2026-01-27', strikes: [1580, 1610] },
  { symbol: 'TECHM', expiry: '2026-01-27', strikes: [1560, 1600] },
  { symbol: 'WIPRO', expiry: '2026-01-27', strikes: [260, 260] },
  { symbol: 'ADANIENT', expiry: '2026-01-27', strikes: [2230, 2280] },
  { symbol: 'ADANIPORTS', expiry: '2026-01-27', strikes: [1460, 1490] },
  { symbol: 'ASIANPAINT', expiry: '2026-01-27', strikes: [2760, 2820] },
  { symbol: 'BAJAJ-AUTO', expiry: '2026-01-27', strikes: [9310, 9500] },
  { symbol: 'BAJAJFINSV', expiry: '2026-01-27', strikes: [2000, 2040] },
  { symbol: 'JSWSTEEL', expiry: '2026-01-27', strikes: [1160, 1190] },
  { symbol: 'ULTRACEMCO', expiry: '2026-01-27', strikes: [11850, 12090] },
  { symbol: 'GRASIM', expiry: '2026-01-27', strikes: [2790, 2850] },
  { symbol: 'CIPLA', expiry: '2026-01-27', strikes: [1490, 1520] },
  { symbol: 'DRREDDY', expiry: '2026-01-27', strikes: [1230, 1250] },
  { symbol: 'APOLLOHOSP', expiry: '2026-01-27', strikes: [6940, 7080] },
  { symbol: 'EICHERMOT', expiry: '2026-01-27', strikes: [7330, 7480] },
  { symbol: 'BPCL', expiry: '2026-01-27', strikes: [370, 380] },
  { symbol: 'NTPC', expiry: '2026-01-27', strikes: [340, 350] },
  { symbol: 'SBILIFE', expiry: '2026-01-27', strikes: [2030, 2080] },
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
    const totalCalls = stocksToFetch.length * 2 * 2; // 30 × 2 × 2 = 120
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
    
    // Score and select top 5
    const scored = allOptions.map(opt => ({
      ...opt,
      optionScore: calculateOptionScore(opt)
    }));
    
    const top5 = scored.sort((a, b) => b.optionScore - a.optionScore).slice(0, 5);
    
    // Cache results
    dailyOptionsCache.set('TOP_OPTIONS', {
      data: top5,
      timestamp: new Date().toISOString(),
      expiryDate: '2026-01-27',
      totalScanned: allOptions.length
    });
    
    console.log('✅ Cached top 5 options for the day');
    console.log('🏆 Top option:', top5[0].tradingSymbol, 'Score:', top5[0].optionScore);
    
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
  console.log('');
  
  // Run cache refresh immediately on startup
  console.log('🔄 Running initial cache refresh...');
  await fetchAndCacheOptions();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down Samco API Proxy...');
  process.exit(0);
});
