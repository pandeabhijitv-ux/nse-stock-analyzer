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

const detectChartPatterns = (prices, highs = [], lows = []) => {
  if (prices.length < 50) return [];
  
  const patterns = [];
  const recentPrices = prices.slice(-50);
  const currentPrice = prices[prices.length - 1];
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  
  // Use provided highs/lows or fallback to prices
  const recentHighs = highs.length >= 50 ? highs.slice(-50) : recentPrices;
  const recentLows = lows.length >= 50 ? lows.slice(-50) : recentPrices;
  
  // === MOVING AVERAGE PATTERNS ===
  
  // Golden Cross (Bullish)
  if (sma20[sma20.length - 1] > sma50[sma50.length - 1] && 
      sma20[sma20.length - 2] <= sma50[sma50.length - 2]) {
    patterns.push({ name: 'Golden Cross', signal: 'bullish', reliability: 85 });
  }
  
  // Death Cross (Bearish)
  if (sma20[sma20.length - 1] < sma50[sma50.length - 1] && 
      sma20[sma20.length - 2] >= sma50[sma50.length - 2]) {
    patterns.push({ name: 'Death Cross', signal: 'bearish', reliability: 85 });
  }
  
  // === BREAKOUT/BREAKDOWN PATTERNS ===
  
  // Breakout (Bullish)
  const recentHigh = Math.max(...recentPrices.slice(0, -1));
  if (currentPrice > recentHigh * 1.02) {
    patterns.push({ name: 'Breakout', signal: 'bullish', reliability: 75 });
  }
  
  // Breakdown (Bearish)
  const recentLow = Math.min(...recentPrices.slice(0, -1));
  if (currentPrice < recentLow * 0.98) {
    patterns.push({ name: 'Breakdown', signal: 'bearish', reliability: 75 });
  }
  
  // === HEAD & SHOULDERS PATTERNS ===
  
  // Simplified Head & Shoulders detection (last 30 days)
  if (prices.length >= 30) {
    const segment = prices.slice(-30);
    const mid = Math.floor(segment.length / 2);
    
    // Left shoulder, head, right shoulder peaks
    const leftPeak = Math.max(...segment.slice(0, 10));
    const headPeak = Math.max(...segment.slice(10, 20));
    const rightPeak = Math.max(...segment.slice(20, 30));
    
    // Head & Shoulders (Bearish) - Head higher than shoulders
    if (headPeak > leftPeak * 1.03 && headPeak > rightPeak * 1.03 && 
        Math.abs(leftPeak - rightPeak) < leftPeak * 0.05) {
      patterns.push({ name: 'Head & Shoulders', signal: 'bearish', reliability: 80 });
    }
    
    // Inverse Head & Shoulders (Bullish) - valleys instead of peaks
    const leftValley = Math.min(...segment.slice(0, 10));
    const headValley = Math.min(...segment.slice(10, 20));
    const rightValley = Math.min(...segment.slice(20, 30));
    
    if (headValley < leftValley * 0.97 && headValley < rightValley * 0.97 && 
        Math.abs(leftValley - rightValley) < leftValley * 0.05) {
      patterns.push({ name: 'Inverse Head & Shoulders', signal: 'bullish', reliability: 80 });
    }
  }
  
  // === TRIANGLE PATTERNS ===
  
  if (prices.length >= 20) {
    const last20 = prices.slice(-20);
    const highs20 = recentHighs.slice(-20);
    const lows20 = recentLows.slice(-20);
    
    // Calculate trend lines
    const highTrend = (Math.max(...highs20.slice(-5)) - Math.max(...highs20.slice(0, 5))) / Math.max(...highs20.slice(0, 5));
    const lowTrend = (Math.min(...lows20.slice(-5)) - Math.min(...lows20.slice(0, 5))) / Math.min(...lows20.slice(0, 5));
    
    // Ascending Triangle (Bullish) - flat top, rising bottom
    if (Math.abs(highTrend) < 0.02 && lowTrend > 0.03) {
      patterns.push({ name: 'Ascending Triangle', signal: 'bullish', reliability: 75 });
    }
    
    // Descending Triangle (Bearish) - flat bottom, falling top
    if (Math.abs(lowTrend) < 0.02 && highTrend < -0.03) {
      patterns.push({ name: 'Descending Triangle', signal: 'bearish', reliability: 75 });
    }
    
    // Symmetrical Triangle (Neutral) - converging lines
    if (highTrend < -0.02 && lowTrend > 0.02) {
      patterns.push({ name: 'Symmetrical Triangle', signal: 'neutral', reliability: 70 });
    }
  }
  
  // === FLAG & PENNANT PATTERNS ===
  
  if (prices.length >= 15) {
    const last15 = prices.slice(-15);
    const strongMove = prices.slice(-20, -15);
    
    // Bull Flag - Strong upward move followed by slight downward consolidation
    const poleGain = (Math.max(...strongMove) - Math.min(...strongMove)) / Math.min(...strongMove);
    const flagSlope = (last15[last15.length - 1] - last15[0]) / last15[0];
    
    if (poleGain > 0.05 && flagSlope > -0.03 && flagSlope < 0.01) {
      patterns.push({ name: 'Bull Flag', signal: 'bullish', reliability: 80 });
    }
    
    // Bear Flag - Strong downward move followed by slight upward consolidation
    const poleDrop = (Math.min(...strongMove) - Math.max(...strongMove)) / Math.max(...strongMove);
    if (poleDrop < -0.05 && flagSlope > -0.01 && flagSlope < 0.03) {
      patterns.push({ name: 'Bear Flag', signal: 'bearish', reliability: 80 });
    }
  }
  
  // === WEDGE PATTERNS ===
  
  if (prices.length >= 25) {
    const last25 = prices.slice(-25);
    const highs25 = recentHighs.slice(-25);
    const lows25 = recentLows.slice(-25);
    
    // Rising Wedge (Bearish) - Both lines rising but converging
    const recentHighSlope = (Math.max(...highs25.slice(-8)) - Math.max(...highs25.slice(0, 8))) / Math.max(...highs25.slice(0, 8));
    const recentLowSlope = (Math.min(...lows25.slice(-8)) - Math.min(...lows25.slice(0, 8))) / Math.min(...lows25.slice(0, 8));
    
    if (recentHighSlope > 0.02 && recentLowSlope > recentHighSlope * 1.5) {
      patterns.push({ name: 'Rising Wedge', signal: 'bearish', reliability: 75 });
    }
    
    // Falling Wedge (Bullish) - Both lines falling but converging
    if (recentHighSlope < -0.02 && recentLowSlope < recentHighSlope * 1.5 && recentLowSlope < -0.01) {
      patterns.push({ name: 'Falling Wedge', signal: 'bullish', reliability: 75 });
    }
  }
  
  // === DOUBLE TOP/BOTTOM PATTERNS ===
  
  if (prices.length >= 40) {
    const last40 = prices.slice(-40);
    const highs40 = recentHighs.slice(-40);
    const lows40 = recentLows.slice(-40);
    
    // Double Top (Bearish) - Two peaks at similar levels
    const peak1 = Math.max(...highs40.slice(0, 20));
    const peak2 = Math.max(...highs40.slice(20, 40));
    const peak1Idx = highs40.slice(0, 20).indexOf(peak1);
    const peak2Idx = 20 + highs40.slice(20, 40).indexOf(peak2);
    
    if (Math.abs(peak1 - peak2) < peak1 * 0.03 && (peak2Idx - peak1Idx) > 10) {
      patterns.push({ name: 'Double Top', signal: 'bearish', reliability: 78 });
    }
    
    // Double Bottom (Bullish) - Two valleys at similar levels
    const valley1 = Math.min(...lows40.slice(0, 20));
    const valley2 = Math.min(...lows40.slice(20, 40));
    const valley1Idx = lows40.slice(0, 20).indexOf(valley1);
    const valley2Idx = 20 + lows40.slice(20, 40).indexOf(valley2);
    
    if (Math.abs(valley1 - valley2) < valley1 * 0.03 && (valley2Idx - valley1Idx) > 10) {
      patterns.push({ name: 'Double Bottom', signal: 'bullish', reliability: 78 });
    }
  }
  
  // === CUP & HANDLE PATTERN ===
  
  if (prices.length >= 50) {
    const last50 = prices.slice(-50);
    const cupStart = last50[0];
    const cupBottom = Math.min(...last50.slice(10, 30));
    const cupEnd = last50[30];
    const handleEnd = last50[last50.length - 1];
    
    // Cup: U-shaped recovery, Handle: slight pullback
    const cupDepth = (cupStart - cupBottom) / cupStart;
    const cupRecovery = (cupEnd - cupBottom) / cupBottom;
    const handlePullback = (cupEnd - handleEnd) / cupEnd;
    
    if (cupDepth > 0.1 && cupDepth < 0.3 && cupRecovery > 0.08 && 
        handlePullback > 0.01 && handlePullback < 0.08) {
      patterns.push({ name: 'Cup & Handle', signal: 'bullish', reliability: 82 });
    }
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
