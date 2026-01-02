# Stock Analyzer - EAS Build Setup

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  BUILDING STANDALONE ANDROID APK" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "This will create an installable APK file for your phone!" -ForegroundColor Green
Write-Host "The build happens in the cloud - no Node version issues!`n" -ForegroundColor Yellow

# Check if eas-cli is installed
Write-Host "Step 1: Checking EAS CLI..." -ForegroundColor Magenta
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue

if (-not $easInstalled) {
    Write-Host "Installing EAS CLI globally..." -ForegroundColor Yellow
    npm install -g eas-cli
} else {
    Write-Host "✅ EAS CLI already installed!`n" -ForegroundColor Green
}

# Login
Write-Host "Step 2: Login to Expo" -ForegroundColor Magenta
Write-Host "If you don't have an account, create one (it's free!)`n" -ForegroundColor Yellow
eas login

# Configure
Write-Host "`nStep 3: Configure build..." -ForegroundColor Magenta
cd C:\Users\Abhijit.Pande\stock-analyzer-mobile

# Build
Write-Host "`nStep 4: Starting build (this takes 10-15 minutes)..." -ForegroundColor Magenta
Write-Host "The build happens in the cloud, so you can close this and check later!`n" -ForegroundColor Yellow

$build = Read-Host "Ready to start build? (y/n)"

if ($build -eq "y") {
    Write-Host "`n🚀 Building your app..." -ForegroundColor Green
    Write-Host "You'll get a download link when done!`n" -ForegroundColor Green
    
    eas build -p android --profile preview
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  BUILD COMPLETE!" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    Write-Host "Download the APK and install on your phone!" -ForegroundColor Green
} else {
    Write-Host "`nBuild cancelled. Run this script again when ready!" -ForegroundColor Yellow
}

Write-Host "`n"
