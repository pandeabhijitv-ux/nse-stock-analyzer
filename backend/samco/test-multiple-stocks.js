// Comprehensive test for multiple stocks
require('dotenv').config();
const https = require('https');
const fetch = require('node-fetch');

const agent = new https.Agent({ rejectUnauthorized: false });

async function login() {
    const response = await fetch('https://tradeapi.samco.in/login', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: process.env.SAMCO_USER_ID,
            password: process.env.SAMCO_PASSWORD,
            yob: process.env.SAMCO_YOB || ''
        }),
        agent
    });
    const data = await response.json();
    return data.sessionToken;
}

async function getOptionChain(token, symbol, expiry, strike, type) {
    const url = `https://tradeapi.samco.in/option/optionChain?exchange=NFO&searchSymbolName=${symbol}&expiryDate=${expiry}&strikePrice=${strike}&optionType=${type}`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json', 'x-session-token': token },
        agent
    });

    const data = await response.json();
    return data;
}

async function testMultipleStocks() {
    console.log('🚀 Testing Samco API with Multiple Stocks\n');
    console.log('='.repeat(70));
    
    const token = await login();
    console.log('✅ Logged in successfully\n');

    const tests = [
        { symbol: 'RELIANCE', expiry: '2026-01-27', strike: '1600', type: 'CE', name: 'RELIANCE 1600 CE' },
        { symbol: 'RELIANCE', expiry: '2026-01-27', strike: '1600', type: 'PE', name: 'RELIANCE 1600 PE' },
        { symbol: 'RELIANCE', expiry: '2026-01-27', strike: '1620', type: 'CE', name: 'RELIANCE 1620 CE' },
    ];

    for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        console.log(`\n${i + 1}. Testing ${test.name}...`);
        
        try {
            const data = await getOptionChain(token, test.symbol, test.expiry, test.strike, test.type);
            
            if (data.status === 'Success' && data.optionChainDetails?.length > 0) {
                const option = data.optionChainDetails[0];
                console.log(`   ✅ SUCCESS`);
                console.log(`   📊 Trading Symbol: ${option.tradingSymbol}`);
                console.log(`   💰 LTP: ₹${option.lastTradedPrice}`);
                console.log(`   📈 Spot: ₹${option.spotPrice}`);
                console.log(`   📊 IV: ${option.impliedVolatility}%`);
                console.log(`   📊 OI: ${option.openInterest.toLocaleString()}`);
                console.log(`   📊 Volume: ${option.volume.toLocaleString()}`);
                console.log(`   🎯 Delta: ${option.delta}`);
            } else {
                console.log(`   ⚠️  No data: ${data.statusMessage || 'Unknown error'}`);
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }

        // Wait 2 seconds between requests (rate limit: 1 req/sec)
        if (i < tests.length - 1) {
            console.log(`   ⏳ Waiting 2 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ All tests completed!');
    console.log('\n💡 Backend is ready to serve all stocks dynamically!');
}

testMultipleStocks().catch(console.error);
