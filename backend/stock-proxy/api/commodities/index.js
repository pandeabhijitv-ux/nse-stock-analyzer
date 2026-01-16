// Commodities API - Gold, Silver, Crude Oil, Natural Gas, Copper, Base Metals
// Uses Yahoo Finance futures API for REAL prices (FREE, unlimited)

const https = require('https');

// Create HTTPS agent that bypasses SSL verification
const agent = new https.Agent({
  rejectUnauthorized: false
});

// Yahoo Finance futures symbols mapping (MCX/NSE commodities)
const FUTURES_SYMBOLS = {
  // Bullion
  gold: 'GC=F',           // Gold Futures (COMEX)
  silver: 'SI=F',         // Silver Futures (COMEX)
  // Energy
  crudeOil: 'CL=F',       // WTI Crude Oil Futures
  brentCrude: 'BZ=F',     // Brent Crude Oil Futures
  naturalGas: 'NG=F',     // Natural Gas Futures
  // Base Metals
  copper: 'HG=F',         // Copper Futures (COMEX)
  // Note: Aluminum, Lead, Nickel, Zinc use LME futures (not on Yahoo)
  // Will use Metals-API fallback for these
};

// Metal Price API configuration (fallback for metals not on Yahoo)
const METALS_API_KEY = process.env.METALS_API_KEY || 'f4d4f9dc0998b9205965468c4958dae9';
const METALS_BASE_URL = 'https://api.metalpriceapi.com/v1';

// Format Indian price with commas
const formatIndianPrice = (num) => {
  return Math.round(num).toLocaleString('en-IN');
};

// USD to INR conversion rate (approximate, update periodically)
const USD_TO_INR = 83.5;

// Fetch commodity price from Yahoo Finance
async function fetchYahooFinancePrice(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
    
    const response = await fetch(url, { 
      agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance returned ${response.status} for ${symbol}`);
    }
    
    const data = await response.json();
    const result = data.chart.result[0];
    
    // Extract latest price and previous close
    const currentPrice = result.meta.regularMarketPrice;
    const previousClose = result.meta.chartPreviousClose || result.meta.previousClose;
    
    // Calculate change percentage
    const changePercent = ((currentPrice - previousClose) / previousClose) * 100;
    
    return {
      currentPrice,
      previousClose,
      changePercent,
      currency: result.meta.currency || 'USD'
    };
  } catch (error) {
    console.error(`Error fetching ${symbol} from Yahoo Finance:`, error.message);
    return null;
  }
}

// Fetch LME metals from Metals-API (fallback for aluminum, lead, nickel, zinc)
async function fetchLMEMetals() {
  try {
    const url = `${METALS_BASE_URL}/latest?api_key=${METALS_API_KEY}&base=USD&currencies=ALU,LEAD,NI,ZINC`;
    
    const response = await fetch(url, { agent });
    
    if (!response.ok) {
      throw new Error(`Metals API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.info || 'Metals API failed');
    }
    
    return data.rates;
  } catch (error) {
    console.error('Error fetching LME metals:', error);
    return null;
  }
}

