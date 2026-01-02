# PWA Deployment Helper Script

Write-Host "================================" -ForegroundColor Cyan
Write-Host "NSE Stock Analyzer - PWA Deploy" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if in PWA folder
if (-not (Test-Path "manifest.json")) {
    Write-Host "❌ Error: Run this script from the pwa folder!" -ForegroundColor Red
    Write-Host "   cd pwa" -ForegroundColor Yellow
    Write-Host "   .\deploy-pwa.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ PWA files detected" -ForegroundColor Green
Write-Host ""

# Check for icons
$hasIcons = (Test-Path "icon-192.png") -and (Test-Path "icon-512.png")

if (-not $hasIcons) {
    Write-Host "⚠️  WARNING: Icon files missing!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You need to create:" -ForegroundColor White
    Write-Host "  - icon-192.png (192x192 pixels)" -ForegroundColor White
    Write-Host "  - icon-512.png (512x512 pixels)" -ForegroundColor White
    Write-Host ""
    Write-Host "Quick option: Use a stock market icon from:" -ForegroundColor Yellow
    Write-Host "  https://www.flaticon.com/search?word=stock" -ForegroundColor Cyan
    Write-Host ""
    
    $continue = Read-Host "Continue without icons? (y/n)"
    if ($continue -ne 'y') {
        exit 0
    }
} else {
    Write-Host "✅ Icons found" -ForegroundColor Green
}

Write-Host ""
Write-Host "Select deployment option:" -ForegroundColor Yellow
Write-Host "1. Test locally (npx serve)" -ForegroundColor White
Write-Host "2. Deploy to GitHub Pages" -ForegroundColor White
Write-Host "3. Deploy to Netlify (manual)" -ForegroundColor White
Write-Host "4. Generate .aab with PWABuilder" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Starting local server..." -ForegroundColor Yellow
        Write-Host "Your PWA will open at: http://localhost:3000" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
        Write-Host ""
        npx serve .
    }
    
    "2" {
        Write-Host ""
        Write-Host "Deploying to GitHub Pages..." -ForegroundColor Yellow
        
        $username = Read-Host "Enter your GitHub username"
        
        Write-Host ""
        Write-Host "Steps:" -ForegroundColor Yellow
        Write-Host "1. Creating gh-pages branch..." -ForegroundColor White
        
        cd ..
        git checkout -b gh-pages
        git add pwa/*
        git commit -m "Deploy PWA to GitHub Pages"
        
        Write-Host "2. Pushing to GitHub..." -ForegroundColor White
        git push origin gh-pages
        
        Write-Host ""
        Write-Host "✅ Deployed!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your PWA is at:" -ForegroundColor Cyan
        Write-Host "https://$username.github.io/nse-stock-analyzer/pwa/" -ForegroundColor White
        Write-Host ""
        Write-Host "Note: May take 1-2 minutes to go live" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Enable GitHub Pages:" -ForegroundColor Yellow
        Write-Host "1. Go to: https://github.com/$username/nse-stock-analyzer/settings/pages" -ForegroundColor White
        Write-Host "2. Source: gh-pages branch" -ForegroundColor White
        Write-Host "3. Folder: / (root)" -ForegroundColor White
        Write-Host "4. Save" -ForegroundColor White
    }
    
    "3" {
        Write-Host ""
        Write-Host "Deploying to Netlify..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Option A: Drag & Drop" -ForegroundColor Cyan
        Write-Host "1. Go to: https://app.netlify.com/drop" -ForegroundColor White
        Write-Host "2. Drag the 'pwa' folder onto the page" -ForegroundColor White
        Write-Host "3. Get your URL (e.g., https://random-name.netlify.app)" -ForegroundColor White
        Write-Host ""
        Write-Host "Option B: Netlify CLI" -ForegroundColor Cyan
        Write-Host ""
        
        $useNetlifyCLI = Read-Host "Use Netlify CLI? (y/n)"
        
        if ($useNetlifyCLI -eq 'y') {
            Write-Host "Installing Netlify CLI..." -ForegroundColor Yellow
            npm install -g netlify-cli
            
            Write-Host "Logging in to Netlify..." -ForegroundColor Yellow
            netlify login
            
            Write-Host "Deploying..." -ForegroundColor Yellow
            netlify deploy --prod
            
            Write-Host ""
            Write-Host "✅ Deployed!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "Opening Netlify Drop in browser..." -ForegroundColor Yellow
            Start-Process "https://app.netlify.com/drop"
            Write-Host ""
            Write-Host "Drag the PWA folder onto the page" -ForegroundColor White
        }
    }
    
    "4" {
        Write-Host ""
        Write-Host "Generating .aab with PWABuilder..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "First, you need to deploy your PWA to a URL" -ForegroundColor Yellow
        Write-Host ""
        
        $hasURL = Read-Host "Do you have a deployed PWA URL? (y/n)"
        
        if ($hasURL -eq 'y') {
            $url = Read-Host "Enter your PWA URL (e.g., https://your-app.netlify.app)"
            
            Write-Host ""
            Write-Host "Steps to generate .aab:" -ForegroundColor Yellow
            Write-Host "1. Go to: https://www.pwabuilder.com/" -ForegroundColor White
            Write-Host "2. Enter URL: $url" -ForegroundColor White
            Write-Host "3. Click 'Start'" -ForegroundColor White
            Write-Host "4. Fix any issues shown in report" -ForegroundColor White
            Write-Host "5. Click 'Package For Stores' → 'Android'" -ForegroundColor White
            Write-Host "6. Fill in details:" -ForegroundColor White
            Write-Host "   - Package ID: com.nsestockanalyzer.mobile" -ForegroundColor Gray
            Write-Host "   - App name: NSE Stock Analyzer" -ForegroundColor Gray
            Write-Host "   - Version: 1.0.0" -ForegroundColor Gray
            Write-Host "7. Click 'Generate'" -ForegroundColor White
            Write-Host "8. Download the .aab file" -ForegroundColor White
            Write-Host ""
            Write-Host "Opening PWABuilder..." -ForegroundColor Yellow
            Start-Process "https://www.pwabuilder.com/"
        } else {
            Write-Host ""
            Write-Host "Please deploy your PWA first using option 1, 2, or 3" -ForegroundColor Yellow
            Write-Host "Then run this script again and choose option 4" -ForegroundColor Yellow
        }
    }
    
    default {
        Write-Host ""
        Write-Host "Invalid choice" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Need help? See README.md" -ForegroundColor White
Write-Host "================================" -ForegroundColor Cyan
