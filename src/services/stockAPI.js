import axios from 'axios';

// Use proxy server - DISABLED: Proxy doesn't have quote endpoints yet
const USE_PROXY = false;
const PROXY_URL = 'https://stock-analyzer-backend-nu.vercel.app';
const BASE_URL = USE_PROXY ? `${PROXY_URL}/api` : 'https://query1.finance.yahoo.com/v8/finance';
const BASE_URL_V10 = USE_PROXY ? `${PROXY_URL}/api` : 'https://query1.finance.yahoo.com/v10/finance';

// Session-level cache for pre-computed analysis (persists during app session)
let analysisCache = {};
let analysisCacheTimestamp = null;

// NEW: Fetch pre-computed analysis from backend (MUCH FASTER!)
export const fetchPrecomputedAnalysis = async (category) => {
  try {
    console.log(`[PRECOMPUTED] Fetching ${category} from backend`);
    const startTime = Date.now();
    
    // Check if we have cached trigger results (max 1 hour old)
    const cacheAge = analysisCacheTimestamp ? Date.now() - analysisCacheTimestamp : Infinity;
    const MAX_CACHE_AGE = 60 * 60 * 1000; // 1 hour
    
    if (Object.keys(analysisCache).length > 0 && cacheAge < MAX_CACHE_AGE) {
      console.log(`[PRECOMPUTED] Using cached trigger data (${Math.round(cacheAge / 1000 / 60)}min old)`);
      const stocks = analysisCache[category] || [];
      return {
        stocks,
        metadata: { fromCache: true, cacheAge: Math.round(cacheAge / 1000) },
        fromCache: true
      };
    }
    
    // Cache miss or stale - fetch from Redis-cached analysis endpoint (FAST!)
    console.log('[PRECOMPUTED] Cache miss - fetching from Redis cache (2-3 seconds)');
    const response = await axios.get(`${PROXY_URL}/api/analysis`, {
      params: { category },
      timeout: 30000, // 30 seconds
    });
    
    const duration = Date.now() - startTime;
    console.log(`[PRECOMPUTED] Redis fetch completed in ${duration}ms`);
    
    if (response.data.success && response.data.data) {
      // /api/analysis returns single category, store it in cache
      const stocks = response.data.data;
      
      // Update cache for this category only
      if (!analysisCache[category] || cacheAge >= MAX_CACHE_AGE) {
        analysisCache[category] = stocks;
        analysisCacheTimestamp = Date.now();
      }
      
      console.log(`[PRECOMPUTED] Cached ${stocks.length} stocks for ${category}`);
      
      return {
        stocks,
        metadata: response.data.metadata || { source: 'redis', timestamp: Date.now() },
        fromCache: false
      };
    } else {
      throw new Error(response.data.error || 'Failed to fetch pre-computed analysis');
    }
  } catch (error) {
    console.error(`[PRECOMPUTED] Error fetching ${category}:`, error.message);
    // Return null to fallback to client-side analysis
    return null;
  }
};

// Check if backend cache is available and fresh
export const checkBackendHealth = async () => {
  try {
    const response = await axios.get(`${PROXY_URL}/api/health`, { timeout: 5000 });
    return response.data;
  } catch (error) {
    console.error('[HEALTH] Backend health check failed:', error.message);
    return { success: false, status: 'unavailable' };
  }
};

