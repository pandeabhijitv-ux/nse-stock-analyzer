// Simple in-memory cache with TTL (can be replaced with Redis later)
// For now using in-memory, but structured for easy Redis migration

const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Store analysis results
const storeAnalysis = async (category, data) => {
  const key = `analysis:${category}`;
  cache.set(key, {
    data,
    timestamp: Date.now(),
    expires: Date.now() + CACHE_TTL
  });
  console.log(`[CACHE] Stored ${category} with ${data.length} stocks`);
};

// Get analysis results
const getAnalysis = async (category) => {
  const key = `analysis:${category}`;
  const cached = cache.get(key);
  
  if (!cached) {
    console.log(`[CACHE] Miss for ${category}`);
    return null;
  }
  
  // Check if expired
  if (Date.now() > cached.expires) {
    console.log(`[CACHE] Expired for ${category}`);
    cache.delete(key);
    return null;
  }
  
  console.log(`[CACHE] Hit for ${category}`);
  return cached.data;
};

// Store metadata about last analysis
const markAsUpdated = async (metadata) => {
  cache.set('metadata:last-update', {
    ...metadata,
    timestamp: Date.now()
  });
  console.log('[CACHE] Metadata updated');
};

// Get metadata
const getMetadata = async () => {
  return cache.get('metadata:last-update') || null;
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
