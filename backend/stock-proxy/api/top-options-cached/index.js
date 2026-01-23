// Options Trading API - Returns realistic options data with target calculations
// Path: /api/top-options-cached (to match PWA expectations)

const { Redis } = require('@upstash/redis');
const yahooFinance = require('yahoo-finance2').default;

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

// Calculate target price for underlying stock (SINGLE BEST METHOD)
function calculateUnderlyingTarget(fundamentals) {
  const currentPrice = fundamentals.currentPrice;
  const peRatio = fundamentals.peRatio;
  const pegRatio = fundamentals.pegRatio;
  const earningsGrowth = fundamentals.earningsGrowth;
  const priceToBook = fundamentals.priceToBook;
  const returnOnEquity = fundamentals.returnOnEquity;
  const fiftyTwoWeekHigh = fundamentals.fiftyTwoWeekHigh;
  const fiftyTwoWeekLow = fundamentals.fiftyTwoWeekLow;

  if (!currentPrice || currentPrice <= 0) return null;

  let target = null;
  let method = null;
  let signal = null; // 'BULLISH' or 'BEARISH'

  // Priority 1: PEG-based (best for growth stocks)
  if (pegRatio && pegRatio > 0 && pegRatio < 2.5 && earningsGrowth && earningsGrowth > 0.10) {
    const fairPE = earningsGrowth * 100;
    target = currentPrice * (fairPE / (peRatio || 20));
    method = 'PEG';
  }
  // Priority 2: ROE-based (best for value stocks)
  else if (returnOnEquity && returnOnEquity > 0.15 && priceToBook && priceToBook > 0) {
    const roePercent = returnOnEquity * 100;
    let fairPB = roePercent > 20 ? 5.0 : roePercent > 18 ? 4.5 : 4.0;
    target = currentPrice * (fairPB / priceToBook);
    method = 'ROE';
  }
  // Priority 3: Momentum-based (fallback)
  else if (fiftyTwoWeekHigh && fiftyTwoWeekLow) {
    const range = fiftyTwoWeekHigh - fiftyTwoWeekLow;
    const position = (currentPrice - fiftyTwoWeekLow) / range;
    target = position < 0.4 ? fiftyTwoWeekHigh : fiftyTwoWeekHigh * 1.08;
    method = 'MOM';
  }

  if (!target) return null;

  // Apply bounds (±30%)
  target = Math.max(currentPrice * 0.7, Math.min(currentPrice * 1.3, target));
  const upside = ((target - currentPrice) / currentPrice) * 100;
  
  // Determine signal for options
  if (upside > 5) signal = 'BULLISH'; // Favor Calls
  else if (upside < -5) signal = 'BEARISH'; // Favor Puts
  else signal = 'NEUTRAL';

  return {
    target: Number(target.toFixed(2)),
    upside: Number(upside.toFixed(2)),
    method,
    signal
  };
}

// Fetch fundamentals for target calculation
async function fetchUnderlyingFundamentals(symbol) {
  try {
    const nseSymbol = `${symbol}.NS`;
    const [quote, fundamentals] = await Promise.all([
      yahooFinance.quote(nseSymbol),
      yahooFinance.quoteSummary(nseSymbol, {
        modules: ['defaultKeyStatistics', 'financialData', 'summaryDetail']
      })
    ]);

    return {
      currentPrice: quote.regularMarketPrice || 0,
      peRatio: fundamentals.defaultKeyStatistics?.trailingPE || 0,
      pegRatio: fundamentals.defaultKeyStatistics?.pegRatio || 0,
      earningsGrowth: fundamentals.defaultKeyStatistics?.earningsQuarterlyGrowth || 0,
      priceToBook: fundamentals.defaultKeyStatistics?.priceToBook || 0,
      returnOnEquity: fundamentals.financialData?.returnOnEquity || 0,
      fiftyTwoWeekHigh: fundamentals.summaryDetail?.fiftyTwoWeekHigh || quote.fiftyTwoWeekHigh || 0,
      fiftyTwoWeekLow: fundamentals.summaryDetail?.fiftyTwoWeekLow || quote.fiftyTwoWeekLow || 0
    };
  } catch (err) {
    console.log(`⚠️ Could not fetch fundamentals for ${symbol}:`, err.message);
    return null;
  }
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
    // Check for manual refresh request
    const { refresh, secret } = req.query;
    const REFRESH_SECRET = process.env.REFRESH_SECRET || 'dev-secret-key-123';
    
    // Generate cache key based on today's date (changes daily)
    const today = new Date();
    const cacheKey = `options:${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
    
    console.log(`📊 Checking cache for ${cacheKey}...`);
    
    // Handle manual refresh
    if (refresh === 'true') {
      if (secret !== REFRESH_SECRET) {
        return res.status(403).json({
          success: false,
          error: 'Invalid or missing secret key for refresh',
          message: 'Use ?refresh=true&secret=YOUR_SECRET to manually refresh cache'
        });
      }
      
      console.log('🔄 Manual refresh requested - clearing options cache...');
      try {
        await redis.del(cacheKey);
        console.log('✅ Options cache cleared');
      } catch (err) {
        console.log('⚠️ Cache clear error:', err.message);
      }
    }
    
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
      
      // Add target calculations for unique underlying stocks
      const uniqueSymbols = [...new Set(options.map(opt => opt.underlyingSymbol))];
      console.log(`📈 Calculating targets for ${uniqueSymbols.length} underlying stocks...`);
      
      const targetMap = {};
      await Promise.all(
        uniqueSymbols.map(async (symbol) => {
          const fundamentals = await fetchUnderlyingFundamentals(symbol);
          if (fundamentals) {
            targetMap[symbol] = calculateUnderlyingTarget(fundamentals);
          }
        })
      );
      
      // Enhance options with underlying targets and bias
      const enhancedOptions = options.map(opt => {
        const target = targetMap[opt.underlyingSymbol];
        if (target) {
          // Add bias to score based on signal alignment
          let biasedScore = opt.score;
          if (target.signal === 'BULLISH' && opt.optionType === 'CE') {
            biasedScore += 10; // Boost Call options on bullish signal
          } else if (target.signal === 'BEARISH' && opt.optionType === 'PE') {
            biasedScore += 10; // Boost Put options on bearish signal
          }
          
          return {
            ...opt,
            score: Math.min(99, biasedScore),
            underlyingTarget: target.target,
            underlyingUpside: target.upside,
            targetMethod: target.method,
            marketSignal: target.signal,
            recommendation: target.signal === 'BULLISH' && opt.optionType === 'CE' ? 'STRONG BUY' :
                          target.signal === 'BEARISH' && opt.optionType === 'PE' ? 'STRONG BUY' :
                          target.signal === 'BULLISH' && opt.optionType === 'PE' ? 'AVOID' :
                          target.signal === 'BEARISH' && opt.optionType === 'CE' ? 'AVOID' :
                          'NEUTRAL'
          };
        }
        return opt;
      });
      
      // Re-sort by biased score
      enhancedOptions.sort((a, b) => b.score - a.score);
      
      cachedData = {
        success: true,
        data: enhancedOptions.slice(0, 10),
        cachedAt: new Date().toISOString(),
        expiryDate: expiryDate,
        totalScanned: enhancedOptions.length,
        message: 'Options with underlying target analysis - Best method per stock'
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
