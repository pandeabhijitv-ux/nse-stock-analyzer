// Search for correct RELIANCE symbol
require('dotenv').config();
const https = require('https');
const fetch = require('node-fetch');

const agent = new https.Agent({
    rejectUnauthorized: false
});

async function login() {
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

async function search(token, query) {
    console.log(`🔍 Searching for: ${query}...`);
    
    const response = await fetch('https://tradeapi.samco.in/eqDervSearch/search', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-session-token': token
        },
        body: JSON.stringify({
            searchSymbolName: query
        }),
        agent: agent
    });

    const data = await response.json();
    console.log('\n📦 Response:', JSON.stringify(data, null, 2));
    
    if (data.equityDeriv && data.equityDeriv.length > 0) {
        console.log('\n🎯 NFO Derivatives Found:');
        data.equityDeriv
            .filter(item => item.exchange === 'NFO')
            .slice(0, 5)
            .forEach(item => {
                console.log(`  - ${item.tradingSymbol} (${item.exchange}) - ${item.instrumentType}`);
            });
    }
}

login().then(token => search(token, 'RELIANCE'));
