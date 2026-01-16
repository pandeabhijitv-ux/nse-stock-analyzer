// Options Trading API - Returns realistic options data
// Path: /api/top-options-cached (to match PWA expectations)

// Generate realistic options data based on current date
function generateRealisticOptions() {
  const today = new Date();
  const seed = today.getDate() + today.getMonth() * 31;
  
  // Top liquid NSE stocks with NSE-compliant strike intervals
  const stocks = [
    { symbol: 'RELIANCE', spot: 2850, atm: 2850, interval: 50 },  // Above 1000: 50 interval
    { symbol: 'TCS', spot: 3920, atm: 3900, interval: 100 },      // Above 1000: 50-100 interval
    { symbol: 'INFY', spot: 1780, atm: 1780, interval: 20 },      // Above 1000: 20 interval
    { symbol: 'HDFCBANK', spot: 1645, atm: 1640, interval: 20 },  // Above 1000: 20 interval
    { symbol: 'ICICIBANK', spot: 1095, atm: 1100, interval: 20 }, // Above 1000: 20 interval
    { symbol: 'SBIN', spot: 785, atm: 780, interval: 20 },        // 500-1000: 20 interval
    { symbol: 'BHARTIARTL', spot: 1545, atm: 1540, interval: 20 },// Above 1000: 20 interval
    { symbol: 'ITC', spot: 465, atm: 460, interval: 10 },         // 250-500: 10 interval
  ];
  
  const options = [];
  
  // Generate 10-15 quality options with NSE-compliant strike prices
  for (let i = 0; i < 12; i++) {
    const stock = stocks[i % stocks.length];
    const isCall = (seed + i) % 2 === 0;
    
    // Generate strikes using NSE-compliant intervals
    // Strikes: ATM-2, ATM-1, ATM, ATM+1, ATM+2
    const strikeOffset = ((seed + i * 7) % 5 - 2); // -2, -1, 0, 1, 2
    const strike = stock.atm + (strikeOffset * stock.interval);
    
    // Premium calculation based on moneyness
    const moneyness = isCall ? 
      (stock.spot - strike) / strike : 
      (strike - stock.spot) / strike;
    
    const basePremium = Math.abs(moneyness) * stock.spot * 0.02 + 
      (Math.random() * 0.01 + 0.02) * stock.spot;
    
    const premium = Math.max(5, Math.min(200, basePremium));
    
    // Greeks and metrics
    const delta = isCall ?
      0.35 + Math.abs(moneyness) * 0.3 :
      -0.35 - Math.abs(moneyness) * 0.3;
    
    const iv = 18 + (seed + i * 3) % 15; // 18-33% IV
    const volume = Math.floor((seed + i * 17) % 50000 + 10000);
    const oi = Math.floor(volume * (1.5 + Math.random() * 2));
    
    const score = Math.floor(
      (volume / 1000) * 0.2 +
      (oi / 10000) * 0.3 +
      (35 - Math.abs(iv - 25)) * 2 +
      (Math.abs(delta) * 50)
    );
    
    options.push({
      tradingSymbol: `${stock.symbol}${isCall ? 'CE' : 'PE'}`,
      underlyingSymbol: stock.symbol,
      strikePrice: strike,
      optionType: isCall ? 'CE' : 'PE',
      spotPrice: stock.spot,
      ltp: Number(premium.toFixed(2)),
      volume: volume,
      openInterest: oi,
      iv: Number(iv.toFixed(2)),
      delta: Number(delta.toFixed(3)),
      theta: Number((-(premium * 0.05)).toFixed(3)),
      gamma: Number((0.001 + Math.random() * 0.002).toFixed(4)),
      vega: Number((premium * 0.15).toFixed(2)),
      score: Math.min(95, Math.max(45, score)),
      expiryDate: getNextThursday().toISOString().split('T')[0]
    });
  }
  
  // Sort by score
  options.sort((a, b) => b.score - a.score);
  
  return options.slice(0, 10); // Top 10 options
}

// Get next Thursday (weekly expiry)
function getNextThursday() {
  const today = new Date();
  const daysUntilThursday = (4 - today.getDay() + 7) % 7 || 7;
  const nextThursday = new Date(today);
  nextThursday.setDate(today.getDate() + daysUntilThursday);
  return nextThursday;
}

// Main handler
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  
  try {
    console.log('📊 Generating options data...');
    
    const options = generateRealisticOptions();
    const expiryDate = getNextThursday().toISOString().split('T')[0];
    
    console.log(`✅ Generated ${options.length} quality options`);
    
    // Match the structure expected by PWA
    res.status(200).json({
      success: true,
      data: options,
      cachedAt: new Date().toISOString(),
      expiryDate: expiryDate,
      totalScanned: options.length,
      message: 'Realistic simulated data - SAMCO integration pending'
    });
  } catch (error) {
    console.error('❌ Error generating options:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
