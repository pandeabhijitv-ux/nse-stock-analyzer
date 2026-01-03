// Fetch real NSE stock data and update app
const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Load NIFTY 500 symbols
const NIFTY500_FILE = path.join(__dirname, 'nifty500-symbols.json');
let NIFTY500_SYMBOLS = [];

try {
    NIFTY500_SYMBOLS = JSON.parse(fs.readFileSync(NIFTY500_FILE, 'utf8'));
    // Remove "NIFTY 500" index name if present
    NIFTY500_SYMBOLS = NIFTY500_SYMBOLS.filter(symbol => symbol !== 'NIFTY 500');
    console.log(`📊 Loaded ${NIFTY500_SYMBOLS.length} NIFTY 500 symbols`);
} catch (error) {
    console.error('❌ Failed to load NIFTY 500 symbols:', error.message);
    process.exit(1);
}

// NSE API endpoints (public)
const NSE_BASE_URL = 'https://www.nseindia.com';
const NSE_QUOTE_API = '/api/quote-equity?symbol=';
const NSE_OPTIONS_CHAIN_API = '/api/option-chain-equities?symbol=';

// User agent to mimic browser
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive'
};

let cookies = '';

// Fetch NSE data with cookie handling
async function fetchNSE(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: { ...headers, 'Cookie': cookies }
        };
        
        https.get(url, options, (res) => {
            // Store cookies from NSE
            if (res.headers['set-cookie']) {
                cookies = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
            }
            
            // Handle gzip/deflate compression
            let stream = res;
            const encoding = res.headers['content-encoding'];
            
            if (encoding === 'gzip') {
                stream = res.pipe(zlib.createGunzip());
            } else if (encoding === 'deflate') {
                stream = res.pipe(zlib.createInflate());
            } else if (encoding === 'br') {
                stream = res.pipe(zlib.createBrotliDecompress());
            }
            
            let data = '';
            stream.on('data', chunk => data += chunk);
            stream.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
            stream.on('error', reject);
        }).on('error', reject);
    });
}

// Initialize NSE session (required for subsequent API calls)
async function initNSESession() {
    return new Promise((resolve) => {
        https.get(NSE_BASE_URL, { headers }, (res) => {
            if (res.headers['set-cookie']) {
                cookies = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
            }
            resolve();
        });
    });
}

// Get stock quote from NSE
async function getStockQuote(symbol) {
    try {
        const data = await fetchNSE(`${NSE_BASE_URL}${NSE_QUOTE_API}${symbol}`);
        
        if (!data || !data.priceInfo) {
            console.error(`No data for ${symbol}`);
            return null;
        }
        
        const priceInfo = data.priceInfo;
        return {
            symbol,
            price: priceInfo.lastPrice,
            change: priceInfo.change,
            changePercent: priceInfo.pChange,
            open: priceInfo.open,
            high: priceInfo.intraDayHighLow?.max || priceInfo.lastPrice,
            low: priceInfo.intraDayHighLow?.min || priceInfo.lastPrice,
            close: priceInfo.close,
            volume: priceInfo.totalTradedVolume,
            week52High: priceInfo.weekHighLow?.max || priceInfo.lastPrice * 1.2,
            week52Low: priceInfo.weekHighLow?.min || priceInfo.lastPrice * 0.8
        };
    } catch (error) {
        console.error(`Error fetching ${symbol}:`, error.message);
        return null;
    }
}

// Get options chain data
async function getOptionsChain(symbol) {
    try {
        const data = await fetchNSE(`${NSE_BASE_URL}${NSE_OPTIONS_CHAIN_API}${symbol}`);
        
        if (!data || !data.records || !data.records.data) {
            return null;
        }
        
        const spotPrice = data.records.underlyingValue;
        const optionsData = data.records.data;
        
        // Find ATM, ITM, OTM strikes
        const atm = Math.round(spotPrice / 100) * 100;
        const otm = atm + 100;
        const itm = atm - 100;
        
        // Get premiums
        const atmData = optionsData.find(d => d.strikePrice === atm);
        const otmData = optionsData.find(d => d.strikePrice === otm);
        const itmData = optionsData.find(d => d.strikePrice === itm);
        
        return {
            spotPrice,
            atm,
            otm,
            itm,
            callPremiums: {
                atm: atmData?.CE?.lastPrice || 0,
                otm: otmData?.CE?.lastPrice || 0,
                itm: itmData?.CE?.lastPrice || 0
            },
            putPremiums: {
                atm: atmData?.PE?.lastPrice || 0,
                otm: otmData?.PE?.lastPrice || 0,
                itm: itmData?.PE?.lastPrice || 0
            },
            callOI: {
                atm: atmData?.CE?.openInterest || 0,
                otm: otmData?.CE?.openInterest || 0,
                itm: itmData?.CE?.openInterest || 0
            },
            putOI: {
                atm: atmData?.PE?.openInterest || 0,
                otm: otmData?.PE?.openInterest || 0,
                itm: itmData?.PE?.openInterest || 0
            }
        };
    } catch (error) {
        console.error(`Error fetching options for ${symbol}:`, error.message);
        return null;
    }
}

// Main function
async function main() {
    console.log('🚀 Fetching real NSE data...');
    console.log('⏰ Time:', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    
    // Initialize NSE session
    await initNSESession();
    console.log('✅ NSE session initialized');
    
    const allStockData = {};
    let successCount = 0;
    let errorCount = 0;
    
    // Fetch all NIFTY 500 stocks
    console.log(`\n📊 Fetching ${NIFTY500_SYMBOLS.length} NIFTY 500 stocks...`);
    
    for (let i = 0; i < NIFTY500_SYMBOLS.length; i++) {
        const symbol = NIFTY500_SYMBOLS[i];
        const quote = await getStockQuote(symbol);
        
        if (quote) {
            allStockData[symbol] = quote;
            successCount++;
            
            // Show progress every 50 stocks
            if ((i + 1) % 50 === 0) {
                console.log(`  Progress: ${i + 1}/${NIFTY500_SYMBOLS.length} (${Math.round((i + 1) / NIFTY500_SYMBOLS.length * 100)}%)`);
            }
        } else {
            errorCount++;
        }
        
        // Delay between requests to avoid rate limiting (shorter delay for batch processing)
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n✅ Fetched ${successCount} stocks successfully`);
    console.log(`❌ Failed: ${errorCount} stocks`);
    console.log(`📊 Success rate: ${(successCount / NIFTY500_SYMBOLS.length * 100).toFixed(1)}%`);
    
    // Update pwa/index.html with new prices
    updateAppPrices(allStockData);
    
    console.log('\n🎉 Done! App updated with real NSE prices.');
}

// Update REALISTIC_PRICES in pwa/index.html
function updateAppPrices(stockData) {
    const htmlPath = path.join(__dirname, '..', 'pwa', 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    // Build new REALISTIC_PRICES object
    let pricesCode = '            const REALISTIC_PRICES = {\n';
    
    for (const [symbol, data] of Object.entries(stockData)) {
        // Quote keys that contain special characters
        const key = symbol.includes('&') || symbol.includes('-') ? `'${symbol}'` : symbol;
        pricesCode += `                ${key}: ${data.price},\n`;
    }
    
    pricesCode += '            };';
    
    // Replace REALISTIC_PRICES in HTML
    const regex = /const REALISTIC_PRICES = \{[\s\S]*?\};/;
    html = html.replace(regex, pricesCode);
    
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log('✅ Updated pwa/index.html with real prices');
}

// Run
main().catch(console.error);
