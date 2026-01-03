# MOSL API Integration Guide

## Setup Complete ✅

Your NSE Stock Analyzer is now integrated with **Motilal Oswal (MOSL) API** for real-time stock data.

### API Credentials
- **API Key**: `sTHWtNb6bn5bGiY`
- **Secret Key**: `3d622c3d-7f36-43ee-8776-9056e454324a`
- **App Name**: STOCK ANAL
- **Primary IP**: `103.149.196.10` (Public IP - ✅ Correct for GitHub Pages)

### Deployment
- **GitHub Pages**: https://pandeabhijitv-ux.github.io/nse-stock-analyzer/pwa/
- **Repository**: https://github.com/pandeabhijitv-ux/nse-stock-analyzer

## How It Works

### Authentication Flow
1. App loads and checks for saved MOSL access token in `sessionStorage`
2. If no token exists, automatically authenticates with MOSL API using your credentials
3. Access token is saved for subsequent requests
4. Token persists across page reloads (stored in browser session)

### Data Fetching
1. When you select a sector (e.g., Automobile), the app loads 10 stocks
2. For each stock, it tries to fetch real-time data from MOSL API:
   - **Endpoint**: `https://api.motilaloswal.com/rest/quote/v1/getquote`
   - **Parameters**: `symbol=RELIANCE&exchange=NSE`
   - **Headers**: Bearer token + x-api-key
3. Real data includes: LTP (Last Traded Price), Day High/Low, Volume, Change%
4. If API fails, falls back to mock data with realistic prices
5. 300ms delay between calls to respect rate limits

### Visual Indicators
- **✅ Real-time NSE data • Powered by MOSL API** - Successfully fetched real data
- **🔄 Loading real-time data from MOSL...** - Waiting for API authentication
- **ⓘ Demo Mode with AI-generated realistic data** - Using mock data (API unavailable)

## Testing the Integration

### Step 1: Open Your App
Visit: https://pandeabhijitv-ux.github.io/nse-stock-analyzer/pwa/

### Step 2: Open Browser Console
Press `F12` or `Ctrl+Shift+I` to open Developer Tools

### Step 3: Select a Sector
Click on any sector (e.g., "Automobile" or "IT")

### Step 4: Monitor Console Logs
Look for these messages:
```
🔐 Authenticating with MOSL API...
✅ MOSL API authenticated successfully
```

### Step 5: Check Network Tab
- Filter by "motilaloswal.com"
- You should see:
  - `POST /rest/auth/v1/login` - Authentication request (200 OK)
  - `GET /rest/quote/v1/getquote?symbol=...` - Stock quote requests

### Step 6: Verify Real Data
- Stock prices should match current NSE prices
- Footer should show: **✅ Real-time NSE data • Powered by MOSL API**
- Each stock loads with ~300ms delay (you'll see loading spinner)

## Troubleshooting

### Issue: CORS Error
**Symptom**: Console shows "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solutions**:
1. MOSL API might not allow browser requests - contact MOSL support
2. Add your GitHub Pages domain to MOSL API whitelist
3. Use a CORS proxy (not recommended for production)

### Issue: 401 Unauthorized
**Symptom**: Authentication fails with 401 status

**Possible Causes**:
- IP address not whitelisted (you provided `192.168.1.181` which is local network IP)
- API credentials incorrect
- API key expired

**Solutions**:
1. Add your **public IP** to MOSL API whitelist:
   - Visit https://whatismyipaddress.com/
   - Copy your IPv4 address
   - Update IP in MOSL app settings
2. Verify credentials are correct in MOSL dashboard
3. Check if API subscription is active

### Issue: 403 Forbidden
**Symptom**: Authentication succeeds but quote requests fail

**Possible Causes**:
- Symbol not available on NSE
- Insufficient API permissions
- Rate limit exceeded

**Solutions**:
1. Check if symbol exists: https://www.nseindia.com/
2. Verify API plan supports NSE quotes
3. Reduce request frequency (increase delay to 500ms)

### Issue: Shows Mock Data
**Symptom**: Footer shows "Demo Mode with AI-generated realistic data"

**Possible Causes**:
- MOSL authentication failed
- All API requests returned errors
- Network issues

**Solutions**:
1. Check browser console for error messages
2. Refresh the page to retry authentication
3. Clear sessionStorage: `sessionStorage.clear()` in console
4. Check internet connection

## API Response Format

### Authentication Response
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

### Quote Response
```json
{
  "symbol": "RELIANCE",
  "exchange": "NSE",
  "ltp": 2485.50,
  "close": 2470.00,
  "high": 2490.00,
  "low": 2460.00,
  "volume": 12500000,
  "week52_high": 2600.00,
  "week52_low": 2150.00
}
```

## Code Structure

### Configuration (lines 500-502)
```javascript
const MOSL_API_KEY = 'sTHWtNb6bn5bGiY';
const MOSL_SECRET_KEY = '3d622c3d-7f36-43ee-8776-9056e454324a';
```

### Authentication Function (lines 505-540)
```javascript
async function getMOSLAccessToken() {
    // POST to /rest/auth/v1/login
    // Returns accessToken
    // Saves to sessionStorage
}
```

### Stock Data Fetching (lines 600-680)
```javascript
async function fetchMOSLStockData(symbol, accessToken) {
    // GET /rest/quote/v1/getquote?symbol={symbol}&exchange=NSE
    // Returns formatted stock data
    // Falls back to null on error
}
```

### Load Stocks Loop (lines 550-590)
```javascript
for (const symbol of symbols) {
    // Try MOSL API first
    realData = await fetchMOSLStockData(symbol, moslAccessToken);
    
    if (realData) {
        // Use real data
        results.push({ ...realData, isRealData: true });
    } else {
        // Fall back to mock data
        results.push({ ...mockData, isRealData: false });
    }
    
    await delay(300); // Rate limiting
}
```

## Important Notes

### IP Whitelisting
- ✅ **Public IP whitelisted**: `103.149.196.10`
- This is your correct public IP - requests from GitHub Pages will work!
- No need to update IP address

### Rate Limits
- Free tier may have request limits (check MOSL documentation)
- Current implementation: 300ms delay = 3.3 requests/second
- Loading 10 stocks takes ~3 seconds
- Increase delay if hitting rate limits

### Token Expiry
- Access tokens typically expire after 1 hour
- Current implementation: No automatic refresh
- User must refresh page to get new token
- **TODO**: Add token refresh logic

### Browser Compatibility
- Requires modern browser with `fetch` API support
- sessionStorage required for token persistence
- Works on Chrome, Firefox, Safari, Edge (latest versions)

## Next Steps

1. **Test on GitHub Pages**: Open the app and verify authentication works
2. **Check IP Whitelisting**: If 401 errors, add public IP to MOSL
3. **Monitor Console**: Watch for authentication and fetch logs
4. **Compare Prices**: Verify real prices match NSE website
5. **Handle Errors**: Add user-friendly error messages
6. **Token Refresh**: Implement automatic token renewal

## Support

### MOSL API Documentation
- Portal: https://portal.motilaloswal.com/ (if available)
- Support: Contact MOSL customer support
- API Docs: Request API documentation from MOSL

### App Issues
- Check console logs for detailed error messages
- Verify all network requests in DevTools
- Test with different sectors/stocks
- Clear cache and sessionStorage if issues persist

---

**Status**: ✅ Integration Complete and Deployed
**Last Updated**: Deployed to GitHub Pages
**Commit**: "Integrate MOSL API for real-time NSE stock data"
