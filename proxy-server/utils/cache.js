// Vercel KV (Redis) cache - persistent across all function invocations
const { kv } = require('@vercel/kv');

const CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds (KV uses seconds)

// Store analysis results
const storeAnalysis = async (category, data) => {
  try {
    const key = `analysis:${category}`;
    const cacheData = {
      data,
      timestamp: Date.now(),
      expires: Date.now() + (CACHE_TTL * 1000)
    };
    
    // Store in KV with TTL
    await kv.set(key, cacheData, { ex: CACHE_TTL });
    console.log(`[KV] Stored ${category} with ${data.length} stocks`);
  } catch (error) {
    console.error(`[KV] Error storing ${category}:`, error.message);
  }
};

// Get analysis results
const getAnalysis = async (category) => {
  try {
    const key = `analysis:${category}`;
    const cached = await kv.get(key);
    
    if (!cached) {
      console.log(`[KV] Miss for ${category}`);
      return null;
    }
    
    // Check if expired (extra safety, though KV handles TTL)
    if (Date.now() > cached.expires) {
      console.log(`[KV] Expired for ${category}`);
      await kv.del(key);
      return null;
    }
    
    console.log(`[KV] Hit for ${category}`);
    return cached.data;
  } catch (error) {
    console.error(`[KV] Error reading ${category}:`, error.message);
    return null;
  }
};

// Store metadata about last analysis
const markAsUpdated = async (metadata) => {
  try {
    const metadataWithTimestamp = {
      ...metadata,
      timestamp: Date.now()
    };
    
    await kv.set('metadata:last-update', metadataWithTimestamp, { ex: CACHE_TTL });
    console.log('[KV] Metadata updated');
  } catch (error) {
    console.error('[KV] Error storing metadata:', error.message);
  }
};

// Get metadata
const getMetadata = async () => {
  try {
    const metadata = await kv.get('metadata:last-update');
    return metadata || null;
  } catch (error) {
    console.error('[KV] Error reading metadata:', error.message);
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
