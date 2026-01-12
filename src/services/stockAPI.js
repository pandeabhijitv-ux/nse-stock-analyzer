import axios from 'axios';

// Use proxy server - REQUIRED for mobile app to work
const USE_PROXY = true;
const PROXY_URL = 'https://stock-analyzer-backend-nu.vercel.app';
const BASE_URL = USE_PROXY ? `${PROXY_URL}/api` : 'https://query1.finance.yahoo.com/v8/finance';
const BASE_URL_V10 = USE_PROXY ? `${PROXY_URL}/api` : 'https://query1.finance.yahoo.com/v10/finance';

// Indian NSE Sector mapping with popular stocks (Yahoo Finance uses .NS suffix for NSE)
// Reduced to 3 stocks per sector for faster mobile loading
export const SECTORS = {
  'Technology': ['TCS.NS', 'INFY.NS', 'WIPRO.NS'],
  'Banking': ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS'],
  'Financial Services': ['BAJFINANCE.NS', 'BAJAJFINSV.NS', 'HDFCLIFE.NS'],
  'FMCG': ['HINDUNILVR.NS', 'ITC.NS', 'NESTLEIND.NS'],
  'Automobile': ['MARUTI.NS', 'TATAMOTORS.NS', 'M&M.NS'],
  'Pharma': ['SUNPHARMA.NS', 'DRREDDY.NS', 'CIPLA.NS'],
  'Energy': ['RELIANCE.NS', 'ONGC.NS', 'IOC.NS'],
  'Metals & Mining': ['TATASTEEL.NS', 'HINDALCO.NS', 'JSWSTEEL.NS'],
  'Infrastructure': ['LT.NS', 'ULTRACEMCO.NS', 'GRASIM.NS'],
  'Consumer Durables': ['TITAN.NS', 'HAVELLS.NS', 'VOLTAS.NS'],
};

// Test backend connection
export const testBackendConnection = async () => {
  try {
    console.log('Testing backend connection:', PROXY_URL);
    const response = await axios.get(PROXY_URL, { timeout: 5000 });
    console.log('Backend connection test:', response.data);
    return response.data;
  } catch (error) {
    console.error('Backend connection failed:', error.message);
    throw error;
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
    };
    
    const data = USE_PROXY ? response.data : response.data;
    const result = data.chart.result[0];
    const quote = result.indicators.quote[0];
    const meta = result.meta;
    
    return {
      symbol: symbol,
      currentPrice: meta.regularMarketPrice,
      previousClose: meta.previousClose,
      change: meta.regularMarketPrice - meta.previousClose,
      changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
      volume: quote.volume[quote.volume.length - 1],
      timestamps: result.timestamp,
      prices: quote.close,
      high: quote.high,
      low: quote.low,
      open: quote.open,
    };
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error.message);
    return null;
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
    };
    
    const data = response.data.quoteSummary.result[0];
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
    console.error(`Error fetching fundamentals for ${symbol}:`, error.message);
    return null;
  }
};

// Fetch multiple stocks for a sector
export const fetchSectorStocks = async (sector) => {
  console.log('fetchSectorStocks called for:', sector);
  const symbols = SECTORS[sector] || [];
  console.log('Symbols to fetch:', symbols);
  
  if (symbols.length === 0) {
    console.warn('No symbols found for sector:', sector);
    return [];
  }
  
  const promises = symbols.map(async (symbol) => {
    try {
      const quote = await fetchStockQuote(symbol);
      const fundamentals = await fetchFundamentalData(symbol);
      
      if (quote && fundamentals) {
        return {
          ...quote,
          ...fundamentals,
        };
      }
      console.warn(`Missing data for ${symbol}`);
      return null;
    } catch (error) {
      console.error(`Failed to fetch ${symbol}:`, error.message);
      return null;
    }
  });
  
  const results = await Promise.all(promises);
  const validStocks = results.filter(stock => stock !== null);
  console.log(`Successfully fetched ${validStocks.length} out of ${symbols.length} stocks`);
  return validStocks;
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