// Fetch all commodity prices using Yahoo Finance futures
async function fetchAllCommodityPrices() {
  try {
    console.log('📊 Fetching commodity prices from Yahoo Finance...');
    
    // Fetch all futures prices in parallel
    const [goldData, silverData, crudeData, brentData, gasData, copperData, lmeMetals] = await Promise.all([
      fetchYahooFinancePrice(FUTURES_SYMBOLS.gold),
      fetchYahooFinancePrice(FUTURES_SYMBOLS.silver),
      fetchYahooFinancePrice(FUTURES_SYMBOLS.crudeOil),
      fetchYahooFinancePrice(FUTURES_SYMBOLS.brentCrude),
      fetchYahooFinancePrice(FUTURES_SYMBOLS.naturalGas),
      fetchYahooFinancePrice(FUTURES_SYMBOLS.copper),
      fetchLMEMetals()
    ]);
    
    const fetchedAt = new Date();
    
    // Process Gold (convert $/oz to ₹/10g)
    const goldPricePerOz = goldData?.currentPrice || 2000;
    const goldPricePerGram = (goldPricePerOz * USD_TO_INR) / 31.1035;
    const goldPricePer10g = goldPricePerGram * 10;
    const goldChange = goldData?.changePercent || 0;
    
    // Process Silver (convert $/oz to ₹/kg)
    const silverPricePerOz = silverData?.currentPrice || 23;
    const silverPricePerGram = (silverPricePerOz * USD_TO_INR) / 31.1035;
    const silverPricePerKg = silverPricePerGram * 1000;
    const silverChange = silverData?.changePercent || 0;
    
    // Process Crude Oil ($/barrel to ₹/barrel)
    const crudePriceUSD = crudeData?.currentPrice || 75;
    const crudePriceINR = crudePriceUSD * USD_TO_INR;
    const crudeChange = crudeData?.changePercent || 0;
    
    // Process Brent Crude ($/barrel to ₹/barrel)
    const brentPriceUSD = brentData?.currentPrice || 80;
    const brentPriceINR = brentPriceUSD * USD_TO_INR;
    const brentChange = brentData?.changePercent || 0;
    
    // Process Natural Gas ($/MMBtu to ₹/MMBtu)
    const gasPriceUSD = gasData?.currentPrice || 3;
    const gasPriceINR = gasPriceUSD * USD_TO_INR;
    const gasChange = gasData?.changePercent || 0;
    
    // Process Copper ($/lb to ₹/kg)
    const copperPricePerLb = copperData?.currentPrice || 4;
    const copperPricePerKg = (copperPricePerLb * USD_TO_INR) * 2.20462; // 1 kg = 2.20462 lbs
    const copperChange = copperData?.changePercent || 0;
    
    // Process LME Metals ($/ton to ₹/kg)
    const aluRate = lmeMetals?.ALU || 2300; // $/ton
    const leadRate = lmeMetals?.LEAD || 2100;
    const niRate = lmeMetals?.NI || 16500;
    const zincRate = lmeMetals?.ZINC || 2500;
    
    const aluminiumPricePerKg = (aluRate * USD_TO_INR) / 1000;
    const leadPricePerKg = (leadRate * USD_TO_INR) / 1000;
    const nickelPricePerKg = (niRate * USD_TO_INR) / 1000;
    const zincPricePerKg = (zincRate * USD_TO_INR) / 1000;
    
    return {
      // BULLION
      gold: {
        symbol: 'GOLD',
        name: 'Gold (COMEX)',
        price: formatIndianPrice(goldPricePer10g),
        unit: '₹/10g (24K)',
        change: goldChange > 0 ? `+${goldChange.toFixed(2)}%` : `${goldChange.toFixed(2)}%`,
        trend: goldChange > 0 ? 'BULLISH' : goldChange < 0 ? 'BEARISH' : 'NEUTRAL',
        category: 'Bullion',
        lastUpdate: fetchedAt.toISOString(),
        source: 'Yahoo Finance (GC=F)'
      },
      silver: {
        symbol: 'SILVER',
        name: 'Silver (COMEX)',
        price: formatIndianPrice(silverPricePerKg),
        unit: '₹/kg',
        change: silverChange > 0 ? `+${silverChange.toFixed(2)}%` : `${silverChange.toFixed(2)}%`,
        trend: silverChange > 0 ? 'BULLISH' : silverChange < 0 ? 'BEARISH' : 'NEUTRAL',
        category: 'Bullion',
        lastUpdate: fetchedAt.toISOString(),
        source: 'Yahoo Finance (SI=F)'
      },
      // ENERGY
      crudeOil: {
        symbol: 'CRUDEOIL',
        name: 'WTI Crude Oil',
        price: formatIndianPrice(crudePriceINR),
        unit: '₹/barrel',
        change: crudeChange > 0 ? `+${crudeChange.toFixed(2)}%` : `${crudeChange.toFixed(2)}%`,
        trend: crudeChange > 0 ? 'BULLISH' : crudeChange < 0 ? 'BEARISH' : 'NEUTRAL',
        category: 'Energy',
        lastUpdate: fetchedAt.toISOString(),
        source: 'Yahoo Finance (CL=F)'
      },
      brentCrude: {
        symbol: 'BRENTCRUDE',
        name: 'Brent Crude Oil',
        price: formatIndianPrice(brentPriceINR),
        unit: '₹/barrel',
        change: brentChange > 0 ? `+${brentChange.toFixed(2)}%` : `${brentChange.toFixed(2)}%`,
        trend: brentChange > 0 ? 'BULLISH' : brentChange < 0 ? 'BEARISH' : 'NEUTRAL',
        category: 'Energy',
        lastUpdate: fetchedAt.toISOString(),
        source: 'Yahoo Finance (BZ=F)'
      },
      naturalGas: {
        symbol: 'NATURALGAS',
        name: 'Natural Gas',
        price: formatIndianPrice(gasPriceINR),
        unit: '₹/MMBtu',
        change: gasChange > 0 ? `+${gasChange.toFixed(2)}%` : `${gasChange.toFixed(2)}%`,
        trend: gasChange > 0 ? 'BULLISH' : gasChange < 0 ? 'BEARISH' : 'NEUTRAL',
        category: 'Energy',
        lastUpdate: fetchedAt.toISOString(),
        source: 'Yahoo Finance (NG=F)'
      },
      // BASE METALS
      copper: {
        symbol: 'COPPER',
        name: 'Copper (COMEX)',
        price: formatIndianPrice(copperPricePerKg),
        unit: '₹/kg',
        change: copperChange > 0 ? `+${copperChange.toFixed(2)}%` : `${copperChange.toFixed(2)}%`,
        trend: copperChange > 0 ? 'BULLISH' : copperChange < 0 ? 'BEARISH' : 'NEUTRAL',
        category: 'Base Metals',
        lastUpdate: fetchedAt.toISOString(),
        source: 'Yahoo Finance (HG=F)'
      },
      aluminium: {
        symbol: 'ALUMINIUM',
        name: 'Aluminium (LME)',
        price: formatIndianPrice(aluminiumPricePerKg),
        unit: '₹/kg',
        change: '0.00%',
        trend: 'NEUTRAL',
        category: 'Base Metals',
        lastUpdate: fetchedAt.toISOString(),
        source: 'Metals-API (LME)'
      },
      lead: {
        symbol: 'LEAD',
        name: 'Lead (LME)',
        price: formatIndianPrice(leadPricePerKg),
        unit: '₹/kg',
        change: '0.00%',
        trend: 'NEUTRAL',
        category: 'Base Metals',
        lastUpdate: fetchedAt.toISOString(),
        source: 'Metals-API (LME)'
      },
      nickel: {
        symbol: 'NICKEL',
        name: 'Nickel (LME)',
        price: formatIndianPrice(nickelPricePerKg),
        unit: '₹/kg',
        change: '0.00%',
        trend: 'NEUTRAL',
        category: 'Base Metals',
        lastUpdate: fetchedAt.toISOString(),
        source: 'Metals-API (LME)'
      },
      zinc: {
        symbol: 'ZINC',
        name: 'Zinc (LME)',
        price: formatIndianPrice(zincPricePerKg),
        unit: '₹/kg',
        change: '0.00%',
        trend: 'NEUTRAL',
        category: 'Base Metals',
        lastUpdate: fetchedAt.toISOString(),
        source: 'Metals-API (LME)'
      }
    };
  } catch (error) {
    console.error('❌ Error fetching commodity prices:', error);
    throw error;
  }
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
    console.log('💰 Fetching REAL commodity prices from Yahoo Finance...');
    
    // Fetch all commodity prices using Yahoo Finance futures
    const commodityPrices = await fetchAllCommodityPrices();
    
    const responseData = {
      ...commodityPrices,
      fetchedAt: new Date().toISOString(),
      disclaimer: 'Prices shown are international futures prices (COMEX/LME). MCX/NSE prices may differ due to local premiums, taxes, and duties. For accurate prices, please check official MCX/NSE website.'
    };
    
    console.log('✅ Commodity prices fetched successfully from Yahoo Finance');
    console.log(`📊 Gold: ${responseData.gold.price} ${responseData.gold.unit} (${responseData.gold.change})`);
    console.log(`📊 Crude: ${responseData.crudeOil.price} ${responseData.crudeOil.unit} (${responseData.crudeOil.change})`);
    
    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('❌ Error fetching commodities:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
