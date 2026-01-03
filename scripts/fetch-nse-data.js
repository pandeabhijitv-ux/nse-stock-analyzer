// Fetch real NSE stock data and update app
const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// NSE stocks to track - Expanded with more sectors and mid-cap stocks
const NSE_SYMBOLS = {
    'IT': ['TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM', 'LTIM', 'COFORGE', 'PERSISTENT', 'MPHASIS', 'LTTS'],
    'Banking': ['HDFCBANK', 'ICICIBANK', 'KOTAKBANK', 'AXISBANK', 'SBIN', 'INDUSINDBK', 'BANKBARODA', 'PNB', 'IDFCFIRSTB', 'FEDERALBNK'],
    'FMCG': ['HINDUNILVR', 'ITC', 'NESTLEIND', 'BRITANNIA', 'DABUR', 'MARICO', 'GODREJCP', 'COLPAL', 'TATACONSUM', 'EMAMILTD'],
    'Finance': ['BAJFINANCE', 'BAJAJFINSV', 'HDFCLIFE', 'SBILIFE', 'ICICIGI', 'ICICIPRU', 'LTF', 'CHOLAFIN', 'MUTHOOTFIN', 'MANAPPURAM'],
    'Automobile': ['MARUTI', 'TATAMOTORS', 'M&M', 'HEROMOTOCO', 'BAJAJ-AUTO', 'EICHERMOT', 'TVSMOTOR', 'ASHOKLEY', 'MOTHERSON', 'MRF'],
    'Pharma': ['SUNPHARMA', 'DRREDDY', 'CIPLA', 'DIVISLAB', 'APOLLOHOSP', 'BIOCON', 'TORNTPHARM', 'LUPIN', 'ALKEM', 'AUROPHARMA'],
    'Energy': ['RELIANCE', 'ONGC', 'NTPC', 'POWERGRID', 'BPCL', 'IOC', 'GAIL', 'COALINDIA', 'ADANIGREEN', 'TATAPOWER'],
    'Metals': ['TATASTEEL', 'JSWSTEEL', 'HINDALCO', 'VEDL', 'NATIONALUM', 'HINDZINC', 'SAIL', 'NMDC', 'JINDALSTEL', 'MOIL'],
    'Infrastructure': ['LT', 'ADANIPORTS', 'ULTRACEMCO', 'GRASIM', 'DALBHARAT', 'RAMCOCEM', 'JKCEMENT', 'SHREECEM', 'ACC', 'AMBUJACEM'],
    'Consumer Durables': ['TITAN', 'HAVELLS', 'VOLTAS', 'WHIRLPOOL', 'CROMPTON', 'BLUESTARCO', 'SYMPHONY', 'DIXON', 'AMBER', 'RAJESHEXPO'],
    'Telecom': ['BHARTIARTL', 'INDUSINDBK', 'TATACOMM', 'TTML', 'GTPL', 'HFCL', 'STERLITE', 'ITI', 'VINDHYATEL', 'ZENTEC'],
    'Real Estate': ['DLF', 'GODREJPROP', 'OBEROIRLTY', 'PRESTIGE', 'BRIGADE', 'SOBHA', 'PHOENIXLTD', 'MAHLIFE', 'SUNTECK', 'IBREALEST'],
    'Chemicals': ['UPL', 'PIDILITIND', 'AARTI', 'DEEPAKNI', 'SRF', 'BALRAMCHIN', 'GNFC', 'ALKYLAMINE', 'NAVINFLUOR', 'TATACHEM'],
    'Media': ['ZEEL', 'SUNTV', 'PVRINOX', 'NETWORK18', 'SAREGAMA', 'NAZARA', 'TIPS', 'BALAJITELE', 'TVTODAY', 'UTVME'],
    'Hotels': ['INDHOTEL', 'LEMONTREE', 'CHALET', 'TAJGVK', 'EIH', 'ORIENTHOT', 'MAHINDCIE', 'ROYALORCH', 'TRENTL', 'JAIHINDPRO'],
    'Textiles': ['ARVIND', 'WELSPUNIND', 'TRIDENT', 'RAYMOND', 'VARDHACRLC', 'KPR', 'SWARAJENG', 'GOKEX', 'GUJALKALI', 'CENTEXT'],
    'Power': ['POWERGRID', 'NTPC', 'TATAPOWER', 'NHPC', 'SJVN', 'PFC', 'REC', 'TORNTPOWER', 'JSW ENERGY', 'ADANIPOWER'],
    'Retail': ['DMART', 'TRENT', 'SHOPERSTOP', 'ADITYA', 'VEDANT', 'VMART', 'VSTIND', 'SPENCERS', 'VBLSTORE', 'GULFPETRO']
};

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
    
    // Fetch all stocks
    for (const [sector, symbols] of Object.entries(NSE_SYMBOLS)) {
        console.log(`\n📊 Fetching ${sector} sector...`);
        
        for (const symbol of symbols) {
            const quote = await getStockQuote(symbol);
            
            if (quote) {
                allStockData[symbol] = quote;
                console.log(`  ✅ ${symbol}: ₹${quote.price} (${quote.changePercent > 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%)`);
                successCount++;
            } else {
                console.log(`  ❌ ${symbol}: Failed`);
                errorCount++;
            }
            
            // Delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    console.log(`\n✅ Fetched ${successCount} stocks successfully`);
    console.log(`❌ Failed: ${errorCount} stocks`);
    
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
