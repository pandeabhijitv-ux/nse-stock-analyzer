# Stock Analyzer Proxy Server

Backend proxy server for the Stock Analyzer mobile app to fetch Yahoo Finance data.

## Deploy to Vercel (FREE)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
cd backend/stock-proxy
vercel
```

3. Copy the deployment URL (e.g., `https://your-app.vercel.app`)

4. Update your mobile app's `stockAPI.js` with the proxy URL

## Deploy to Railway (FREE)

1. Push to GitHub
2. Go to https://railway.app
3. New Project → Deploy from GitHub
4. Select this repository
5. Set root directory to `backend/stock-proxy`
6. Deploy!

## Deploy to Render (FREE)

1. Push to GitHub
2. Go to https://render.com
3. New → Web Service
4. Connect GitHub repo
5. Set root directory: `backend/stock-proxy`
6. Build command: `npm install`
7. Start command: `npm start`
8. Deploy!

## Local Testing

```bash
npm install
npm start
```

Server runs on http://localhost:3000
