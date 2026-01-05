// Test Samco Authentication
require('dotenv').config();
const https = require('https');
const fetch = require('node-fetch');

// SSL Agent to handle certificate issues on Windows
const agent = new https.Agent({
    rejectUnauthorized: false
});

async function testAuth() {
    try {
        console.log('🔐 Testing Samco API Authentication...');
        console.log('Base URL:', 'https://tradeapi.samco.in');
        console.log('User ID:', process.env.SAMCO_USER_ID);
        
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
        
        console.log('\n📊 Response Status:', response.status);
        console.log('📦 Response Data:', JSON.stringify(data, null, 2));
        
        if (data.sessionToken) {
            console.log('\n✅ Authentication Successful!');
            console.log('🎫 Session Token:', data.sessionToken.substring(0, 20) + '...');
            return data.sessionToken;
        } else {
            console.log('\n❌ Authentication Failed!');
            console.log('Error:', data.message || data.error || 'Unknown error');
            return null;
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return null;
    }
}

// Run test
testAuth().then(token => {
    if (token) {
        console.log('\n🎯 Next: Testing Option Chain API...');
    }
    process.exit(token ? 0 : 1);
});
