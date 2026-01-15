// Cron job that runs at 6 AM IST (12:30 AM UTC) to pre-compute all stock analysis
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();
const { storeAnalysis, markAsUpdated } = require('../../utils/cache');
const { analyzeAllCategories } = require('../../utils/analyzer');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    // Verify this is a cron request
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('[CRON] Starting daily stock analysis at', new Date().toISOString());
    const startTime = Date.now();

    // Load Nifty 500 stocks from JSON file (400-500 stocks for comprehensive analysis)
    const nifty500Path = path.join(__dirname, '../../nifty500-symbols.json');
    let nifty500Stocks = [];
    
    try {
      const nifty500Data = fs.readFileSync(nifty500Path, 'utf8');
      nifty500Stocks = JSON.parse(nifty500Data);
      // Remove first element if it's \"NIFTY 500\" header
      if (nifty500Stocks[0] === 'NIFTY 500') {
        nifty500Stocks.shift();
      }
      console.log(`[CRON] Loaded ${nifty500Stocks.length} stocks from Nifty 500`);
    } catch (error) {
      console.error('[CRON] Error loading Nifty 500 list, using fallback:', error.message);
      // Fallback to major stocks if file not found
      nifty500Stocks = [
        'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'RELIANCE', 'HINDUNILVR', 'ITC',
        'SBIN', 'BHARTIARTL', 'KOTAKBANK', 'LT', 'AXISBANK', 'ASIANPAINT', 'MARUTI',
        'TITAN', 'SUNPHARMA', 'WIPRO', 'HCLTECH', 'ULTRACEMCO', 'BAJFINANCE'
      ];
    }
    
    // Add .NS suffix for NSE stocks
    const stockSymbols = nifty500Stocks.map(symbol => `${symbol}.NS`);

    // Fetch all stock data in parallel using yahoo-finance2 library
    console.log('[CRON] Fetching data for', stockSymbols.length, 'stocks');
    const stockDataPromises = stockSymbols.map(async (symbol) => {
      try {
        // Fetch both quote and chart data using yahoo-finance2
        const [quoteData, chartData] = await Promise.all([
          yahooFinance.quoteSummary(symbol, {
            modules: ['price', 'summaryDetail', 'defaultKeyStatistics', 'financialData']
          }),
          yahooFinance.chart(symbol, {
            period1: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
            interval: '1d'
          })
        ]);
        
        // Transform to expected format (yahoo-finance2 format is already correct)
        return {
          symbol,
          quote: chartData, // Pass chartData directly (has .quotes and .meta)
          fundamentals: {
            quoteSummary: {
              result: [quoteData]
            }
          },
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
