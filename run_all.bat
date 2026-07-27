@echo off
title AntiTalk Enterprise Launcher
echo ============================================================
echo          AntiTalk Enterprise AI Voice SaaS
echo ============================================================

echo [1/3] Launching Frontend ^& Express Backend Servers...
start cmd /k "npm run dev"

echo [2/3] Launching Python FastAPI Voice Engine...
start cmd /k "cd python_service && venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo [3/3] Launching Ngrok HTTP Tunnel...
start cmd /k "ngrok http --url=stonable-remiform-augustina.ngrok-free.dev 5000"

echo ============================================================
echo  All services launched in separate windows!
echo  React Dashboard: http://localhost:5173
echo  Express Backend: http://localhost:5000
echo  Python AI Engine: http://localhost:8000
echo  Ngrok Tunnel: https://stonable-remiform-augustina.ngrok-free.dev
echo ============================================================
