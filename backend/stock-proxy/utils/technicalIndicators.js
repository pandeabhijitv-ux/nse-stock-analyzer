// Technical indicators calculations for backend

const calculateSMA = (data, period) => {
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

const calculateEMA = (data, period) => {
  const ema = [];
  const multiplier = 2 / (period + 1);
  
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  ema[period - 1] = sum / period;
  
  for (let i = period; i < data.length; i++) {
    ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
  }
  
  return ema;
};

const calculateRSI = (prices, period = 14) => {
  if (prices.length < period + 1) return { current: 50, signal: 'neutral' };
  
  const gains = [];
  const losses = [];
  
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < gains.length; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
  }
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  let signal = 'neutral';
  if (rsi > 70) signal = 'overbought';
  else if (rsi < 30) signal = 'oversold';
  else if (rsi > 50) signal = 'bullish';
  else signal = 'bearish';
  
  return { current: rsi, signal };
};

const calculateMACD = (prices) => {
  if (prices.length < 26) return { macd: 0, signal: 0, histogram: 0 };
  
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  const macdLine = [];
  for (let i = 0; i < prices.length; i++) {
    if (ema12[i] && ema26[i]) {
      macdLine.push(ema12[i] - ema26[i]);
    }
  }
  
  const validMacd = macdLine.filter(v => v !== null && v !== undefined);
  if (validMacd.length < 9) return { macd: 0, signal: 0, histogram: 0 };
  
  const signalLine = calculateEMA(validMacd, 9);
  
  const macd = macdLine[macdLine.length - 1] || 0;
  const signal = signalLine[signalLine.length - 1] || 0;
  const histogram = macd - signal;
  
  return { macd, signal, histogram };
};

const calculateBollingerBands = (prices, period = 20, stdDev = 2) => {
  if (prices.length < period) return { upper: 0, middle: 0, lower: 0 };
  
  const sma = calculateSMA(prices, period);
  const currentSMA = sma[sma.length - 1];
  
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

const calculateATR = (prices, period = 14) => {
  if (prices.length < period + 1) return 0;
  
  const trueRanges = [];
  for (let i = 1; i < prices.length; i++) {
    const high = prices[i];
    const low = prices[i];
    const prevClose = prices[i - 1];
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }
  
  const recentTR = trueRanges.slice(-period);
  return recentTR.reduce((a, b) => a + b, 0) / period;
};

const calculateStochastic = (prices, period = 14) => {
  if (prices.length < period) return { k: 50, d: 50 };
  
  const recentPrices = prices.slice(-period);
  const highestHigh = Math.max(...recentPrices);
  const lowestLow = Math.min(...recentPrices);
  const currentClose = prices[prices.length - 1];
  
  const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
  
  return { k, d: k };
};

const detectChartPatterns = (prices) => {
  if (prices.length < 50) return [];
  
  const patterns = [];
  const recentPrices = prices.slice(-50);
  const currentPrice = prices[prices.length - 1];
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  
  // Golden Cross
  if (sma20[sma20.length - 1] > sma50[sma50.length - 1] && 
      sma20[sma20.length - 2] <= sma50[sma50.length - 2]) {
    patterns.push({ name: 'Golden Cross', signal: 'bullish' });
  }
  
  // Death Cross
  if (sma20[sma20.length - 1] < sma50[sma50.length - 1] && 
      sma20[sma20.length - 2] >= sma50[sma50.length - 2]) {
    patterns.push({ name: 'Death Cross', signal: 'bearish' });
  }
  
  // Breakout
  const recentHigh = Math.max(...recentPrices.slice(0, -1));
  if (currentPrice > recentHigh * 1.02) {
    patterns.push({ name: 'Breakout', signal: 'bullish' });
  }
  
  // Breakdown
  const recentLow = Math.min(...recentPrices.slice(0, -1));
  if (currentPrice < recentLow * 0.98) {
    patterns.push({ name: 'Breakdown', signal: 'bearish' });
  }
  
  return patterns;
};

module.exports = {
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
  calculateStochastic,
  detectChartPatterns,
  calculateSMA,
  calculateEMA
};
