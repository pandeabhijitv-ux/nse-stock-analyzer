# Fix SSL Certificate Error for EAS Login

Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "  FIXING SSL CERTIFICATE ERROR" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

Write-Host "Applying SSL certificate fix...`n" -ForegroundColor Cyan

# Set NODE_TLS_REJECT_UNAUTHORIZED to bypass SSL issues temporarily
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"

Write-Host "✅ SSL bypass enabled for this session`n" -ForegroundColor Green

Write-Host "Now trying to login to EAS..." -ForegroundColor Cyan
cd C:\Users\Abhijit.Pande\stock-analyzer-mobile
eas login

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "If you still have issues, check:" -ForegroundColor Yellow
Write-Host "1. Disable VPN temporarily" -ForegroundColor White
Write-Host "2. Check corporate firewall" -ForegroundColor White
Write-Host "3. Try using mobile hotspot`n" -ForegroundColor White
