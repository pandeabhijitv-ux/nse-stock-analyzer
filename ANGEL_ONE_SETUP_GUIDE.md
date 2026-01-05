# Angel One Account & API Setup Guide

## 📋 Prerequisites Checklist

Before starting, make sure you have:
- ✅ PAN Card (Permanent Account Number)
- ✅ Aadhaar Card (with linked mobile number)
- ✅ Valid Email ID
- ✅ Bank Account Details (cancelled cheque or bank statement)
- ✅ Signature (white paper - will upload photo)
- ✅ Selfie/Photo

**Time Required**: 15-20 minutes for account opening, 24-48 hours for activation

---

## 🚀 STEP 1: Open Angel One Trading Account

### 1.1 Start Account Opening Process

**Visit**: https://www.angelone.in/open-demat-account/

**Click**: "Open Free Demat Account" button

---

### 1.2 Enter Basic Details

You'll be asked to provide:

1. **Mobile Number**: Enter your mobile (linked to Aadhaar)
2. **Email ID**: Your email address
3. **OTP Verification**: Enter OTP sent to mobile and email

---

### 1.3 Complete KYC Process

#### a) PAN Card Details
- Enter PAN number
- Upload PAN card image (clear photo or PDF)
- System will auto-fetch details from Income Tax database

#### b) Aadhaar Verification
**IMPORTANT**: Use the mobile number linked to your Aadhaar

1. Enter Aadhaar number
2. Click "Generate OTP"
3. You'll receive OTP on Aadhaar-linked mobile
4. Enter OTP to verify
5. System will auto-fetch address and DOB

**If Aadhaar-mobile not linked**: You'll need to do Video KYC instead

#### c) Personal Information
Auto-filled from Aadhaar, verify:
- Full Name
- Date of Birth
- Address
- Father's Name

#### d) Bank Account Details
Two options:

**Option 1: Net Banking (FASTER)**
- Select your bank
- Login to net banking
- Verify account automatically

**Option 2: Manual Upload**
- Upload cancelled cheque or bank statement
- Enter bank details manually
- Takes longer for verification

#### e) Upload Documents

1. **Signature**:
   - Sign on white paper with black pen
   - Take clear photo
   - Upload image

2. **Photo/Selfie**:
   - Take a clear selfie
   - Or upload recent photo
   - Should show face clearly

#### f) IPV (In-Person Verification)
Two options:

**Option 1: DigiLocker (FASTEST)**
- Click "Verify via DigiLocker"
- Login with Aadhaar
- Instant verification
- **RECOMMENDED**

**Option 2: Video KYC**
- Schedule video call
- Agent will verify documents live
- Takes 5-10 minutes
- Available 9 AM - 9 PM

---

### 1.4 Income & Trading Details

1. **Annual Income**: Select your income bracket
2. **Occupation**: Select (Salaried/Business/Professional/etc.)
3. **Trading Experience**: 
   - Select "No Experience" if new
   - Or select your experience level

4. **Segment Selection**:
   - ✅ **Equity** (stocks) - FREE
   - ✅ **F&O** (Futures & Options) - **SELECT THIS** (needed for options data)
   - ✅ **Commodity** - Optional
   - ✅ **Currency** - Optional

**IMPORTANT**: ✅ CHECK "Futures & Options" - Required for option chain API access

---

### 1.5 E-Sign Documents

1. Review terms and conditions
2. Click "I Agree"
3. E-Sign using Aadhaar:
   - Enter Aadhaar number
   - Click "Generate OTP"
   - Enter OTP received on Aadhaar-linked mobile
   - Documents will be digitally signed

---

### 1.6 Account Opening Fee

**Cost**: **FREE** (₹0)

Angel One doesn't charge account opening fee currently.

If asked for any payment:
- Some promotions may require ₹0 payment verification
- Use UPI/Net Banking
- Amount will be credited to trading account

---

### 1.7 Wait for Activation

**Timeline**:
- DigiLocker KYC: 24 hours (usually same day)
- Video KYC: 24-48 hours
- Manual verification: 2-3 days

**You'll receive**:
- Email with Client ID
- SMS with login credentials
- Welcome email with account details

---

## 🔑 STEP 2: Activate Your Account

### 2.1 Receive Credentials

Check your email for:
- **Client ID**: Your unique trading ID (e.g., A12345678)
- **Password**: Initial password (change on first login)
- **App Download Link**: Angel One mobile app

### 2.2 First Login

**Option 1: Mobile App**
1. Download "Angel One" app from Play Store
2. Open app
3. Enter Client ID
4. Enter Password
5. Create new 4-digit PIN
6. Set up biometric login (optional)

**Option 2: Web**
1. Go to https://trade.angelone.in/
2. Enter Client ID and Password
3. Complete security setup

### 2.3 Complete Profile

After first login:
1. Add bank account (if not added during KYC)
2. Set trading PIN
3. Verify email and mobile
4. Add nominee details (optional but recommended)

---

## 🔌 STEP 3: Register for SmartAPI

### 3.1 Access SmartAPI Portal

**Visit**: https://smartapi.angelbroking.com/

**Click**: "Get Started" or "Register"

