// Fundamental Analysis and Scoring

// Score fundamental metrics (0-100 scale)
export const scoreFundamentals = (stock) => {
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
  
  // Valuation Scores
  if (stock.peRatio !== null) {
    // Lower P/E is better (under 20 is good, under 15 is excellent)
    if (stock.peRatio < 15) scores.valuation += 30;
    else if (stock.peRatio < 20) scores.valuation += 20;
    else if (stock.peRatio < 30) scores.valuation += 10;
    weights.valuation += 30;
  }
  
  if (stock.pegRatio !== null) {
    // PEG under 1 is excellent, under 2 is good
    if (stock.pegRatio < 1) scores.valuation += 25;
    else if (stock.pegRatio < 2) scores.valuation += 15;
    else if (stock.pegRatio < 3) scores.valuation += 5;
    weights.valuation += 25;
  }
  
  if (stock.priceToBook !== null) {
    // P/B under 3 is generally good
    if (stock.priceToBook < 1) scores.valuation += 25;
    else if (stock.priceToBook < 3) scores.valuation += 15;
    else if (stock.priceToBook < 5) scores.valuation += 5;
    weights.valuation += 25;
  }
  
  if (stock.priceToSales !== null) {
    // P/S under 2 is good
    if (stock.priceToSales < 1) scores.valuation += 20;
    else if (stock.priceToSales < 2) scores.valuation += 12;
    else if (stock.priceToSales < 4) scores.valuation += 5;
    weights.valuation += 20;
  }
  
  // Profitability Scores
  if (stock.returnOnEquity !== null) {
    // ROE above 15% is good, above 20% is excellent
    const roePercent = stock.returnOnEquity * 100;
    if (roePercent > 20) scores.profitability += 30;
    else if (roePercent > 15) scores.profitability += 20;
    else if (roePercent > 10) scores.profitability += 10;
    weights.profitability += 30;
  }
  
  if (stock.profitMargin !== null) {
    // Profit margin above 15% is good
    const marginPercent = stock.profitMargin * 100;
    if (marginPercent > 20) scores.profitability += 25;
    else if (marginPercent > 15) scores.profitability += 18;
    else if (marginPercent > 10) scores.profitability += 10;
    weights.profitability += 25;
  }
  
  if (stock.operatingMargin !== null) {
    // Operating margin above 15% is good
    const opMarginPercent = stock.operatingMargin * 100;
    if (opMarginPercent > 20) scores.profitability += 25;
    else if (opMarginPercent > 15) scores.profitability += 18;
    else if (opMarginPercent > 10) scores.profitability += 10;
    weights.profitability += 25;
  }
  
  if (stock.returnOnAssets !== null) {
    // ROA above 8% is good
    const roaPercent = stock.returnOnAssets * 100;
    if (roaPercent > 10) scores.profitability += 20;
    else if (roaPercent > 8) scores.profitability += 15;
    else if (roaPercent > 5) scores.profitability += 8;
    weights.profitability += 20;
  }
  
  // Growth Scores
  if (stock.revenueGrowth !== null) {
    // Revenue growth above 10% is good
    const revenueGrowthPercent = stock.revenueGrowth * 100;
    if (revenueGrowthPercent > 20) scores.growth += 35;
    else if (revenueGrowthPercent > 10) scores.growth += 25;
    else if (revenueGrowthPercent > 5) scores.growth += 15;
    else if (revenueGrowthPercent > 0) scores.growth += 5;
    weights.growth += 35;
  }
  
  if (stock.earningsGrowth !== null) {
    // Earnings growth above 15% is excellent
    const earningsGrowthPercent = stock.earningsGrowth * 100;
    if (earningsGrowthPercent > 25) scores.growth += 35;
    else if (earningsGrowthPercent > 15) scores.growth += 25;
    else if (earningsGrowthPercent > 10) scores.growth += 15;
    else if (earningsGrowthPercent > 0) scores.growth += 5;
    weights.growth += 35;
  }
  
  if (stock.earningsQuarterlyGrowth !== null) {
    const qGrowthPercent = stock.earningsQuarterlyGrowth * 100;
    if (qGrowthPercent > 20) scores.growth += 30;
    else if (qGrowthPercent > 10) scores.growth += 20;
    else if (qGrowthPercent > 5) scores.growth += 10;
    weights.growth += 30;
  }
  
  // Financial Health Scores
  if (stock.debtToEquity !== null) {
    // Lower debt-to-equity is better (under 0.5 is excellent)
    if (stock.debtToEquity < 0.5) scores.financialHealth += 25;
    else if (stock.debtToEquity < 1) scores.financialHealth += 18;
    else if (stock.debtToEquity < 2) scores.financialHealth += 10;
    else if (stock.debtToEquity < 3) scores.financialHealth += 5;
    weights.financialHealth += 25;
  }
  
  if (stock.currentRatio !== null) {
    // Current ratio above 1.5 is good
    if (stock.currentRatio > 2) scores.financialHealth += 25;
    else if (stock.currentRatio > 1.5) scores.financialHealth += 18;
    else if (stock.currentRatio > 1) scores.financialHealth += 10;
    weights.financialHealth += 25;
  }
  
  if (stock.quickRatio !== null) {
    // Quick ratio above 1 is good
    if (stock.quickRatio > 1.5) scores.financialHealth += 20;
    else if (stock.quickRatio > 1) scores.financialHealth += 15;
    else if (stock.quickRatio > 0.8) scores.financialHealth += 8;
    weights.financialHealth += 20;
  }
  
  if (stock.freeCashflow !== null && stock.freeCashflow > 0) {
    scores.financialHealth += 30;
    weights.financialHealth += 30;
  } else if (stock.freeCashflow !== null) {
    weights.financialHealth += 30;
  }
  
  // Dividend Scores
  if (stock.dividendYield !== null) {
    const yieldPercent = stock.dividendYield * 100;
    if (yieldPercent > 3) scores.dividend += 40;
    else if (yieldPercent > 2) scores.dividend += 30;
    else if (yieldPercent > 1) scores.dividend += 20;
    else if (yieldPercent > 0) scores.dividend += 10;
    weights.dividend += 40;
  } else {
    // No dividend is not necessarily bad for growth stocks
    scores.dividend += 10;
    weights.dividend += 40;
  }
  
  if (stock.payoutRatio !== null) {
    const payoutPercent = stock.payoutRatio * 100;
    // Payout ratio between 30-60% is ideal
    if (payoutPercent > 30 && payoutPercent < 60) scores.dividend += 30;
    else if (payoutPercent < 80) scores.dividend += 20;
    else if (payoutPercent < 100) scores.dividend += 10;
    weights.dividend += 30;
  }
  
  // Normalize scores
  const normalizedScores = {};
  for (let key in scores) {
    normalizedScores[key] = weights[key] > 0 ? (scores[key] / weights[key]) * 100 : 50;
  }
  
  return normalizedScores;
};

