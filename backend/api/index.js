// NSE Options API Proxy Server
// Bypasses CORS restrictions and adds caching
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const NodeCache = require('node-cache');

const app = express();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'NSE Options Proxy API',
        endpoints: {
            optionChain: '/api/option-chain/:symbol',
            stockQuote: '/api/quote/:symbol'
        }
    });
});

// Get NSE Option Chain
app.get('/api/option-chain/:symbol', async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    
    // Check cache first
    const cacheKey = `option-chain-${symbol}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
        console.log(`✅ Cache hit for ${symbol}`);
        return res.json(cachedData);
    }
    
    try {
        console.log(`🔍 Fetching option chain for ${symbol}...`);
        
        // NSE requires cookies, so we need to get them first
        const cookieResponse = await fetch('https://www.nseindia.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive'
            }
        });
        
        const cookies = cookieResponse.headers.raw()['set-cookie'];
        const cookieString = cookies ? cookies.map(cookie => cookie.split(';')[0]).join('; ') : '';
        
        // Now fetch option chain with cookies
        const response = await fetch(
            `https://www.nseindia.com/api/option-chain-equities?symbol=${symbol}`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Cookie': cookieString,
                    'Referer': 'https://www.nseindia.com/'
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`NSE API returned ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.records || !data.records.data) {
            return res.status(404).json({
                error: 'No option chain data found',
                symbol
            });
        }
        
        // Cache the response
        cache.set(cacheKey, data);
        console.log(`✅ Fetched and cached option chain for ${symbol}`);
        
        res.json(data);
        
    } catch (error) {
        console.error(`❌ Error fetching option chain for ${symbol}:`, error.message);
        res.status(500).json({
            error: 'Failed to fetch option chain',
            message: error.message,
            symbol
        });
    }
});

// Get NSE Stock Quote
app.get('/api/quote/:symbol', async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    
    const cacheKey = `quote-${symbol}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
        return res.json(cachedData);
    }
    
    try {
        const cookieResponse = await fetch('https://www.nseindia.com/');
        const cookies = cookieResponse.headers.raw()['set-cookie'];
        const cookieString = cookies ? cookies.map(cookie => cookie.split(';')[0]).join('; ') : '';
        
        const response = await fetch(
            `https://www.nseindia.com/api/quote-equity?symbol=${symbol}`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json',
                    'Cookie': cookieString,
                    'Referer': 'https://www.nseindia.com/'
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`NSE API returned ${response.status}`);
        }
        
        const data = await response.json();
        cache.set(cacheKey, data, 60); // 1 minute cache for quotes
        
        res.json(data);
        
    } catch (error) {
        console.error(`Error fetching quote for ${symbol}:`, error.message);
        res.status(500).json({
            error: 'Failed to fetch quote',
            message: error.message,
            symbol
        });
    }
});

// Export for Vercel serverless
module.exports = app;
