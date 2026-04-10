@echo off
setlocal EnableDelayedExpansion

echo =========================================
echo    Poster of the Day - Frontend Deploy
echo =========================================
echo.

set DEPLOY_KEY=pod-deploy-2026-secret-key-xK9mP2vL
set DEPLOY_URL=http://admin.pod.allinonebimaposter.com/deploy-receiver.php
set FRONTEND_DIR=%~dp0..\frontend
set DIST_DIR=%FRONTEND_DIR%\dist

:: Step 1: Check deploy receiver is active
echo [0/3] Checking deploy receiver...
curl -s -X POST "%DEPLOY_URL%" -d "key=%DEPLOY_KEY%&action=ping" 2>nul | findstr "active" >nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Deploy receiver not found at %DEPLOY_URL%
    echo Please upload deploy-receiver.php to the server first!
    echo Location: /home/allinone/domains/admin.pod.allinonebimaposter.com/public_html/
    echo.
    pause
    exit /b 1
)
echo Deploy receiver is active!
echo.

:: Step 2: Build
echo [1/3] Building frontend...
echo.
cd /d "%FRONTEND_DIR%"
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo BUILD FAILED!
    pause
    exit /b 1
)
echo.
echo Build successful!
echo.

:: Step 3: Create ZIP of dist
echo [2/3] Creating deployment package...
cd /d "%DIST_DIR%"
powershell -Command "Compress-Archive -Path '%DIST_DIR%\*' -DestinationPath '%~dp0deploy-frontend.zip' -Force"
if %ERRORLEVEL% NEQ 0 (
    echo Failed to create ZIP!
    pause
    exit /b 1
)
echo Package created!
echo.

:: Step 4: Upload ZIP
echo [3/3] Uploading to server...
curl -X POST "%DEPLOY_URL%" -F "key=%DEPLOY_KEY%" -F "action=upload_zip" -F "clear_dir=1" -F "file=@%~dp0deploy-frontend.zip"
echo.

:: Cleanup
del "%~dp0deploy-frontend.zip" 2>nul

echo.
echo =========================================
echo    Frontend Deployed!
echo    URL: http://admin.pod.allinonebimaposter.com
echo =========================================
echo.
pause
