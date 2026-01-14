// Health check endpoint to verify if cached data is available and fresh
const { getMetadata, isCacheFresh } = require('../../utils/cache');

module.exports = async (req, res) => {
  try {
    const metadata = await getMetadata();
    const fresh = await isCacheFresh();
    
    if (!metadata) {
      return res.status(503).json({
        success: false,
        status: 'no-data',
        message: 'No analysis data available. Waiting for first cron run at 6:00 AM IST'
      });
    }
    
    res.status(200).json({
      success: true,
      status: fresh ? 'fresh' : 'stale',
      metadata: {
        lastUpdated: metadata.timestamp,
        stocksAnalyzed: metadata.stocksAnalyzed,
        totalStocks: metadata.totalStocks,
        successRate: metadata.successRate,
        duration: metadata.duration
      },
      nextUpdate: '6:00 AM IST daily'
    });
    
  } catch (error) {
    console.error('[HEALTH] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
