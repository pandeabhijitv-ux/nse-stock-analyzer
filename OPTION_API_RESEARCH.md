# Indian Options Data API Research

## Date: January 4, 2026

## Requirement
Real-time NSE option chain data (strikes, premiums, OI, IV, Greeks) accessible from browser/PWA without CORS issues.

---

## Option 1: NSE Official API ❌
**URL**: `https://www.nseindia.com/api/option-chain-equities`
- **Status**: CORS blocked in browsers
- **Cost**: Free
- **Data Quality**: Official, most accurate
- **Issue**: Requires backend proxy or native app
- **Verdict**: NOT SUITABLE for PWA

---

## Option 2: Upstox API ⚠️
**URL**: `https://api.upstox.com/v2/option/chain`
- **Status**: Requires account + API key
- **Cost**: Free for personal use, requires Upstox trading account
- **Data Quality**: Excellent (official broker)
- **CORS**: Backend proxy required
- **Rate Limits**: 25 requests/second
- **Signup**: https://upstox.com/developer/
- **Verdict**: REQUIRES ACCOUNT + BACKEND PROXY

---

## Option 3: Zerodha Kite API ⚠️
**URL**: `https://kite.zerodha.com/oms/instruments`
- **Status**: Requires Zerodha account + Kite Connect subscription
- **Cost**: ₹2000/month
- **Data Quality**: Excellent (official broker)
- **CORS**: Backend proxy required
- **Signup**: https://kite.trade/
- **Verdict**: PAID + REQUIRES ACCOUNT + BACKEND PROXY

---

## Option 4: Dhan API ⚠️
**URL**: `https://api.dhan.co/`
- **Status**: Requires Dhan trading account
- **Cost**: Free for clients
- **Data Quality**: Good
- **CORS**: Backend proxy required
- **Verdict**: REQUIRES ACCOUNT + BACKEND PROXY

---

## Option 5: OptionChain.in Unofficial ⚠️
**URL**: Various scraped endpoints
- **Status**: Unofficial, may break anytime
- **Cost**: Free
- **Data Quality**: Scraped from NSE, may have delays
- **CORS**: May have issues
- **Reliability**: Low (unofficial)
- **Verdict**: UNRELIABLE

---

## Option 6: Yahoo Finance API ⚠️
**URL**: `https://query1.finance.yahoo.com/v7/finance/options/`
- **Status**: Unofficial, undocumented
- **Cost**: Free
- **Data Quality**: Limited for Indian stocks
- **CORS**: Works from browser!
- **Coverage**: Very limited Indian options
- **Verdict**: LIMITED COVERAGE

---

## Option 7: TradingView (No Public API) ❌
- **Status**: No public API
- **Verdict**: NOT AVAILABLE

---

## Option 8: NSE via CORS Proxy (allorigins.win) ⚠️
**URL**: `https://api.allorigins.win/raw?url=https://nseindia.com/...`
- **Status**: Third-party CORS proxy
- **Cost**: Free
- **Data Quality**: Same as NSE (if it works)
- **Reliability**: Low (third-party dependency)
- **Rate Limits**: Unknown, may block
- **Verdict**: UNRELIABLE

---

## Option 9: Finnhub (Already Using) ✅
**URL**: `https://finnhub.io/api/v1/`
- **Status**: Working (we use for technical indicators)
- **Cost**: Free tier available
- **Options Support**: ❌ NO Indian options data
- **Verdict**: NO OPTIONS SUPPORT

---

## Option 10: Build NSE Scraper Backend 🔧
**Approach**: Node.js/Python backend that scrapes NSE
- **Status**: Needs development
- **Cost**: Hosting cost only (~$5/month)
- **Data Quality**: Same as NSE
- **Maintenance**: Required
- **Deployment**: Vercel/Railway/Render (free tier)
- **Verdict**: BEST LONG-TERM SOLUTION

---

## RECOMMENDATION

### Short-term (Current): ✅ KEEP SIMULATED DATA
- Clear warning banners showing "DEMO DATA"
- Realistic calculations based on option pricing principles
- Users must verify with NSE before trading
- Safe, legal, no API dependencies

### Medium-term: 🔧 BUILD BACKEND PROXY
**Setup**: Simple Node.js/Python proxy on free hosting
- Scrapes NSE option chain (legal for personal use)
- 5-10 minute cache to reduce load
- Deploy on Vercel/Railway free tier
- Estimated time: 2-3 hours

**Architecture**:
```
Browser PWA → Backend API (Vercel) → NSE Website → Response
```

### Long-term: 💰 PAID API (If scaling)
- Upstox API (free with account)
- Zerodha Kite Connect (₹2000/month)
- Required for commercial use

---

## NEXT STEPS

1. ✅ **Keep current simulated data with warnings**
2. 🔧 **Build simple Node.js backend proxy** (2-3 hours)
3. 🚀 **Deploy to Vercel free tier**
4. ✅ **Replace simulated data with real NSE data**

---

## Legal Note
- Scraping NSE for personal use: Generally acceptable
- Commercial use: Requires proper licensing
- Always add rate limiting and caching
- Respect NSE's terms of service
