// Comprehensive script to discover working stocks for current month's expiry
const fetch = require('node-fetch');

// Calculate last Tuesday of a given month (F&O expiry logic)
function getLastTuesday(year, month) {
    const lastDay = new Date(year, month + 1, 0); // Last day of month
    let lastTuesday = lastDay;
    
    // Find last Tuesday (2 = Tuesday in getDay())
    while (lastTuesday.getDay() !== 2) {
        lastTuesday.setDate(lastTuesday.getDate() - 1);
    }
    
    return lastTuesday;
}

// Get current and next month expiries
function getExpiryDates() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    const currentExpiry = getLastTuesday(currentYear, currentMonth);
    const nextExpiry = getLastTuesday(currentYear, currentMonth + 1);
    
    // If current expiry has passed, use next month
    const expiryToUse = today > currentExpiry ? nextExpiry : currentExpiry;
    
    return {
        current: currentExpiry.toISOString().split('T')[0],
        next: nextExpiry.toISOString().split('T')[0],
        recommended: expiryToUse.toISOString().split('T')[0]
    };
}

// Comprehensive list of Nifty 50 + other liquid stocks
const STOCK_UNIVERSE = [
    // Nifty 50
    { symbol: 'RELIANCE', strikes: [1560, 1580, 1600] },
    { symbol: 'TCS', strikes: [4200, 4250, 4300] },
    { symbol: 'HDFCBANK', strikes: [1680, 1700, 1720] },
    { symbol: 'INFY', strikes: [1880, 1900, 1920] },
    { symbol: 'ICICIBANK', strikes: [1230, 1250, 1270] },
    { symbol: 'HINDUNILVR', strikes: [2380, 2400, 2420] },
    { symbol: 'ITC', strikes: [440, 460, 480] },
    { symbol: 'SBIN', strikes: [780, 800, 820] },
    { symbol: 'BHARTIARTL', strikes: [1580, 1600, 1620] },
    { symbol: 'KOTAKBANK', strikes: [1880, 1900, 1920] },
    { symbol: 'LT', strikes: [3580, 3600, 3620] },
    { symbol: 'AXISBANK', strikes: [1080, 1100, 1120] },
    { symbol: 'ASIANPAINT', strikes: [2400, 2420, 2440] },
    { symbol: 'MARUTI', strikes: [10800, 11000, 11200] },
    { symbol: 'SUNPHARMA', strikes: [1680, 1700, 1720] },
    { symbol: 'BAJFINANCE', strikes: [6900, 7000, 7100] },
    { symbol: 'TITAN', strikes: [3400, 3420, 3440] },
    { symbol: 'WIPRO', strikes: [560, 580, 600] },
    { symbol: 'ULTRACEMCO', strikes: [10800, 11000, 11200] },
    { symbol: 'ONGC', strikes: [240, 250, 260] },
    { symbol: 'NTPC', strikes: [320, 330, 340] },
    { symbol: 'POWERGRID', strikes: [300, 310, 320] },
    { symbol: 'M&M', strikes: [2780, 2800, 2820] },
    { symbol: 'TATAMOTORS', strikes: [880, 900, 920] },
    { symbol: 'TMCV', strikes: [880, 900, 920] },  // Alternative symbol
    { symbol: 'JSWSTEEL', strikes: [920, 940, 960] },
    { symbol: 'TATASTEEL', strikes: [135, 140, 145] },
    { symbol: 'HINDALCO', strikes: [620, 640, 660] },
    { symbol: 'ADANIENT', strikes: [2380, 2400, 2420] },
    { symbol: 'ADANIPORTS', strikes: [1180, 1200, 1220] },
    { symbol: 'COALINDIA', strikes: [400, 410, 420] },
    { symbol: 'TECHM', strikes: [1620, 1640, 1660] },
    { symbol: 'HCLTECH', strikes: [1820, 1840, 1860] },
    { symbol: 'DRREDDY', strikes: [1220, 1240, 1260] },
    { symbol: 'CIPLA', strikes: [1420, 1440, 1460] },
    { symbol: 'APOLLOHOSP', strikes: [6800, 6900, 7000] },
    { symbol: 'DIVISLAB', strikes: [5800, 5900, 6000] },
    { symbol: 'EICHERMOT', strikes: [4800, 4900, 5000] },
    { symbol: 'HEROMOTOCO', strikes: [4600, 4700, 4800] },
    { symbol: 'BAJAJFINSV', strikes: [1680, 1700, 1720] },
    { symbol: 'BAJAJ-AUTO', strikes: [9400, 9500, 9600] },
    { symbol: 'GRASIM', strikes: [2500, 2520, 2540] },
    { symbol: 'INDUSINDBK', strikes: [960, 980, 1000] },
    { symbol: 'SHRIRAMFIN', strikes: [2900, 2920, 2940] },
    { symbol: 'NESTLEIND', strikes: [2200, 2220, 2240] },
    { symbol: 'BRITANNIA', strikes: [4800, 4900, 5000] },
    { symbol: 'TATACONSUM', strikes: [900, 920, 940] },
    { symbol: 'BPCL', strikes: [280, 290, 300] },
    { symbol: 'IOC', strikes: [130, 135, 140] },
    { symbol: 'SBILIFE', strikes: [1420, 1440, 1460] },
];

