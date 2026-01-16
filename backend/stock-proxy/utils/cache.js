// Upstash Redis persistent cache with 24-hour TTL
// Survives Vercel serverless restarts, perfect for multiple users

const { Redis } = require('@upstash/redis');

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours in seconds

// Store analysis results
const storeAnalysis = async (category, data) => {
  try {
    const key = `analysis:${category}`;
    const value = {
      data,
      timestamp: Date.now(),
      expires: Date.now() + (CACHE_TTL_SECONDS * 1000)
    };
    
    // Store in Redis with TTL (Upstash automatically expires after 24h)
    await redis.set(key, JSON.stringify(value), { ex: CACHE_TTL_SECONDS });
    console.log(`[REDIS] Stored ${category} with ${data.length} stocks (TTL: 24h)`);
  } catch (error) {
    console.error(`[REDIS] Error storing ${category}:`, error.message);
    throw error;
  }
};

// Get analysis results
const getAnalysis = async (category) => {
  try {
    const key = `analysis:${category}`;
    const cached = await redis.get(key);
    
    if (!cached) {
      console.log(`[REDIS] Miss for ${category}`);
      return null;
    }
    
    // Parse JSON (Upstash returns string)
    const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
    
    // Check if expired (redundant since Upstash auto-expires, but good fallback)
    if (Date.now() > parsed.expires) {
      console.log(`[REDIS] Expired for ${category}`);
      await redis.del(key);
      return null;
    }
    
    console.log(`[REDIS] Hit for ${category}`);
    return parsed.data;
  } catch (error) {
    console.error(`[REDIS] Error getting ${category}:`, error.message);
    return null; // Fallback gracefully
  }
};

// Store metadata about last analysis
const markAsUpdated = async (metadata) => {
  try {
    const value = {
      ...metadata,
      timestamp: Date.now()
    };
    await redis.set('metadata:last-update', JSON.stringify(value));
    console.log('[REDIS] Metadata updated');
  } catch (error) {
    console.error('[REDIS] Error updating metadata:', error.message);
  }
};

// Get metadata
const getMetadata = async () => {
  try {
    const cached = await redis.get('metadata:last-update');
    if (!cached) return null;
    return typeof cached === 'string' ? JSON.parse(cached) : cached;
  } catch (error) {
    console.error('[REDIS] Error getting metadata:', error.message);
    return null;
  }
};

// Clear all cache
const clearAll = async () => {
  try {
    // Delete all analysis keys
    const categories = ['target-oriented', 'swing', 'fundamentally-strong', 'technically-strong', 'hot-stocks', 'graha-gochar'];
    const deletePromises = categories.map(cat => redis.del(`analysis:${cat}`));
    await Promise.all(deletePromises);
    await redis.del('metadata:last-update');
    console.log('[REDIS] All cache cleared');
  } catch (error) {
    console.error('[REDIS] Error clearing cache:', error.message);
  }
};

// Check if cache is fresh (updated today)
const isCacheFresh = async () => {
  try {
    const metadata = await getMetadata();
    if (!metadata) return false;
    
    const now = new Date();
    const lastUpdate = new Date(metadata.timestamp);
    
    // Check if same day
    return now.toDateString() === lastUpdate.toDateString();
  } catch (error) {
    console.error('[REDIS] Error checking freshness:', error.message);
    return false;
  }
};

module.exports = {
  storeAnalysis,
  getAnalysis,
  markAsUpdated,
  getMetadata,
  clearAll,
  isCacheFresh
};
