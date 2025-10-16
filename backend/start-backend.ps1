# Start Karnataka Job Portal Backend in Background
Write-Host "Starting Karnataka Job Portal Backend..." -ForegroundColor Green

# Check if backend is already running
$existingProcess = Get-Process node -ErrorAction SilentlyContinue | Where-Object {$_.Path -like "*backend*"}
if ($existingProcess) {
    Write-Host "Backend is already running (PID: $($existingProcess.Id))" -ForegroundColor Yellow
    Write-Host "To stop it, run: Stop-Process -Id $($existingProcess.Id)" -ForegroundColor Yellow
    exit
}

# Start backend in background
$backendPath = $PSScriptRoot
Set-Location $backendPath

# Start the process and redirect output to log file
$logFile = Join-Path $backendPath "backend.log"
$process = Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory $backendPath -PassThru -WindowStyle Hidden -RedirectStandardOutput $logFile -RedirectStandardError (Join-Path $backendPath "backend-error.log")

if ($process) {
    Write-Host "✅ Backend started successfully!" -ForegroundColor Green
    Write-Host "   PID: $($process.Id)" -ForegroundColor Cyan
    Write-Host "   Port: 5000" -ForegroundColor Cyan
    Write-Host "   Logs: $logFile" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To stop backend: Stop-Process -Id $($process.Id)" -ForegroundColor Yellow
    Write-Host "To view logs: Get-Content $logFile -Wait -Tail 20" -ForegroundColor Yellow
} else {
    Write-Host "❌ Failed to start backend" -ForegroundColor Red
}