// Indian NSE Sector mapping with popular stocks (Yahoo Finance uses .NS suffix for NSE)
export const SECTORS = {
  'Technology': ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'TECHM.NS', 'LTI.NS', 'PERSISTENT.NS', 'COFORGE.NS', 'MPHASIS.NS', 'LTTS.NS'],
  'Banking': ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS', 'INDUSINDBK.NS', 'BANKBARODA.NS', 'PNB.NS', 'FEDERALBNK.NS', 'BANDHANBNK.NS'],
  'Financial Services': ['BAJFINANCE.NS', 'BAJAJFINSV.NS', 'HDFCLIFE.NS', 'SBILIFE.NS', 'ICICIGI.NS', 'MUTHOOTFIN.NS', 'CHOLAFIN.NS', 'SBICARD.NS', 'PNBHOUSING.NS', 'RECLTD.NS'],
  'FMCG': ['HINDUNILVR.NS', 'ITC.NS', 'NESTLEIND.NS', 'BRITANNIA.NS', 'DABUR.NS', 'MARICO.NS', 'GODREJCP.NS', 'COLPAL.NS', 'TATACONSUM.NS', 'EMAMILTD.NS'],
  'Automobile': ['MARUTI.NS', 'TATAMOTORS.NS', 'M&M.NS', 'BAJAJ-AUTO.NS', 'EICHERMOT.NS', 'HEROMOTOCO.NS', 'ASHOKLEY.NS', 'ESCORTS.NS', 'MOTHERSON.NS', 'APOLLOTYRE.NS'],
  'Pharma': ['SUNPHARMA.NS', 'DRREDDY.NS', 'CIPLA.NS', 'DIVISLAB.NS', 'AUROPHARMA.NS', 'LUPIN.NS', 'BIOCON.NS', 'TORNTPHARM.NS', 'ALKEM.NS', 'IPCALAB.NS'],
  'Energy': ['RELIANCE.NS', 'ONGC.NS', 'IOC.NS', 'BPCL.NS', 'HINDPETRO.NS', 'GAIL.NS', 'COALINDIA.NS', 'POWERGRID.NS', 'NTPC.NS', 'ADANIGREEN.NS'],
  'Metals & Mining': ['TATASTEEL.NS', 'HINDALCO.NS', 'JSWSTEEL.NS', 'VEDL.NS', 'SAIL.NS', 'NMDC.NS', 'NATIONALUM.NS', 'JINDALSTEL.NS', 'HINDZINC.NS', 'RATNAMANI.NS'],
  'Infrastructure': ['LT.NS', 'ULTRACEMCO.NS', 'GRASIM.NS', 'ADANIPORTS.NS', 'HINDCOPPER.NS', 'AMBUJACEM.NS', 'ACC.NS', 'RAMCOCEM.NS', 'JKCEMENT.NS', 'IRCTC.NS'],
  'Consumer Durables': ['TITAN.NS', 'HAVELLS.NS', 'VOLTAS.NS', 'WHIRLPOOL.NS', 'CROMPTON.NS', 'BATAINDIA.NS', 'RELAXO.NS', 'Symphony.NS', 'AMBER.NS', 'CENTURYPLY.NS'],
};

// ETFs and Mutual Funds removed - focusing on stocks only

