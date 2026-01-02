# 📦 Installation Guide - Step by Step

## Prerequisites Checklist

Before you begin, ensure you have:

- [ ] Windows 10/11, macOS, or Linux
- [ ] Internet connection
- [ ] 2GB free disk space
- [ ] Administrator/sudo privileges (for installations)

## Step-by-Step Installation

### 1️⃣ Install Node.js

**Windows:**
1. Go to https://nodejs.org/
2. Download "LTS" version (e.g., 18.x or 20.x)
3. Run the installer
4. Keep all default settings
5. Restart your computer

**Mac:**
```bash
# Using Homebrew (recommended)
brew install node

# Or download from nodejs.org
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Verify Installation:**
```bash
node --version   # Should show v18.x.x or v20.x.x
npm --version    # Should show 9.x.x or 10.x.x
```

### 2️⃣ Install Expo CLI

```bash
npm install -g expo-cli
```

If you get permission errors:

**Windows:** Run PowerShell as Administrator

**Mac/Linux:**
```bash
sudo npm install -g expo-cli
```

**Verify:**
```bash
expo --version   # Should show 6.x.x or higher
```

### 3️⃣ Setup Development Environment

#### Option A: Physical Device (Easiest)

1. **Download Expo Go App:**
   - iOS: Search "Expo Go" in App Store
   - Android: Search "Expo Go" in Play Store

2. **Ensure Same Network:**
   - Connect your phone and computer to the same WiFi
   - Disable VPN on both devices

#### Option B: iOS Simulator (Mac Only)

1. **Install Xcode:**
   ```bash
   # Download from Mac App Store (12+ GB)
   # Or use command:
   xcode-select --install
   ```

2. **Open Xcode:**
   - Go to Preferences > Locations
   - Select Command Line Tools

3. **Install Simulator:**
   - Xcode > Preferences > Components
   - Download iOS Simulator

#### Option C: Android Emulator (All Platforms)

1. **Install Android Studio:**
   - Download from https://developer.android.com/studio
   - Install with default settings (8+ GB)

2. **Setup Android SDK:**
   - Open Android Studio
   - Go to Tools > SDK Manager
   - Install Android SDK (API 33 or higher)

3. **Create Virtual Device:**
   - Tools > AVD Manager
   - Create Virtual Device
   - Select Pixel 5 or similar
   - Download system image (if needed)

4. **Add to PATH (Windows):**
   ```powershell
   # Add these to System Environment Variables:
   ANDROID_HOME = C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk
   # Add to PATH:
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\emulator
   ```

5. **Add to PATH (Mac/Linux):**
   ```bash
   # Add to ~/.bashrc or ~/.zshrc:
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

### 4️⃣ Install Project Dependencies

1. **Open Terminal/PowerShell**

2. **Navigate to Project:**
   ```bash
   cd stock-analyzer-mobile
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   ```

   This will install:
   - React Native
   - Expo SDK
   - Navigation libraries
   - Chart libraries
   - API clients
   - And more... (~300 MB)

4. **Wait for Completion:**
   - First time: 5-10 minutes
   - Depends on internet speed

### 5️⃣ Start the Development Server

```bash
npm start
```

Or:

```bash
expo start
```

**What happens:**
- Expo DevTools opens in browser
- QR code appears in terminal
- Metro bundler starts

**Common Issues:**

❌ **Port 19000 already in use:**
```bash
expo start --port 19001
```

❌ **Module not found:**
```bash
npm install
expo start --clear
```

❌ **Network issues:**
```bash
expo start --tunnel   # Uses ngrok tunnel
```

### 6️⃣ Run the App

#### On Physical Device:
1. Open Expo Go app
2. Scan QR code:
   - **iOS**: Use Camera app
   - **Android**: Use Expo Go scanner
3. App will download and run
4. Wait 30-60 seconds for first load

#### On iOS Simulator:
1. Press `i` in terminal
2. Simulator launches automatically
3. App installs and runs

#### On Android Emulator:
1. Start emulator first:
   ```bash
   emulator -avd YOUR_DEVICE_NAME
   ```
2. Press `a` in terminal
3. App installs and runs

### 7️⃣ Verify Everything Works

**Test Checklist:**
- [ ] App opens without crashes
- [ ] Home screen shows 10 sectors
- [ ] Can tap on a sector (e.g., Technology)
- [ ] Stock list loads (may take 10-30 seconds)
- [ ] Can tap on a stock (e.g., AAPL)
- [ ] Stock detail screen shows tabs
- [ ] Chart renders correctly
- [ ] Bottom navigation works

## Troubleshooting

### Problem: "Expo Command Not Found"

**Solution:**
```bash
# Install globally again
npm install -g expo-cli

# Or use npx
npx expo start
```

### Problem: "Network Response Timeout"

**Solution:**
1. Check internet connection
2. Try different WiFi network
3. Use tunnel mode:
   ```bash
   expo start --tunnel
   ```

### Problem: "Dependencies Not Found"

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
expo start --clear
```

### Problem: "Can't Scan QR Code"

**Solution:**
1. Ensure same WiFi network
2. Disable VPN
3. Try tunnel mode
4. Use direct IP (shown in terminal)

### Problem: "Metro Bundler Fails"

**Solution:**
```bash
# Clear cache
expo start --clear

# Or
npx expo start --clear --reset-cache
```

### Problem: "Build Failed" on Device

**Solution:**
1. Update Expo Go app
2. Clear Expo cache on device
3. Restart device
4. Try different device

## Performance Tips

1. **First Load is Slow:**
   - Yahoo Finance API fetches data for 10 stocks
   - This takes 10-30 seconds
   - Subsequent loads are faster

2. **Reduce Network Calls:**
   - Use fewer stocks per sector (edit stockAPI.js)
   - Implement caching (future feature)

3. **Speed Up Development:**
   ```bash
   # Use cached dependencies
   expo start --dev-client
   
   # Optimize for production
   expo start --no-dev --minify
   ```

## Next Steps

✅ **App is Running!** Now:

1. **Explore the App:**
   - Check different sectors
   - View various stocks
   - Read analysis recommendations

2. **Read Documentation:**
   - [QUICKSTART.md](QUICKSTART.md) - Basic usage
   - [README.md](README.md) - Full documentation
   - [FEATURES.md](FEATURES.md) - Feature list

3. **Customize:**
   - Change stock symbols
   - Adjust scoring weights
   - Modify UI colors

4. **Build for Production:**
   ```bash
   # iOS
   expo build:ios
   
   # Android
   expo build:android
   ```

## Getting Help

- **Expo Documentation**: https://docs.expo.dev/
- **React Native Docs**: https://reactnative.dev/docs/getting-started
- **Project Issues**: Check README.md

## System Requirements Summary

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Node.js | v14.x | v18.x or v20.x |
| RAM | 4GB | 8GB+ |
| Storage | 2GB | 5GB+ |
| OS | Windows 10, macOS 10.15, Ubuntu 18.04 | Latest versions |
| Internet | 1 Mbps | 5+ Mbps |

## Installation Time Estimate

| Task | Time |
|------|------|
| Node.js Installation | 5-10 min |
| Expo CLI Installation | 2-5 min |
| Project Dependencies | 5-10 min |
| Android Studio (optional) | 30-60 min |
| Xcode (optional, Mac only) | 60-120 min |
| **Total (minimal)** | **15-25 min** |
| **Total (with emulator)** | **45-150 min** |

---

**Congratulations! You're all set! 🎉**

Run `npm start` and start analyzing stocks! 📈
