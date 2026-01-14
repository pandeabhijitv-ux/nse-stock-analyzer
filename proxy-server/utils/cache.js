// Filesystem-based cache for Vercel serverless (uses /tmp directory)
// Vercel's /tmp persists across warm function invocations

const fs = require('fs');
const path = require('path');

const CACHE_DIR = '/tmp/stock-cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Ensure cache directory exists
const ensureCacheDir = () => {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
};

// Store analysis results
const storeAnalysis = async (category, data) => {
  try {
    ensureCacheDir();
    const filePath = path.join(CACHE_DIR, `${category}.json`);
    const cacheData = {
      data,
      timestamp: Date.now(),
      expires: Date.now() + CACHE_TTL
    };
    fs.writeFileSync(filePath, JSON.stringify(cacheData));
    console.log(`[CACHE] Stored ${category} with ${data.length} stocks to ${filePath}`);
  } catch (error) {
    console.error(`[CACHE] Error storing ${category}:`, error.message);
  }
};

// Get analysis results
const getAnalysis = async (category) => {
  try {
    const filePath = path.join(CACHE_DIR, `${category}.json`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`[CACHE] Miss for ${category} (file not found)`);
      return null;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const cached = JSON.parse(fileContent);
    
    // Check if expired
    if (Date.now() > cached.expires) {
      console.log(`[CACHE] Expired for ${category}`);
      fs.unlinkSync(filePath);
      return null;
    }
    
    console.log(`[CACHE] Hit for ${category}`);
    return cached.data;
  } catch (error) {
    console.error(`[CACHE] Error reading ${category}:`, error.message);
    return null;
  }
};

// Store metadata about last analysis
const markAsUpdated = async (metadata) => {
  try {
    ensureCacheDir();
    const filePath = path.join(CACHE_DIR, 'metadata.json');
    fs.writeFileSync(filePath, JSON.stringify({
      ...metadata,
      timestamp: Date.now()
    }));
    console.log('[CACHE] Metadata updated');
  } catch (error) {
    console.error('[CACHE] Error storing metadata:', error.message);
  }
};

// Get metadata
const getMetadata = async () => {
  try {
    const filePath = path.join(CACHE_DIR, 'metadata.json');
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('[CACHE] Error reading metadata:', error.message);
    return null;
  }
};
};

// Clear all cache
const clearAll = async () => {
  cache.clear();
  console.log('[CACHE] All cache cleared');
};

// Check if cache is fresh (updated today)
const isCacheFresh = async () => {
  const metadata = await getMetadata();
  if (!metadata) return false;
  
  const now = new Date();
  const lastUpdate = new Date(metadata.timestamp);
  
  // Check if same day
  return now.toDateString() === lastUpdate.toDateString();
};

module.exports = {
  storeAnalysis,
  getAnalysis,
  markAsUpdated,
  getMetadata,
  clearAll,
  isCacheFresh
};
