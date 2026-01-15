// Analysis utility - Contains all the logic from mobile app's analysisEngine.js
const { calculateRSI, calculateMACD, calculateBollingerBands, calculateATR, calculateStochastic, detectChartPatterns, calculateSMA, calculateEMA } = require('./technicalIndicators');

// Helper to extract values from both yahoo-finance2 format (plain number) and original Yahoo API format ({raw, fmt})
const getValue = (field) => {
  if (field === null || field === undefined) return null;
  // yahoo-finance2 returns plain numbers/strings
  if (typeof field === 'number' || typeof field === 'string') return field;
  // Original Yahoo API returns {raw: value, fmt: string}
  return field.raw !== undefined ? field.raw : field;
};

// Score fundamental metrics (0-100 scale)
const scoreFundamentals = (stock) => {
  let scores = {
    valuation: 0,
    profitability: 0,
    growth: 0,
    financialHealth: 0,
    dividend: 0,
  };
  
  let weights = {
    valuation: 0,
    profitability: 0,
    growth: 0,
    financialHealth: 0,
    dividend: 0,
  };
  
  const fundamental = stock.fundamentals?.quoteSummary?.result?.[0];
  if (!fundamental) return { fundamentalScore: 0, categoryScores: scores };

  const defaultKeyStats = fundamental.defaultKeyStatistics || {};
  const financialData = fundamental.financialData || {};
  const summaryDetail = fundamental.summaryDetail || {};

  // Extract metrics - handle both yahoo-finance2 (plain values) and original Yahoo API ({raw, fmt}) formats
  const peRatio = getValue(summaryDetail.trailingPE);
  const pegRatio = getValue(defaultKeyStats.pegRatio);
  const priceToBook = getValue(defaultKeyStats.priceToBook);
  const priceToSales = getValue(summaryDetail.priceToSalesTrailing12Months);
  const returnOnEquity = getValue(financialData.returnOnEquity);
  const profitMargin = getValue(financialData.profitMargins);
  const operatingMargin = getValue(financialData.operatingMargins);
  const returnOnAssets = getValue(financialData.returnOnAssets);
  const revenueGrowth = getValue(financialData.revenueGrowth);
  const earningsGrowth = getValue(financialData.earningsGrowth);
  const earningsQuarterlyGrowth = getValue(defaultKeyStats.earningsQuarterlyGrowth);
  const debtToEquity = getValue(financialData.debtToEquity);
  const currentRatio = getValue(financialData.currentRatio);
  const quickRatio = getValue(financialData.quickRatio);
  const freeCashflow = getValue(financialData.freeCashflow);
  const dividendYield = getValue(summaryDetail.dividendYield);
  const payoutRatio = getValue(summaryDetail.payoutRatio);

  // Valuation Scores
  if (peRatio !== null) {
    if (peRatio < 15) scores.valuation += 30;
    else if (peRatio < 20) scores.valuation += 20;
    else if (peRatio < 30) scores.valuation += 10;
    weights.valuation += 30;
  }
  
  if (pegRatio !== null) {
    if (pegRatio < 1) scores.valuation += 25;
    else if (pegRatio < 2) scores.valuation += 15;
    else if (pegRatio < 3) scores.valuation += 5;
    weights.valuation += 25;
  }
  
  if (priceToBook !== null) {
    if (priceToBook < 1) scores.valuation += 25;
    else if (priceToBook < 3) scores.valuation += 15;
    else if (priceToBook < 5) scores.valuation += 5;
    weights.valuation += 25;
  }
  
  if (priceToSales !== null) {
    if (priceToSales < 1) scores.valuation += 20;
    else if (priceToSales < 2) scores.valuation += 12;
    else if (priceToSales < 4) scores.valuation += 5;
    weights.valuation += 20;
  }
  
  // Profitability Scores
  if (returnOnEquity !== null) {
    const roePercent = returnOnEquity * 100;
    if (roePercent > 20) scores.profitability += 30;
    else if (roePercent > 15) scores.profitability += 20;
    else if (roePercent > 10) scores.profitability += 10;
    weights.profitability += 30;
  }
  
  if (profitMargin !== null) {
    const marginPercent = profitMargin * 100;
    if (marginPercent > 20) scores.profitability += 25;
    else if (marginPercent > 15) scores.profitability += 18;
    else if (marginPercent > 10) scores.profitability += 10;
    weights.profitability += 25;
  }
  
  if (operatingMargin !== null) {
    const opMarginPercent = operatingMargin * 100;
    if (opMarginPercent > 20) scores.profitability += 25;
    else if (opMarginPercent > 15) scores.profitability += 18;
    else if (opMarginPercent > 10) scores.profitability += 10;
    weights.profitability += 25;
  }
  
  if (returnOnAssets !== null) {
    const roaPercent = returnOnAssets * 100;
    if (roaPercent > 10) scores.profitability += 20;
    else if (roaPercent > 8) scores.profitability += 15;
    else if (roaPercent > 5) scores.profitability += 8;
    weights.profitability += 20;
  }
  
  // Growth Scores
  if (revenueGrowth !== null) {
    const revenueGrowthPercent = revenueGrowth * 100;
    if (revenueGrowthPercent > 20) scores.growth += 35;
    else if (revenueGrowthPercent > 10) scores.growth += 25;
    else if (revenueGrowthPercent > 5) scores.growth += 15;
    else if (revenueGrowthPercent > 0) scores.growth += 5;
    weights.growth += 35;
  }
  
  if (earningsGrowth !== null) {
    const earningsGrowthPercent = earningsGrowth * 100;
    if (earningsGrowthPercent > 25) scores.growth += 35;
    else if (earningsGrowthPercent > 15) scores.growth += 25;
    else if (earningsGrowthPercent > 10) scores.growth += 15;
    else if (earningsGrowthPercent > 0) scores.growth += 5;
    weights.growth += 35;
  }
  
  if (earningsQuarterlyGrowth !== null) {
    const qGrowthPercent = earningsQuarterlyGrowth * 100;
    if (qGrowthPercent > 20) scores.growth += 30;
    else if (qGrowthPercent > 10) scores.growth += 20;
    else if (qGrowthPercent > 5) scores.growth += 10;
    weights.growth += 30;
  }
  
  // Financial Health Scores
  if (debtToEquity !== null) {
    if (debtToEquity < 0.5) scores.financialHealth += 25;
    else if (debtToEquity < 1) scores.financialHealth += 18;
    else if (debtToEquity < 2) scores.financialHealth += 10;
    else if (debtToEquity < 3) scores.financialHealth += 5;
    weights.financialHealth += 25;
  }
  
  if (currentRatio !== null) {
    if (currentRatio > 2) scores.financialHealth += 25;
    else if (currentRatio > 1.5) scores.financialHealth += 18;
    else if (currentRatio > 1) scores.financialHealth += 10;
    weights.financialHealth += 25;
  }
  
  if (quickRatio !== null) {
    if (quickRatio > 1.5) scores.financialHealth += 20;
    else if (quickRatio > 1) scores.financialHealth += 15;
    else if (quickRatio > 0.8) scores.financialHealth += 8;
    weights.financialHealth += 20;
  }
  
  if (freeCashflow !== null && freeCashflow > 0) {
    scores.financialHealth += 30;
    weights.financialHealth += 30;
  } else if (freeCashflow !== null) {
    weights.financialHealth += 30;
  }
  
  // Dividend Scores
  if (dividendYield !== null && dividendYield > 0) {
    const yieldPercent = dividendYield * 100;
    if (yieldPercent > 4) scores.dividend += 40;
    else if (yieldPercent > 2) scores.dividend += 30;
    else if (yieldPercent > 1) scores.dividend += 15;
    weights.dividend += 40;
  }
  
  if (payoutRatio !== null && payoutRatio > 0) {
    const payoutPercent = payoutRatio * 100;
    if (payoutPercent < 60 && payoutPercent > 30) scores.dividend += 30;
    else if (payoutPercent < 80) scores.dividend += 20;
    else if (payoutPercent > 0) scores.dividend += 10;
    weights.dividend += 30;
  }
  
  // Calculate weighted scores
  const categoryScores = {};
  Object.keys(scores).forEach(key => {
    categoryScores[key] = weights[key] > 0 ? (scores[key] / weights[key]) * 100 : 0;
  });
  
  // Overall fundamental score
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const fundamentalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
  
  return { fundamentalScore, categoryScores };
};

