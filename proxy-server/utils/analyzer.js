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
  
  const fundamentals = stock.fundamentals;
  if (!fundamentals || Object.keys(fundamentals).length === 0) {
    return { fundamentalScore: 0, categoryScores: scores };
  }

  // Extract metrics directly from the fundamentals object
  const peRatio = fundamentals.peRatio;
  const forwardPE = fundamentals.forwardPE;
  const profitMargin = fundamentals.profitMargin;
  const returnOnEquity = fundamentals.roe;
  const returnOnAssets = fundamentals.roa;
  const debtToEquity = fundamentals.debtToEquity;
  const currentRatio = fundamentals.currentRatio;
  const revenueGrowth = fundamentals.revenueGrowth;
  const earningsGrowth = fundamentals.earningsGrowth;
  const dividendYield = fundamentals.dividendYield;
  const beta = fundamentals.beta;

  // Valuation Scores
  if (peRatio !== null && peRatio !== undefined) {
    if (peRatio < 15) scores.valuation += 30;
    else if (peRatio < 20) scores.valuation += 20;
    else if (peRatio < 30) scores.valuation += 10;
    else if (peRatio < 50) scores.valuation += 5;
    weights.valuation += 30;
  }
  
  if (forwardPE !== null && forwardPE !== undefined) {
    if (forwardPE < 15) scores.valuation += 25;
    else if (forwardPE < 20) scores.valuation += 15;
    else if (forwardPE < 30) scores.valuation += 5;
    weights.valuation += 25;
  }
  
  // Profitability Scores
  if (returnOnEquity !== null && returnOnEquity !== undefined) {
    const roePercent = returnOnEquity * 100;
    if (roePercent > 20) scores.profitability += 35;
    else if (roePercent > 15) scores.profitability += 25;
    else if (roePercent > 10) scores.profitability += 15;
    else if (roePercent > 5) scores.profitability += 5;
    weights.profitability += 35;
  }
  
  if (profitMargin !== null && profitMargin !== undefined) {
    const marginPercent = profitMargin * 100;
    if (marginPercent > 20) scores.profitability += 35;
    else if (marginPercent > 15) scores.profitability += 25;
    else if (marginPercent > 10) scores.profitability += 15;
    else if (marginPercent > 5) scores.profitability += 5;
    weights.profitability += 35;
  }
  
  if (returnOnAssets !== null && returnOnAssets !== undefined) {
    const roaPercent = returnOnAssets * 100;
    if (roaPercent > 10) scores.profitability += 30;
    else if (roaPercent > 5) scores.profitability += 20;
    else if (roaPercent > 2) scores.profitability += 10;
    weights.profitability += 30;
  }
  
  // Growth Scores
  if (revenueGrowth !== null && revenueGrowth !== undefined) {
    const revenueGrowthPercent = revenueGrowth * 100;
    if (revenueGrowthPercent > 20) scores.growth += 35;
    else if (revenueGrowthPercent > 10) scores.growth += 25;
    else if (revenueGrowthPercent > 5) scores.growth += 15;
    else if (revenueGrowthPercent > 0) scores.growth += 5;
    weights.growth += 35;
  }
  
  if (earningsGrowth !== null && earningsGrowth !== undefined) {
    const earningsGrowthPercent = earningsGrowth * 100;
    if (earningsGrowthPercent > 25) scores.growth += 35;
    else if (earningsGrowthPercent > 15) scores.growth += 25;
    else if (earningsGrowthPercent > 10) scores.growth += 15;
    else if (earningsGrowthPercent > 0) scores.growth += 5;
    weights.growth += 35;
  }
  
  // Financial Health Scores
  if (debtToEquity !== null && debtToEquity !== undefined) {
    if (debtToEquity < 0.5) scores.financialHealth += 35;
    else if (debtToEquity < 1) scores.financialHealth += 25;
    else if (debtToEquity < 2) scores.financialHealth += 15;
    else if (debtToEquity < 3) scores.financialHealth += 5;
    weights.financialHealth += 35;
  }
  
  if (currentRatio !== null && currentRatio !== undefined) {
    if (currentRatio > 2) scores.financialHealth += 35;
    else if (currentRatio > 1.5) scores.financialHealth += 25;
    else if (currentRatio > 1) scores.financialHealth += 15;
    weights.financialHealth += 35;
  }
  
  if (beta !== null && beta !== undefined) {
    if (beta < 0.8) scores.financialHealth += 30;
    else if (beta < 1.2) scores.financialHealth += 20;
    else if (beta < 1.5) scores.financialHealth += 10;
    weights.financialHealth += 30;
  }
  
  // Dividend Scores
  if (dividendYield !== null && dividendYield !== undefined && dividendYield > 0) {
    const yieldPercent = dividendYield * 100;
    if (yieldPercent > 4) scores.dividend += 50;
    else if (yieldPercent > 2) scores.dividend += 35;
    else if (yieldPercent > 1) scores.dividend += 20;
    weights.dividend += 50;
  }
  
  // Calculate final weighted score
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const category in scores) {
    if (weights[category] > 0) {
      totalScore += (scores[category] / weights[category]) * 100;
      totalWeight += 100;
    }
  }
  
  const fundamentalScore = totalWeight > 0 ? Math.round(totalScore / (totalWeight / 100)) : 0;
  
  return { fundamentalScore, categoryScores: scores };
};

