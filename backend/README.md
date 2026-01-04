# NSE Options Proxy API

Simple Node.js backend to bypass NSE CORS restrictions and provide real-time option chain data to the PWA.

## Features
- ✅ Bypasses CORS restrictions
- ✅ 5-minute caching to reduce NSE load
- ✅ RESTful API endpoints
- ✅ Free deployment on Vercel

## Endpoints

### 1. Health Check
```
GET /
```

### 2. Get Option Chain
```
GET /api/option-chain/:symbol

Example: GET /api/option-chain/RELIANCE
```

Response includes:
- Strike prices (ATM, ITM, OTM)
- Call/Put premiums
- Open Interest
- Implied Volatility
- Greeks
- Expiry dates

### 3. Get Stock Quote
```
GET /api/quote/:symbol

Example: GET /api/quote/TCS
```

## Local Development

1. Install dependencies:
```bash
cd backend
npm install
```

2. Start server:
```bash
npm start
```

Server runs on: http://localhost:3001

3. Test:
```bash
curl http://localhost:3001/api/option-chain/RELIANCE
```

## Deploy to Vercel (Free)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
cd backend
vercel
```

3. Follow prompts and get your API URL:
```
https://your-app.vercel.app
```

4. Update PWA to use your API:
```javascript
const API_URL = 'https://your-app.vercel.app';
```

## Environment Variables
None required! Uses public NSE website.

## Rate Limiting
- 5-minute cache per symbol
- Reduces NSE requests
- Respects NSE's servers

## Legal
- Personal use only
- Scrapes public NSE website
- Adds proper headers and delays
- For educational/personal trading only
