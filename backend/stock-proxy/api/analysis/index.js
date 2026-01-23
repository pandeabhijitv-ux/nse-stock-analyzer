// API endpoint to fetch pre-computed analysis for a specific category
const { getAnalysis, getMetadata, deleteAnalysis } = require('../../utils/cache');
const { analyzeMarket } = require('../../utils/stockService');

module.exports = async (req, res) => {
  try {
    const { category, refresh, secret } = req.query;
    
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

    ];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }
    
    // Handle manual refresh request
    if (refresh === 'true') {
      // Verify secret key to prevent abuse
      const REFRESH_SECRET = process.env.REFRESH_SECRET || 'dev-secret-key-123';
      if (secret !== REFRESH_SECRET) {
        return res.status(403).json({
          success: false,
          error: 'Invalid or missing secret key for refresh',
          message: 'Use ?refresh=true&secret=YOUR_SECRET to manually refresh cache'
        });
      }
      
      console.log(`🔄 Manual refresh requested for category: ${category}`);
      
      // Delete cached data to force refresh
      await deleteAnalysis(category);
      
      // Trigger fresh analysis
      console.log('📊 Triggering fresh market analysis...');
      await analyzeMarket();
      console.log('✅ Fresh analysis complete!');
    }
    
    // Get cached analysis
    const analysis = await getAnalysis(category);
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not available yet. Please wait for next update cycle.',
        message: 'Analysis is computed daily at 6:00 AM IST'
      });
    }
    
    // Get metadata
    const metadata = await getMetadata();
    
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
