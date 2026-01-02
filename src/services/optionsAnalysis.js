// Options Analysis Service for NSE Stock Analyzer
// Provides Call/Put option recommendations based on technical and market indicators

/**
 * Calculate option parameters and recommendations
 * @param {Object} stockData - Current stock/index data
 * @param {Object} technicalIndicators - RSI, MACD, trend data
 * @param {number} volatilityIndex - India VIX or stock volatility
 * @returns {Object} Options analysis with recommendations
 */
export const analyzeOptions = (stockData, technicalIndicators, volatilityIndex) => {
  const { currentPrice, rsi, macd, ema50, ema200, trend } = stockData;
  const { score } = technicalIndicators;
  
  // Determine market direction
  const marketDirection = determineMarketDirection(rsi, macd, ema50, ema200, trend, score);
  
  // Calculate optimal strike prices
  const strikes = calculateStrikePrices(currentPrice, marketDirection);
  
  // Determine expiration recommendations
  const expiration = recommendExpiration(volatilityIndex, trend);
  
  // Calculate risk-reward metrics
  const riskReward = calculateRiskReward(currentPrice, strikes, volatilityIndex);
  
  return {
    recommendation: marketDirection.recommendation,
    confidence: marketDirection.confidence,
    strikePrice: strikes,
    expiration: expiration,
    volatility: {
      current: volatilityIndex,
      level: getVolatilityLevel(volatilityIndex),
      impact: getVolatilityImpact(volatilityIndex)
    },
    premium: estimatePremium(currentPrice, strikes, volatilityIndex, expiration),
    greeks: calculateGreeks(currentPrice, strikes.recommended, volatilityIndex, expiration),
    riskReward: riskReward,
    strategy: recommendStrategy(marketDirection, volatilityIndex, riskReward)
  };
};

/**
 * Determine market direction based on technical indicators
 */
const determineMarketDirection = (rsi, macd, ema50, ema200, trend, score) => {
  let bullishSignals = 0;
  let bearishSignals = 0;
  
  // RSI Analysis
  if (rsi < 30) bullishSignals += 2; // Oversold - bullish
  else if (rsi > 70) bearishSignals += 2; // Overbought - bearish
  else if (rsi >= 50 && rsi <= 60) bullishSignals += 1; // Moderate bullish
  else if (rsi >= 40 && rsi < 50) bearishSignals += 1; // Moderate bearish
  
  // MACD Analysis
  if (macd && macd.histogram > 0) bullishSignals += 2;
  else if (macd && macd.histogram < 0) bearishSignals += 2;
  
  // EMA Trend
  if (ema50 > ema200) bullishSignals += 2; // Golden cross
  else if (ema50 < ema200) bearishSignals += 2; // Death cross
  
  // Overall Score
  if (score >= 70) bullishSignals += 2;
  else if (score <= 40) bearishSignals += 2;
  
  // Determine recommendation
  const totalSignals = bullishSignals + bearishSignals;
  const bullishPercentage = totalSignals > 0 ? (bullishSignals / totalSignals) * 100 : 50;
  
  let recommendation, confidence, optionType;
  
  if (bullishPercentage >= 70) {
    recommendation = 'BULLISH';
    optionType = 'CALL';
    confidence = Math.min(95, bullishPercentage);
  } else if (bullishPercentage <= 30) {
    recommendation = 'BEARISH';
    optionType = 'PUT';
    confidence = Math.min(95, 100 - bullishPercentage);
  } else {
    recommendation = 'NEUTRAL';
    optionType = 'STRADDLE';
    confidence = 50;
  }
  
  return {
    recommendation,
    optionType,
    confidence,
    bullishSignals,
    bearishSignals,
    analysis: `${bullishSignals} bullish signals, ${bearishSignals} bearish signals`
  };
};

/**
 * Calculate optimal strike prices
 */
const calculateStrikePrices = (currentPrice, marketDirection) => {
  const { optionType } = marketDirection;
  
  // Round to nearest 50 for better liquidity
  const roundToStrike = (price) => Math.round(price / 50) * 50;
  
  let atm = roundToStrike(currentPrice);
  let itm, otm;
  
  if (optionType === 'CALL') {
    // For CALL options
    itm = roundToStrike(currentPrice * 0.97); // 3% ITM
    otm = roundToStrike(currentPrice * 1.03); // 3% OTM
  } else if (optionType === 'PUT') {
    // For PUT options
    itm = roundToStrike(currentPrice * 1.03); // 3% ITM
    otm = roundToStrike(currentPrice * 0.97); // 3% OTM
  } else {
    // Neutral - use ATM
    itm = atm;
    otm = atm;
  }
  
  return {
    itm: itm, // In-The-Money
    atm: atm, // At-The-Money
    otm: otm, // Out-Of-The-Money
    recommended: marketDirection.confidence > 60 ? otm : atm,
    explanation: getStrikeExplanation(optionType, itm, atm, otm)
  };
};

