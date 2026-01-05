// Test both approaches for Option Chain API
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
    if (data.sessionToken) {
        console.log('✅ Login successful!\n');
        return data.sessionToken;
    }
    throw new Error('Login failed');
}

async function testApproach1(token) {
    console.log('='.repeat(60));
    console.log('APPROACH 1: Using Trading Symbol in searchSymbolName');
    console.log('='.repeat(60));
    
    const tradingSymbol = 'RELIANCE26JAN1600CE';
    const url = `https://tradeapi.samco.in/option/optionChain?exchange=NFO&searchSymbolName=${tradingSymbol}`;
    
    console.log(`📊 Testing: ${tradingSymbol}`);
    console.log(`🌐 URL: ${url}\n`);
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'x-session-token': token
        },
        agent: agent
    });

    const text = await response.text();
    console.log(`📦 Status: ${response.status}`);
    
    try {
        const data = JSON.parse(text);
        if (data.optionChainDetails && data.optionChainDetails.length > 0) {
            console.log('✅ SUCCESS!');
            const option = data.optionChainDetails[0];
            console.log(`   Trading Symbol: ${option.tradingSymbol}`);
            console.log(`   LTP: ₹${option.lastTradedPrice}`);
            console.log(`   Spot: ₹${option.spotPrice}`);
            console.log(`   IV: ${option.impliedVolatility}%`);
            console.log(`   OI: ${option.openInterest}`);
            return true;
        } else {
            console.log('⚠️  No data returned');
            console.log(JSON.stringify(data, null, 2));
            return false;
        }
    } catch (e) {
        console.log('❌ Failed to parse JSON');
        console.log('Raw response:', text.substring(0, 300));
        return false;
    }
}

async function testApproach2(token) {
    console.log('\n' + '='.repeat(60));
    console.log('APPROACH 2: Using Underlying + Parameters');
    console.log('='.repeat(60));
    
    const url = 'https://tradeapi.samco.in/option/optionChain?exchange=NFO&searchSymbolName=RELIANCE&expiryDate=2026-01-27&strikePrice=1600&optionType=CE';
    
    console.log(`📊 Testing: RELIANCE + expiry + strike + type`);
    console.log(`🌐 URL: ${url}\n`);
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'x-session-token': token
        },
        agent: agent
    });

    const text = await response.text();
    console.log(`📦 Status: ${response.status}`);
    
    try {
        const data = JSON.parse(text);
        if (data.optionChainDetails && data.optionChainDetails.length > 0) {
            console.log('✅ SUCCESS!');
            const option = data.optionChainDetails[0];
            console.log(`   Trading Symbol: ${option.tradingSymbol}`);
            console.log(`   LTP: ₹${option.lastTradedPrice}`);
            console.log(`   Spot: ₹${option.spotPrice}`);
            console.log(`   IV: ${option.impliedVolatility}%`);
            console.log(`   OI: ${option.openInterest}`);
            return true;
        } else {
            console.log('⚠️  No data returned');
            console.log(JSON.stringify(data, null, 2));
            return false;
        }
    } catch (e) {
        console.log('❌ Failed to parse JSON');
        console.log('Raw response:', text.substring(0, 300));
        return false;
    }
}

async function main() {
    try {
        const token = await login();
        
        const result1 = await testApproach1(token);
        
        // Wait 2 seconds to avoid rate limit
        console.log('\n⏳ Waiting 2 seconds to avoid rate limit...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const result2 = await testApproach2(token);
        
        console.log('\n' + '='.repeat(60));
        console.log('SUMMARY');
        console.log('='.repeat(60));
        console.log(`Approach 1 (Trading Symbol): ${result1 ? '✅ Works' : '❌ Failed'}`);
        console.log(`Approach 2 (Underlying + Params): ${result2 ? '✅ Works' : '❌ Failed'}`);
        console.log('\n💡 Recommendation: Use Approach 1 (Trading Symbol) for cleaner code');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();
