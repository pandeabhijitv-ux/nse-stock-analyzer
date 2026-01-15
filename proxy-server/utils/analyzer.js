// Analysis utility - Contains all the logic from mobile app's analysisEngine.js
const { calculateRSI, calculateMACD, calculateBollingerBands, calculateATR, calculateStochastic, detectChartPatterns } = require('./technicalIndicators');

// Helper: Calculate average daily price change percentage
const calculateAverageDailyChange = (prices) => {
  if (prices.length < 2) return 0;
  
  let totalChange = 0;
  let count = 0;
  
  for (let i = 1; i < prices.length; i++) {
    const change = Math.abs((prices[i] - prices[i-1]) / prices[i-1] * 100);
    totalChange += change;
    count++;
  }
  
  return count > 0 ? totalChange / count : 0;
};

// Helper: Calculate price volatility (standard deviation of daily changes)
const calculateVolatility = (prices) => {
  if (prices.length < 2) return 0;
  
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push((prices[i] - prices[i-1]) / prices[i-1] * 100);
  }
  
  const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
  const variance = changes.reduce((sum, change) => sum + Math.pow(change - mean, 2), 0) / changes.length;
  return Math.sqrt(variance);
};

// Helper: Add trading days to a date (skip weekends)
const addTradingDays = (startDate, days) => {
  const date = new Date(startDate);
  let addedDays = 0;
  
  while (addedDays < days) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      addedDays++;
    }
  }
  
  return date;
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
          const patterns = detectChartPatterns(stock.prices, stock.high, stock.low);
          
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
    
    // Add fields expected by mobile app
    s.name = s.symbol; // Stock name
    s.change = s.currentPrice * (s.changePercent / 100); // Absolute change
    s.overallScore = s.fundamentalScore || 0; // Overall score
    s.technicalScore = s.technical ? 50 + (s.technical.rsi?.current || 50) / 2 : 0; // Simple technical score
    s.momentumScore = Math.abs(s.changePercent || 0) * 10; // Momentum based on changePercent
    s.fundamentalScores = s.categoryScores || {}; // Category breakdown
    
    // Calculate target price (5% upside for positive movers, current for others)
    if (s.changePercent > 0) {
      s.targetPrice = s.currentPrice * 1.05;
      s.upsidePercent = 5;
    } else {
      s.targetPrice = s.currentPrice;
      s.upsidePercent = 0;
    }
    
    // Calculate tentative target date based on historical volatility and patterns
    if (s.targetPrice && s.currentPrice && s.prices && s.prices.length >= 30) {
      const avgDailyChange = calculateAverageDailyChange(s.prices);
      const volatility = calculateVolatility(s.prices);
      const patterns = s.technical?.patterns || [];
      
      let daysToTarget = 15; // Default 15 trading days (~3 weeks)
      
      // Adjust based on upside percentage
      if (s.upsidePercent > 0) {
        const priceGapPercent = ((s.targetPrice - s.currentPrice) / s.currentPrice) * 100;
        
        // Base calculation: days = price gap / average daily movement
        if (avgDailyChange > 0) {
          daysToTarget = Math.ceil(priceGapPercent / avgDailyChange);
        }
        
        // Adjust for volatility (high volatility = faster movement)
        if (volatility > 3) {
          daysToTarget = Math.floor(daysToTarget * 0.7); // 30% faster
        } else if (volatility < 1) {
          daysToTarget = Math.ceil(daysToTarget * 1.3); // 30% slower
        }
        
        // Adjust for bullish patterns (accelerate timeline)
        const bullishPatterns = patterns.filter(p => p.signal === 'bullish');
        if (bullishPatterns.length >= 2) {
          daysToTarget = Math.floor(daysToTarget * 0.8); // 20% faster with multiple bullish patterns
        } else if (bullishPatterns.length === 1) {
          daysToTarget = Math.floor(daysToTarget * 0.9); // 10% faster with one bullish pattern
        }
        
        // Pattern-specific timeframes (some patterns have known durations)
        const patternName = patterns[0]?.name || '';
        if (patternName.includes('Cup & Handle')) {
          daysToTarget = Math.max(20, Math.min(daysToTarget, 25)); // 20-25 days
        } else if (patternName.includes('Bull Flag')) {
          daysToTarget = Math.max(5, Math.min(daysToTarget, 12)); // 5-12 days
        } else if (patternName.includes('Golden Cross')) {
          daysToTarget = Math.max(15, Math.min(daysToTarget, 30)); // 15-30 days
        } else if (patternName.includes('Triangle')) {
          daysToTarget = Math.max(10, Math.min(daysToTarget, 20)); // 10-20 days
        }
        
        // Bounds: 3 to 60 trading days (1 week to 3 months)
        daysToTarget = Math.max(3, Math.min(daysToTarget, 60));
      }
      
      // Calculate target date (add trading days, skip weekends)
      const targetDate = addTradingDays(new Date(), daysToTarget);
      s.targetDate = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      s.daysToTarget = daysToTarget;
    }
    
    // Extract fundamental fields from fundamentals object for detail screen
    if (s.fundamentals && typeof s.fundamentals === 'object') {
      s.peRatio = s.fundamentals.peRatio || null;
      s.pegRatio = s.fundamentals.forwardPE || null;
      s.profitMargin = s.fundamentals.profitMargin || null;
      s.returnOnEquity = s.fundamentals.roe || null;
      s.debtToEquity = s.fundamentals.debtToEquity || null;
      s.dividendYield = s.fundamentals.dividendYield || null;
      
      // NSE-specific fields
      s.eps = s.fundamentals.eps || null;
      s.bookValue = s.fundamentals.bookValue || null;
      s.faceValue = s.fundamentals.faceValue || null;
      s.week52High = s.fundamentals.week52High || null;
      s.week52Low = s.fundamentals.week52Low || null;
      s.marketCapCr = s.fundamentals.marketCapCr || null;
      s.sectorPE = s.fundamentals.sectorPE || null;
      s.fundamentalSource = s.fundamentals.source || null;
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
