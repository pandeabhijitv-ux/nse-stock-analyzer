# Twelve Data API Setup for NSE Stocks

## Why Twelve Data?
- ✅ **800 API calls per day** (vs Finnhub's 60/minute but limited stocks)
- ✅ **Excellent NSE coverage** - All major Indian stocks available
- ✅ **No credit card required** for free tier
- ✅ **Simple API** - Easy to integrate
- ✅ **Real-time quotes** with minimal delay

## Registration Steps

1. Go to: https://twelvedata.com/pricing
2. Click **"Start Free"** under the Free plan
3. Sign up with email: `krittikaapps@gmail.com`
4. Verify email
5. Go to dashboard: https://twelvedata.com/account/api-keys
6. Copy your API key

## API Endpoint

```
https://api.twelvedata.com/quote?symbol=RELIANCE.NSE&apikey=YOUR_API_KEY
```

## NSE Symbol Format

Twelve Data uses `.NSE` suffix:
- RELIANCE → `RELIANCE.NSE`
- TCS → `TCS.NSE`
- INFY → `INFY.NSE`

## Response Format

```json
{
  "symbol": "RELIANCE.NSE",
  "name": "Reliance Industries Limited",
  "exchange": "NSE",
  "currency": "INR",
  "datetime": "2026-01-03",
  "open": "2450.00",
  "high": "2480.00",
  "low": "2445.00",
  "close": "2475.50",
  "volume": "5000000",
  "previous_close": "2465.00",
  "change": "10.50",
  "percent_change": "0.43",
  "is_market_open": false
}
```

## Rate Limits

- **Free tier**: 800 calls/day
- **Per minute**: 8 calls/minute
- **Strategy**: With 100 stocks, we can load 8 sectors per day comfortably

## Advantages over Finnhub

| Feature | Finnhub Free | Twelve Data Free |
|---------|--------------|------------------|
| NSE Coverage | ~5-10 stocks | All major stocks |
| Daily Limit | Unlimited* | 800 calls |
| Per Minute | 60 calls | 8 calls |
| Volume Data | ❌ No | ✅ Yes |
| Previous Close | ✅ Yes | ✅ Yes |
| % Change | Calculate | ✅ Provided |

*Finnhub unlimited calls but very limited NSE stocks = useless for us

## Next Steps

1. Register and get API key
2. Test with: `https://api.twelvedata.com/quote?symbol=RELIANCE.NSE&apikey=YOUR_KEY`
3. I'll update the code to use Twelve Data
4. Add caching to stay within 800 calls/day limit