// Test backend connection
export const testBackendConnection = async () => {
  try {
    console.log('Testing backend connection:', PROXY_URL);
    const response = await axios.get(PROXY_URL, { 
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    console.log('Backend connection test successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Backend connection failed:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    throw new Error(`Backend unreachable: ${error.message}`);
  }
};


// Fetch stock quote data
export const fetchStockQuote = async (symbol) => {
  try {
    const url = USE_PROXY 
      ? `${PROXY_URL}/api/quote/${symbol}`
      : `${BASE_URL}/chart/${symbol}`;
    
    console.log('Fetching quote for:', symbol, 'from:', url);
    const response = await axios.get(url, {
      timeout: 8000,
      ...(USE_PROXY ? {} : {
        params: {
          interval: '1d',
          range: '1y',
        },
      }),
    });
    
    const data = USE_PROXY ? response.data : response.data;
    
    // Validate response structure
    if (!data || !data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error('Invalid response structure from API');
    }
    
    const result = data.chart.result[0];
    const quote = result.indicators?.quote?.[0];
    const meta = result.meta;
    
    // Validate required fields
    if (!quote || !meta || !meta.regularMarketPrice) {
      throw new Error('Missing required price data');
    }
    
    return {
      symbol: symbol,
      currentPrice: meta.regularMarketPrice || 0,
      previousClose: meta.previousClose || meta.regularMarketPrice || 0,
      change: (meta.regularMarketPrice || 0) - (meta.previousClose || meta.regularMarketPrice || 0),
      changePercent: meta.previousClose ? (((meta.regularMarketPrice || 0) - meta.previousClose) / meta.previousClose) * 100 : 0,
      volume: quote.volume?.[quote.volume.length - 1] || 0,
      timestamps: result.timestamp || [],
      prices: quote.close || [],
      high: quote.high || [],
      low: quote.low || [],
      open: quote.open || [],
      companyName: meta.shortName || meta.longName || symbol.replace('.NS', ''),
    };
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, {
      message: error.message,
      code: error.code,
      response: error.response?.status,
      url: error.config?.url
    });
    throw error;
  }
};

// Fetch fundamental data
export const fetchFundamentalData = async (symbol) => {
  try {
    const url = USE_PROXY
      ? `${PROXY_URL}/api/fundamentals/${symbol}`
      : `${BASE_URL_V10}/quoteSummary/${symbol}`;
    
    console.log('Fetching fundamentals for:', symbol);
    const response = await axios.get(url, {
      timeout: 8000,
      ...(USE_PROXY ? {} : {
        params: {
          modules: 'defaultKeyStatistics,financialData,summaryDetail,price,summaryProfile',
        },
      }),
    });
    
    // Validate response structure
    if (!response.data || !response.data.quoteSummary || !response.data.quoteSummary.result) {
      throw new Error('Invalid fundamentals response structure');
    }
    
    const data = response.data.quoteSummary.result[0] || {};
    const keyStats = data.defaultKeyStatistics || {};
    const financials = data.financialData || {};
    const summary = data.summaryDetail || {};
    const price = data.price || {};
    const profile = data.summaryProfile || {};
    
    return {
      symbol: symbol,
      companyName: price.shortName,
      sector: profile.sector,
      industry: profile.industry,
      
      // Valuation Metrics
      peRatio: summary.trailingPE?.raw || null,
      forwardPE: summary.forwardPE?.raw || null,
      pegRatio: keyStats.pegRatio?.raw || null,
      priceToBook: keyStats.priceToBook?.raw || null,
      priceToSales: keyStats.priceToSalesTrailing12Months?.raw || null,
      enterpriseToRevenue: keyStats.enterpriseToRevenue?.raw || null,
      enterpriseToEbitda: keyStats.enterpriseToEbitda?.raw || null,
      marketCap: price.marketCap?.raw || null,
      
      // Profitability Metrics
      profitMargin: financials.profitMargins?.raw || null,
      operatingMargin: financials.operatingMargins?.raw || null,
      returnOnAssets: financials.returnOnAssets?.raw || null,
      returnOnEquity: financials.returnOnEquity?.raw || null,
      
      // Growth Metrics
      revenueGrowth: financials.revenueGrowth?.raw || null,
      earningsGrowth: financials.earningsGrowth?.raw || null,
      earningsQuarterlyGrowth: keyStats.earningsQuarterlyGrowth?.raw || null,
      
      // Financial Health
      debtToEquity: financials.debtToEquity?.raw || null,
      currentRatio: financials.currentRatio?.raw || null,
      quickRatio: financials.quickRatio?.raw || null,
      freeCashflow: financials.freeCashflow?.raw || null,
      operatingCashflow: financials.operatingCashflow?.raw || null,
      totalCash: financials.totalCash?.raw || null,
      totalDebt: financials.totalDebt?.raw || null,
      
      // Per Share Metrics
      eps: keyStats.trailingEps?.raw || null,
      bookValue: keyStats.bookValue?.raw || null,
      
      // Dividend
      dividendYield: summary.dividendYield?.raw || null,
      dividendRate: summary.dividendRate?.raw || null,
      payoutRatio: keyStats.payoutRatio?.raw || null,
      
      // Risk Metrics
      beta: keyStats.beta?.raw || null,
      
      // Analyst Ratings
      targetMeanPrice: financials.targetMeanPrice?.raw || null,
      recommendationKey: financials.recommendationKey || null,
    };
  } catch (error) {
    console.error(`Error fetching fundamentals for ${symbol}:`, {
      message: error.message,
      code: error.code,
      response: error.response?.status,
      url: error.config?.url
    });
    throw error;
  }
};

// Day-based category-specific cache
const stockCache = new Map();
const fundamentalCache = new Map();
const technicalCache = new Map();
const allStocksCache = { data: null, timestamp: 0 }; // Session-level cache for all stocks

// Get start of current day timestamp
const getStartOfDay = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
};

const getCachedStock = (symbol, cacheType = 'quote') => {
  const cache = cacheType === 'fundamental' ? fundamentalCache : 
                cacheType === 'technical' ? technicalCache : stockCache;
  const cached = cache.get(symbol);
  
  // Cache valid until end of day (midnight)
  if (cached && cached.timestamp >= getStartOfDay()) {
    console.log(`Using cached ${cacheType} data for ${symbol}`);
    return cached.data;
  }
  return null;
};

const setCachedStock = (symbol, data, cacheType = 'quote') => {
  const cache = cacheType === 'fundamental' ? fundamentalCache : 
                cacheType === 'technical' ? technicalCache : stockCache;
  cache.set(symbol, { data, timestamp: Date.now() });
};

// Clear all caches at midnight
const scheduleNightlyCacheClear = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const msUntilMidnight = tomorrow.getTime() - now.getTime();
  
  setTimeout(() => {
    console.log('Clearing all caches at midnight...');
    stockCache.clear();
    fundamentalCache.clear();
    technicalCache.clear();
    scheduleNightlyCacheClear(); // Schedule for next day
  }, msUntilMidnight);
};

