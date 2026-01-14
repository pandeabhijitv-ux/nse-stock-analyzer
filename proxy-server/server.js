// Stock Analyzer Backend - Serverless Functions
// API routes are in /api folder as Vercel serverless functions

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok',
        message: 'Stock Analyzer Backend',
        endpoints: [
            '/api/health',
            '/api/analysis',
            '/api/commodities',
            '/api/top-options-cached',
            '/api/trigger',
            '/api/cron/analyze-stocks'
        ]
    });
});

// For Vercel serverless deployment
module.exports = app;
