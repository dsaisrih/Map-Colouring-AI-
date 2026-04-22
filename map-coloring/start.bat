@echo off
echo ============================================
echo  MapColor AI - Setup and Launch
echo ============================================

echo.
echo [1/3] Installing Python dependencies...
cd backend
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: pip install failed. Try: pip install -r requirements.txt --break-system-packages
    pause
    exit /b 1
)

echo.
echo [2/3] Installing Node.js dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed.
    pause
    exit /b 1
)

echo.
echo [3/3] Starting servers...
echo Backend  -> http://localhost:8000
echo Frontend -> http://localhost:5173
echo.

start "MapColor Backend" cmd /k "cd /d %~dp0backend && python app.py"
timeout /t 2 /nobreak >nul
start "MapColor Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers starting...
echo Open: http://localhost:5173
pause
