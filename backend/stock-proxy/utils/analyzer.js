// Analysis utility - Contains all the logic from mobile app's analysisEngine.js
const { calculateRSI, calculateMACD, calculateBollingerBands, calculateATR, calculateStochastic, detectChartPatterns, calculateSMA, calculateEMA } = require('./technicalIndicators');

// Helper to extract values from both yahoo-finance2 format (plain number) and original Yahoo API format ({raw, fmt})
const getValue = (field) => {
  if (field === null || field === undefined) return null;
  // yahoo-finance2 returns plain numbers/strings
  if (typeof field === 'number' || typeof field === 'string') return field;
  // Original Yahoo API returns {raw: value, fmt: string}
  return field.raw !== undefined ? field.raw : field;
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
  
  const fundamental = stock.fundamentals?.quoteSummary?.result?.[0];
  if (!fundamental) return { fundamentalScore: 0, categoryScores: scores };

  const defaultKeyStats = fundamental.defaultKeyStatistics || {};
  const financialData = fundamental.financialData || {};
  const summaryDetail = fundamental.summaryDetail || {};

  // Extract metrics - handle both yahoo-finance2 (plain values) and original Yahoo API ({raw, fmt}) formats
  const peRatio = getValue(summaryDetail.trailingPE);
  const pegRatio = getValue(defaultKeyStats.pegRatio);
  const priceToBook = getValue(defaultKeyStats.priceToBook);
  const priceToSales = getValue(summaryDetail.priceToSalesTrailing12Months);
  const returnOnEquity = getValue(financialData.returnOnEquity);
  const profitMargin = getValue(financialData.profitMargins);
  const operatingMargin = getValue(financialData.operatingMargins);
  const returnOnAssets = getValue(financialData.returnOnAssets);
  const revenueGrowth = getValue(financialData.revenueGrowth);
  const earningsGrowth = getValue(financialData.earningsGrowth);
  const earningsQuarterlyGrowth = getValue(defaultKeyStats.earningsQuarterlyGrowth);
  const debtToEquity = getValue(financialData.debtToEquity);
  const currentRatio = getValue(financialData.currentRatio);
  const quickRatio = getValue(financialData.quickRatio);
  const freeCashflow = getValue(financialData.freeCashflow);
  const dividendYield = getValue(summaryDetail.dividendYield);
  const payoutRatio = getValue(summaryDetail.payoutRatio);

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

// Calculate target price using SINGLE BEST METHOD (most accurate approach)
const calculateTargetPrice = (stock) => {
  const {
    currentPrice,
    peRatio,
    pegRatio,
    earningsGrowth,
    priceToBook,
    returnOnEquity,
    fiftyTwoWeekHigh,
    fiftyTwoWeekLow
  } = stock;

  if (!currentPrice || currentPrice <= 0) return null;

  let calculatedTarget = null;
  let methodUsed = null;
  let confidence = 'Low';
  let explanation = '';

  // PRIORITY 1: PEG-based valuation (MOST RELIABLE for growth stocks)
  // Best for: IT, Pharma, Consumer Discretionary
  if (pegRatio && pegRatio > 0 && pegRatio < 2.5 && earningsGrowth && earningsGrowth > 0.10) {
    const epsGrowthPercent = earningsGrowth * 100;
    const fairPE = epsGrowthPercent; // Fair PEG = 1.0, so fair PE = growth rate
    const currentPE = peRatio || 20;
    calculatedTarget = currentPrice * (fairPE / currentPE);
    methodUsed = 'PEG-Based';
    confidence = pegRatio < 1.5 ? 'High' : 'Medium';
    explanation = `Fair PE=${fairPE.toFixed(1)} (based on ${epsGrowthPercent.toFixed(1)}% growth), Current PE=${currentPE.toFixed(1)}`;
  }
  // PRIORITY 2: ROE-based valuation (BEST for value/mature companies)
  // Best for: Banks, FMCG, Utilities
  else if (returnOnEquity && returnOnEquity > 0.15 && priceToBook && priceToBook > 0) {
    const roePercent = returnOnEquity * 100;
    let fairPB = 3.0;
    if (roePercent > 20) fairPB = 5.0;
    else if (roePercent > 18) fairPB = 4.5;
    else if (roePercent > 15) fairPB = 4.0;
    
    calculatedTarget = currentPrice * (fairPB / priceToBook);
    methodUsed = 'ROE-Based';
    confidence = roePercent > 20 ? 'High' : 'Medium';
    explanation = `ROE=${roePercent.toFixed(1)}%, Fair P/B=${fairPB.toFixed(1)}, Current P/B=${priceToBook.toFixed(2)}`;
  }
  // PRIORITY 3: Growth-adjusted PE (ALTERNATIVE fundamental)
  // Used when PEG unavailable but growth data exists
  else if (peRatio && peRatio > 0 && earningsGrowth && earningsGrowth > 0.08) {
    const growthPercent = earningsGrowth * 100;
    let fairPE = 18; // Base for moderate growth
    if (growthPercent > 20) fairPE = 28;
    else if (growthPercent > 15) fairPE = 24;
    else if (growthPercent > 10) fairPE = 20;
    
    calculatedTarget = currentPrice * (fairPE / peRatio);
    methodUsed = 'Growth-PE';
    confidence = 'Medium';
    explanation = `${growthPercent.toFixed(1)}% growth → Fair PE=${fairPE}, Current PE=${peRatio.toFixed(1)}`;
  }
  // PRIORITY 4: 52-week momentum (FALLBACK - always available)
  // Technical analysis when fundamental data is weak
  else if (fiftyTwoWeekHigh && fiftyTwoWeekLow && fiftyTwoWeekHigh > fiftyTwoWeekLow) {
    const range = fiftyTwoWeekHigh - fiftyTwoWeekLow;
    const positionInRange = (currentPrice - fiftyTwoWeekLow) / range;
    
    if (positionInRange < 0.4) {
      // Near 52w low - target is 52w high (mean reversion)
      calculatedTarget = fiftyTwoWeekHigh;
      explanation = `Near 52w low, targeting 52w high`;
    } else if (positionInRange > 0.8) {
      // Near 52w high - target is 8% above (breakout)
      calculatedTarget = fiftyTwoWeekHigh * 1.08;
      explanation = `Near 52w high, targeting breakout (+8%)`;
    } else {
      // Mid-range - target is 52w high
      calculatedTarget = fiftyTwoWeekHigh;
      explanation = `Mid-range, targeting 52w high`;
    }
    methodUsed = 'Momentum';
    confidence = 'Low';
  }

  // No method could be applied
  if (!calculatedTarget || !methodUsed) return null;

  // Apply tighter sanity bounds (±30% instead of ±100%)
  const minTarget = currentPrice * 0.7; // Max 30% downside
  const maxTarget = currentPrice * 1.3; // Max 30% upside
  const finalTarget = Math.max(minTarget, Math.min(maxTarget, calculatedTarget));

  // Adjust confidence if bounds were hit (indicates unrealistic target)
  if (finalTarget !== calculatedTarget) {
    confidence = confidence === 'High' ? 'Medium' : 'Low';
  }

  return {
    calculatedTarget: Number(finalTarget.toFixed(2)),
    upside: Number((((finalTarget - currentPrice) / currentPrice) * 100).toFixed(2)),
    methodUsed: methodUsed,
    confidence: confidence,
    explanation: explanation
  };
};

// Parse stock data from API responses (yahoo-finance2 format)
const parseStockData = (stockData) => {
  const { symbol, quote, fundamentals } = stockData;
  
  // yahoo-finance2 chart format: {quotes: [{close, high, low, open, volume, date}], meta: {}}
  const chart = quote?.chart?.result?.[0]; // Original Yahoo API format
  const quotes = quote?.quotes || chart?.indicators?.quote?.[0]; // yahoo-finance2 or original format
  const meta = quote?.meta || chart?.meta;
  
  // Extract prices from yahoo-finance2 format OR original Yahoo API format
  let prices = [];
  let timestamps = [];
  if (quotes && Array.isArray(quotes)) {
    // yahoo-finance2 format: array of objects with {close, date}
    prices = quotes.map(q => q?.close).filter(p => p !== null && p !== undefined);
    timestamps = quotes.map(q => q?.date ? Math.floor(q.date.getTime() / 1000) : null).filter(t => t !== null);
  } else if (quotes?.close) {
    // Original Yahoo API format: {close: []}
    prices = (quotes.close || []).filter(p => p !== null && p !== undefined);
    timestamps = chart?.timestamp || [];
  }
  
  const fundamental = fundamentals?.quoteSummary?.result?.[0];
  const price = fundamental?.price;
  const summaryDetail = fundamental?.summaryDetail;
  const financialData = fundamental?.financialData;
  const defaultKeyStats = fundamental?.defaultKeyStatistics;

  // Convert market cap to Crores (divide by 10M for proper display)
  const rawMarketCap = getValue(summaryDetail?.marketCap) || 0;
  const marketCapCr = rawMarketCap > 0 ? Number((rawMarketCap / 10000000).toFixed(2)) : 0;

  return {
    symbol,
    name: getValue(meta?.longName) || symbol.replace('.NS', ''),
    currentPrice: getValue(price?.regularMarketPrice) || getValue(meta?.regularMarketPrice) || 0,
    changePercent: getValue(price?.regularMarketChangePercent) || 0,
    change: getValue(price?.regularMarketChange) || 0,
    marketCap: rawMarketCap, // Keep raw for calculations
    marketCapCr: marketCapCr, // Display in Crores
    volume: getValue(meta?.regularMarketVolume) || 0,
    fiftyTwoWeekHigh: getValue(summaryDetail?.fiftyTwoWeekHigh) || 0,
    fiftyTwoWeekLow: getValue(summaryDetail?.fiftyTwoWeekLow) || 0,
    
    // Prices for technical analysis
    prices: prices.filter(p => p !== null && p !== undefined),
    timestamps,
    
    // Fundamentals
    peRatio: getValue(summaryDetail?.trailingPE),
    pegRatio: getValue(defaultKeyStats?.pegRatio),
    priceToBook: getValue(defaultKeyStats?.priceToBook),
    priceToSales: getValue(summaryDetail?.priceToSalesTrailing12Months),
    returnOnEquity: getValue(financialData?.returnOnEquity),
    profitMargin: getValue(financialData?.profitMargins),
    operatingMargin: getValue(financialData?.operatingMargins),
    returnOnAssets: getValue(financialData?.returnOnAssets),
    revenueGrowth: getValue(financialData?.revenueGrowth),
    earningsGrowth: getValue(financialData?.earningsGrowth),
    earningsQuarterlyGrowth: getValue(defaultKeyStats?.earningsQuarterlyGrowth),
    debtToEquity: getValue(financialData?.debtToEquity),
    currentRatio: getValue(financialData?.currentRatio),
    quickRatio: getValue(financialData?.quickRatio),
    freeCashflow: getValue(financialData?.freeCashflow),
    dividendYield: getValue(summaryDetail?.dividendYield),
    payoutRatio: getValue(summaryDetail?.payoutRatio),
    
    // Analyst targets (from Yahoo Finance)
    targetMeanPrice: getValue(financialData?.targetMeanPrice),
    targetHighPrice: getValue(financialData?.targetHighPrice),
    targetLowPrice: getValue(financialData?.targetLowPrice),
    numberOfAnalystOpinions: getValue(financialData?.numberOfAnalystOpinions),
    
    // Store raw data for detailed views
    quote,
    fundamentals
  };
};

// Analyze all categories
const analyzeAllCategories = async (stocksData) => {
  const parsedStocks = stocksData.map(parseStockData);
  
// Add calculated target prices to all stocks (using SINGLE BEST METHOD)
    const stocksWithTargets = parsedStocks.map(stock => {
      const calculatedTarget = calculateTargetPrice(stock);
      return {
        ...stock,
        calculatedTarget: calculatedTarget?.calculatedTarget || null,
        calculatedUpside: calculatedTarget?.upside || null,
        calculatedConfidence: calculatedTarget?.confidence || null,
        calculatedMethod: calculatedTarget?.methodUsed || null,
        calculatedExplanation: calculatedTarget?.explanation || null
    };
  });
  
  // Calculate technical indicators for all stocks
  const stocksWithTechnical = stocksWithTargets.map(stock => {
    if (stock.prices.length >= 50) {
      const rsi = calculateRSI(stock.prices);
      const macd = calculateMACD(stock.prices);
      const bollinger = calculateBollingerBands(stock.prices);
      const atr = calculateATR(stock.prices);
      const stochastic = calculateStochastic(stock.prices);
      const patterns = detectChartPatterns(stock.prices);
      
      // Calculate moving averages
      const sma20Array = calculateSMA(stock.prices, 20);
      const sma50Array = calculateSMA(stock.prices, 50);
      const sma200Array = calculateSMA(stock.prices, 200);
      const ema12Array = calculateEMA(stock.prices, 12);
      const ema26Array = calculateEMA(stock.prices, 26);
      
      const movingAverages = {
        sma20: sma20Array[sma20Array.length - 1] || null,
        sma50: sma50Array[sma50Array.length - 1] || null,
        sma200: sma200Array[sma200Array.length - 1] || null,
        ema12: ema12Array[ema12Array.length - 1] || null,
        ema26: ema26Array[ema26Array.length - 1] || null,
      };
      
      // Determine trend
      const currentPrice = stock.prices[stock.prices.length - 1];
      let trend = 'Neutral';
      if (movingAverages.sma20 && movingAverages.sma50) {
        if (currentPrice > movingAverages.sma20 && movingAverages.sma20 > movingAverages.sma50) {
          trend = 'Strong Uptrend';
        } else if (currentPrice > movingAverages.sma50) {
          trend = 'Uptrend';
        } else if (currentPrice < movingAverages.sma20 && movingAverages.sma20 < movingAverages.sma50) {
          trend = 'Strong Downtrend';
        } else if (currentPrice < movingAverages.sma50) {
          trend = 'Downtrend';
        }
      }
      
      // Calculate support and resistance
      const recentPrices = stock.prices.slice(-20);
      const supportResistance = {
        resistance: Math.max(...recentPrices),
        support: Math.min(...recentPrices),
      };
      
      // Volume analysis
      const volumeAnalysis = {
        currentVolume: stock.volume,
        avgVolume: stock.avgVolume10Day || stock.volume,
        relativeVolume: stock.avgVolume10Day ? (stock.volume / stock.avgVolume10Day).toFixed(2) : 1,
      };
      
      // Add stochastic signal
      stochastic.signal = stochastic.k > 80 ? 'overbought' : stochastic.k < 20 ? 'oversold' : 'neutral';
      
      stock.technical = { 
        rsi, 
        macd, 
        bollinger, 
        atr, 
        stochastic, 
        patterns,
        movingAverages,
        trend,
        supportResistance,
        volumeAnalysis
      };
    }
    
    const fundScore = scoreFundamentals({ fundamentals: stock.fundamentals });
    stock.fundamentalScore = fundScore.fundamentalScore;
    stock.categoryScores = fundScore.categoryScores;
    
    return stock;
  });
  
  // Filter for each category and sort by BEST TO WORST (highest scores first)
  // QUALITY FILTER: Only show stocks with 75+ scores and proper data
  const targetOriented = stocksWithTechnical
    .filter(s => {
      // Must have technical data
      if (!s.technical) return false;
      // Must have HIGH fundamental score (75+)
      if (!s.fundamentalScore || s.fundamentalScore < 75) return false;
      // Must have calculated target (our proprietary calculation)
      if (!s.calculatedTarget || s.calculatedUpside === null) return false;
      // Must have key fundamentals for user to see
      if (!s.peRatio || !s.marketCap) return false;
      return true;
    })
    .sort((a, b) => b.fundamentalScore - a.fundamentalScore) // Best fundamental score first
    .slice(0, 10); // Top 10 best fundamentals
  
  const swing = stocksWithTechnical
    .filter(s => {
      // Must have technical data and RSI
      if (!s.technical || !s.technical.rsi?.current) return false;
      // Must have SIGNIFICANT movement (>1% for tradeable swing)
      if (Math.abs(s.changePercent || 0) < 1.0) return false;
      // Technical score must be decent (70+)
      if (!s.technicalScore || s.technicalScore < 70) return false;
      // RSI should be in tradeable range (not neutral 45-55)
      const rsi = s.technical.rsi.current;
      if (rsi > 45 && rsi < 55) return false; // Skip neutral RSI
      return true;
    })
    .sort((a, b) => {
      // Sort by best swing potential: RSI momentum + price movement
      const aScore = Math.abs(a.technical.rsi.current - 50) + Math.abs(a.changePercent || 0) * 2;
      const bScore = Math.abs(b.technical.rsi.current - 50) + Math.abs(b.changePercent || 0) * 2;
      return bScore - aScore; // Best swing momentum first
    })
    .slice(0, 8); // Top 8 best swing opportunities
  
  const fundamentallyStrong = stocksWithTechnical
    .filter(s => {
      // Must have VERY HIGH fundamental score (80+)
      if (!s.fundamentalScore || s.fundamentalScore < 80) return false;
      // Must have calculated target
      if (!s.calculatedTarget || s.calculatedUpside === null) return false;
      // Must have PE ratio (valuation metric)
      if (!s.peRatio || s.peRatio <= 0) return false;
      // Must have market cap (size metric)
      if (!s.marketCap) return false;
      return true;
    })
    .sort((a, b) => b.fundamentalScore - a.fundamentalScore) // Best fundamental score first
    .slice(0, 10); // Top 10 strongest fundamentals
  
  const technicallyStrong = stocksWithTechnical
    .filter(s => {
      // Must have proper technical chart data (50+ days for all indicators)
      if (!s.technical || s.prices.length < 50) return false;
      
      // Must have HIGH technical score (75+)
      if (!s.technicalScore || s.technicalScore < 75) return false;
      
      // Must have RSI in strong zone (>55 for bullish OR <45 for oversold)
      const rsi = s.technical.rsi?.current;
      if (!rsi || (rsi >= 45 && rsi <= 55)) return false; // Skip neutral
      
      // Must have MACD histogram (momentum indicator)
      if (!s.technical.macd?.histogram) return false;
      
      // Must have moving averages for chart display
      if (!s.technical.movingAverages?.sma20 || !s.technical.movingAverages?.sma50) return false;
      
      return true;
    })
    .sort((a, b) => {
      // Sort by best technical strength: RSI deviation + MACD
      const aScore = Math.abs((a.technical.rsi?.current || 50) - 50) * 2 + ((a.technical.macd?.histogram || 0) * 10);
      const bScore = Math.abs((b.technical.rsi?.current || 50) - 50) * 2 + ((b.technical.macd?.histogram || 0) * 10);
      return bScore - aScore; // Best technical strength first
    })
    .slice(0, 10); // Top 10 best technical indicators
  
  const hotStocks = stocksWithTechnical
    .filter(s => s.currentPrice > 0) // Must have price data
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)) // Highest movers first (even if 0)
    .slice(0, 10); // Top 10
  
  // Placeholder for other categories
  const grahaGochar = []; // Astrological analysis
  // ETF and Mutual Funds removed - focusing on stocks only
  
  return {
    targetOriented,
    swing,
    fundamentallyStrong,
    technicallyStrong,
    hotStocks,
    grahaGochar,

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
