// API endpoint to fetch pre-computed analysis for a specific category
const { getAnalysis, getMetadata } = require('../../utils/cache');
const axios = require('axios');

// In-memory flag to track if auto-trigger is running (prevent duplicate triggers)
let autoTriggerRunning = false;

module.exports = async (req, res) => {
  try {
    const { category } = req.query;
    
    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'Category parameter is required'
      });
    }
    
    // Valid categories
    const validCategories = [
      'target-oriented',
      'swing',
      'fundamentally-strong',
      'technically-strong',
      'hot-stocks',
      'graha-gochar',
      'etf',
      'mutual-funds'
    ];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }
    
    // Get cached analysis and metadata
    const analysis = await getAnalysis(category);
    const metadata = await getMetadata();
    
    // AUTO-TRIGGER LOGIC: Check if cache is stale or empty
    const isCacheStale = !metadata || !metadata.timestamp || 
                         (Date.now() - metadata.timestamp > 24 * 60 * 60 * 1000); // 24 hours
    const isCacheEmpty = !analysis || analysis.length === 0;
    
    // If cache is stale/empty AND no trigger is running, start background refresh
    if ((isCacheStale || isCacheEmpty) && !autoTriggerRunning) {
      console.log('[AUTO-TRIGGER] Cache stale or empty, triggering background refresh...');
      autoTriggerRunning = true;
      
      // Trigger in background (don't wait for it)
      axios.get(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/trigger`)
        .then(() => {
          console.log('[AUTO-TRIGGER] Background refresh completed');
          autoTriggerRunning = false;
        })
        .catch(err => {
          console.error('[AUTO-TRIGGER] Background refresh failed:', err.message);
          autoTriggerRunning = false;
        });
    }
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not available yet. Refresh in progress...',
        message: 'Analysis is computed daily at 9:00 PM IST. Cache is being refreshed now.',
        refreshing: autoTriggerRunning
      });
    }
    
    res.status(200).json({
      success: true,
      category,
      data: analysis,
      metadata: {
        lastUpdated: metadata?.timestamp,
        stocksAnalyzed: metadata?.stocksAnalyzed,
        successRate: metadata?.successRate,
        count: analysis.length
      }
    });
    
  } catch (error) {
    console.error('[API] Error fetching analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
