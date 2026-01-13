// Calculate all technical indicators

// Memoization cache for expensive calculations
const technicalCache = new Map();
const TECH_CACHE_SIZE = 100;

const getTechnicalCacheKey = (symbol, prices) => {
  // Use last price and length as key (fast but effective)
  return `${symbol}_${prices.length}_${prices[prices.length - 1]}`;
};

// Simple Moving Average
export const calculateSMA = (data, period) => {
  // Limit data points for performance (use last 100 days max)
  const limitedData = data.length > 100 ? data.slice(-100) : data;
  const sma = [];
  for (let i = 0; i < limitedData.length; i++) {
    if (i < period - 1) {
      sma.push(null);
    } else {
      const sum = limitedData.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
  }
  return sma;
};

// Exponential Moving Average
export const calculateEMA = (data, period) => {
  const ema = [];
  const multiplier = 2 / (period + 1);
  
  // First EMA is SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  ema[period - 1] = sum / period;
  
  // Calculate rest of EMAs
  for (let i = period; i < data.length; i++) {
    ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
  }
  
  return ema;
};

// Relative Strength Index (RSI)
export const calculateRSI = (prices, period = 14) => {
  const rsi = [];
  const gains = [];
  const losses = [];
  
  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  // Calculate first average gain and loss
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  rsi.push(null); // First value is null
  for (let i = 0; i < period; i++) {
    rsi.push(null);
  }
  
  // Calculate RSI
  for (let i = period; i < gains.length; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
    
    const rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }
  
  return rsi[rsi.length - 1] || 50;
};

// MACD (Moving Average Convergence Divergence)
export const calculateMACD = (prices) => {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  const macdLine = [];
  for (let i = 0; i < prices.length; i++) {
    if (ema12[i] && ema26[i]) {
      macdLine.push(ema12[i] - ema26[i]);
    } else {
      macdLine.push(null);
    }
  }
  
  const validMacd = macdLine.filter(v => v !== null);
  const signalLine = calculateEMA(validMacd, 9);
  
  const macd = macdLine[macdLine.length - 1];
  const signal = signalLine[signalLine.length - 1];
  const histogram = macd - signal;
  
  return {
    macd: macd,
    signal: signal,
    histogram: histogram,
  };
};

// Bollinger Bands
export const calculateBollingerBands = (prices, period = 20, stdDev = 2) => {
  const sma = calculateSMA(prices, period);
  const currentSMA = sma[sma.length - 1];
  
  // Calculate standard deviation
  const recentPrices = prices.slice(-period);
  const squaredDiffs = recentPrices.map(price => Math.pow(price - currentSMA, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const standardDeviation = Math.sqrt(variance);
  
  return {
    upper: currentSMA + (stdDev * standardDeviation),
    middle: currentSMA,
    lower: currentSMA - (stdDev * standardDeviation),
  };
};

// Average True Range (ATR)
export const calculateATR = (high, low, close, period = 14) => {
  const trueRanges = [];
  
  for (let i = 1; i < close.length; i++) {
    const tr1 = high[i] - low[i];
    const tr2 = Math.abs(high[i] - close[i - 1]);
    const tr3 = Math.abs(low[i] - close[i - 1]);
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }
  
  // Calculate ATR as SMA of true ranges
  const recentTR = trueRanges.slice(-period);
  return recentTR.reduce((a, b) => a + b, 0) / period;
};

// Stochastic Oscillator
export const calculateStochastic = (high, low, close, period = 14) => {
  const recentHigh = high.slice(-period);
  const recentLow = low.slice(-period);
  const currentClose = close[close.length - 1];
  
  const highestHigh = Math.max(...recentHigh);
  const lowestLow = Math.min(...recentLow);
  
  const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
  
  return {
    k: k,
    d: k, // Simplified, normally would be SMA of K
  };
};

// Support and Resistance levels
export const calculateSupportResistance = (prices, pivotPeriod = 5) => {
  const highs = [];
  const lows = [];
  
  for (let i = pivotPeriod; i < prices.length - pivotPeriod; i++) {
    const window = prices.slice(i - pivotPeriod, i + pivotPeriod + 1);
    const currentPrice = prices[i];
    
    if (currentPrice === Math.max(...window)) {
      highs.push(currentPrice);
    }
    if (currentPrice === Math.min(...window)) {
      lows.push(currentPrice);
    }
  }
  
  return {
    resistance: highs.length > 0 ? Math.max(...highs) : null,
    support: lows.length > 0 ? Math.min(...lows) : null,
  };
};

// Volume Analysis
export const analyzeVolume = (volumes, period = 20) => {
  const recentVolume = volumes.slice(-period);
  const avgVolume = recentVolume.reduce((a, b) => a + b, 0) / period;
  const currentVolume = volumes[volumes.length - 1];
  
  return {
    averageVolume: avgVolume,
    currentVolume: currentVolume,
    volumeRatio: currentVolume / avgVolume,
    isHighVolume: currentVolume > avgVolume * 1.5,
  };
};

// Trend Detection
export const detectTrend = (prices, shortPeriod = 20, longPeriod = 50) => {
  const shortSMA = calculateSMA(prices, shortPeriod);
  const longSMA = calculateSMA(prices, longPeriod);
  
  const currentShort = shortSMA[shortSMA.length - 1];
  const currentLong = longSMA[longSMA.length - 1];
  const prevShort = shortSMA[shortSMA.length - 2];
  const prevLong = longSMA[longSMA.length - 2];
  
  // Check for golden cross or death cross
  const goldenCross = prevShort <= prevLong && currentShort > currentLong;
  const deathCross = prevShort >= prevLong && currentShort < currentLong;
  
  if (goldenCross) {
    return 'Strong Uptrend';
  } else if (deathCross) {
    return 'Strong Downtrend';
  } else if (currentShort > currentLong) {
    return 'Uptrend';
  } else if (currentShort < currentLong) {
    return 'Downtrend';
  } else {
    return 'Sideways';
  }
};

// Pattern Detection
export const detectPatterns = (prices, high, low) => {
  const patterns = [];
  const len = prices.length;
  
  if (len < 5) return patterns;
  
  // Get recent data
  const recentPrices = prices.slice(-5);
  const recentHigh = high?.slice(-5) || recentPrices;
  const recentLow = low?.slice(-5) || recentPrices;
  
  // Bullish Engulfing
  if (recentPrices[3] > recentPrices[2] && 
      recentPrices[4] > recentPrices[3] &&
      recentPrices[4] > recentPrices[2] * 1.02) {
    patterns.push('Bullish Engulfing');
  }
  
  // Bearish Engulfing
  if (recentPrices[3] < recentPrices[2] && 
      recentPrices[4] < recentPrices[3] &&
      recentPrices[4] < recentPrices[2] * 0.98) {
    patterns.push('Bearish Engulfing');
  }
  
  // Morning Star (Bullish reversal)
  if (recentPrices[0] > recentPrices[1] &&
      recentPrices[1] > recentPrices[2] &&
      recentPrices[3] < recentPrices[2] &&
      recentPrices[4] > recentPrices[1]) {
    patterns.push('Morning Star');
  }
  
  // Evening Star (Bearish reversal)
  if (recentPrices[0] < recentPrices[1] &&
      recentPrices[1] < recentPrices[2] &&
      recentPrices[3] > recentPrices[2] &&
      recentPrices[4] < recentPrices[1]) {
    patterns.push('Evening Star');
  }
  
  // Doji (Indecision)
  const lastPrice = recentPrices[4];
  const lastHigh = recentHigh[4];
  const lastLow = recentLow[4];
  const bodySize = Math.abs(lastPrice - recentPrices[3]);
  const rangeSize = lastHigh - lastLow;
  
  if (rangeSize > 0 && bodySize / rangeSize < 0.1) {
    patterns.push('Doji');
  }
  
  // Hammer (Bullish reversal)
  const lowerWick = lastPrice - lastLow;
  const upperWick = lastHigh - lastPrice;
  if (lowerWick > bodySize * 2 && upperWick < bodySize) {
    patterns.push('Hammer');
  }
  
  // Shooting Star (Bearish reversal)
  if (upperWick > bodySize * 2 && lowerWick < bodySize) {
    patterns.push('Shooting Star');
  }
  
  return patterns.length > 0 ? patterns : ['No Clear Pattern'];
};

// Calculate all technical indicators for a stock
export const calculateTechnicalIndicators = (stockData) => {
  const { symbol, prices, high, low, volume } = stockData;
  
  if (!prices || prices.length < 50) {
    return null;
  }
  
  // Check cache first
  const cacheKey = getTechnicalCacheKey(symbol || 'unknown', prices);
  if (technicalCache.has(cacheKey)) {
    return technicalCache.get(cacheKey);
  }
  
  // Limit data to last 100 points for performance
  const limitedPrices = prices.length > 100 ? prices.slice(-100) : prices;
  const limitedHigh = high && high.length > 100 ? high.slice(-100) : high;
  const limitedLow = low && low.length > 100 ? low.slice(-100) : low;
  const limitedVolume = volume && Array.isArray(volume) && volume.length > 100 ? volume.slice(-100) : volume;
  
  const rsi = calculateRSI(limitedPrices, 14);
  const macd = calculateMACD(limitedPrices);
  const bollingerBands = calculateBollingerBands(limitedPrices, 20, 2);
  const atr = calculateATR(limitedHigh, limitedLow, limitedPrices, 14);
  const stochastic = calculateStochastic(limitedHigh, limitedLow, limitedPrices, 14);
  const supportResistance = calculateSupportResistance(limitedPrices, 5);
  const volumeAnalysis = analyzeVolume(limitedVolume, 20);
  const trend = detectTrend(limitedPrices, 20, 50);
  const patterns = detectPatterns(limitedPrices, limitedHigh, limitedLow);
  
  const sma20 = calculateSMA(limitedPrices, 20);
  const sma50 = calculateSMA(limitedPrices, 50);
  const ema12 = calculateEMA(limitedPrices, 12);
  const ema26 = calculateEMA(limitedPrices, 26);
  
  const result = {
    rsi: rsi,
    rsiSignal: rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral',
    
    macd: macd,
    macdSignal: macd.histogram > 0 ? 'Bullish' : 'Bearish',
    
    bollingerBands: bollingerBands,
    bbSignal: limitedPrices[limitedPrices.length - 1] > bollingerBands.upper ? 'Overbought' : 
              limitedPrices[limitedPrices.length - 1] < bollingerBands.lower ? 'Oversold' : 'Neutral',
    
    atr: atr,
    
    stochastic: stochastic,
    stochasticSignal: stochastic.k > 80 ? 'Overbought' : stochastic.k < 20 ? 'Oversold' : 'Neutral',
    
    supportResistance: supportResistance,
    
    volumeAnalysis: volumeAnalysis,
    
    trend: trend,
    
    patterns: patterns, // Add detected patterns
    
    movingAverages: {
      sma20: sma20[sma20.length - 1],
      sma50: sma50[sma50.length - 1],
      ema12: ema12[ema12.length - 1],
      ema26: ema26[ema26.length - 1],
    },
  };
  
  // Cache the result (limit cache size)
  if (technicalCache.size >= TECH_CACHE_SIZE) {
    const firstKey = technicalCache.keys().next().value;
    technicalCache.delete(firstKey);
  }
  technicalCache.set(cacheKey, result);
  
  return result;
};
