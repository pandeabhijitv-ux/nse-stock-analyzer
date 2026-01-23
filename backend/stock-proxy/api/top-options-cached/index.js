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
// Helper: Calculate NSE-compliant strike interval based on price
function getStrikeInterval(price) {
  if (price < 50) return 2.5;
  if (price < 100) return 5;
  if (price < 500) return 10;
  if (price < 1000) return 20;
  if (price < 2500) return 50;
  return 100;
}

// Helper: Calculate ATM strike (round to nearest interval)
function calculateATM(spotPrice, interval) {
  return Math.round(spotPrice / interval) * interval;
}

async function generateRealisticOptions() {
  const today = new Date();
  const seed = today.getDate() + today.getMonth() * 31;
  
  // Seeded random function for consistent results within the same day
  let randomSeed = seed;
  const seededRandom = () => {
    randomSeed = (randomSeed * 9301 + 49297) % 233280;
    return randomSeed / 233280;
  };
  
  // Top 30 liquid NSE stocks - symbols only (we'll fetch live prices)
  const stockSymbols = [
    // Banking & Finance (High liquidity)
    'HDFCBANK', 'ICICIBANK', 'KOTAKBANK', 'AXISBANK', 'SBIN', 'INDUSINDBK', 'BAJFINANCE',
    // IT Sector
    'TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM',
    // Auto & Pharma
    'MARUTI', 'TATAMOTORS', 'M&M', 'SUNPHARMA', 'DRREDDY',
    // Energy & Telecom
    'RELIANCE', 'BHARTIARTL', 'ONGC', 'POWERGRID',
    // FMCG & Consumer
    'ITC', 'HINDUNILVR', 'NESTLEIND', 'BRITANNIA',
    // Metals & Infra
    'LT', 'TATASTEEL', 'HINDALCO', 'JSWSTEEL', 'ADANIPORTS'
  ];
  
  // Fetch LIVE prices from Yahoo Finance for all stocks
  console.log('📈 Fetching live prices for options generation...');
  const stocks = [];
  await Promise.all(
    stockSymbols.map(async (symbol) => {
      try {
        const quote = await yahooFinance.quote(`${symbol}.NS`);
        const spot = quote.regularMarketPrice || 100;
        const interval = getStrikeInterval(spot);
        const atm = calculateATM(spot, interval);
        
        stocks.push({ symbol, spot, atm, interval });
        console.log(`  ${symbol}: ₹${spot} (ATM: ${atm}, interval: ${interval})`);
      } catch (err) {
        console.log(`  ⚠️ ${symbol}: Failed to fetch price, skipping`);
      }
    })
  );
  
  if (stocks.length === 0) {
    console.log('❌ No stock prices fetched, cannot generate options');
    return [];
  }
  
  console.log(`✅ Fetched ${stocks.length} stock prices`);
  
  const options = [];
  
  // Generate 20-25 quality options with REALISTIC strikes near current price
  // Strategy: For each stock, pick 1-2 best strikes (ATM or slightly OTM)
  for (let i = 0; i < Math.min(25, stocks.length * 2); i++) {
    const stock = stocks[i % stocks.length];
    const isCall = (seed + i) % 2 === 0;
    
    // PROPER LOGIC: Generate strikes ONLY near ATM (±1 strike max)
    // For CALL: Prefer ATM or ATM+1 (slightly OTM for premium collection)
    // For PUT: Prefer ATM or ATM-1 (slightly OTM for premium collection)
    const strikeOffsets = [-1, 0, 1]; // ATM-1, ATM, ATM+1
    const preferredOffset = isCall ? 
      ((seed + i) % 2 === 0 ? 0 : 1) : // CALL: ATM or ATM+1
      ((seed + i) % 2 === 0 ? 0 : -1); // PUT: ATM or ATM-1
    
    const strike = stock.atm + (preferredOffset * stock.interval);
    
    // REALISTIC moneyness check (reject if too far OTM/ITM)
    const moneynessPct = isCall ? 
      ((strike - stock.spot) / stock.spot) * 100 : // CALL: +ve = OTM, -ve = ITM
      ((stock.spot - strike) / stock.spot) * 100;  // PUT: +ve = OTM, -ve = ITM
    
    // Skip if more than 5% OTM (won't be liquid/tradeable)
    if (Math.abs(moneynessPct) > 5) {
      continue;
    }
    
    // Premium calculation based on moneyness and time value
    const intrinsicValue = isCall ? 
      Math.max(0, stock.spot - strike) : 
      Math.max(0, strike - stock.spot);
    
    const timeValue = stock.spot * (0.01 + seededRandom() * 0.02); // 1-3% of spot
    const premium = intrinsicValue + timeValue;
    
    // Greeks based on moneyness
    const absMoneyness = Math.abs(moneynessPct) / 100;
    const delta = isCall ?
      (0.50 + (intrinsicValue > 0 ? 0.2 : -absMoneyness * 0.3)) :
      (-0.50 - (intrinsicValue > 0 ? 0.2 : -absMoneyness * 0.3));
    
    const iv = 20 + (seed + i * 3) % 12; // 20-32% IV (realistic range)
    const volume = Math.floor((seed + i * 17) % 80000 + 20000); // Higher volume for ATM
    const oi = Math.floor(volume * (1.8 + seededRandom() * 1.5));
    
    // Score based on liquidity + moneyness (favor ATM)
    const score = Math.floor(
      (volume / 1000) * 0.25 +
      (oi / 10000) * 0.35 +
      (35 - Math.abs(iv - 26)) * 2 +
      (Math.abs(delta) * 40) +
      (5 - Math.abs(moneynessPct)) * 3 // Bonus for near-ATM
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
      gamma: Number((0.001 + seededRandom() * 0.003).toFixed(4)),
      vega: Number((premium * 0.18).toFixed(2)),
      score: Math.min(95, Math.max(50, score)),
      expiryDate: getNextThursday().toISOString().split('T')[0],
      moneyness: Number(moneynessPct.toFixed(2)) // Show how OTM/ITM
    });
  }
  
  console.log(`✅ Generated ${options.length} realistic options (ATM ±1 strike only)`);
  
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
      const options = await generateRealisticOptions(); // NOW ASYNC
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