async function testStock(symbol, expiry, strikes) {
    // Test with first strike (ATM usually)
    const strike = strikes[1]; // Middle strike
    const url = `http://localhost:3002/api/option-chain?symbol=${encodeURIComponent(symbol)}&expiry=${expiry}&strike=${strike}&type=CE`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success && data.totalOptions > 0) {
            return { status: 'OK', symbol, strike, error: null };
        } else {
            return { status: 'FAILED', symbol, strike, error: data.error || 'No options found' };
        }
    } catch (error) {
        return { status: 'ERROR', symbol, strike, error: error.message };
    }
}

async function discoverWorkingStocks() {
    console.log('🔍 DISCOVERING WORKING STOCKS FOR OPTIONS TRADING\n');
    console.log('=' .repeat(70));
    
    // Calculate expiry dates
    const expiries = getExpiryDates();
    console.log('📅 Expiry Dates:');
    console.log(`   Current Month: ${expiries.current}`);
    console.log(`   Next Month:    ${expiries.next}`);
    console.log(`   Recommended:   ${expiries.recommended}`);
    console.log('=' .repeat(70) + '\n');
    
    const expiryToTest = expiries.recommended;
    console.log(`🎯 Testing with expiry: ${expiryToTest}\n`);
    
    const results = { working: [], failing: [], errors: [] };
    let progress = 0;
    const total = STOCK_UNIVERSE.length;
    
    for (const stock of STOCK_UNIVERSE) {
        progress++;
        process.stdout.write(`\r[${progress}/${total}] Testing ${stock.symbol.padEnd(15)}...`);
        
        const result = await testStock(stock.symbol, expiryToTest, stock.strikes);
        
        if (result.status === 'OK') {
            results.working.push({ symbol: stock.symbol, strikes: stock.strikes });
        } else if (result.status === 'FAILED') {
            results.failing.push({ symbol: stock.symbol, error: result.error });
        } else {
            results.errors.push({ symbol: stock.symbol, error: result.error });
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n\n' + '=' .repeat(70));
    console.log('📊 DISCOVERY RESULTS');
    console.log('=' .repeat(70));
    console.log(`✅ Working stocks: ${results.working.length}/${total}`);
    console.log(`❌ Failed stocks:  ${results.failing.length}/${total}`);
    console.log(`⚠️  Errors:         ${results.errors.length}/${total}`);
    console.log('=' .repeat(70) + '\n');
    
    if (results.working.length >= 25) {
        console.log('🎉 SUCCESS! Found enough working stocks for production.\n');
    } else {
        console.log(`⚠️  WARNING: Only ${results.working.length} working stocks found (need 25+)\n`);
    }
    
    // Print working stocks
    console.log('✅ WORKING STOCKS (Use these in production):');
    console.log('-'.repeat(70));
    results.working.forEach((stock, idx) => {
        console.log(`${(idx + 1).toString().padStart(2)}. ${stock.symbol.padEnd(15)} strikes: [${stock.strikes.join(', ')}]`);
    });
    
    // Print failed stocks (first 10)
    if (results.failing.length > 0) {
        console.log('\n❌ FAILED STOCKS (sample):');
        console.log('-'.repeat(70));
        results.failing.slice(0, 10).forEach(stock => {
            const shortError = stock.error.substring(0, 60);
            console.log(`   ${stock.symbol.padEnd(15)} - ${shortError}...`);
        });
        if (results.failing.length > 10) {
            console.log(`   ... and ${results.failing.length - 10} more`);
        }
    }
    
    // Generate code snippet
    console.log('\n' + '=' .repeat(70));
    console.log('📝 CODE TO USE IN PWA:');
    console.log('=' .repeat(70));
    console.log('const stocksToFetch = [');
    results.working.forEach(stock => {
        const strikeStr = `[${stock.strikes[0]}, ${stock.strikes[1]}]`;
        console.log(`    { symbol: '${stock.symbol}', expiry: '${expiryToTest}', strikes: ${strikeStr} },`);
    });
    console.log('];\n');
    
    // Save to file
    const outputFile = 'working-stocks-output.json';
    const fs = require('fs');
    fs.writeFileSync(outputFile, JSON.stringify({
        discoveryDate: new Date().toISOString(),
        expiry: expiryToTest,
        totalTested: total,
        workingCount: results.working.length,
        workingStocks: results.working,
        failedStocks: results.failing
    }, null, 2));
    
    console.log(`💾 Full results saved to: ${outputFile}`);
}

// Run discovery
console.log('🚀 Starting stock discovery process...\n');
discoverWorkingStocks().catch(console.error);
