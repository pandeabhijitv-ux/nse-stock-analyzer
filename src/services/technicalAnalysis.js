// Calculate all technical indicators

// Simple Moving Average
export const calculateSMA = (data, period) => {
  const sma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
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
  
  if (currentShort > currentLong) {
    return 'Uptrend';
  } else if (currentShort < currentLong) {
    return 'Downtrend';
  } else {
    return 'Sideways';
  }
};

// Calculate all technical indicators for a stock
export const calculateTechnicalIndicators = (stockData) => {
  const { prices, high, low, volume } = stockData;
  
  if (!prices || prices.length < 50) {
    return null;
  }
  
  const rsi = calculateRSI(prices, 14);
  const macd = calculateMACD(prices);
  const bollingerBands = calculateBollingerBands(prices, 20, 2);
  const atr = calculateATR(high, low, prices, 14);
  const stochastic = calculateStochastic(high, low, prices, 14);
  const supportResistance = calculateSupportResistance(prices, 5);
  const volumeAnalysis = analyzeVolume(volume, 20);
  const trend = detectTrend(prices, 20, 50);
  
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  const sma200 = calculateSMA(prices, 200);
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  return {
    rsi: rsi,
    rsiSignal: rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral',
    
    macd: macd,
    macdSignal: macd.histogram > 0 ? 'Bullish' : 'Bearish',
    
    bollingerBands: bollingerBands,
    bbSignal: prices[prices.length - 1] > bollingerBands.upper ? 'Overbought' : 
              prices[prices.length - 1] < bollingerBands.lower ? 'Oversold' : 'Neutral',
    
    atr: atr,
    
    stochastic: stochastic,
    stochasticSignal: stochastic.k > 80 ? 'Overbought' : stochastic.k < 20 ? 'Oversold' : 'Neutral',
    
    supportResistance: supportResistance,
    
    volumeAnalysis: volumeAnalysis,
    
    trend: trend,
    
    movingAverages: {
      sma20: sma20[sma20.length - 1],
      sma50: sma50[sma50.length - 1],
      sma200: sma200[sma200.length - 1],
      ema12: ema12[ema12.length - 1],
      ema26: ema26[ema26.length - 1],
    },
  };
};