/**
 * Get strike price explanation
 */
const getStrikeExplanation = (optionType, itm, atm, otm) => {
  if (optionType === 'CALL') {
    return `ITM (₹${itm}): Higher premium, more intrinsic value. ATM (₹${atm}): Balanced risk-reward. OTM (₹${otm}): Lower premium, higher potential return.`;
  } else if (optionType === 'PUT') {
    return `ITM (₹${itm}): Higher premium, more intrinsic value. ATM (₹${atm}): Balanced risk-reward. OTM (₹${otm}): Lower premium, higher potential return.`;
  } else {
    return `ATM (₹${atm}): Best for neutral strategies like straddles.`;
  }
};

/**
 * Recommend expiration date
 */
const recommendExpiration = (volatilityIndex, trend) => {
  // Options in India expire on last Thursday of month
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Calculate next expiry (last Thursday)
  const nextExpiry = getLastThursday(currentYear, currentMonth);
  const monthlyExpiry = getLastThursday(currentYear, currentMonth + 1);
  const quarterlyExpiry = getLastThursday(currentYear, currentMonth + 3);
  
  // Days to expiry
  const daysToNextExpiry = Math.ceil((nextExpiry - today) / (1000 * 60 * 60 * 24));
  const daysToMonthly = Math.ceil((monthlyExpiry - today) / (1000 * 60 * 60 * 24));
  
  let recommended;
  if (volatilityIndex > 25 || trend === 'strong') {
    // High volatility or strong trend - use near-term expiry
    recommended = 'NEAR';
  } else {
    // Low volatility - give more time
    recommended = 'MONTHLY';
  }
  
  return {
    nearTerm: {
      date: nextExpiry.toLocaleDateString('en-IN'),
      days: daysToNextExpiry,
      type: 'Weekly/Near'
    },
    monthly: {
      date: monthlyExpiry.toLocaleDateString('en-IN'),
      days: daysToMonthly,
      type: 'Monthly'
    },
    recommended: recommended,
    explanation: recommended === 'NEAR' 
      ? `Near-term expiry recommended due to ${volatilityIndex > 25 ? 'high volatility' : 'strong trend'}`
      : 'Monthly expiry recommended for more time value'
  };
};

/**
 * Get last Thursday of month
 */
const getLastThursday = (year, month) => {
  const lastDay = new Date(year, month + 1, 0);
  const day = lastDay.getDay();
  const diff = day >= 4 ? day - 4 : 7 - (4 - day);
  return new Date(year, month, lastDay.getDate() - diff);
};

/**
 * Estimate option premium
 */
const estimatePremium = (spotPrice, strikes, volatilityIndex, expiration) => {
  // Simplified Black-Scholes approximation
  const timeValue = expiration.nearTerm.days / 365;
  const volatility = volatilityIndex / 100;
  
  const calculatePremium = (strike, isCall) => {
    const intrinsicValue = isCall 
      ? Math.max(0, spotPrice - strike)
      : Math.max(0, strike - spotPrice);
    
    const extrinsicValue = spotPrice * volatility * Math.sqrt(timeValue) * 0.4;
    
    return Math.round(intrinsicValue + extrinsicValue);
  };
  
  return {
    call: {
      itm: calculatePremium(strikes.itm, true),
      atm: calculatePremium(strikes.atm, true),
      otm: calculatePremium(strikes.otm, true)
    },
    put: {
      itm: calculatePremium(strikes.itm, false),
      atm: calculatePremium(strikes.atm, false),
      otm: calculatePremium(strikes.otm, false)
    }
  };
};

/**
 * Calculate option Greeks (simplified)
 */
const calculateGreeks = (spotPrice, strikePrice, volatility, expiration) => {
  const timeToExpiry = expiration.nearTerm.days / 365;
  const vol = volatility / 100;
  
  // Simplified calculations
  const delta = spotPrice > strikePrice ? 0.6 : 0.4;
  const gamma = 0.05;
  const theta = -0.02; // Time decay per day
  const vega = spotPrice * Math.sqrt(timeToExpiry) * 0.01;
  
  return {
    delta: delta.toFixed(2),
    gamma: gamma.toFixed(3),
    theta: theta.toFixed(2),
    vega: vega.toFixed(2),
    explanation: {
      delta: `Rate of change: ${delta > 0.5 ? 'High' : 'Moderate'} sensitivity to price movement`,
      theta: `Time decay: Losing ₹${Math.abs(theta).toFixed(2)} per day`,
      vega: `Volatility impact: ₹${vega.toFixed(2)} per 1% volatility change`
    }
  };
};

/**
 * Calculate risk-reward metrics
 */
