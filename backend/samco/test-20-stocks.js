// Test 20 stocks for availability
const fetch = require('node-fetch');

const stocksToTest = [
    { symbol: 'RELIANCE', strike: 1580 },
    { symbol: 'TCS', strike: 4200 },
    { symbol: 'HDFCBANK', strike: 1700 },
    { symbol: 'INFY', strike: 1900 },
    { symbol: 'ICICIBANK', strike: 1250 },
    { symbol: 'SBIN', strike: 800 },
    { symbol: 'BHARTIARTL', strike: 1600 },
    { symbol: 'ITC', strike: 460 },
    { symbol: 'KOTAKBANK', strike: 1900 },
    { symbol: 'LT', strike: 3600 },
    { symbol: 'AXISBANK', strike: 1100 },
    { symbol: 'HINDUNILVR', strike: 2400 },
    { symbol: 'MARUTI', strike: 11000 },
    { symbol: 'BAJFINANCE', strike: 7000 },
    { symbol: 'SUNPHARMA', strike: 1700 },
    { symbol: 'TMCV', strike: 900 },
    { symbol: 'WIPRO', strike: 580 },
    { symbol: 'ADANIENT', strike: 2400 },
    { symbol: 'TATASTEEL', strike: 140 },
    { symbol: 'M&M', strike: 2800 },
];

async function testStocks() {
    console.log('🔍 Testing 20 stocks for option chain availability...\n');
    
    const results = { working: [], failing: [] };
    
    for (const stock of stocksToTest) {
        try {
            const url = `http://localhost:3002/api/option-chain?symbol=${encodeURIComponent(stock.symbol)}&expiry=2026-01-27&strike=${stock.strike}&type=CE`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success && data.totalOptions > 0) {
                console.log(`✅ ${stock.symbol.padEnd(15)} - OK (Strike: ${stock.strike})`);
                results.working.push(stock.symbol);
            } else {
                console.log(`❌ ${stock.symbol.padEnd(15)} - FAILED: ${data.error || 'No options found'}`);
                results.failing.push({ symbol: stock.symbol, error: data.error });
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.log(`❌ ${stock.symbol.padEnd(15)} - ERROR: ${error.message}`);
            results.failing.push({ symbol: stock.symbol, error: error.message });
        }
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Working: ${results.working.length}/20`);
    console.log(`❌ Failing: ${results.failing.length}/20`);
    
    if (results.failing.length > 0) {
        console.log('\n❌ Failed stocks:');
        results.failing.forEach(f => console.log(`   - ${f.symbol}: ${f.error}`));
    }
}

testStocks().catch(console.error);
