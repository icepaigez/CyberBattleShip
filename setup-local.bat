@echo off
REM Cyber Battleships - Local Network Setup Script (Windows)
REM This script helps configure the application for local network deployment

echo ==========================================
echo   Cyber Battleships - Local Setup
echo ==========================================
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set SERVER_IP=%%a
    goto :found
)

:found
set SERVER_IP=%SERVER_IP:~1%

echo Detected Server IP: %SERVER_IP%
echo.

set /p CONFIRM="Is this correct? (y/n) or enter custom IP: "

REM Check if user entered an IP address
echo %CONFIRM% | findstr /r "^[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*$" >nul
if %errorlevel% equ 0 (
    set SERVER_IP=%CONFIRM%
    echo Using custom IP: %SERVER_IP%
) else if /i not "%CONFIRM%"=="y" (
    echo Please run 'ipconfig' to find your IPv4 Address
    echo Then edit the .env files manually.
    pause
    exit /b 1
)

echo.
echo Creating environment files...
echo.

REM Create backend/.env
(
echo # Backend Environment Configuration
echo PORT=3000
echo NODE_ENV=production
echo HOST=%SERVER_IP%
echo CORS_ORIGIN=*
) > backend\.env

echo Created backend\.env

REM Create frontend/.env
(
echo # Frontend Environment Configuration
echo VITE_API_URL=http://%SERVER_IP%:3000
) > frontend\.env

echo Created frontend\.env

echo.
echo ==========================================
echo   Configuration Complete!
echo ==========================================
echo.
echo Next steps:
echo.
echo 1. Install dependencies:
echo    npm install
echo.
echo 2. Build the application:
echo    cd backend ^&^& npm run build
echo    cd ..\frontend ^&^& npm run build
echo.
echo 3. Start the servers:
echo    cd backend ^&^& npm start
echo    cd ..\frontend ^&^& npm run dev -- --host
echo.
echo 4. Students connect to:
echo    http://%SERVER_IP%:5173
echo.
echo 5. Admin panel:
echo    http://%SERVER_IP%:5173/admin
echo.
echo 6. Make sure Windows Firewall allows ports 3000 and 5173
echo.
echo ==========================================
echo See LOCAL_DEPLOYMENT.md for full guide
echo ==========================================
echo.
pause
