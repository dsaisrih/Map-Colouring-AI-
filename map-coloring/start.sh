#!/bin/bash
set -e

echo "============================================"
echo " MapColor AI - Setup and Launch"
echo "============================================"

ROOT=$(cd "$(dirname "$0")" && pwd)

echo ""
echo "[1/3] Installing Python dependencies..."
cd "$ROOT/backend"
pip install -r requirements.txt 2>/dev/null || pip install -r requirements.txt --break-system-packages

echo ""
echo "[2/3] Installing Node.js dependencies..."
cd "$ROOT/frontend"
npm install

echo ""
echo "[3/3] Starting servers..."
echo "Backend  -> http://localhost:8000"
echo "Frontend -> http://localhost:5173"
echo ""

# Start backend in background
cd "$ROOT/backend"
python app.py &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

sleep 2

# Start frontend in background
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ Both servers running!"
echo "   Open: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait and cleanup on exit
trap "echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
wait
