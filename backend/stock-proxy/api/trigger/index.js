// Manual trigger endpoint for testing - NO AUTH REQUIRED
// This allows you to trigger analysis on-demand during development/testing
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();
const { storeAnalysis, markAsUpdated } = require('../../utils/cache');
const { analyzeAllCategories } = require('../../utils/analyzer');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    console.log('[MANUAL TRIGGER] Starting analysis at', new Date().toISOString());
    const startTime = Date.now();

    // Load Nifty 500 stocks from JSON file (500 stocks for comprehensive analysis)
    const nifty500Path = path.join(__dirname, '../../nifty500-symbols.json');
    let nifty500Stocks = [];
    
    try {
      const nifty500Data = fs.readFileSync(nifty500Path, 'utf8');
      nifty500Stocks = JSON.parse(nifty500Data);
      // Remove first element if it's "NIFTY 500" header
      if (nifty500Stocks[0] === 'NIFTY 500') {
        nifty500Stocks.shift();
      }
      console.log(`[MANUAL] Loaded ${nifty500Stocks.length} stocks from Nifty 500`);
    } catch (error) {
      console.error('[MANUAL] Error loading Nifty 500 list, using fallback:', error.message);
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
    console.log('[MANUAL] Fetching data for', stockSymbols.length, 'stocks');
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
        console.error(`[MANUAL] Error fetching ${symbol}:`, error.message);
        return { symbol, success: false, error: error.message };
      }
    });

    const results = await Promise.allSettled(stockDataPromises);
    const successfulStocks = results
      .filter(r => r.status === 'fulfilled' && r.value.success)
      .map(r => r.value);

    console.log('[MANUAL] Successfully fetched', successfulStocks.length, 'stocks');

    // Analyze all categories
    const analysis = await analyzeAllCategories(successfulStocks);

    // Store in cache
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
      duration: Date.now() - startTime + 'ms',
      trigger: 'manual'
    });

    console.log('[MANUAL] Analysis completed and cached');

    res.status(200).json({
      success: true,
      message: 'Stock analysis completed successfully',
      stats: {
        stocksAnalyzed: successfulStocks.length,
        totalStocks: stockSymbols.length,
        successRate: ((successfulStocks.length / stockSymbols.length) * 100).toFixed(2) + '%',
        duration: Date.now() - startTime + 'ms',
        categories: Object.keys(analysis).length
      },
      categories: {
        'target-oriented': analysis.targetOriented.length,
        'swing': analysis.swing.length,
        'fundamentally-strong': analysis.fundamentallyStrong.length,
        'technically-strong': analysis.technicallyStrong.length,
        'hot-stocks': analysis.hotStocks.length,
        'graha-gochar': analysis.grahaGochar.length,
        'etf': analysis.etf.length,
        'mutual-funds': analysis.mutualFunds.length
      }
    });

  } catch (error) {
    console.error('[MANUAL] Fatal error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
