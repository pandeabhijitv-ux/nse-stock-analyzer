// Fetch NIFTY 500 constituent list from NSE
const https = require('https');
const fs = require('fs');

// Fetch NIFTY 500 stock list
function fetchNIFTY500List() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'www.nseindia.com',
            path: '/api/equity-stockIndices?index=NIFTY%20500',
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate, br',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive'
            }
        };

        const req = https.request(options, (res) => {
            const chunks = [];
            
            res.on('data', (chunk) => chunks.push(chunk));
            
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                let data;
                
                const encoding = res.headers['content-encoding'];
                
                try {
                    if (encoding === 'gzip') {
                        const zlib = require('zlib');
                        data = zlib.gunzipSync(buffer).toString();
                    } else if (encoding === 'deflate') {
                        const zlib = require('zlib');
                        data = zlib.inflateSync(buffer).toString();
                    } else if (encoding === 'br') {
                        const zlib = require('zlib');
                        data = zlib.brotliDecompressSync(buffer).toString();
                    } else {
                        data = buffer.toString();
                    }
                    
                    const json = JSON.parse(data);
                    if (json.data) {
                        const symbols = json.data.map(stock => stock.symbol);
                        console.log(`✅ Fetched ${symbols.length} NIFTY 500 stocks`);
                        resolve(symbols);
                    } else {
                        reject(new Error('No data in response'));
                    }
                } catch (error) {
                    console.error('Parse error:', error.message);
                    console.error('Content-Encoding:', encoding);
                    console.error('First 100 bytes:', buffer.slice(0, 100).toString('hex'));
                    reject(error);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// Main execution
(async () => {
    try {
        console.log('📊 Fetching NIFTY 500 constituent list...');
        const symbols = await fetchNIFTY500List();
        
        // Save to file
        const outputPath = 'nifty500-symbols.json';
        fs.writeFileSync(outputPath, JSON.stringify(symbols, null, 2));
        
        console.log(`\n📝 Saved ${symbols.length} symbols to ${outputPath}`);
        console.log('\nFirst 20 symbols:');
        console.log(symbols.slice(0, 20).join(', '));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
})();
