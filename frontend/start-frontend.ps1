# Start Karnataka Job Portal Frontend in Background
Write-Host "Starting Karnataka Job Portal Frontend..." -ForegroundColor Green

# Check if frontend is already running
$existingProcess = Get-Process node -ErrorAction SilentlyContinue | Where-Object {$_.Path -like "*frontend*"}
if ($existingProcess) {
    Write-Host "Frontend is already running (PID: $($existingProcess.Id))" -ForegroundColor Yellow
    Write-Host "To stop it, run: Stop-Process -Id $($existingProcess.Id)" -ForegroundColor Yellow
    exit
}

# Start frontend in background
$frontendPath = $PSScriptRoot
Set-Location $frontendPath

# Start the process and redirect output to log file
$logFile = Join-Path $frontendPath "frontend.log"
$process = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory $frontendPath -PassThru -WindowStyle Hidden -RedirectStandardOutput $logFile -RedirectStandardError (Join-Path $frontendPath "frontend-error.log")

if ($process) {
    Start-Sleep -Seconds 3
    Write-Host "✅ Frontend started successfully!" -ForegroundColor Green
    Write-Host "   PID: $($process.Id)" -ForegroundColor Cyan
    Write-Host "   URL: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "   Logs: $logFile" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To stop frontend: Stop-Process -Id $($process.Id)" -ForegroundColor Yellow
    Write-Host "To view logs: Get-Content $logFile -Wait -Tail 20" -ForegroundColor Yellow
} else {
    Write-Host "❌ Failed to start frontend" -ForegroundColor Red
}
