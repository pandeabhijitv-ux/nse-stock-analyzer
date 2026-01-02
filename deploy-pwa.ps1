# PWABuilder.com Deployment - Quick Start

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  NSE Stock Analyzer - PWABuilder Deployment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if PWA folder exists
if (!(Test-Path "pwa")) {
    Write-Host "❌ PWA folder not found!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ PWA folder found" -ForegroundColor Green
Write-Host ""

# Step 2: Choose hosting method
Write-Host "Step 1: Choose Hosting Method" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Netlify Drop (Easiest - No signup needed)" -ForegroundColor White
Write-Host "2. GitHub Pages (Free - Requires GitHub account)" -ForegroundColor White
Write-Host "3. Vercel (Free - Requires account)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "📦 Netlify Drop Method:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. Go to: https://app.netlify.com/drop" -ForegroundColor White
        Write-Host "2. Drag and drop the 'pwa' folder" -ForegroundColor White
        Write-Host "3. Wait 30 seconds" -ForegroundColor White
        Write-Host "4. Copy the URL (e.g., https://random-name.netlify.app)" -ForegroundColor White
        Write-Host ""
        
        # Open Netlify Drop
        Start-Process "https://app.netlify.com/drop"
        
        Write-Host "Press Enter after you've deployed to Netlify..." -ForegroundColor Yellow
        Read-Host
        
        $url = Read-Host "Enter your Netlify URL"
    }
    "2" {
        Write-Host ""
        Write-Host "📦 GitHub Pages Method:" -ForegroundColor Cyan
        Write-Host ""
        
        $username = Read-Host "Enter your GitHub username"
        
        Write-Host ""
        Write-Host "Creating repository..." -ForegroundColor Yellow
        
        cd pwa
        git init
        git add .
        git commit -m "NSE Stock Analyzer PWA"
        git branch -M main
        git remote add origin "https://github.com/$username/nse-stock-analyzer.git"
        
        Write-Host ""
        Write-Host "Before pushing, create the repository:" -ForegroundColor Yellow
        Write-Host "1. Go to: https://github.com/new" -ForegroundColor White
        Write-Host "2. Name: nse-stock-analyzer" -ForegroundColor White
        Write-Host "3. Public repository" -ForegroundColor White
        Write-Host "4. Don't initialize with anything" -ForegroundColor White
        Write-Host "5. Create repository" -ForegroundColor White
        Write-Host ""
        
        Start-Process "https://github.com/new"
        
        Read-Host "Press Enter after creating the repository"
        
        git push -u origin main
        
        Write-Host ""
        Write-Host "Now enable GitHub Pages:" -ForegroundColor Yellow
        Write-Host "1. Go to repository Settings" -ForegroundColor White
        Write-Host "2. Click 'Pages' in sidebar" -ForegroundColor White
        Write-Host "3. Source: main branch" -ForegroundColor White
        Write-Host "4. Save" -ForegroundColor White
        Write-Host ""
        
        $url = "https://$username.github.io/nse-stock-analyzer/"
        Write-Host "Your URL will be: $url" -ForegroundColor Green
        
        cd ..
    }
    "3" {
        Write-Host ""
        Write-Host "📦 Vercel Method:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. Go to: https://vercel.com/new" -ForegroundColor White
        Write-Host "2. Sign up/Login" -ForegroundColor White
        Write-Host "3. Import your GitHub repository" -ForegroundColor White
        Write-Host "4. Deploy" -ForegroundColor White
        Write-Host ""
        
        Start-Process "https://vercel.com/new"
        
        Read-Host "Press Enter after deploying"
        
        $url = Read-Host "Enter your Vercel URL"
    }
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

# Step 3: PWABuilder
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Step 2: Generate .aab with PWABuilder" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Your app URL: $url" -ForegroundColor Green
Write-Host ""
Write-Host "Now follow these steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to: https://www.pwabuilder.com" -ForegroundColor White
Write-Host "2. Enter your URL: $url" -ForegroundColor Cyan
Write-Host "3. Click 'Start'" -ForegroundColor White
Write-Host "4. Wait for analysis to complete" -ForegroundColor White
Write-Host "5. Click 'Package For Stores'" -ForegroundColor White
Write-Host "6. Select 'Android'" -ForegroundColor White
Write-Host "7. Fill in details:" -ForegroundColor White
Write-Host "   - Package ID: com.nsestockanalyzer.mobile" -ForegroundColor Gray
Write-Host "   - App name: NSE Stock Analyzer" -ForegroundColor Gray
Write-Host "   - Version: 1.0.0" -ForegroundColor Gray
Write-Host "8. Click 'Generate'" -ForegroundColor White
Write-Host "9. Download the .aab file" -ForegroundColor White
Write-Host ""

# Open PWABuilder
Start-Process "https://www.pwabuilder.com"

Write-Host ""
Write-Host "Press Enter after downloading the .aab file..." -ForegroundColor Yellow
Read-Host

# Step 4: Google Play
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Step 3: Upload to Google Play Console" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Go to: https://play.google.com/console" -ForegroundColor White
Write-Host "2. Create new app (if not exists)" -ForegroundColor White
Write-Host "3. Go to Production → Create Release" -ForegroundColor White
Write-Host "4. Upload your .aab file" -ForegroundColor White
Write-Host "5. Complete store listing" -ForegroundColor White
Write-Host "6. Submit for review" -ForegroundColor White
Write-Host ""

$openPlayConsole = Read-Host "Open Google Play Console? (y/n)"

if ($openPlayConsole -eq 'y') {
    Start-Process "https://play.google.com/console"
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🎉 Deployment Process Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 For detailed instructions, see:" -ForegroundColor Yellow
Write-Host "   PWABUILDER_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app URL: $url" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Wait 2-7 days for Google Play approval! 🚀" -ForegroundColor Yellow
Write-Host ""