// Score technical indicators
export const scoreTechnical = (technical) => {
  if (!technical) return { overall: 50, details: {} };
  
  let scores = {
    momentum: 0,
    trend: 0,
    volatility: 0,
    volume: 0,
  };
  
  // Momentum scoring (RSI, Stochastic, MACD)
  if (technical.rsi !== null) {
    if (technical.rsi > 30 && technical.rsi < 70) scores.momentum += 35; // Neutral is good
    else if (technical.rsi < 30) scores.momentum += 25; // Oversold - buying opportunity
    else scores.momentum += 15; // Overbought - risky
  }
  
  if (technical.stochastic) {
    if (technical.stochastic.k > 20 && technical.stochastic.k < 80) scores.momentum += 30;
    else if (technical.stochastic.k < 20) scores.momentum += 25;
    else scores.momentum += 15;
  }
  
  if (technical.macd && technical.macd.histogram > 0) {
    scores.momentum += 35; // Bullish
  } else {
    scores.momentum += 15;
  }
  
  // Trend scoring
  if (technical.trend === 'Uptrend') {
    scores.trend += 60;
  } else if (technical.trend === 'Sideways') {
    scores.trend += 40;
  } else {
    scores.trend += 20;
  }
  
  // Moving average alignment
  const ma = technical.movingAverages;
  if (ma.sma20 && ma.sma50 && ma.sma200) {
    if (ma.sma20 > ma.sma50 && ma.sma50 > ma.sma200) {
      scores.trend += 40; // Perfect bullish alignment
    } else if (ma.sma20 > ma.sma50) {
      scores.trend += 30;
    } else if (ma.sma20 > ma.sma200) {
      scores.trend += 20;
    }
  }
  
  // Volatility scoring (Lower volatility = better for conservative investors)
  if (technical.bollingerBands) {
    const currentPrice = technical.bollingerBands.middle;
    const bandwidth = (technical.bollingerBands.upper - technical.bollingerBands.lower) / currentPrice;
    
    if (bandwidth < 0.1) scores.volatility += 40; // Low volatility
    else if (bandwidth < 0.15) scores.volatility += 30;
    else if (bandwidth < 0.2) scores.volatility += 20;
    else scores.volatility += 10; // High volatility
  }
  
  if (technical.atr) {
    // Lower ATR is better (less volatile)
    scores.volatility += 30; // Simplified - would need price context
  }
  
  // Volume scoring
  if (technical.volumeAnalysis) {
    if (technical.volumeAnalysis.volumeRatio > 1.5) {
      scores.volume += 40; // High interest
    } else if (technical.volumeAnalysis.volumeRatio > 1) {
      scores.volume += 30;
    } else if (technical.volumeAnalysis.volumeRatio > 0.8) {
      scores.volume += 25;
    } else {
      scores.volume += 15; // Low volume
    }
  }
  
  return {
    momentum: scores.momentum,
    trend: scores.trend,
    volatility: scores.volatility,
    volume: scores.volume,
    overall: (scores.momentum + scores.trend + scores.volatility + scores.volume) / 4,
  };
};

