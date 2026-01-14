// API endpoint to fetch pre-computed analysis for a specific category
const { getAnalysis, getMetadata } = require('../../utils/cache');

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
