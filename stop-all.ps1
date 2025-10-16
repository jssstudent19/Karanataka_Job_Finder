# Stop Karnataka Job Portal - Backend & Frontend
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Red
Write-Host "║      Karnataka Job Portal - Stopping All Services         ║" -ForegroundColor Red
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Red
Write-Host ""

$stoppedCount = 0

# Find and stop all node processes
Write-Host "🔍 Looking for running Node.js processes..." -ForegroundColor Yellow

# Get all node processes
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    foreach ($process in $nodeProcesses) {
        try {
            $processName = $process.ProcessName
            $processId = $process.Id
            
            Write-Host "   Stopping process: $processName (PID: $processId)" -ForegroundColor Yellow
            Stop-Process -Id $processId -Force
            $stoppedCount++
            Write-Host "   ✅ Stopped PID: $processId" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  Could not stop PID: $processId" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "✅ Stopped $stoppedCount process(es)" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No running Node.js processes found" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "All services stopped!" -ForegroundColor Green
