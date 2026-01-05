// Test Option Chain API with exact format from Samco docs
require('dotenv').config();
const https = require('https');
const fetch = require('node-fetch');

const agent = new https.Agent({
    rejectUnauthorized: false
});

async function login() {
    console.log('🔐 Logging in...');
    const response = await fetch('https://tradeapi.samco.in/login', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId: process.env.SAMCO_USER_ID,
            password: process.env.SAMCO_PASSWORD,
            yob: process.env.SAMCO_YOB || ''
        }),
        agent: agent
    });

    const data = await response.json();
    return data.sessionToken;
}

async function testAPI(url, token, description) {
    console.log('\n' + '='.repeat(70));
    console.log(description);
    console.log('='.repeat(70));
    console.log('🌐 URL:', url);
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-session-token': token
        },
        agent: agent
    });

    const data = await response.json();
    
    if (data.status === 'Success' && data.optionChainDetails) {
        const options = data.optionChainDetails;
        console.log(`✅ SUCCESS! Got ${options.length} option(s)`);
        
        if (options.length > 0) {
            const opt = options[0];
            console.log('\n📊 Sample Option:');
            console.log(`   Symbol: ${opt.tradingSymbol}`);
            console.log(`   Strike: ${opt.strikePrice}`);
            console.log(`   Type: ${opt.optionType}`);
            console.log(`   Spot: ₹${opt.spotPrice}`);
            console.log(`   LTP: ₹${opt.lastTradedPrice}`);
            console.log(`   IV: ${opt.impliedVolatility}%`);
            console.log(`   OI: ${opt.openInterest}`);
            console.log(`   Volume: ${opt.volume}`);
            console.log(`   Greeks: δ=${opt.delta} γ=${opt.gamma} θ=${opt.theta} ν=${opt.vega}`);
        }
    } else {
        console.log('❌ FAILED:', data.statusMessage || data.validationErrors);
    }
    
    // Rate limit: 1 req/sec
    await new Promise(resolve => setTimeout(resolve, 1100));
}

async function main() {
    try {
        const token = await login();
        console.log('✅ Authenticated successfully!\n');
        
        // Test 1: RELIANCE specific strike
        await testAPI(
            'https://tradeapi.samco.in/option/optionChain?exchange=NFO&searchSymbolName=RELIANCE&strikePrice=1600&optionType=CE&expiryDate=2026-01-27',
            token,
            'Test 1: RELIANCE 1600 CE 27-JAN-2026 (Specific Strike)'
        );
        
        // Test 2: RELIANCE all strikes for CE
        await testAPI(
            'https://tradeapi.samco.in/option/optionChain?exchange=NFO&searchSymbolName=RELIANCE&strikePrice=&optionType=CE&expiryDate=2026-01-27',
            token,
            'Test 2: RELIANCE All CE Strikes 27-JAN-2026'
        );
        
        // Test 3: RELIANCE PUT
        await testAPI(
            'https://tradeapi.samco.in/option/optionChain?exchange=NFO&searchSymbolName=RELIANCE&strikePrice=1600&optionType=PE&expiryDate=2026-01-27',
            token,
            'Test 3: RELIANCE 1600 PE 27-JAN-2026'
        );
        
        // Test 4: NIFTY (if you have the next weekly expiry)
        const nextThursday = getNextThursday();
        await testAPI(
            `https://tradeapi.samco.in/option/optionChain?exchange=NFO&searchSymbolName=NIFTY&strikePrice=&optionType=CE&expiryDate=${nextThursday}`,
            token,
            `Test 4: NIFTY All CE Strikes ${nextThursday}`
        );
        
        console.log('\n' + '='.repeat(70));
        console.log('✅ All tests completed!');
        console.log('='.repeat(70));
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
}

function getNextThursday() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7;
    const nextThursday = new Date(today);
    nextThursday.setDate(today.getDate() + daysUntilThursday);
    return nextThursday.toISOString().split('T')[0];
}

main();
