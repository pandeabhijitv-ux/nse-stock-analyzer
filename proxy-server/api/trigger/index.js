// Manual trigger endpoint for testing - NO AUTH REQUIRED
// This allows you to trigger analysis on-demand during development/testing
const axios = require('axios');
const { storeAnalysis, markAsUpdated } = require('../../utils/cache');
const { analyzeAllCategories } = require('../../utils/analyzer');

module.exports = async (req, res) => {
  try {
    console.log('[MANUAL TRIGGER] Starting analysis at', new Date().toISOString());
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
    console.log('[MANUAL] Fetching data for', stockSymbols.length, 'stocks from Yahoo Finance');
    const stockDataPromises = stockSymbols.map(async (symbol) => {
      try {
        // Fetch quote and chart data from Yahoo Finance
        const [quoteRes, chartRes, fundamentalsRes] = await Promise.all([
          axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, { 
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
          }),
          axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, { 
            params: { interval: '1d', range: '1y' },
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
          }),
          axios.get(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}`, { 
            params: { modules: 'summaryDetail,financialData,defaultKeyStatistics' },
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
          }).catch(err => {
            console.log(`[WARN] Fundamentals fetch failed for ${symbol}:`, err.message);
            return { data: null }; // Return empty data instead of failing
          })
        ]);
        
        const quote = quoteRes.data?.chart?.result?.[0];
        const chart = chartRes.data?.chart?.result?.[0];
        const fundamentals = fundamentalsRes?.data?.quoteSummary?.result?.[0];
        
        if (!quote || !chart) {
          throw new Error('Invalid response from Yahoo Finance');
        }
        
        // DEBUG: Log fundamental data structure
        if (symbol === 'RELIANCE.NS') {
          console.log('[DEBUG] Raw Yahoo Finance data for RELIANCE.NS:');
          console.log('[DEBUG] Quote meta:', JSON.stringify(quote.meta, null, 2));
          console.log('[DEBUG] Has fundamentals from quoteSummary?', !!fundamentals);
          if (fundamentals) {
            console.log('[DEBUG] summaryDetail:', JSON.stringify(fundamentals.summaryDetail, null, 2));
            console.log('[DEBUG] financialData:', JSON.stringify(fundamentals.financialData, null, 2));
            console.log('[DEBUG] defaultKeyStatistics:', JSON.stringify(fundamentals.defaultKeyStatistics, null, 2));
          }
        }
        
        // Extract fundamental data
        const fundamentalsData = fundamentals ? {
          peRatio: fundamentals.summaryDetail?.trailingPE?.raw || fundamentals.defaultKeyStatistics?.trailingPE?.raw || null,
          forwardPE: fundamentals.defaultKeyStatistics?.forwardPE?.raw || null,
          profitMargin: fundamentals.financialData?.profitMargins?.raw || null,
          roe: fundamentals.financialData?.returnOnEquity?.raw || null,
          roa: fundamentals.financialData?.returnOnAssets?.raw || null,
          debtToEquity: fundamentals.financialData?.debtToEquity?.raw || null,
          currentRatio: fundamentals.financialData?.currentRatio?.raw || null,
          revenueGrowth: fundamentals.financialData?.revenueGrowth?.raw || null,
          earningsGrowth: fundamentals.financialData?.earningsGrowth?.raw || null,
          beta: fundamentals.summaryDetail?.beta?.raw || null,
          dividendYield: fundamentals.summaryDetail?.dividendYield?.raw || null
        } : {};
        
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
          fundamentals: fundamentalsData,
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