const calculateRiskReward = (spotPrice, strikes, volatilityIndex) => {
  const potentialMove = spotPrice * (volatilityIndex / 100) * 0.5; // Expected move
  
  return {
    maxRisk: 'Premium paid (100% loss possible)',
    maxReward: 'Unlimited (for calls) / Limited to strike price (for puts)',
    breakeven: {
      call: strikes.recommended + (spotPrice * 0.02),
      put: strikes.recommended - (spotPrice * 0.02)
    },
    expectedMove: Math.round(potentialMove),
    riskRewardRatio: volatilityIndex > 20 ? 'Favorable' : 'Moderate'
  };
};

/**
 * Recommend options strategy
 */
const recommendStrategy = (marketDirection, volatilityIndex, riskReward) => {
  const { optionType, confidence } = marketDirection;
  
  let strategy, description;
  
  if (confidence >= 70) {
    // Strong directional view
    if (optionType === 'CALL') {
      strategy = 'Long Call';
      description = 'Buy OTM call for maximum leverage with limited risk';
    } else if (optionType === 'PUT') {
      strategy = 'Long Put';
      description = 'Buy OTM put to profit from expected decline';
    }
  } else if (confidence < 50 && volatilityIndex > 25) {
    // High volatility, no clear direction
    strategy = 'Long Straddle';
    description = 'Buy ATM call and put to profit from big move in either direction';
  } else if (confidence < 50 && volatilityIndex <= 25) {
    // Low volatility, no clear direction
    strategy = 'Short Strangle';
    description = 'Sell OTM call and put to collect premium in range-bound market';
  } else {
    // Moderate conviction
    strategy = optionType === 'CALL' ? 'Bull Call Spread' : 'Bear Put Spread';
    description = 'Reduce premium cost by selling higher/lower strike option';
  }
  
  return {
    strategy,
    description,
    suitability: getSuitability(strategy, volatilityIndex),
    riskLevel: getRiskLevel(strategy)
  };
};

/**
 * Get volatility level description
 */
const getVolatilityLevel = (vix) => {
  if (vix < 15) return 'Low';
  if (vix < 25) return 'Normal';
  if (vix < 35) return 'High';
  return 'Very High';
};

/**
 * Get volatility impact
 */
const getVolatilityImpact = (vix) => {
  if (vix < 15) return 'Option premiums are relatively cheap. Good for buying options.';
  if (vix < 25) return 'Normal volatility. Balanced premium levels.';
  if (vix < 35) return 'High volatility. Premiums are expensive. Consider selling strategies.';
  return 'Very high volatility. Extreme premium levels. Use caution.';
};

/**
 * Get strategy suitability
 */
const getSuitability = (strategy, volatility) => {
  const map = {
    'Long Call': volatility < 25 ? 'Good' : 'Moderate',
    'Long Put': volatility < 25 ? 'Good' : 'Moderate',
    'Long Straddle': volatility > 25 ? 'Excellent' : 'Poor',
    'Short Strangle': volatility < 20 ? 'Excellent' : 'Risky',
    'Bull Call Spread': 'Good for moderate bullish views',
    'Bear Put Spread': 'Good for moderate bearish views'
  };
  return map[strategy] || 'Moderate';
};

/**
 * Get risk level
 */
const getRiskLevel = (strategy) => {
  const map = {
    'Long Call': 'Limited Risk (Premium)',
    'Long Put': 'Limited Risk (Premium)',
    'Long Straddle': 'High Premium Cost',
    'Short Strangle': 'Unlimited Risk',
    'Bull Call Spread': 'Limited Risk',
    'Bear Put Spread': 'Limited Risk'
  };
  return map[strategy] || 'Moderate';
};

/**
 * Get India VIX (Volatility Index) - Mock for now
 * In production, fetch from NSE API
 */
export const getIndiaVIX = async () => {
  // Mock value - in production, fetch from NSE
  return Math.random() * 30 + 10; // Random between 10-40
};

/**
 * Analyze Nifty options specifically
 */
export const analyzeNiftyOptions = async (niftyData, technicalIndicators) => {
  const vix = await getIndiaVIX();
  const analysis = analyzeOptions(niftyData, technicalIndicators, vix);
  
  return {
    ...analysis,
    underlying: 'NIFTY 50',
    lotSize: 50, // Nifty lot size
    marginRequired: estimateMargin(niftyData.currentPrice, analysis.strikePrice.recommended),
    contractValue: niftyData.currentPrice * 50
  };
};

/**
 * Estimate margin required
 */
const estimateMargin = (spotPrice, strikePrice) => {
  // SPAN margin approximation
  const spanMargin = spotPrice * 0.10; // ~10% of spot
  const exposureMargin = spotPrice * 0.05; // ~5% of spot
  
  return Math.round(spanMargin + exposureMargin);
};
