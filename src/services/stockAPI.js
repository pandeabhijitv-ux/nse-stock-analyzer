import axios from 'axios';

// Use proxy server - REQUIRED for mobile app to work
const USE_PROXY = true;
const PROXY_URL = 'https://stock-analyzer-backend-nu.vercel.app';
const BASE_URL = USE_PROXY ? `${PROXY_URL}/api` : 'https://query1.finance.yahoo.com/v8/finance';
const BASE_URL_V10 = USE_PROXY ? `${PROXY_URL}/api` : 'https://query1.finance.yahoo.com/v10/finance';

// Indian NSE Sector mapping with popular stocks (Yahoo Finance uses .NS suffix for NSE)
// Reduced to 5 stocks per sector for faster loading
export const SECTORS = {
  'Technology': ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'TECHM.NS'],
  'Banking': ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS'],
  'Financial Services': ['BAJFINANCE.NS', 'BAJAJFINSV.NS', 'HDFCLIFE.NS', 'SBILIFE.NS', 'ICICIGI.NS'],
  'FMCG': ['HINDUNILVR.NS', 'ITC.NS', 'NESTLEIND.NS', 'BRITANNIA.NS', 'DABUR.NS'],
  'Automobile': ['MARUTI.NS', 'TATAMOTORS.NS', 'M&M.NS', 'BAJAJ-AUTO.NS', 'EICHERMOT.NS'],
  'Pharma': ['SUNPHARMA.NS', 'DRREDDY.NS', 'CIPLA.NS', 'DIVISLAB.NS', 'AUROPHARMA.NS'],
  'Energy': ['RELIANCE.NS', 'ONGC.NS', 'IOC.NS', 'BPCL.NS', 'HINDPETRO.NS'],
  'Metals & Mining': ['TATASTEEL.NS', 'HINDALCO.NS', 'JSWSTEEL.NS', 'VEDL.NS', 'SAIL.NS'],
  'Infrastructure': ['LT.NS', 'ULTRACEMCO.NS', 'GRASIM.NS', 'ADANIPORTS.NS', 'HINDCOPPER.NS'],
  'Consumer Durables': ['TITAN.NS', 'HAVELLS.NS', 'VOLTAS.NS', 'WHIRLPOOL.NS', 'CROMPTON.NS'],
};

// Popular NSE ETFs (Exchange Traded Funds)
export const ETF_SYMBOLS = [
  'NIFTYBEES.NS',     // Nifty 50 ETF
  'BANKBEES.NS',      // Nifty Bank ETF
  'JUNIORBEES.NS',    // Nifty Next 50 ETF
  'LIQUIDBEES.NS',    // Liquid ETF
  'GOLDBEES.NS',      // Gold ETF
];

// Popular Mutual Fund AMC stocks (Asset Management Companies)
export const MUTUAL_FUND_STOCKS = [
  'HDFCAMC.NS',       // HDFC AMC
  'NAM-INDIA.NS',     // Nippon Life AMC
  'HDFCBANK.NS',      // HDFC Bank (MF ecosystem)
  'ICICIGI.NS',       // ICICI Prudential
  'SBILIFE.NS',       // SBI Life (MF ecosystem)
];

// Popular NSE ETFs (Exchange Traded Funds)
export const ETF_SYMBOLS = [
  'NIFTYBEES.NS',     // Nifty 50 ETF
  'BANKBEES.NS',      // Nifty Bank ETF
  'JUNIORBEES.NS',    // Nifty Next 50 ETF
  'LIQUIDBEES.NS',    // Liquid ETF
  'GOLDBEES.NS',      // Gold ETF
  'ITBEES.NS',        // Nifty IT ETF
  'PSUBNKBEES.NS',    // PSU Bank ETF
  'CONSUMBEES.NS',    // Nifty Consumption ETF
  'PHARMABEES.NS',    // Pharma ETF
  'AUTOBEES.NS',      // Auto ETF
];

// Popular Mutual Fund Houses represented through their AMC stocks
// Note: Direct mutual fund NAVs are harder to fetch via Yahoo Finance
// Using AMC (Asset Management Company) stocks as proxy
export const MUTUAL_FUND_STOCKS = [
  'HDFCAMC.NS',       // HDFC AMC
  'UTIAMC.NS',        // UTI AMC
  'NAM-INDIA.NS',     // Nippon Life AMC
  'ICICIAMC.NS',      // ICICI Prudential AMC (if available)
  'SBIAMC.NS',        // SBI Funds Management (if available)
  // Popular fund houses with good track record
  'HDFCBANK.NS',      // HDFC Bank (represents HDFC MF ecosystem)
  'ICICIGI.NS',       // ICICI (represents ICICI Prudential MF)
  'SBILIFE.NS',       // SBI Life (represents SBI MF ecosystem)
  'BAJAJFINSV.NS',    // Bajaj Finserv (represents Bajaj MF)
  'AXISBANK.NS',      // Axis Bank (represents Axis MF)
];

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

// Fetch multiple stocks for a sector or custom symbol list
export const fetchSectorStocks = async (sector, customSymbols = null) => {
  console.log('fetchSectorStocks called for:', sector);
  const symbols = customSymbols || SECTORS[sector] || [];
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

// Fetch stocks from selected sectors (for analysis filtering)
// Progressive loading: fetch from multiple sectors to get ~25 stocks total
// First 5 stocks display immediately, remaining load in background
export const fetchAllStocks = async () => {
  try {
    console.log('Fetching stocks from key sectors for analysis...');
    const allStocks = [];
    // Fetch from 5 sectors for progressive loading (25 stocks total)
    // First sector loads fast (5 stocks), others load progressively
    const keySectors = ['Technology', 'Banking', 'Pharma', 'Energy', 'FMCG'];
    
    for (const sector of keySectors) {
      try {
        console.log(`Fetching ${sector} stocks...`);
        const sectorStocks = await fetchSectorStocks(sector);
        allStocks.push(...sectorStocks);
        console.log(`✓ ${sector}: ${sectorStocks.length} stocks added (Total: ${allStocks.length})`);
      } catch (error) {
        console.error(`✗ Failed to fetch ${sector}:`, error.message);
        // Continue with other sectors even if one fails
      }
    }
    
    console.log(`Total stocks fetched: ${allStocks.length}`);
    if (allStocks.length === 0) {
      throw new Error('No stocks could be fetched. Please check your internet connection.');
    }
    return allStocks;
  } catch (error) {
    console.error('Error fetching stocks:', error);
    throw error;
  }
};

// Fetch ETF data
export const fetchETFs = async () => {
  try {
    console.log('Fetching ETF data...');
    return await fetchSectorStocks('ETF', ETF_SYMBOLS);
  } catch (error) {
    console.error('Error fetching ETFs:', error);
    throw error;
  }
};

// Fetch Mutual Fund related stocks
export const fetchMutualFunds = async () => {
  try {
    console.log('Fetching Mutual Fund AMC stocks...');
    return await fetchSectorStocks('Mutual Funds', MUTUAL_FUND_STOCKS);
  } catch (error) {
    console.error('Error fetching Mutual Funds:', error);
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
