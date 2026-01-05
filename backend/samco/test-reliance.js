// Test RELIANCE Option Chain with correct parameters
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
        console.log('✅ Login successful!');
        return data.sessionToken;
    }
    throw new Error('Login failed');
}

async function testOptionChain(token, symbol, expiryDate, strikePrice, optionType) {
    console.log(`\n📊 Testing Option Chain:`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Expiry: ${expiryDate}`);
    console.log(`   Strike: ${strikePrice}`);
    console.log(`   Type: ${optionType}`);
    
    const url = `https://tradeapi.samco.in/option/optionChain?searchSymbolName=${symbol}&exchange=NFO&expiryDate=${expiryDate}&strikePrice=${strikePrice}&optionType=${optionType}`;
    console.log(`\n🌐 URL: ${url}`);
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-session-token': token
        },
        agent: agent
    });

    const text = await response.text();
    console.log(`\n📦 Status: ${response.status}`);
    
    try {
        const data = JSON.parse(text);
        console.log(`📦 Response:`, JSON.stringify(data, null, 2));
        
        if (data.optionChainDetails && data.optionChainDetails.length > 0) {
            console.log(`\n✅ SUCCESS! Got ${data.optionChainDetails.length} option(s)`);
            console.log('\n🎯 First Option Details:');
            const option = data.optionChainDetails[0];
            console.log(`   Trading Symbol: ${option.tradingSymbol}`);
            console.log(`   LTP: ${option.lastTradedPrice}`);
            console.log(`   Strike: ${option.strikePrice}`);
            console.log(`   Expiry: ${option.expiryDate}`);
            console.log(`   IV: ${option.impliedVolatility || 'N/A'}`);
            console.log(`   OI: ${option.openInterest || 'N/A'}`);
        }
    } catch (e) {
        console.log('❌ Failed to parse JSON');
        console.log('Raw response:', text.substring(0, 500));
    }
}

async function main() {
    try {
        const token = await login();
        
        // Test with RELIANCE 1600 CE 27-JAN-2026
        await testOptionChain(token, 'RELIANCE', '2026-01-27', '1600', 'CE');
        
        // Also test without strike price to get all strikes
        console.log('\n\n' + '='.repeat(60));
        console.log('Testing ALL strikes for RELIANCE 27-JAN-2026 CE');
        console.log('='.repeat(60));
        await testOptionChain(token, 'RELIANCE', '2026-01-27', '', 'CE');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();