// Initialize nightly cache clearing
scheduleNightlyCacheClear();

// Fetch multiple stocks for a sector or custom symbol list
export const fetchSectorStocks = async (sector, customSymbols = null) => {
  console.log('fetchSectorStocks called for:', sector);
  const symbols = customSymbols || SECTORS[sector] || [];
  console.log('Symbols to fetch:', symbols);
  
  if (symbols.length === 0) {
    console.warn('No symbols found for sector:', sector);
    throw new Error('No symbols configured for this sector');
  }
  
  // Fetch all stocks in parallel for much faster loading
  const stockPromises = symbols.map(async (symbol) => {
    // Check cache first (quote data)
    const cached = getCachedStock(symbol, 'quote');
    if (cached) {
      return cached;
    }

    try {
      console.log(`Fetching ${symbol}...`);
      
      const quote = await fetchStockQuote(symbol);
      console.log(`Got quote for ${symbol}`);
      
      // Try to get fundamentals, but don't fail if it doesn't work
      let fundamentals = null;
      try {
        fundamentals = await fetchFundamentalData(symbol);
        console.log(`Got fundamentals for ${symbol}`);
      } catch (fundError) {
        console.warn(`Could not fetch fundamentals for ${symbol}, using quote data only:`, fundError.message);
        // Create basic fundamental data from quote
        fundamentals = {
          symbol: quote.symbol || symbol,
          companyName: quote.companyName || symbol.replace('.NS', ''),
          sector: sector,
          peRatio: null,
          marketCap: null,
          profitMargin: null,
          returnOnEquity: null,
          debtToEquity: null,
          currentRatio: null,
          revenueGrowth: null,
          earningsGrowth: null,
          dividendYield: null,
        };
      }
      
      const stockData = {
        ...quote,
        ...fundamentals,
      };
      
      // Cache the result - separate caches for quote, fundamental, and technical
      setCachedStock(symbol, stockData, 'quote');
      if (fundamentals && fundamentals.peRatio !== null) {
        setCachedStock(symbol, fundamentals, 'fundamental');
      }
      console.log(`✓ Successfully fetched ${symbol}`);
      return stockData;
    } catch (error) {
      console.error(`✗ Failed to fetch ${symbol}:`, error.message);
      return null; // Return null for failed fetches
    }
  });
  
  // Wait for all parallel fetches to complete
  const results = await Promise.allSettled(stockPromises);
  const validStocks = results
    .filter(r => r.status === 'fulfilled' && r.value !== null)
    .map(r => r.value);
  
  console.log(`Result: ${validStocks.length}/${symbols.length} stocks fetched successfully`);
  
  if (validStocks.length === 0) {
    throw new Error('Failed to fetch any stocks. Please check your connection.');
  }
  
  return validStocks;
};

