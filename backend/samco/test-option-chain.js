// Test Samco Option Chain API
require('dotenv').config();
const https = require('https');
const fetch = require('node-fetch');

// SSL Agent
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
    throw new Error('Login failed: ' + data.statusMessage);
}

async function testOptionChain(token, symbol) {
    console.log(`\n📊 Getting Option Chain for ${symbol}...`);
    
    // Get nearest Thursday (weekly expiry) or last Thursday of month
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 4 = Thursday
    const daysUntilThursday = (4 - currentDay + 7) % 7 || 7; // Next Thursday
    const expiryDate = new Date(today);
    expiryDate.setDate(today.getDate() + daysUntilThursday);
    const formattedExpiry = expiryDate.toISOString().split('T')[0]; // yyyy-mm-dd
    
    console.log(`📅 Using Expiry Date: ${formattedExpiry}`);
    
    // Get CALL options
    console.log('\n📈 Fetching CALL (CE) options...');
    const callResponse = await fetch(`https://tradeapi.samco.in/option/optionChain?searchSymbolName=${symbol}&exchange=NFO&expiryDate=${formattedExpiry}&strikePrice=&optionType=CE`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-session-token': token
        },
        agent: agent
    });
    
    const callText = await callResponse.text();
    console.log('✅ CALL Response Status:', callResponse.status);
    console.log('📦 CALL Response:', callText);
    
    let callData;
    try {
        callData = JSON.parse(callText);
    } catch (e) {
        console.log('❌ Failed to parse CALL response as JSON');
        return { error: 'Invalid response', details: callText.substring(0, 500) };
    }
    
    // Get PUT options
    console.log('\n📉 Fetching PUT (PE) options...');
    const putResponse = await fetch(`https://tradeapi.samco.in/option/optionChain?searchSymbolName=${symbol}&exchange=NFO&expiryDate=${formattedExpiry}&strikePrice=&optionType=PE`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-session-token': token
        },
        agent: agent
    });
    
    const putData = await putResponse.json();
    console.log('✅ PUT Response:', putResponse.status);
    
    // Combine results
    const response = {
        status: callData.status,
        serverTime: callData.serverTime,
        calls: callData.optionChainDetails || [],
        puts: putData.optionChainDetails || []
    };
    
    console.log(`\n📦 Total CALL Options: ${response.calls.length}`);
    console.log(`📦 Total PUT Options: ${response.puts.length}`);
    
    if (response.calls.length > 0) {
        console.log('\n🔍 Sample CALL Option:');
        console.log(JSON.stringify(response.calls[0], null, 2));
    }
    
    if (response.puts.length > 0) {
        console.log('\n🔍 Sample PUT Option:');
        console.log(JSON.stringify(response.puts[0], null, 2));
    }
    
    return response;
}

async function main() {
    try {
        const token = await login();
        
        // Test with RELIANCE
        await testOptionChain(token, 'RELIANCE');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();
