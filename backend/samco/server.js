const express = require('express');
const cors = require('cors');
const https = require('https');
const fetch = require('node-fetch');
const NodeCache = require('node-cache');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// SSL Agent for Windows
const agent = new https.Agent({
    rejectUnauthorized: false
});

// Cache with 5-minute TTL for option chain data
const cache = new NodeCache({ stdTTL: 300 });

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

app.listen(PORT, () => {
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
  console.log('='.repeat(50));
  console.log('✅ Ready to serve requests!');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down Samco API Proxy...');
  process.exit(0);
});