// Analyze all categories
const analyzeAllCategories = async (stocksData) => {
  // Calculate technical indicators for all stocks
  const stocksWithTechnical = stocksData.map(stock => {
    if (stock.prices && stock.prices.length >= 50) {
      const rsi = calculateRSI(stock.prices);
      const macd = calculateMACD(stock.prices);
      const bollinger = calculateBollingerBands(stock.prices);
      const atr = calculateATR(stock.prices);
      const stochastic = calculateStochastic(stock.prices);
      const patterns = detectChartPatterns(stock.prices);
      
      stock.technical = { rsi, macd, bollinger, atr, stochastic, patterns };
    }
    
    // Calculate fundamental score - pass stock object directly
    const fundScore = scoreFundamentals(stock);
    stock.fundamentalScore = fundScore.fundamentalScore;
    stock.categoryScores = fundScore.categoryScores;
    
    // DEBUG: Log RELIANCE fundamental scoring
    if (stock.symbol === 'RELIANCE.NS') {
      console.log('[DEBUG] RELIANCE.NS fundamental scoring:');
      console.log('[DEBUG] - Has fundamentals object?', !!stock.fundamentals);
      console.log('[DEBUG] - Fundamentals keys:', Object.keys(stock.fundamentals || {}));
      console.log('[DEBUG] - fundamentalScore:', stock.fundamentalScore);
      console.log('[DEBUG] - categoryScores:', JSON.stringify(stock.categoryScores));
    }
    
    return stock;
  });
  
  // Strip .NS suffix from symbols for cleaner display
  stocksWithTechnical.forEach(s => {
    if (s.symbol && s.symbol.endsWith('.NS')) {
      s.symbol = s.symbol.replace('.NS', '');
    }
  });
  
  console.log(`[ANALYZER] Total stocks with technical data: ${stocksWithTechnical.length}`);
  console.log(`[ANALYZER] Sample stock:`, stocksWithTechnical[0] ? {
    symbol: stocksWithTechnical[0].symbol,
    hasTechnical: !!stocksWithTechnical[0].technical,
    hasRSI: !!stocksWithTechnical[0].technical?.rsi,
    rsiValue: stocksWithTechnical[0].technical?.rsi?.current,
    fundScore: stocksWithTechnical[0].fundamentalScore,
    changePercent: stocksWithTechnical[0].changePercent
  } : 'No stocks');
  
  // Filter for each category - VERY RELAXED filters to ensure stocks are returned
  const targetOriented = stocksWithTechnical
    .filter(s => s.technical && (s.fundamentalScore || 0) > 0) // ANY fundamental score
    .sort((a, b) => (b.fundamentalScore || 0) - (a.fundamentalScore || 0))
    .slice(0, 20);
  
  const swing = stocksWithTechnical
    .filter(s => s.technical && Math.abs(s.changePercent || 0) > 0.1) // ANY movement >0.1%
    .sort((a, b) => Math.abs(b.changePercent || 0) - Math.abs(a.changePercent || 0))
    .slice(0, 20);
  
  const fundamentallyStrong = stocksWithTechnical
    .filter(s => (s.fundamentalScore || 0) > 0) // ANY score
    .sort((a, b) => (b.fundamentalScore || 0) - (a.fundamentalScore || 0))
    .slice(0, 20);
  
  const technicallyStrong = stocksWithTechnical
    .filter(s => s.technical && s.prices && s.prices.length >= 20) // Just need price history
    .sort((a, b) => ((b.technical?.rsi?.current || 50) + (b.technical?.macd?.histogram || 0)) - 
                    ((a.technical?.rsi?.current || 50) + (a.technical?.macd?.histogram || 0)))
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