// Calculate overall stock score
export const calculateOverallScore = (fundamentalScores, technicalScore, weights = null) => {
  const defaultWeights = {
    valuation: 0.20,
    profitability: 0.20,
    growth: 0.20,
    financialHealth: 0.15,
    dividend: 0.10,
    technical: 0.15,
  };
  
  const w = weights || defaultWeights;
  
  const score = 
    (fundamentalScores.valuation * w.valuation) +
    (fundamentalScores.profitability * w.profitability) +
    (fundamentalScores.growth * w.growth) +
    (fundamentalScores.financialHealth * w.financialHealth) +
    (fundamentalScores.dividend * w.dividend) +
    (technicalScore.overall * w.technical);
  
  return Math.round(score);
};

// Generate recommendation
export const generateRecommendation = (overallScore, fundamentalScores, technicalScore, stock) => {
  let recommendation = '';
  let action = '';
  let reasons = [];
  
  if (overallScore >= 75) {
    action = 'Strong Buy';
    recommendation = 'This stock shows excellent fundamentals and technical indicators.';
  } else if (overallScore >= 60) {
    action = 'Buy';
    recommendation = 'This stock has good potential with solid metrics.';
  } else if (overallScore >= 45) {
    action = 'Hold';
    recommendation = 'This stock has mixed signals. Consider holding if already owned.';
  } else if (overallScore >= 30) {
    action = 'Sell';
    recommendation = 'This stock shows concerning metrics. Consider reducing exposure.';
  } else {
    action = 'Strong Sell';
    recommendation = 'This stock has poor fundamentals and/or technical indicators.';
  }
  
  // Add specific reasons
  if (fundamentalScores.growth > 70) reasons.push('Strong growth trajectory');
  if (fundamentalScores.profitability > 70) reasons.push('Excellent profitability');
  if (fundamentalScores.valuation > 70) reasons.push('Attractive valuation');
  if (fundamentalScores.financialHealth > 70) reasons.push('Solid financial health');
  if (technicalScore.trend > 70) reasons.push('Strong uptrend');
  if (technicalScore.momentum > 70) reasons.push('Positive momentum');
  
  if (fundamentalScores.growth < 30) reasons.push('Weak growth');
  if (fundamentalScores.profitability < 30) reasons.push('Low profitability');
  if (fundamentalScores.valuation < 30) reasons.push('Overvalued');
  if (fundamentalScores.financialHealth < 30) reasons.push('Concerning debt levels');
  if (technicalScore.trend < 30) reasons.push('Downtrend');
  
  // Risk assessment
  let riskLevel = 'Medium';
  if (stock.beta !== null) {
    if (stock.beta > 1.5) riskLevel = 'High';
    else if (stock.beta < 0.8) riskLevel = 'Low';
  }
  
  return {
    action: action,
    recommendation: recommendation,
    reasons: reasons,
    riskLevel: riskLevel,
    score: overallScore,
  };
};
