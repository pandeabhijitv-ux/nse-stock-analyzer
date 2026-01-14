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
  
  try {
    const fundamentals = stock.fundamentals;
    if (!fundamentals || typeof fundamentals !== 'object' || Object.keys(fundamentals).length === 0) {
      return { fundamentalScore: 0, categoryScores: scores };
    }

    // Extract metrics directly from the fundamentals object (all with safety checks)
    const peRatio = typeof fundamentals.peRatio === 'number' ? fundamentals.peRatio : null;
    const forwardPE = typeof fundamentals.forwardPE === 'number' ? fundamentals.forwardPE : null;
    const profitMargin = typeof fundamentals.profitMargin === 'number' ? fundamentals.profitMargin : null;
    const returnOnEquity = typeof fundamentals.roe === 'number' ? fundamentals.roe : null;
    const returnOnAssets = typeof fundamentals.roa === 'number' ? fundamentals.roa : null;
    const debtToEquity = typeof fundamentals.debtToEquity === 'number' ? fundamentals.debtToEquity : null;
    const currentRatio = typeof fundamentals.currentRatio === 'number' ? fundamentals.currentRatio : null;
    const revenueGrowth = typeof fundamentals.revenueGrowth === 'number' ? fundamentals.revenueGrowth : null;
    const earningsGrowth = typeof fundamentals.earningsGrowth === 'number' ? fundamentals.earningsGrowth : null;
    const dividendYield = typeof fundamentals.dividendYield === 'number' ? fundamentals.dividendYield : null;
    const beta = typeof fundamentals.beta === 'number' ? fundamentals.beta : null;

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
  } catch (error) {
    console.error('[ERROR] scoreFundamentals failed:', error.message);
    return { fundamentalScore: 0, categoryScores: scores };
  }
};

// Analyze all categories
const analyzeAllCategories = async (stocksData) => {
  // Calculate technical indicators for all stocks
  const stocksWithTechnical = stocksData.map(stock => {
    try {
      // Calculate technical indicators if enough price data
      if (stock.prices && Array.isArray(stock.prices) && stock.prices.length >= 50) {
        try {
          const rsi = calculateRSI(stock.prices);
          const macd = calculateMACD(stock.prices);
          const bollinger = calculateBollingerBands(stock.prices);
          const atr = calculateATR(stock.prices);
          const stochastic = calculateStochastic(stock.prices);
          const patterns = detectChartPatterns(stock.prices);
          
          stock.technical = { rsi, macd, bollinger, atr, stochastic, patterns };
        } catch (techError) {
          console.error(`[ERROR] Technical calculation failed for ${stock.symbol}:`, techError.message);
          stock.technical = null;
        }
      }
      
      // Calculate fundamental score - pass stock object directly
      try {
        const fundScore = scoreFundamentals(stock);
        stock.fundamentalScore = fundScore.fundamentalScore || 0;
        stock.categoryScores = fundScore.categoryScores || {};
        
        // DEBUG: Log RELIANCE fundamental scoring
        if (stock.symbol === 'RELIANCE.NS') {
          console.log('[DEBUG] RELIANCE.NS fundamental scoring:');
          console.log('[DEBUG] - Has fundamentals object?', !!stock.fundamentals);
          console.log('[DEBUG] - Fundamentals keys:', Object.keys(stock.fundamentals || {}));
          console.log('[DEBUG] - fundamentalScore:', stock.fundamentalScore);
          console.log('[DEBUG] - categoryScores:', JSON.stringify(stock.categoryScores));
        }
      } catch (fundError) {
        console.error(`[ERROR] Fundamental scoring failed for ${stock.symbol}:`, fundError.message);
        stock.fundamentalScore = 0;
        stock.categoryScores = {};
      }
      
      return stock;
    } catch (error) {
      console.error(`[ERROR] Stock processing failed for ${stock.symbol}:`, error.message);
      // Return stock with minimal data to prevent complete failure
      stock.fundamentalScore = 0;
      stock.categoryScores = {};
      stock.technical = null;
      return stock;
    }
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
    .filter(s => s.technical && s.volume > 500000) // Has technical data and decent volume
    .sort((a, b) => {
      // Sort by combination of fundamentalScore (if available) and positive price change
      const scoreA = (a.fundamentalScore || 0) + (a.changePercent > 0 ? a.changePercent * 2 : 0);
      const scoreB = (b.fundamentalScore || 0) + (b.changePercent > 0 ? b.changePercent * 2 : 0);
      return scoreB - scoreA;
    })
    .slice(0, 20);
  
  const swing = stocksWithTechnical
    .filter(s => s.technical && Math.abs(s.changePercent || 0) > 0.1) // ANY movement >0.1%
    .sort((a, b) => Math.abs(b.changePercent || 0) - Math.abs(a.changePercent || 0))
    .slice(0, 20);
  
  const fundamentallyStrong = stocksWithTechnical
    .filter(s => s.currentPrice > 0 && s.volume > 1000000) // Active stocks with good volume
    .sort((a, b) => {
      // If fundamental scores exist, use them; otherwise sort by volume (liquidity proxy)
      if ((a.fundamentalScore || 0) > 0 || (b.fundamentalScore || 0) > 0) {
        return (b.fundamentalScore || 0) - (a.fundamentalScore || 0);
      }
      // Higher volume = more liquid = typically stronger stocks
      return (b.volume || 0) - (a.volume || 0);
    })
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
      totalStocks: stocksWithTechnical.length,
      stocksWithTechnical: stocksWithTechnical.filter(s => s.technical).length,
      timestamp: new Date().toISOString()
    }
  };
};

module.exports = {
  scoreFundamentals,
  analyzeAllCategories
};
