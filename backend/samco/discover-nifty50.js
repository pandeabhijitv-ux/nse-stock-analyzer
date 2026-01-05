// Discover all Nifty 50 stocks with options available for Jan 27, 2026
const fetch = require('node-fetch');

const NIFTY_50_STOCKS = [
    'ADANIENT', 'ADANIPORTS', 'APOLLOHOSP', 'ASIANPAINT', 'AXISBANK',
    'BAJAJ-AUTO', 'BAJFINANCE', 'BAJAJFINSV', 'BPCL', 'BHARTIARTL',
    'BRITANNIA', 'CIPLA', 'COALINDIA', 'DIVISLAB', 'DRREDDY',
    'EICHERMOT', 'GRASIM', 'HCLTECH', 'HDFCBANK', 'HDFCLIFE',
    'HEROMOTOCO', 'HINDALCO', 'HINDUNILVR', 'ICICIBANK', 'ITC',
    'INDUSINDBK', 'INFY', 'JSWSTEEL', 'KOTAKBANK', 'LT',
    'M&M', 'MARUTI', 'NTPC', 'NESTLEIND', 'ONGC',
    'POWERGRID', 'RELIANCE', 'SBILIFE', 'SBIN', 'SUNPHARMA',
    'TCS', 'TATACONSUM', 'TATAMOTORS', 'TATASTEEL', 'TECHM',
    'TITAN', 'ULTRACEMCO', 'UPL', 'WIPRO', 'ZOMATO'
];

// Common strike prices to test for each stock (we'll try multiple)
const STRIKE_RANGES = {
    high: [10000, 11000, 12000],     // NESTLEIND, ULTRACEMCO, MARUTI
    mid: [1500, 1600, 1700, 1800],   // Most banking/large caps
    low: [100, 200, 300, 400, 500],  // Smaller stocks
};

async function testStockWithMultipleStrikes(symbol, expiry) {
    // Try different strike ranges to find what works
    const strikesToTest = [...STRIKE_RANGES.high, ...STRIKE_RANGES.mid, ...STRIKE_RANGES.low];
    
    for (const strike of strikesToTest) {
        try {
            const url = `http://localhost:3002/api/option-chain?symbol=${encodeURIComponent(symbol)}&expiry=${expiry}&strike=${strike}&type=CE`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success && data.totalOptions > 0) {
                // Found a working strike! Get the spot price to calculate better strikes
                const spotPrice = data.options[0].spotPrice;
                const atmStrike = Math.round(spotPrice / 10) * 10; // Round to nearest 10
                const itmStrike = Math.round((spotPrice * 0.98) / 10) * 10; // 2% ITM
                
                return {
                    success: true,
                    symbol: symbol,
                    spotPrice: spotPrice,
                    recommendedStrikes: [itmStrike, atmStrike],
                    testedStrike: strike
                };
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            // Continue to next strike
        }
    }
    
    return { success: false, symbol: symbol };
}

async function discoverWorkingStocks() {
    console.log('🔍 Testing all Nifty 50 stocks for Jan 27, 2026 expiry...\n');
    console.log('This will take ~5 minutes due to rate limiting\n');
    
    const expiry = '2026-01-27';
    const workingStocks = [];
    const failingStocks = [];
    
    for (let i = 0; i < NIFTY_50_STOCKS.length; i++) {
        const symbol = NIFTY_50_STOCKS[i];
        const progress = `[${i + 1}/${NIFTY_50_STOCKS.length}]`;
        
        console.log(`${progress} Testing ${symbol.padEnd(15)}...`);
        
        const result = await testStockWithMultipleStrikes(symbol, expiry);
        
        if (result.success) {
            console.log(`   ✅ WORKING - Spot: ₹${result.spotPrice}, Strikes: ${result.recommendedStrikes.join(', ')}`);
            workingStocks.push(result);
        } else {
            console.log(`   ❌ FAILED - No options found for ${expiry}`);
            failingStocks.push(symbol);
        }
        
        // Rate limiting between stocks
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 DISCOVERY RESULTS');
    console.log('='.repeat(80));
    console.log(`✅ Working stocks: ${workingStocks.length}/50`);
    console.log(`❌ Failing stocks: ${failingStocks.length}/50`);
    
    if (workingStocks.length >= 25) {
        console.log(`\n🎯 SUCCESS! Found ${workingStocks.length} working stocks (target: 25-30)`);
    } else {
        console.log(`\n⚠️  Only found ${workingStocks.length} stocks (target: 25-30)`);
    }
    
    // Generate code for pwa/index.html
    console.log('\n' + '='.repeat(80));
    console.log('📝 CODE FOR PWA/INDEX.HTML:');
    console.log('='.repeat(80));
    console.log('const stocksToFetch = [');
    
    workingStocks.forEach(stock => {
        const strikes = stock.recommendedStrikes;
        console.log(`    { symbol: '${stock.symbol}', expiry: '2026-01-27', strikes: [${strikes[0]}, ${strikes[1]}] },  // Spot: ₹${stock.spotPrice}`);
    });
    
    console.log('];');
    console.log(`\n// Total API calls: ${workingStocks.length} stocks × 2 strikes × 2 types = ${workingStocks.length * 4}`);
    
    // Save results to file
    const fs = require('fs');
    const results = {
        date: new Date().toISOString(),
        expiry: expiry,
        totalTested: NIFTY_50_STOCKS.length,
        working: workingStocks,
        failing: failingStocks
    };
    
    fs.writeFileSync('nifty50-discovery-results.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Results saved to: nifty50-discovery-results.json');
}

discoverWorkingStocks().catch(console.error);