---

### 3.2 Create Developer Account

Fill in the form:

1. **Name**: Your full name
2. **Email**: Your email (same as trading account)
3. **Mobile**: Your mobile number
4. **Client Code**: Your Angel One Client ID (from Step 2)
5. **Company/Individual**: Select "Individual"
6. **Purpose**: Select "Personal Project" or "Startup"

**Click**: "Submit"

---

### 3.3 Verify Email

1. Check your email inbox
2. Open verification email from Angel One
3. Click verification link
4. Email will be verified

---

### 3.4 Login to SmartAPI Dashboard

**Visit**: https://smartapi.angelbroking.com/login

**Login with**:
- Email
- Password (you set during registration)

---

### 3.5 Create API App

After login:

1. **Click**: "Create New App" or "New Application"

2. **Fill Details**:
   - **App Name**: "Stock Analyzer" (or your app name)
   - **App Type**: "Mobile App" or "Web App"
   - **Description**: "Stock market analysis and options trading app"
   - **Redirect URL**: 
     - For testing: `http://localhost:3000/callback`
     - For production: `https://yourdomain.com/callback`
     - If unsure, use: `http://localhost:3000/callback`

3. **Click**: "Create App"

---

### 3.6 Get API Credentials

After creating app, you'll see:

**API Key**: `xxxxxxxx` (8-character alphanumeric)
**API Secret**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (UUID format)

**🔒 IMPORTANT**: 
- **Copy and save these immediately**
- API Secret is shown only once
- Keep them secure - never share publicly
- Never commit to GitHub

**Save them here temporarily**:
```
API Key: _________________________
API Secret: _________________________
Client ID: _________________________
Password: _________________________
```

---

## 📱 STEP 4: Enable TOTP (Time-Based OTP)

For API authentication, Angel One requires TOTP (like Google Authenticator)

### 4.1 Install Authenticator App

Download one of these apps:
- **Google Authenticator** (Recommended)
- Microsoft Authenticator
- Authy

### 4.2 Enable TOTP in Angel One

**Option 1: Mobile App**
1. Open Angel One app
2. Go to Profile → Settings → Security
3. Click "Enable TOTP"
4. Scan QR code with authenticator app
5. Enter 6-digit code to confirm

**Option 2: Web**
1. Login to https://trade.angelone.in/
2. Go to Profile → Security Settings
3. Enable "TOTP Authentication"
4. Scan QR code
5. Confirm with 6-digit code

**🔒 SAVE BACKUP KEY**: Write down the backup key shown - needed if you lose phone

---

## ✅ STEP 5: Test API Access

Let's test if everything works:

### 5.1 Test Authentication

**Tell me when you reach this step** - I'll provide a test script to verify:
- API credentials work
- TOTP authentication works
- You can access market data
- Option chain API is accessible

---

## 📞 NEXT STEPS

Once you complete the above steps, let me know:

**Message me with**:
```
✅ Account Status: [Opened/Pending/Activated]
✅ SmartAPI Registration: [Done/Pending]
✅ API Credentials: [Got them/Waiting]
✅ TOTP Enabled: [Yes/No]
```

Then I'll:
1. ✅ Create backend proxy server
2. ✅ Test your API credentials
3. ✅ Deploy to free hosting
4. ✅ Integrate with your mobile app
5. ✅ Show you real option chain data!

---

## ⚠️ COMMON ISSUES & SOLUTIONS

### Issue 1: "Aadhaar not linked to mobile"
**Solution**: 
- Visit nearest Aadhaar center
- Or use Video KYC instead

### Issue 2: "DigiLocker verification failed"
**Solution**:
- Use Video KYC option
- Schedule call during working hours

### Issue 3: "Bank verification pending"
**Solution**:
- Try net banking verification (faster)
- Or wait 24-48 hours for manual verification

### Issue 4: "Can't find F&O option during signup"
**Solution**:
- Complete basic account opening first
- F&O can be activated later from app settings
- Go to Profile → Segments → Activate F&O

### Issue 5: "Not receiving OTP"
**Solution**:
- Check spam/promotions folder
- Ensure mobile number is correct
- Try "Resend OTP"
- Wait 2-3 minutes between attempts

### Issue 6: "SmartAPI registration not working"
**Solution**:
- Wait for account to be fully activated (24 hours)
- Ensure using same email as trading account
- Try different browser
- Contact support: api@angelbroking.com

---

## 📧 SUPPORT CONTACTS

**Angel One Customer Care**:
- Phone: 1800-123-1344 (Toll-free)
- Email: care@angelone.in
- Hours: 8 AM - 8 PM (Mon-Sat)

**SmartAPI Support**:
- Email: api@angelbroking.com
- Documentation: https://smartapi.angelbroking.com/docs

---

## 🎯 YOUR CURRENT STEP

**START HERE** → Step 1: Open Angel One Account
**URL**: https://www.angelone.in/open-demat-account/

**Estimated Time**: 
- Form filling: 15 minutes
- KYC: 5-10 minutes
- Activation: 24 hours

**Let me know when you complete Step 1, and I'll guide you through the next steps!** 🚀
