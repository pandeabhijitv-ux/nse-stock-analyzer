// NEW: Returns latest analysis from trigger (no cache needed - Vercel serverless workaround)
// Since Vercel serverless functions can't share memory, we store in a simple JSON file
const fs = require('fs');
const path = require('path');

// Path to store latest analysis (accessible across serverless invocations)
const LATEST_DATA_PATH = path.join('/tmp', 'latest-analysis.json');

// Store latest analysis (called by trigger endpoint)
const storeLatestAnalysis = (data) => {
  try {
    fs.writeFileSync(LATEST_DATA_PATH, JSON.stringify(data));
    console.log('[LATEST] Stored analysis with', Object.keys(data.data).length, 'categories');
    return true;
  } catch (error) {
    console.error('[LATEST] Error storing:', error.message);
    return false;
  }
};

// Get latest analysis
const getLatestAnalysis = () => {
  try {
    if (!fs.existsSync(LATEST_DATA_PATH)) {
      console.log('[LATEST] No data file found');
      return null;
    }
    
    const data = JSON.parse(fs.readFileSync(LATEST_DATA_PATH, 'utf8'));
    
    // Check if data is stale (older than 25 hours)
    const age = Date.now() - new Date(data.metadata.timestamp).getTime();
    const MAX_AGE = 25 * 60 * 60 * 1000; // 25 hours
    
    if (age > MAX_AGE) {
      console.log('[LATEST] Data is stale (', Math.round(age / 1000 / 60 / 60), 'hours old)');
      return null;
    }
    
    console.log('[LATEST] Returning cached data from', data.metadata.timestamp);
    return data;
  } catch (error) {
    console.error('[LATEST] Error reading:', error.message);
    return null;
  }
};

module.exports = async (req, res) => {
  try {
    const { category } = req.query;
    
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
    
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }
    
    // Get latest analysis
    const latest = getLatestAnalysis();
    
    if (!latest) {
      return res.status(404).json({
        success: false,
        error: 'No recent analysis available. Please trigger a new analysis.',
        message: 'Call POST /api/trigger to generate fresh analysis'
      });
    }
    
    // If category specified, return just that category
    if (category) {
      return res.status(200).json({
        success: true,
        category,
        data: {
          stocks: latest.data[category] || [],
          count: (latest.data[category] || []).length
        },
        metadata: latest.metadata
      });
    }
    
    // Return all categories
    res.status(200).json({
      success: true,
      stats: latest.stats,
      categories: Object.keys(latest.data).reduce((acc, key) => {
        acc[key] = latest.data[key].length;
        return acc;
      }, {}),
      data: latest.data,
      metadata: latest.metadata
    });
    
  } catch (error) {
    console.error('[LATEST] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Export helper functions for trigger endpoint
module.exports.storeLatestAnalysis = storeLatestAnalysis;
module.exports.getLatestAnalysis = getLatestAnalysis;
