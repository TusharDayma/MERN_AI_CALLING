@echo off
title AntiTalk Enterprise Launcher
echo ============================================================
echo        AntiTalk Omnichannel AI Voice Recruitment Platform
echo ============================================================

echo [1/3] Launching React Frontend ^& Express Backend Servers...
start cmd /k "npm run dev"

echo [2/3] Launching Python FastAPI Voice Engine (Port 8000)...
start cmd /k "cd python_service && venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo [3/3] Launching Ngrok HTTP Tunnel (Port 5000)...
start cmd /k "ngrok http --url=stonable-remiform-augustina.ngrok-free.dev 5000"

echo ============================================================
echo  All services launched in separate windows!
echo  - HR & Admin Portal     : http://localhost:5173
echo  - Express API & Email   : http://localhost:5000
echo  - Python AI Voice Engine: http://localhost:8000
echo  - Web Voice Screenings  : http://localhost:5173/screening/[token]
echo ============================================================
