# Start Karnataka Job Portal - Backend & Frontend
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      Karnataka Job Portal - Starting All Services         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Start Backend
Write-Host "🚀 Starting Backend..." -ForegroundColor Yellow
& "$PSScriptRoot\backend\start-backend.ps1"
Write-Host ""

# Wait a bit for backend to start
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host ""

# Start Frontend
Write-Host "🚀 Starting Frontend..." -ForegroundColor Yellow
& "$PSScriptRoot\frontend\start-frontend.ps1"
Write-Host ""

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    ALL SERVICES STARTED                    ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔧 Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "📊 External Jobs: http://localhost:5173/external-jobs" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 To view backend logs:  Get-Content .\backend\backend.log -Wait -Tail 20" -ForegroundColor Gray
Write-Host "📝 To view frontend logs: Get-Content .\frontend\frontend.log -Wait -Tail 20" -ForegroundColor Gray
Write-Host ""
Write-Host "To stop all services, run: .\stop-all.ps1" -ForegroundColor Yellow
