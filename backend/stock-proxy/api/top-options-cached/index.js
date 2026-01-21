// Options Trading API - Returns realistic options data
// Path: /api/top-options-cached (to match PWA expectations)

const { Redis } = require('@upstash/redis');

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Generate realistic options data based on current date (with seeded random)
function generateRealisticOptions() {
  const today = new Date();
  const seed = today.getDate() + today.getMonth() * 31;
  
  // Seeded random function for consistent results within the same day
  let randomSeed = seed;
  const seededRandom = () => {
    randomSeed = (randomSeed * 9301 + 49297) % 233280;
    return randomSeed / 233280;
  };
  
  // Top 30 liquid NSE stocks with NSE-compliant strike intervals (expanded from 8)
  const stocks = [
    // Banking & Finance (High liquidity)
    { symbol: 'HDFCBANK', spot: 1645, atm: 1640, interval: 20 },
    { symbol: 'ICICIBANK', spot: 1095, atm: 1100, interval: 20 },
    { symbol: 'KOTAKBANK', spot: 1850, atm: 1840, interval: 20 },
    { symbol: 'AXISBANK', spot: 1125, atm: 1120, interval: 20 },
    { symbol: 'SBIN', spot: 785, atm: 780, interval: 20 },
    { symbol: 'INDUSINDBK', spot: 975, atm: 980, interval: 20 },
    { symbol: 'BAJFINANCE', spot: 6850, atm: 6850, interval: 100 },
    
    // IT Sector
    { symbol: 'TCS', spot: 3920, atm: 3900, interval: 100 },
    { symbol: 'INFY', spot: 1780, atm: 1780, interval: 20 },
    { symbol: 'WIPRO', spot: 565, atm: 560, interval: 20 },
    { symbol: 'HCLTECH', spot: 1875, atm: 1880, interval: 20 },
    { symbol: 'TECHM', spot: 1695, atm: 1700, interval: 20 },
    
    // Auto & Pharma
    { symbol: 'MARUTI', spot: 12850, atm: 12850, interval: 100 },
    { symbol: 'TATAMOTORS', spot: 785, atm: 780, interval: 20 },
    { symbol: 'M&M', spot: 2895, atm: 2900, interval: 50 },
    { symbol: 'SUNPHARMA', spot: 1785, atm: 1780, interval: 20 },
    { symbol: 'DRREDDY', spot: 1295, atm: 1300, interval: 20 },
    
    // Energy & Telecom
    { symbol: 'RELIANCE', spot: 2850, atm: 2850, interval: 50 },
    { symbol: 'BHARTIARTL', spot: 1545, atm: 1540, interval: 20 },
    { symbol: 'ONGC', spot: 245, atm: 240, interval: 10 },
    { symbol: 'POWERGRID', spot: 325, atm: 320, interval: 10 },
    
    // FMCG & Consumer
    { symbol: 'ITC', spot: 465, atm: 460, interval: 10 },
    { symbol: 'HINDUNILVR', spot: 2685, atm: 2700, interval: 50 },
    { symbol: 'NESTLEIND', spot: 2485, atm: 2500, interval: 50 },
    { symbol: 'BRITANNIA', spot: 4895, atm: 4900, interval: 100 },
    
    // Metals & Infra
    { symbol: 'LT', spot: 3625, atm: 3600, interval: 100 },
    { symbol: 'TATASTEEL', spot: 165, atm: 160, interval: 5 },
    { symbol: 'HINDALCO', spot: 645, atm: 640, interval: 20 },
    { symbol: 'JSWSTEEL', spot: 985, atm: 980, interval: 20 },
    { symbol: 'ADANIPORTS', spot: 1295, atm: 1300, interval: 20 },
  ];
  
  const options = [];
  
  // Generate 25-30 quality options with NSE-compliant strike prices (expanded from 12)
  for (let i = 0; i < 30; i++) {
    const stock = stocks[i % stocks.length];
    const isCall = (seed + i) % 2 === 0;
    
    // Generate strikes using NSE-compliant intervals
    // Strikes: ATM-2, ATM-1, ATM, ATM+1, ATM+2
    const strikeOffset = ((seed + i * 7) % 5 - 2); // -2, -1, 0, 1, 2
    const strike = stock.atm + (strikeOffset * stock.interval);
    
    // Premium calculation based on moneyness
    const moneyness = isCall ? 
      (stock.spot - strike) / strike : 
      (strike - stock.spot) / strike;
    
    const basePremium = Math.abs(moneyness) * stock.spot * 0.02 + 
      (seededRandom() * 0.01 + 0.02) * stock.spot;
    
    const premium = Math.max(5, Math.min(200, basePremium));
    
    // Greeks and metrics
    const delta = isCall ?
      0.35 + Math.abs(moneyness) * 0.3 :
      -0.35 - Math.abs(moneyness) * 0.3;
    
    const iv = 18 + (seed + i * 3) % 15; // 18-33% IV
    const volume = Math.floor((seed + i * 17) % 50000 + 10000);
    const oi = Math.floor(volume * (1.5 + seededRandom() * 2));
    
    const score = Math.floor(
      (volume / 1000) * 0.2 +
      (oi / 10000) * 0.3 +
      (35 - Math.abs(iv - 25)) * 2 +
      (Math.abs(delta) * 50)
    );
    
    options.push({
      tradingSymbol: `${stock.symbol}${isCall ? 'CE' : 'PE'}`,
      underlyingSymbol: stock.symbol,
      strikePrice: strike,
      optionType: isCall ? 'CE' : 'PE',
      spotPrice: stock.spot,
      ltp: Number(premium.toFixed(2)),
      volume: volume,
      openInterest: oi,
      iv: Number(iv.toFixed(2)),
      delta: Number(delta.toFixed(3)),
      theta: Number((-(premium * 0.05)).toFixed(3)),
      gamma: Number((0.001 + seededRandom() * 0.002).toFixed(4)),
      vega: Number((premium * 0.15).toFixed(2)),
      score: Math.min(95, Math.max(45, score)),
      expiryDate: getNextThursday().toISOString().split('T')[0]
    });
  }
  
  // Sort by score (best to worst)
  options.sort((a, b) => b.score - a.score);
  
  // Return top 10 for API (mobile app will show best 4-5)
  return options.slice(0, 10);
}

