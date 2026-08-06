# AntiTalk One-Click Startup Script
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "         AntiTalk Enterprise AI Voice SaaS                 " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Start Node.js Express Backend & React Frontend
Write-Host "[1/3] Launching Frontend & Express Backend Servers..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location `"$PSScriptRoot`"; npm run dev"

# 2. Start Python Voice AI Service
Write-Host "[2/3] Launching Python FastAPI Voice Engine..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location `"$PSScriptRoot\python_service`"; .\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

# 3. Start Ngrok Tunnel
Write-Host "[3/3] Launching Ngrok HTTP Tunnel..." -ForegroundColor Yellow
Stop-Process -Name ngrok -Force -ErrorAction SilentlyContinue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http --url=stonable-remiform-augustina.ngrok-free.dev 5000"

Write-Host "============================================================" -ForegroundColor Green
Write-Host " All services launched successfully!" -ForegroundColor Green
Write-Host " React Dashboard: http://localhost:5173" -ForegroundColor Green
Write-Host " Express Backend: http://localhost:5000" -ForegroundColor Green
Write-Host " Python AI Engine: http://localhost:8000 (ws://localhost:8000/media-stream)" -ForegroundColor Green
Write-Host " Public URL: https://stonable-remiform-augustina.ngrok-free.dev" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
