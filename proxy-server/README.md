# MOSL API Proxy Server

This proxy server handles MOSL API authentication and forwards requests from your browser app, solving CORS issues.

## Quick Deploy to Vercel (Free)

### 1. Install Vercel CLI
```powershell
npm install -g vercel
```

### 2. Deploy
```powershell
cd proxy-server
vercel
```

Follow prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? **mosl-proxy**
- Directory? **.**
- Override settings? **N**

### 3. Get Your Proxy URL
After deployment, you'll get a URL like:
```
https://mosl-proxy-abc123.vercel.app
```

### 4. Update Your App
Replace the MOSL API calls in `pwa/index.html` to use your proxy URL instead of direct API calls.

## Alternative: Deploy to Railway (Also Free)

1. Go to https://railway.app/
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Set root directory: `proxy-server`
6. Railway will auto-detect and deploy

## Test Your Proxy

Once deployed, test it:
```powershell
# Health check
Invoke-RestMethod -Uri "https://your-proxy-url.vercel.app/"

# Get stock quote
Invoke-RestMethod -Uri "https://your-proxy-url.vercel.app/api/quote/RELIANCE?exchange=NSE"
```

## Endpoints

- `GET /` - Health check
- `GET /api/quote/:symbol?exchange=NSE` - Get single stock quote
- `POST /api/quotes` - Get multiple quotes (batch)
  ```json
  {
    "symbols": ["RELIANCE", "TCS", "INFY"],
    "exchange": "NSE"
  }
  ```

## Local Testing

```powershell
cd proxy-server
npm install
npm start
```

Server runs at: http://localhost:3000

## Security Notes

- API credentials are stored server-side (secure)
- CORS restricted to your GitHub Pages domain
- Token auto-refreshes before expiry
- No credentials exposed to browser

## Environment Variables (Optional)

For additional security, set these on Vercel:
- `MOSL_API_KEY=sTHWtNb6bn5bGiY`
- `MOSL_SECRET_KEY=3d622c3d-7f36-43ee-8776-9056e454324a`

Then update server.js to use `process.env.MOSL_API_KEY`
