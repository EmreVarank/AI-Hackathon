@echo off
echo ========================================
echo   🏥 OBESITY PREDICTION WEB APP
echo ========================================
echo.

echo 📋 Checking Python installation...
python --version
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python and try again
    pause
    exit /b 1
)

echo.
echo 📦 Installing/updating dependencies...
pip install -r requirements.txt

echo.
echo 🚀 Starting Flask API server...
echo.
echo 🌐 API will be available at: http://localhost:5000
echo 🌐 Web interface: Open frontend/index.html in your browser
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

cd backend
python app.py