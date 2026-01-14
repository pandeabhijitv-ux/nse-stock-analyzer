// Analysis utility - Contains all the logic from mobile app's analysisEngine.js
const { calculateRSI, calculateMACD, calculateBollingerBands, calculateATR, calculateStochastic, detectChartPatterns } = require('./technicalIndicators');

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

  // Extract metrics
  const peRatio = summaryDetail.trailingPE?.raw || null;
  const pegRatio = defaultKeyStats.pegRatio?.raw || null;
  const priceToBook = defaultKeyStats.priceToBook?.raw || null;
  const priceToSales = summaryDetail.priceToSalesTrailing12Months?.raw || null;
  const returnOnEquity = financialData.returnOnEquity?.raw || null;
  const profitMargin = financialData.profitMargins?.raw || null;
  const operatingMargin = financialData.operatingMargins?.raw || null;
  const returnOnAssets = financialData.returnOnAssets?.raw || null;
  const revenueGrowth = financialData.revenueGrowth?.raw || null;
  const earningsGrowth = financialData.earningsGrowth?.raw || null;
  const earningsQuarterlyGrowth = defaultKeyStats.earningsQuarterlyGrowth?.raw || null;
  const debtToEquity = financialData.debtToEquity?.raw || null;
  const currentRatio = financialData.currentRatio?.raw || null;
  const quickRatio = financialData.quickRatio?.raw || null;
  const freeCashflow = financialData.freeCashflow?.raw || null;
  const dividendYield = summaryDetail.dividendYield?.raw || null;
  const payoutRatio = summaryDetail.payoutRatio?.raw || null;

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

// Parse stock data from API responses
const parseStockData = (stockData) => {
  const { symbol, quote, fundamentals } = stockData;
  
  const chart = quote?.chart?.result?.[0];
  const meta = chart?.meta;
  const prices = chart?.indicators?.quote?.[0]?.close || [];
  const timestamps = chart?.timestamp || [];
  
  const fundamental = fundamentals?.quoteSummary?.result?.[0];
  const price = fundamental?.price;
  const summaryDetail = fundamental?.summaryDetail;
  const financialData = fundamental?.financialData;
  const defaultKeyStats = fundamental?.defaultKeyStatistics;

  return {
    symbol,
    name: meta?.longName || symbol.replace('.NS', ''),
    currentPrice: price?.regularMarketPrice?.raw || meta?.regularMarketPrice || 0,
    changePercent: price?.regularMarketChangePercent?.raw || 0,
    change: price?.regularMarketChange?.raw || 0,
    marketCap: summaryDetail?.marketCap?.raw || 0,
    volume: meta?.regularMarketVolume || 0,
    fiftyTwoWeekHigh: summaryDetail?.fiftyTwoWeekHigh?.raw || 0,
    fiftyTwoWeekLow: summaryDetail?.fiftyTwoWeekLow?.raw || 0,
    
    // Prices for technical analysis
    prices: prices.filter(p => p !== null && p !== undefined),
    timestamps,
    
    // Fundamentals
    peRatio: summaryDetail?.trailingPE?.raw || null,
    pegRatio: defaultKeyStats?.pegRatio?.raw || null,
    priceToBook: defaultKeyStats?.priceToBook?.raw || null,
    priceToSales: summaryDetail?.priceToSalesTrailing12Months?.raw || null,
    returnOnEquity: financialData?.returnOnEquity?.raw || null,
    profitMargin: financialData?.profitMargins?.raw || null,
    operatingMargin: financialData?.operatingMargins?.raw || null,
    returnOnAssets: financialData?.returnOnAssets?.raw || null,
    revenueGrowth: financialData?.revenueGrowth?.raw || null,
    earningsGrowth: financialData?.earningsGrowth?.raw || null,
    earningsQuarterlyGrowth: defaultKeyStats?.earningsQuarterlyGrowth?.raw || null,
    debtToEquity: financialData?.debtToEquity?.raw || null,
    currentRatio: financialData?.currentRatio?.raw || null,
    quickRatio: financialData?.quickRatio?.raw || null,
    freeCashflow: financialData?.freeCashflow?.raw || null,
    dividendYield: summaryDetail?.dividendYield?.raw || null,
    payoutRatio: summaryDetail?.payoutRatio?.raw || null,
    
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
      
      stock.technical = { rsi, macd, bollinger, atr, stochastic, patterns };
    }
    
    const fundScore = scoreFundamentals({ fundamentals: stock.fundamentals });
    stock.fundamentalScore = fundScore.fundamentalScore;
    stock.categoryScores = fundScore.categoryScores;
    
    return stock;
  });
  
  // Filter for each category
  const targetOriented = stocksWithTechnical
    .filter(s => s.technical && s.fundamentalScore > 50)
    .sort((a, b) => b.fundamentalScore - a.fundamentalScore)
    .slice(0, 20);
  
  const swing = stocksWithTechnical
    .filter(s => s.technical && s.technical.rsi?.current && 
      ((s.technical.rsi.current > 60 && s.technical.macd?.histogram > 0) ||
       (s.technical.rsi.current < 40 && s.technical.macd?.histogram < 0)))
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 20);
  
  const fundamentallyStrong = stocksWithTechnical
    .filter(s => s.fundamentalScore > 65)
    .sort((a, b) => b.fundamentalScore - a.fundamentalScore)
    .slice(0, 20);
  
  const technicallyStrong = stocksWithTechnical
    .filter(s => s.technical && s.prices.length >= 50 &&
      s.technical.rsi?.current > 50 && s.technical.macd?.histogram > 0)
    .sort((a, b) => (b.technical.rsi.current + b.technical.macd.histogram) - 
                    (a.technical.rsi.current + a.technical.macd.histogram))
    .slice(0, 20);
  
  const hotStocks = stocksWithTechnical
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 20);
  
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
