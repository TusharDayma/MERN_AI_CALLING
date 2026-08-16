# AntiTalk Enterprise One-Click Startup Script
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "       AntiTalk Omnichannel AI Voice Recruitment Platform   " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Start Node.js Express Backend & React Frontend
Write-Host "[1/3] Launching React Frontend (Port 5173) & Express Backend (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location `"$PSScriptRoot`"; npm run dev"

# 2. Start Python Voice AI Service
Write-Host "[2/3] Launching Python FastAPI Voice Engine (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location `"$PSScriptRoot\python_service`"; .\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

# 3. Start Ngrok Tunnel (Optional for Telephony/WhatsApp Webhooks)
if (Get-Command ngrok -ErrorAction SilentlyContinue) {
    Write-Host "[3/3] Launching Ngrok HTTP Tunnel (Port 5000)..." -ForegroundColor Yellow
    Stop-Process -Name ngrok -Force -ErrorAction SilentlyContinue
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http --url=stonable-remiform-augustina.ngrok-free.dev 5000"
} else {
    Write-Host "[3/3] Ngrok not found in PATH — running in local mode (Browser voice screening & email work 100% locally)." -ForegroundColor DarkGray
}

Write-Host "============================================================" -ForegroundColor Green
Write-Host " All AntiTalk services launched successfully!" -ForegroundColor Green
Write-Host " - HR & Admin Portal     : http://localhost:5173" -ForegroundColor Green
Write-Host " - Express API & Email   : http://localhost:5000" -ForegroundColor Green
Write-Host " - Python AI Engine      : http://localhost:8000 (ws://localhost:8000/media-stream)" -ForegroundColor Green
Write-Host " - Web Voice Screenings  : http://localhost:5173/screening/<token>" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
