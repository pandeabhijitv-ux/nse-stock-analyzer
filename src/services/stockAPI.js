import axios from 'axios';

// Use proxy server - REQUIRED for mobile app to work
const USE_PROXY = true;
const PROXY_URL = 'https://stock-analyzer-backend-nu.vercel.app';
const BASE_URL = USE_PROXY ? `${PROXY_URL}/api` : 'https://query1.finance.yahoo.com/v8/finance';
const BASE_URL_V10 = USE_PROXY ? `${PROXY_URL}/api` : 'https://query1.finance.yahoo.com/v10/finance';

// Indian NSE Sector mapping with popular stocks (Yahoo Finance uses .NS suffix for NSE)
export const SECTORS = {
  'Technology': ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'TECHM.NS', 'LTI.NS', 'COFORGE.NS', 'MPHASIS.NS', 'PERSISTENT.NS', 'LTTS.NS'],
  'Banking': ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS', 'INDUSINDBK.NS', 'BANKBARODA.NS', 'PNB.NS', 'FEDERALBNK.NS', 'IDFCFIRSTB.NS'],
  'Financial Services': ['BAJFINANCE.NS', 'BAJAJFINSV.NS', 'HDFCLIFE.NS', 'SBILIFE.NS', 'ICICIGI.NS', 'HDFCAMC.NS', 'MUTHOOTFIN.NS', 'CHOLAFIN.NS', 'SBICARD.NS', 'PFC.NS'],
  'FMCG': ['HINDUNILVR.NS', 'ITC.NS', 'NESTLEIND.NS', 'BRITANNIA.NS', 'DABUR.NS', 'MARICO.NS', 'GODREJCP.NS', 'COLPAL.NS', 'TATACONSUM.NS', 'EMAMILTD.NS'],
  'Automobile': ['MARUTI.NS', 'TATAMOTORS.NS', 'M&M.NS', 'BAJAJ-AUTO.NS', 'EICHERMOT.NS', 'HEROMOTOCO.NS', 'ASHOKLEY.NS', 'TVSMOTOR.NS', 'BALKRISIND.NS', 'MRF.NS'],
  'Pharma': ['SUNPHARMA.NS', 'DRREDDY.NS', 'CIPLA.NS', 'DIVISLAB.NS', 'AUROPHARMA.NS', 'LUPIN.NS', 'BIOCON.NS', 'TORNTPHARM.NS', 'ALKEM.NS', 'ZYDUSLIFE.NS'],
  'Energy': ['RELIANCE.NS', 'ONGC.NS', 'IOC.NS', 'BPCL.NS', 'HINDPETRO.NS', 'GAIL.NS', 'COALINDIA.NS', 'ADANIGREEN.NS', 'ADANIPOWER.NS', 'TATAPOWER.NS'],
  'Metals & Mining': ['TATASTEEL.NS', 'HINDALCO.NS', 'JSWSTEEL.NS', 'VEDL.NS', 'SAIL.NS', 'JINDALSTEL.NS', 'NMDC.NS', 'HINDZINC.NS', 'NATIONALUM.NS', 'APLAPOLLO.NS'],
  'Infrastructure': ['LT.NS', 'ULTRACEMCO.NS', 'GRASIM.NS', 'ADANIPORTS.NS', 'HINDCOPPER.NS', 'RAMCOCEM.NS', 'SHREECEM.NS', 'AMBUJACEM.NS', 'ACC.NS', 'CONCOR.NS'],
  'Consumer Durables': ['TITAN.NS', 'HAVELLS.NS', 'VOLTAS.NS', 'WHIRLPOOL.NS', 'CROMPTON.NS', 'BATAINDIA.NS', 'SYMPHONY.NS', 'BLUESTARCO.NS', 'RAJESHEXPO.NS', 'KAJARIACER.NS'],
};

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
      timeout: 15000,
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
      timeout: 15000,
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

// Fetch multiple stocks for a sector
export const fetchSectorStocks = async (sector) => {
  console.log('fetchSectorStocks called for:', sector);
  const symbols = SECTORS[sector] || [];
  console.log('Symbols to fetch:', symbols);
  
  if (symbols.length === 0) {
    console.warn('No symbols found for sector:', sector);
    throw new Error('No symbols configured for this sector');
  }
  
  const validStocks = [];
  const errors = [];
  
  // Fetch stocks sequentially to avoid overwhelming the connection
  for (const symbol of symbols) {
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
        console.warn(`Could not fetch fundamentals for ${symbol}, using quote data only`);
        // Create basic fundamental data from quote
        fundamentals = {
          symbol: symbol,
          companyName: symbol.replace('.NS', ''),
          sector: sector,
          peRatio: null,
          marketCap: null,
        };
      }
      
      if (quote && fundamentals) {
        validStocks.push({
          ...quote,
          ...fundamentals,
        });
        console.log(`✓ Successfully fetched ${symbol}`);
      }
    } catch (error) {
      console.error(`✗ Failed to fetch ${symbol}:`, error.message);
      errors.push({ symbol, error: error.message });
      // Continue trying other stocks even if one fails
    }
  }
  
  console.log(`Result: ${validStocks.length}/${symbols.length} stocks fetched successfully`);
  
  if (validStocks.length === 0) {
    const errorDetails = errors.map(e => `${e.symbol}: ${e.error}`).join('; ');
    throw new Error(`Failed to fetch any stocks. Errors: ${errorDetails}`);
  }
  
  return validStocks;
};

// Fetch all stocks from all sectors (for analysis filtering)
export const fetchAllStocks = async () => {
  try {
    console.log('Fetching all stocks from all sectors...');
    const allStocks = [];
    const sectorNames = Object.keys(SECTORS);
    
    // Fetch stocks from all sectors
    for (const sector of sectorNames) {
      try {
        console.log(`Fetching ${sector} stocks...`);
        const sectorStocks = await fetchSectorStocks(sector);
        allStocks.push(...sectorStocks);
        console.log(`✓ ${sector}: ${sectorStocks.length} stocks added`);
      } catch (error) {
        console.error(`✗ Failed to fetch ${sector}:`, error.message);
        // Continue with other sectors even if one fails
      }
    }
    
    console.log(`Total stocks fetched: ${allStocks.length}`);
    return allStocks;
  } catch (error) {
    console.error('Error fetching all stocks:', error);
    throw error;
  }
};

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
