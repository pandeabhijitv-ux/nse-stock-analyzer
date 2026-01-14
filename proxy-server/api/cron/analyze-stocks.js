// Cron job that runs at 6 AM IST (12:30 AM UTC) to pre-compute all stock analysis
const axios = require('axios');
const { storeAnalysis, markAsUpdated } = require('../../utils/cache');
const { analyzeAllCategories } = require('../../utils/analyzer');

module.exports = async (req, res) => {
  try {
    // Verify this is a cron request
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('[CRON] Starting daily stock analysis at', new Date().toISOString());
    const startTime = Date.now();

    // Fetch all 100 stocks from NSE sectors
    const stockSymbols = [
      // Technology (10 stocks)
      'TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'TECHM.NS',
      'LTI.NS', 'COFORGE.NS', 'MPHASIS.NS', 'PERSISTENT.NS', 'LTTS.NS',
      
      // Banking (10 stocks)
      'HDFCBANK.NS', 'ICICIBANK.NS', 'KOTAKBANK.NS', 'AXISBANK.NS', 'SBIN.NS',
      'INDUSINDBK.NS', 'BANDHANBNK.NS', 'FEDERALBNK.NS', 'IDFCFIRSTB.NS', 'RBLBANK.NS',
      
      // Financial Services (10 stocks)
      'BAJFINANCE.NS', 'BAJAJFINSV.NS', 'HDFCLIFE.NS', 'SBILIFE.NS', 'ICICIGI.NS',
      'HDFC.NS', 'PNBHOUSING.NS', 'LICHSGFIN.NS', 'CHOLAFIN.NS', 'MUTHOOTFIN.NS',
      
      // FMCG (10 stocks)
      'HINDUNILVR.NS', 'ITC.NS', 'NESTLEIND.NS', 'BRITANNIA.NS', 'DABUR.NS',
      'MARICO.NS', 'GODREJCP.NS', 'COLPAL.NS', 'TATACONSUM.NS', 'EMAMILTD.NS',
      
      // Automobile (10 stocks)
      'MARUTI.NS', 'TATAMOTORS.NS', 'M&M.NS', 'BAJAJ-AUTO.NS', 'EICHERMOT.NS',
      'HEROMOTOCO.NS', 'TVSMOTOR.NS', 'ASHOKLEY.NS', 'APOLLOTYRE.NS', 'MRF.NS',
      
      // Pharma (10 stocks)
      'SUNPHARMA.NS', 'DRREDDY.NS', 'DIVISLAB.NS', 'CIPLA.NS', 'AUROPHARMA.NS',
      'BIOCON.NS', 'TORNTPHARM.NS', 'LUPIN.NS', 'ALKEM.NS', 'ABBOTINDIA.NS',
      
      // Energy (10 stocks)
      'RELIANCE.NS', 'ONGC.NS', 'BPCL.NS', 'IOC.NS', 'GAIL.NS',
      'COALINDIA.NS', 'NTPC.NS', 'POWERGRID.NS', 'ADANIGREEN.NS', 'ADANIPOWER.NS',
      
      // Metals & Mining (10 stocks)
      'TATASTEEL.NS', 'HINDALCO.NS', 'JSWSTEEL.NS', 'VEDL.NS', 'JINDALSTEL.NS',
      'SAIL.NS', 'NMDC.NS', 'NATIONALUM.NS', 'HINDZINC.NS', 'MOIL.NS',
      
      // Infrastructure (10 stocks)
      'LT.NS', 'ADANIPORTS.NS', 'SIEMENS.NS', 'ABB.NS', 'CUMMINSIND.NS',
      'ASHOKA.NS', 'NCC.NS', 'IRCTC.NS', 'CONCOR.NS', 'PNB.NS',
      
      // Consumer Durables (10 stocks)
      'TITAN.NS', 'HAVELLS.NS', 'WHIRLPOOL.NS', 'VOLTAS.NS', 'BLUESTARCO.NS',
      'CROMPTON.NS', 'SYMPHONY.NS', 'DIXON.NS', 'AMBER.NS', 'BATAINDIA.NS',
    ];

    // Fetch all stock data in parallel from Yahoo Finance
    console.log('[CRON] Fetching data for', stockSymbols.length, 'stocks from Yahoo Finance');
    const stockDataPromises = stockSymbols.map(async (symbol) => {
      try {
        // Fetch quote and chart data from Yahoo Finance
        const [quoteRes, chartRes] = await Promise.all([
          axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, { 
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
          }),
          axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, { 
            params: { interval: '1d', range: '1y' },
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
          })
        ]);
        
        const quote = quoteRes.data?.chart?.result?.[0];
        const chart = chartRes.data?.chart?.result?.[0];
        
        if (!quote || !chart) {
          throw new Error('Invalid response from Yahoo Finance');
        }
        
        return {
          symbol,
          currentPrice: quote.meta?.regularMarketPrice || 0,
          changePercent: ((quote.meta?.regularMarketPrice - quote.meta?.previousClose) / quote.meta?.previousClose * 100) || 0,
          volume: quote.meta?.regularMarketVolume || 0,
          marketCap: quote.meta?.marketCap || 0,
          prices: chart.indicators?.quote?.[0]?.close || [],
          high: chart.indicators?.quote?.[0]?.high || [],
          low: chart.indicators?.quote?.[0]?.low || [],
          timestamps: chart.timestamp || [],
          fundamentals: {}, // Will be populated by analyzer if needed
          success: true
        };
      } catch (error) {
        console.error(`[CRON] Error fetching ${symbol}:`, error.message);
        return { symbol, success: false, error: error.message };
      }
    });

    const results = await Promise.allSettled(stockDataPromises);
    const successfulStocks = results
      .filter(r => r.status === 'fulfilled' && r.value.success)
      .map(r => r.value);

    console.log('[CRON] Successfully fetched', successfulStocks.length, 'stocks');

    // Analyze all categories
    const analysis = await analyzeAllCategories(successfulStocks);

    // Store in cache (Redis or in-memory with 24h TTL)
    await storeAnalysis('target-oriented', analysis.targetOriented);
    await storeAnalysis('swing', analysis.swing);
    await storeAnalysis('fundamentally-strong', analysis.fundamentallyStrong);
    await storeAnalysis('technically-strong', analysis.technicallyStrong);
    await storeAnalysis('hot-stocks', analysis.hotStocks);
    await storeAnalysis('graha-gochar', analysis.grahaGochar);
    await storeAnalysis('etf', analysis.etf);
    await storeAnalysis('mutual-funds', analysis.mutualFunds);
    
    // Mark metadata
    await markAsUpdated({
      timestamp: new Date().toISOString(),
      stocksAnalyzed: successfulStocks.length,
      totalStocks: stockSymbols.length,
      successRate: (successfulStocks.length / stockSymbols.length * 100).toFixed(2) + '%',
      duration: Date.now() - startTime + 'ms'
    });

    console.log('[CRON] Analysis completed and cached');

    res.status(200).json({
      success: true,
      message: 'Stock analysis completed',
      stats: {
        stocksAnalyzed: successfulStocks.length,
        totalStocks: stockSymbols.length,
        duration: Date.now() - startTime,
        categories: Object.keys(analysis).length
      }
    });

  } catch (error) {
    console.error('[CRON] Fatal error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
