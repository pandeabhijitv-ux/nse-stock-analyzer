// Simple CORS proxy for MOSL API
// Deploy this to Vercel, Railway, or any Node.js hosting

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for your GitHub Pages domain
app.use(cors({
    origin: ['https://pandeabhijitv-ux.github.io', 'http://localhost:8001'],
    credentials: true
}));

app.use(express.json());

const MOSL_API_KEY = 'sTHWtNb6bn5bGiY';
const MOSL_SECRET_KEY = '3d622c3d-7f36-43ee-8776-9056e454324a';

// Store token in memory (resets on server restart)
let accessToken = null;
let tokenExpiry = null;

// Authenticate with MOSL API
async function getMOSLToken() {
    try {
        console.log('🔐 Authenticating with MOSL API...');
        
        const response = await fetch('https://api.motilaloswal.com/rest/auth/v1/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': MOSL_API_KEY
            },
            body: JSON.stringify({
                secretKey: MOSL_SECRET_KEY
            })
        });
        
        if (!response.ok) {
            console.error('MOSL auth failed:', response.status);
            return null;
        }
        
        const data = await response.json();
        accessToken = data.accessToken;
        tokenExpiry = Date.now() + (55 * 60 * 1000); // 55 minutes (refresh before 1 hour expiry)
        
        console.log('✅ MOSL authenticated successfully');
        return accessToken;
    } catch (error) {
        console.error('MOSL auth error:', error.message);
        return null;
    }
}

// Check token validity
async function ensureValidToken() {
    if (!accessToken || Date.now() >= tokenExpiry) {
        return await getMOSLToken();
    }
    return accessToken;
}

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'MOSL Proxy',
        authenticated: !!accessToken,
        tokenExpiry: tokenExpiry ? new Date(tokenExpiry).toISOString() : null
    });
});

// Get server's outbound IP
app.get('/my-ip', async (req, res) => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        res.json({ 
            outboundIP: data.ip,
            message: 'Add this IP to MOSL Secondary IP field'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get IP' });
    }
});

// Get stock quote
app.get('/api/quote/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const exchange = req.query.exchange || 'NSE';
        
        const token = await ensureValidToken();
        if (!token) {
            return res.status(500).json({ error: 'Authentication failed' });
        }
        
        const response = await fetch(
            `https://api.motilaloswal.com/rest/quote/v1/getquote?symbol=${symbol}&exchange=${exchange}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-api-key': MOSL_API_KEY
                }
            }
        );
        
        if (!response.ok) {
            return res.status(response.status).json({ 
                error: 'MOSL API error', 
                status: response.status 
            });
        }
        
        const data = await response.json();
        res.json(data);
        
    } catch (error) {
        console.error('Quote error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get multiple quotes (batch)
app.post('/api/quotes', async (req, res) => {
    try {
        const { symbols, exchange = 'NSE' } = req.body;
        
        if (!symbols || !Array.isArray(symbols)) {
            return res.status(400).json({ error: 'symbols array required' });
        }
        
        const token = await ensureValidToken();
        if (!token) {
            return res.status(500).json({ error: 'Authentication failed' });
        }
        
        const results = [];
        
        for (const symbol of symbols) {
            try {
                const response = await fetch(
                    `https://api.motilaloswal.com/rest/quote/v1/getquote?symbol=${symbol}&exchange=${exchange}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'x-api-key': MOSL_API_KEY
                        }
                    }
                );
                
                if (response.ok) {
                    const data = await response.json();
                    results.push({ symbol, data, success: true });
                } else {
                    results.push({ symbol, error: `Status ${response.status}`, success: false });
                }
                
                // Delay between requests
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (error) {
                results.push({ symbol, error: error.message, success: false });
            }
        }
        
        res.json({ results });
        
    } catch (error) {
        console.error('Batch quotes error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 MOSL Proxy running on port ${PORT}`);
    console.log(`📍 CORS enabled for: https://pandeabhijitv-ux.github.io`);
    
    // Authenticate on startup
    getMOSLToken();
});