// Fetch stocks from selected sectors (for analysis filtering)
export const fetchAllStocks = async () => {
  try {
    // Check session-level cache first (valid for current app session until midnight)
    if (allStocksCache.data && allStocksCache.timestamp >= getStartOfDay()) {
      console.log(`📦 Using cached ALL stocks data (${allStocksCache.data.length} stocks) - INSTANT LOAD!`);
      return allStocksCache.data;
    }
    
    console.log('Fetching stocks from ALL sectors for comprehensive analysis...');
    
    // Use ALL 10 sectors for maximum diversity (100 stocks total)
    const allSectorKeys = Object.keys(SECTORS);
    console.log(`Loading ${allSectorKeys.length} sectors in parallel:`, allSectorKeys);
    
    // Fetch ALL sectors in parallel (multi-threaded) for maximum speed
    const startTime = Date.now();
    const sectorPromises = allSectorKeys.map(async (sector) => {
      try {
        console.log(`[Thread] Fetching ${sector} stocks...`);
        const sectorStocks = await fetchSectorStocks(sector);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✓ ${sector}: ${sectorStocks.length} stocks fetched in ${elapsed}s`);
        return { sector, stocks: sectorStocks, success: true };
      } catch (error) {
        console.error(`✗ Failed to fetch ${sector}:`, error.message);
        return { sector, stocks: [], success: false };
      }
    });
    
    // Wait for ALL parallel fetches to complete
    const results = await Promise.all(sectorPromises);
    const allStocks = [];
    
    // Combine results
    results.forEach(result => {
      if (result.success && result.stocks.length > 0) {
        allStocks.push(...result.stocks);
      }
    });
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    const successCount = results.filter(r => r.success).length;
    
    console.log(`\n=== PARALLEL FETCH COMPLETE ===`);
    console.log(`Total stocks fetched: ${allStocks.length}`);
    console.log(`Successful sectors: ${successCount}/${allSectorKeys.length}`);
    console.log(`Total time: ${totalTime}s (parallel multi-threaded)`);
    console.log(`================================\n`);
    
    if (allStocks.length === 0) {
      throw new Error('No stocks could be fetched. Please check your internet connection.');
    }
    
    // Cache the results for the session (until midnight)
    allStocksCache.data = allStocks;
    allStocksCache.timestamp = Date.now();
    console.log(`💾 Cached ALL stocks for session (valid until midnight)`);
    
    return allStocks;
  } catch (error) {
    console.error('Error fetching stocks:', error);
    throw error;
  }
};

// ETF and Mutual Fund functions removed - app focuses on stocks only

// Search for stocks
export const searchStocks = async (query) => {
  try {
    const response = await axios.get('https://query1.finance.yahoo.com/v1/finance/search', {
      params: {
        q: query,
        quotesCount: 10,
        newsCount: 0,
      },
    });
    
    return response.data.quotes.map(quote => ({
      symbol: quote.symbol,
      name: quote.shortname || quote.longname,
      exchange: quote.exchange,
      type: quote.quoteType,
    }));
  } catch (error) {
    console.error('Error searching stocks:', error.message);
    return [];
  }
};
