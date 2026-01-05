// Test our backend proxy server
const fetch = require('node-fetch');

async function testEndpoint(url, description) {
    console.log('\n' + '='.repeat(70));
    console.log(description);
    console.log('='.repeat(70));
    console.log('🌐 URL:', url);
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            console.log(`✅ SUCCESS! Got ${data.totalOptions} option(s)`);
            
            if (data.options && data.options.length > 0) {
                const opt = data.options[0];
                console.log('\n📊 Sample Option:');
                console.log(`   Symbol: ${opt.tradingSymbol}`);
                console.log(`   Strike: ₹${opt.strikePrice}`);
                console.log(`   Type: ${opt.optionType}`);
                console.log(`   Spot: ₹${opt.spotPrice}`);
                console.log(`   LTP: ₹${opt.ltp}`);
                console.log(`   Change: ${opt.changePer}%`);
                console.log(`   IV: ${opt.iv}%`);
                console.log(`   OI: ${opt.openInterest.toLocaleString()}`);
                console.log(`   Volume: ${opt.volume.toLocaleString()}`);
                console.log(`   Greeks: δ=${opt.delta} γ=${opt.gamma} θ=${opt.theta} ν=${opt.vega}`);
                console.log(`   Bid: ₹${opt.bid} x ${opt.bidQty}`);
                console.log(`   Ask: ₹${opt.ask} x ${opt.askQty}`);
            }
        } else {
            console.log('❌ FAILED:', data.error);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 1100));
}

async function main() {
    const BASE_URL = 'http://localhost:3002';
    
    console.log('🚀 Testing Samco Backend Proxy Server');
    console.log('📡 Base URL:', BASE_URL);
    
    // Test authentication
    console.log('\n' + '='.repeat(70));
    console.log('Test 0: Authentication');
    console.log('='.repeat(70));
    const authResponse = await fetch(`${BASE_URL}/api/test-auth`);
    const authData = await authResponse.json();
    console.log(authData.success ? '✅ Authenticated' : '❌ Auth failed');
    
    // Test 1: Specific strike
    await testEndpoint(
        `${BASE_URL}/api/option-chain?symbol=RELIANCE&expiry=2026-01-27&strike=1600&type=CE`,
        'Test 1: RELIANCE 1600 CE 27-JAN-2026 (Specific Strike)'
    );
    
    // Test 2: All strikes for CE
    await testEndpoint(
        `${BASE_URL}/api/option-chain?symbol=RELIANCE&expiry=2026-01-27&type=CE`,
        'Test 2: RELIANCE All CE Strikes 27-JAN-2026'
    );
    
    // Test 3: PUT option
    await testEndpoint(
        `${BASE_URL}/api/option-chain?symbol=RELIANCE&expiry=2026-01-27&strike=1600&type=PE`,
        'Test 3: RELIANCE 1600 PE 27-JAN-2026'
    );
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ All tests completed!');
    console.log('='.repeat(70));
}

main();