// Get next Thursday (weekly expiry)
function getNextThursday() {
  const today = new Date();
  const daysUntilThursday = (4 - today.getDay() + 7) % 7 || 7;
  const nextThursday = new Date(today);
  nextThursday.setDate(today.getDate() + daysUntilThursday);
  return nextThursday;
}

// Main handler
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  
  try {
    // Generate cache key based on today's date (changes daily)
    const today = new Date();
    const cacheKey = `options:${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
    
    console.log(`📊 Checking cache for ${cacheKey}...`);
    
    // Try to get cached data from Redis
    let cachedData = null;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        cachedData = typeof cached === 'string' ? JSON.parse(cached) : cached;
        console.log('✅ Using cached options data from Redis');
      }
    } catch (cacheError) {
      console.log('⚠️ Cache read error, generating fresh:', cacheError.message);
    }
    
    // If no cache, generate fresh data
    if (!cachedData) {
      console.log('📊 Generating fresh options data for today...');
      const options = generateRealisticOptions();
      const expiryDate = getNextThursday().toISOString().split('T')[0];
      
      cachedData = {
        success: true,
        data: options,
        cachedAt: new Date().toISOString(),
        expiryDate: expiryDate,
        totalScanned: options.length,
        message: 'Realistic simulated data - SAMCO integration pending'
      };
      
      // Cache until end of day (86400 seconds = 24 hours)
      try {
        await redis.set(cacheKey, JSON.stringify(cachedData), { ex: 86400 });
        console.log(`✅ Cached options data for 24 hours`);
      } catch (cacheError) {
        console.log('⚠️ Cache write error (continuing):', cacheError.message);
      }
    }
    
    res.status(200).json(cachedData);
  } catch (error) {
    console.error('❌ Error in options endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