// Parse stock data from API responses (yahoo-finance2 format)
const parseStockData = (stockData) => {
  const { symbol, quote, fundamentals } = stockData;
  
  // yahoo-finance2 chart format: {quotes: [{close, high, low, open, volume, date}], meta: {}}
  const chart = quote?.chart?.result?.[0]; // Original Yahoo API format
  const quotes = quote?.quotes || chart?.indicators?.quote?.[0]; // yahoo-finance2 or original format
  const meta = quote?.meta || chart?.meta;
  
  // Extract prices from yahoo-finance2 format OR original Yahoo API format
  let prices = [];
  let timestamps = [];
  if (quotes && Array.isArray(quotes)) {
    // yahoo-finance2 format: array of objects with {close, date}
    prices = quotes.map(q => q?.close).filter(p => p !== null && p !== undefined);
    timestamps = quotes.map(q => q?.date ? Math.floor(q.date.getTime() / 1000) : null).filter(t => t !== null);
  } else if (quotes?.close) {
    // Original Yahoo API format: {close: []}
    prices = (quotes.close || []).filter(p => p !== null && p !== undefined);
    timestamps = chart?.timestamp || [];
  }
  
  const fundamental = fundamentals?.quoteSummary?.result?.[0];
  const price = fundamental?.price;
  const summaryDetail = fundamental?.summaryDetail;
  const financialData = fundamental?.financialData;
  const defaultKeyStats = fundamental?.defaultKeyStatistics;

  return {
    symbol,
    name: getValue(meta?.longName) || symbol.replace('.NS', ''),
    currentPrice: getValue(price?.regularMarketPrice) || getValue(meta?.regularMarketPrice) || 0,
    changePercent: getValue(price?.regularMarketChangePercent) || 0,
    change: getValue(price?.regularMarketChange) || 0,
    marketCap: getValue(summaryDetail?.marketCap) || 0,
    volume: getValue(meta?.regularMarketVolume) || 0,
    fiftyTwoWeekHigh: getValue(summaryDetail?.fiftyTwoWeekHigh) || 0,
    fiftyTwoWeekLow: getValue(summaryDetail?.fiftyTwoWeekLow) || 0,
    
    // Prices for technical analysis
    prices: prices.filter(p => p !== null && p !== undefined),
    timestamps,
    
    // Fundamentals
    peRatio: getValue(summaryDetail?.trailingPE),
    pegRatio: getValue(defaultKeyStats?.pegRatio),
    priceToBook: getValue(defaultKeyStats?.priceToBook),
    priceToSales: getValue(summaryDetail?.priceToSalesTrailing12Months),
    returnOnEquity: getValue(financialData?.returnOnEquity),
    profitMargin: getValue(financialData?.profitMargins),
    operatingMargin: getValue(financialData?.operatingMargins),
    returnOnAssets: getValue(financialData?.returnOnAssets),
    revenueGrowth: getValue(financialData?.revenueGrowth),
    earningsGrowth: getValue(financialData?.earningsGrowth),
    earningsQuarterlyGrowth: getValue(defaultKeyStats?.earningsQuarterlyGrowth),
    debtToEquity: getValue(financialData?.debtToEquity),
    currentRatio: getValue(financialData?.currentRatio),
    quickRatio: getValue(financialData?.quickRatio),
    freeCashflow: getValue(financialData?.freeCashflow),
    dividendYield: getValue(summaryDetail?.dividendYield),
    payoutRatio: getValue(summaryDetail?.payoutRatio),
    
    // Store raw data for detailed views
    quote,
    fundamentals
  };
};

