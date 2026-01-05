// Find the correct expiry date by testing multiple dates
const fetch = require('node-fetch');

const TEST_STOCKS = ['RELIANCE', 'TCS', 'ICICIBANK']; // Known liquid stocks
const TEST_STRIKES = { 'RELIANCE': 1580, 'TCS': 4200, 'ICICIBANK': 1250 };

// Generate potential expiry dates (Tuesdays in Jan and Feb 2026)
function generatePotentialExpiries() {
    const dates = [];
    
    // All Tuesdays in January 2026
    const janDates = [7, 14, 21, 28];
    janDates.forEach(day => dates.push(`2026-01-${day.toString().padStart(2, '0')}`));
    
    // All Tuesdays in February 2026
    const febDates = [4, 11, 18, 25];
    febDates.forEach(day => dates.push(`2026-02-${day.toString().padStart(2, '0')}`));
    
    // Also test 27th (your original date)
    dates.push('2026-01-27');
    
    return dates.sort();
}

async function testExpiry(expiry) {
    let successCount = 0;
    
    for (const symbol of TEST_STOCKS) {
        const strike = TEST_STRIKES[symbol];
        const url = `http://localhost:3002/api/option-chain?symbol=${symbol}&expiry=${expiry}&strike=${strike}&type=CE`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success && data.totalOptions > 0) {
                successCount++;
            }
        } catch (error) {
            // Ignore errors
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    return successCount;
}

async function findCorrectExpiry() {
    console.log('🔍 FINDING CORRECT EXPIRY DATE FOR OPTIONS\n');
    console.log('Testing multiple Tuesdays in Jan/Feb 2026...\n');
    
    const potentialDates = generatePotentialExpiries();
    const results = [];
    
    for (const expiry of potentialDates) {
        process.stdout.write(`Testing ${expiry}... `);
        const successCount = await testExpiry(expiry);
        results.push({ expiry, successCount });
        
        if (successCount === 3) {
            console.log(`✅ ALL 3 WORKING!`);
        } else if (successCount > 0) {
            console.log(`⚠️  ${successCount}/3 working`);
        } else {
            console.log(`❌ None working`);
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTS:\n');
    
    const workingDates = results.filter(r => r.successCount === 3);
    
    if (workingDates.length > 0) {
        console.log('✅ WORKING EXPIRY DATES:');
        workingDates.forEach(r => {
            console.log(`   ${r.expiry} - All test stocks confirmed`);
        });
        
        console.log(`\n🎯 RECOMMENDED EXPIRY: ${workingDates[0].expiry}`);
    } else {
        console.log('❌ NO FULLY WORKING EXPIRY DATE FOUND!');
        console.log('\n⚠️  Partial results:');
        results.filter(r => r.successCount > 0).forEach(r => {
            console.log(`   ${r.expiry}: ${r.successCount}/3 stocks working`);
        });
    }
}

findCorrectExpiry().catch(console.error);
