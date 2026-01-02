# NSE Stock Analyzer - Quick Deployment Script

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "NSE Stock Analyzer Deployment" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if command exists
function Test-Command {
    param($Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Check GitHub username
Write-Host "Step 1: GitHub Setup" -ForegroundColor Yellow
$username = Read-Host "Enter your GitHub username"

if ([string]::IsNullOrWhiteSpace($username)) {
    Write-Host "❌ GitHub username is required!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ GitHub username: $username" -ForegroundColor Green
Write-Host ""

# Check if git is configured
Write-Host "Checking git configuration..." -ForegroundColor Yellow
$gitUser = git config user.name
$gitEmail = git config user.email

if ([string]::IsNullOrWhiteSpace($gitUser) -or [string]::IsNullOrWhiteSpace($gitEmail)) {
    Write-Host "⚠️ Git not configured. Setting up..." -ForegroundColor Yellow
    $name = Read-Host "Enter your name for git commits"
    $email = Read-Host "Enter your email for git commits"
    
    git config --global user.name $name
    git config --global user.email $email
    Write-Host "✅ Git configured" -ForegroundColor Green
} else {
    Write-Host "✅ Git already configured" -ForegroundColor Green
    Write-Host "   Name: $gitUser" -ForegroundColor Gray
    Write-Host "   Email: $gitEmail" -ForegroundColor Gray
}
Write-Host ""

# Instructions for GitHub repository
Write-Host "Step 2: Create GitHub Repository" -ForegroundColor Yellow
Write-Host ""
Write-Host "Please create a new repository on GitHub:" -ForegroundColor Cyan
Write-Host "1. Go to: https://github.com/new" -ForegroundColor White
Write-Host "2. Repository name: nse-stock-analyzer" -ForegroundColor White
Write-Host "3. Description: AI-Powered NSE Stock Analysis App for Indian Market" -ForegroundColor White
Write-Host "4. Choose Public or Private" -ForegroundColor White
Write-Host "5. DO NOT initialize with README, .gitignore, or license" -ForegroundColor White
Write-Host "6. Click 'Create repository'" -ForegroundColor White
Write-Host ""

$created = Read-Host "Have you created the repository? (y/n)"

if ($created -ne 'y') {
    Write-Host "Please create the repository first, then run this script again." -ForegroundColor Yellow
    exit 0
}

# Add remote and push
Write-Host ""
Write-Host "Step 3: Pushing to GitHub..." -ForegroundColor Yellow

try {
    git remote add origin "https://github.com/$username/nse-stock-analyzer.git"
    Write-Host "✅ Remote added" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Remote might already exist, continuing..." -ForegroundColor Yellow
}

try {
    git branch -M main
    git push -u origin main
    Write-Host "✅ Code pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Your code is now on GitHub!" -ForegroundColor Green
    Write-Host "   URL: https://github.com/$username/nse-stock-analyzer" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to push. Make sure:" -ForegroundColor Red
    Write-Host "   1. Repository exists on GitHub" -ForegroundColor White
    Write-Host "   2. You have access to push" -ForegroundColor White
    Write-Host "   3. Repository name is correct: nse-stock-analyzer" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Step 4: Build Android App Bundle" -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if EAS CLI is installed
if (Test-Command eas) {
    Write-Host "✅ EAS CLI already installed" -ForegroundColor Green
} else {
    Write-Host "Installing EAS CLI..." -ForegroundColor Yellow
    npm install -g eas-cli
    Write-Host "✅ EAS CLI installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "Next steps for building .aab file:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Create Expo account (if you don't have one):" -ForegroundColor White
Write-Host "   https://expo.dev/signup" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Login to Expo:" -ForegroundColor White
Write-Host "   eas login" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Build the app:" -ForegroundColor White
Write-Host "   eas build --platform android --profile production" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Wait 10-20 minutes for build to complete" -ForegroundColor White
Write-Host ""
Write-Host "5. Download the .aab file from the link provided" -ForegroundColor White
Write-Host ""
Write-Host "6. Upload to Google Play Console:" -ForegroundColor White
Write-Host "   https://play.google.com/console" -ForegroundColor Cyan
Write-Host ""

$buildNow = Read-Host "Do you want to start the build process now? (y/n)"

if ($buildNow -eq 'y') {
    Write-Host ""
    Write-Host "Starting build process..." -ForegroundColor Yellow
    Write-Host "You'll need to login to your Expo account..." -ForegroundColor Yellow
    Write-Host ""
    
    eas login
    
    Write-Host ""
    Write-Host "Building Android App Bundle (.aab)..." -ForegroundColor Yellow
    Write-Host "This will take 10-20 minutes..." -ForegroundColor Yellow
    Write-Host ""
    
    eas build --platform android --profile production
} else {
    Write-Host ""
    Write-Host "You can build later using:" -ForegroundColor Yellow
    Write-Host "   eas build --platform android --profile production" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "📚 For detailed instructions, see:" -ForegroundColor Green
Write-Host "   DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Good luck with your app! 🚀📈" -ForegroundColor Green
