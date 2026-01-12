const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for mobile app
app.use(cors());
app.use(express.json());

// Yahoo Finance Base URLs
const YAHOO_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance';
const YAHOO_BASE_URL_V10 = 'https://query1.finance.yahoo.com/v10/finance';

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Stock Analyzer Proxy Server' });
});

// Fetch stock quote
app.get('/api/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const response = await axios.get(`${YAHOO_BASE_URL}/chart/${symbol}`, {
      params: {
        interval: '1d',
        range: '1y',
      },
      timeout: 10000,
    });
    
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching quote for ${req.params.symbol}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Fetch fundamental data
app.get('/api/fundamentals/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const response = await axios.get(`${YAHOO_BASE_URL_V10}/quoteSummary/${symbol}`, {
      params: {
        modules: 'defaultKeyStatistics,financialData,summaryDetail,price,summaryProfile',
      },
      timeout: 10000,
    });
    
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching fundamentals for ${req.params.symbol}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Search stocks
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    const response = await axios.get('https://query1.finance.yahoo.com/v1/finance/search', {
      params: {
        q,
        quotesCount: 10,
        newsCount: 0,
      },
      timeout: 10000,
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error searching stocks:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Stock Proxy Server running on port ${PORT}`);
});
