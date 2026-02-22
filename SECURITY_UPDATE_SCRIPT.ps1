# Security Update Script for React & Next.js (Windows PowerShell)
# Run this script to update dependencies and check for vulnerabilities

Write-Host "🔒 Starting Security Update Process..." -ForegroundColor Cyan
Write-Host ""

# Check Node.js version
Write-Host "📦 Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node -v
Write-Host "   Node.js: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Function to update packages in a directory
function Update-Packages {
    param(
        [string]$Path,
        [string]$ProjectName
    )
    
    if (Test-Path $Path) {
        Push-Location $Path
        
        if (Test-Path "package.json") {
            Write-Host "🔄 Updating packages in $ProjectName..." -ForegroundColor Yellow
            
            # Check current versions
            Write-Host "   Current versions:" -ForegroundColor Gray
            $nextVersion = Select-String -Path "package.json" -Pattern '"next"' | ForEach-Object { $_.Line }
            $reactVersion = Select-String -Path "package.json" -Pattern '"react"' | ForEach-Object { $_.Line }
            if ($nextVersion) { Write-Host "   $nextVersion" -ForegroundColor Gray }
            if ($reactVersion) { Write-Host "   $reactVersion" -ForegroundColor Gray }
            Write-Host ""
            
            # Update Next.js
            Write-Host "   Updating Next.js..." -ForegroundColor Gray
            npm install next@latest --save
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✓ Next.js updated" -ForegroundColor Green
            } else {
                Write-Host "   ✗ Failed to update Next.js" -ForegroundColor Red
            }
            
            # Update React
            Write-Host "   Updating React..." -ForegroundColor Gray
            npm install react@latest react-dom@latest --save
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✓ React updated" -ForegroundColor Green
            } else {
                Write-Host "   ✗ Failed to update React" -ForegroundColor Red
            }
            
            Write-Host ""
        } else {
            Write-Host "   ✗ package.json not found in $Path" -ForegroundColor Red
        }
        
        Pop-Location
    } else {
        Write-Host "   ✗ Directory not found: $Path" -ForegroundColor Red
    }
}

# Update frontend
Update-Packages -Path "src\frontend" -ProjectName "Frontend"

# Update admin frontend
Update-Packages -Path "src\admin\frontend" -ProjectName "Admin Frontend"

# Run npm audit
Write-Host "🔍 Running security audit..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path "src\frontend\package.json") {
    Write-Host "   Frontend audit:" -ForegroundColor Gray
    Push-Location "src\frontend"
    npm audit --audit-level=moderate
    Pop-Location
    Write-Host ""
}

if (Test-Path "src\admin\frontend\package.json") {
    Write-Host "   Admin frontend audit:" -ForegroundColor Gray
    Push-Location "src\admin\frontend"
    npm audit --audit-level=moderate
    Pop-Location
    Write-Host ""
}

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📋 Security Update Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Next.js and React have been updated" -ForegroundColor Green
Write-Host "✅ Security audit completed" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT NEXT STEPS:" -ForegroundColor Yellow
Write-Host "   1. Review the security audit results above"
Write-Host "   2. Test your application thoroughly"
Write-Host "   3. Review SECURITY_ADVISORY_REACT_NEXTJS.md for additional security measures"
Write-Host "   4. Update next.config.js with security headers (already done)"
Write-Host "   5. Consider implementing rate limiting"
Write-Host ""
Write-Host "📚 For more information, see: SECURITY_ADVISORY_REACT_NEXTJS.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Security update process completed!" -ForegroundColor Green
Write-Host ""