// Analyze all categories
const analyzeAllCategories = async (stocksData) => {
  const parsedStocks = stocksData.map(parseStockData);
  
  // Calculate technical indicators for all stocks
  const stocksWithTechnical = parsedStocks.map(stock => {
    if (stock.prices.length >= 50) {
      const rsi = calculateRSI(stock.prices);
      const macd = calculateMACD(stock.prices);
      const bollinger = calculateBollingerBands(stock.prices);
      const atr = calculateATR(stock.prices);
      const stochastic = calculateStochastic(stock.prices);
      const patterns = detectChartPatterns(stock.prices);
      
      // Calculate moving averages
      const sma20Array = calculateSMA(stock.prices, 20);
      const sma50Array = calculateSMA(stock.prices, 50);
      const sma200Array = calculateSMA(stock.prices, 200);
      const ema12Array = calculateEMA(stock.prices, 12);
      const ema26Array = calculateEMA(stock.prices, 26);
      
      const movingAverages = {
        sma20: sma20Array[sma20Array.length - 1] || null,
        sma50: sma50Array[sma50Array.length - 1] || null,
        sma200: sma200Array[sma200Array.length - 1] || null,
        ema12: ema12Array[ema12Array.length - 1] || null,
        ema26: ema26Array[ema26Array.length - 1] || null,
      };
      
      // Determine trend
      const currentPrice = stock.prices[stock.prices.length - 1];
      let trend = 'Neutral';
      if (movingAverages.sma20 && movingAverages.sma50) {
        if (currentPrice > movingAverages.sma20 && movingAverages.sma20 > movingAverages.sma50) {
          trend = 'Strong Uptrend';
        } else if (currentPrice > movingAverages.sma50) {
          trend = 'Uptrend';
        } else if (currentPrice < movingAverages.sma20 && movingAverages.sma20 < movingAverages.sma50) {
          trend = 'Strong Downtrend';
        } else if (currentPrice < movingAverages.sma50) {
          trend = 'Downtrend';
        }
      }
      
      // Calculate support and resistance
      const recentPrices = stock.prices.slice(-20);
      const supportResistance = {
        resistance: Math.max(...recentPrices),
        support: Math.min(...recentPrices),
      };
      
      // Volume analysis
      const volumeAnalysis = {
        currentVolume: stock.volume,
        avgVolume: stock.avgVolume10Day || stock.volume,
        relativeVolume: stock.avgVolume10Day ? (stock.volume / stock.avgVolume10Day).toFixed(2) : 1,
      };
      
      // Add stochastic signal
      stochastic.signal = stochastic.k > 80 ? 'overbought' : stochastic.k < 20 ? 'oversold' : 'neutral';
      
      stock.technical = { 
        rsi, 
        macd, 
        bollinger, 
        atr, 
        stochastic, 
        patterns,
        movingAverages,
        trend,
        supportResistance,
        volumeAnalysis
      };
    }
    
    const fundScore = scoreFundamentals({ fundamentals: stock.fundamentals });
    stock.fundamentalScore = fundScore.fundamentalScore;
    stock.categoryScores = fundScore.categoryScores;
    
    return stock;
  });
  
  // Filter for each category and sort by BEST TO WORST (highest scores first)
  // Analyze ALL stocks but return only TOP 5-10 for better user experience
  const targetOriented = stocksWithTechnical
    .filter(s => s.technical && s.fundamentalScore > 0) // Any fundamental score
    .sort((a, b) => b.fundamentalScore - a.fundamentalScore) // Best fundamental score first
    .slice(0, 10); // Top 10 best fundamentals
  
  const swing = stocksWithTechnical
    .filter(s => s.technical && s.technical.rsi?.current && 
      ((s.technical.rsi.current > 60 && s.technical.macd?.histogram > 0) ||
       (s.technical.rsi.current < 40 && s.technical.macd?.histogram < 0)))
    .sort((a, b) => {
      // Sort by best swing potential: RSI momentum + MACD strength
      const aScore = Math.abs(a.technical.rsi.current - 50) + Math.abs(a.technical.macd.histogram * 10);
      const bScore = Math.abs(b.technical.rsi.current - 50) + Math.abs(b.technical.macd.histogram * 10);
      return bScore - aScore; // Best swing momentum first
    })
    .slice(0, 8); // Top 8 best swing opportunities
  
  const fundamentallyStrong = stocksWithTechnical
    .filter(s => s.fundamentalScore > 0) // Any fundamental score
    .sort((a, b) => b.fundamentalScore - a.fundamentalScore) // Best fundamental score first
    .slice(0, 10); // Top 10 strongest fundamentals
  
  const technicallyStrong = stocksWithTechnical
    .filter(s => s.technical && s.prices.length >= 50 &&
      s.technical.rsi?.current > 50 && s.technical.macd?.histogram > 0)
    .sort((a, b) => {
      // Sort by best technical strength: RSI + MACD combined
      const aScore = a.technical.rsi.current + (a.technical.macd.histogram * 10);
      const bScore = b.technical.rsi.current + (b.technical.macd.histogram * 10);
      return bScore - aScore; // Best technical indicators first
    })
    .slice(0, 10); // Top 10 best technical indicators
  
  const hotStocks = stocksWithTechnical
    .filter(s => s.currentPrice > 0) // Must have price data
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)) // Highest movers first (even if 0)
    .slice(0, 10); // Top 10
  
  // Placeholder for other categories
  const grahaGochar = []; // Astrological analysis
  const etf = []; // ETF specific
  const mutualFunds = []; // Mutual fund stocks
  
  return {
    targetOriented,
    swing,
    fundamentallyStrong,
    technicallyStrong,
    hotStocks,
    grahaGochar,
    etf,
    mutualFunds,
    metadata: {
      totalStocks: parsedStocks.length,
      stocksWithTechnical: stocksWithTechnical.filter(s => s.technical).length,
      timestamp: new Date().toISOString()
    }
  };
};

module.exports = {
  scoreFundamentals,
  parseStockData,
  analyzeAllCategories
};
