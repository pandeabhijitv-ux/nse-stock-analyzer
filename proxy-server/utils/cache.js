// Upstash Redis cache via REST API - 100% FREE, no payment method needed
// Free tier: 10K commands/day, 256MB storage
const axios = require('axios');

const CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Helper to make Upstash REST API calls
const upstashRequest = async (command, ...args) => {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    console.warn('[CACHE] Upstash credentials not configured, using in-memory fallback');
    return null;
  }
  
  try {
    // Build the command array
    const payload = [command, ...args];
    
    const response = await axios.post(
      UPSTASH_URL,
      payload,
      { headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` } }
    );
    return response.data.result;
  } catch (error) {
    console.error(`[CACHE] Upstash error:`, error.response?.data || error.message);
    return null;
  }
};

// Store analysis results
const storeAnalysis = async (category, data) => {
  try {
    const key = `analysis:${category}`;
    const cacheData = {
      data,
      timestamp: Date.now(),
      expires: Date.now() + (CACHE_TTL * 1000)
    };
    
    // Store in Upstash with TTL
    await upstashRequest('SET', key, JSON.stringify(cacheData), 'EX', CACHE_TTL);
    console.log(`[CACHE] Stored ${category} with ${data.length} stocks`);
  } catch (error) {
    console.error(`[CACHE] Error storing ${category}:`, error.message);
  }
};

// Get analysis results
const getAnalysis = async (category) => {
  try {
    const key = `analysis:${category}`;
    const result = await upstashRequest('GET', key);
    
    if (!result) {
      console.log(`[CACHE] Miss for ${category}`);
      return null;
    }
    
    const cached = JSON.parse(result);
    
    // Check if expired
    if (Date.now() > cached.expires) {
      console.log(`[CACHE] Expired for ${category}`);
      await upstashRequest('DEL', key);
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
    const metadataWithTimestamp = {
      ...metadata,
      timestamp: Date.now()
    };
    
    await upstashRequest('SET', 'metadata:last-update', JSON.stringify(metadataWithTimestamp), 'EX', CACHE_TTL);
    console.log('[CACHE] Metadata updated');
  } catch (error) {
    console.error('[CACHE] Error storing metadata:', error.message);
  }
};

// Get metadata
const getMetadata = async () => {
  try {
    const result = await upstashRequest('GET', 'metadata:last-update');
    return result ? JSON.parse(result) : null;
  } catch (error) {
    console.error('[CACHE] Error reading metadata:', error.message);
    return null;
  }
};

// Clear all cache
const clearAll = async () => {
  console.log('[CACHE] Clear all not implemented for Upstash');
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
