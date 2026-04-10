@echo off
setlocal EnableDelayedExpansion

echo =========================================
echo    Poster of the Day - Backend Deploy
echo =========================================
echo.

set DEPLOY_KEY=pod-deploy-2026-secret-key-xK9mP2vL
set DEPLOY_URL=https://api.pod.allinonebimaposter.com/deploy-receiver.php
set BACKEND_DIR=%~dp0..\backend

:: Step 1: Check deploy receiver is active
echo [0/3] Checking deploy receiver...
curl -s -X POST "%DEPLOY_URL%" -d "key=%DEPLOY_KEY%&action=ping" 2>nul | findstr "active" >nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Deploy receiver not found at %DEPLOY_URL%
    echo Please upload deploy-receiver.php to the server first!
    echo Location: /home/allinone/domains/api.pod.allinonebimaposter.com/public_html/
    echo.
    pause
    exit /b 1
)
echo Deploy receiver is active!
echo.

:: Step 2: Upload key backend files individually
echo [1/3] Uploading config files...

:: CORS config
curl -s -X POST "%DEPLOY_URL%" -F "key=%DEPLOY_KEY%" -F "action=upload" -F "path=config/cors.php" -F "file=@%BACKEND_DIR%\config\cors.php"
echo   - config/cors.php

:: Sanctum config
curl -s -X POST "%DEPLOY_URL%" -F "key=%DEPLOY_KEY%" -F "action=upload" -F "path=config/sanctum.php" -F "file=@%BACKEND_DIR%\config\sanctum.php"
echo   - config/sanctum.php

:: Routes
curl -s -X POST "%DEPLOY_URL%" -F "key=%DEPLOY_KEY%" -F "action=upload" -F "path=routes/api.php" -F "file=@%BACKEND_DIR%\routes\api.php"
echo   - routes/api.php

curl -s -X POST "%DEPLOY_URL%" -F "key=%DEPLOY_KEY%" -F "action=upload" -F "path=routes/web.php" -F "file=@%BACKEND_DIR%\routes\web.php"
echo   - routes/web.php

echo.
echo [2/3] Uploading controllers...

:: Upload all controllers
for %%f in ("%BACKEND_DIR%\app\Http\Controllers\Api\*.php") do (
    curl -s -X POST "%DEPLOY_URL%" -F "key=%DEPLOY_KEY%" -F "action=upload" -F "path=app/Http/Controllers/Api/%%~nxf" -F "file=@%%f"
    echo   - app/Http/Controllers/Api/%%~nxf
)

:: Upload base controller
curl -s -X POST "%DEPLOY_URL%" -F "key=%DEPLOY_KEY%" -F "action=upload" -F "path=app/Http/Controllers/Controller.php" -F "file=@%BACKEND_DIR%\app\Http\Controllers\Controller.php"
echo   - app/Http/Controllers/Controller.php

echo.
echo [2/3] Uploading models...

for %%f in ("%BACKEND_DIR%\app\Models\*.php") do (
    curl -s -X POST "%DEPLOY_URL%" -F "key=%DEPLOY_KEY%" -F "action=upload" -F "path=app/Models/%%~nxf" -F "file=@%%f"
    echo   - app/Models/%%~nxf
)

echo.
echo [2/3] Uploading migrations...

for %%f in ("%BACKEND_DIR%\database\migrations\*.php") do (
    curl -s -X POST "%DEPLOY_URL%" -F "key=%DEPLOY_KEY%" -F "action=upload" -F "path=database/migrations/%%~nxf" -F "file=@%%f"
    echo   - database/migrations/%%~nxf
)

echo.
echo [2/3] Uploading seeders...

for %%f in ("%BACKEND_DIR%\database\seeders\*.php") do (
    curl -s -X POST "%DEPLOY_URL%" -F "key=%DEPLOY_KEY%" -F "action=upload" -F "path=database/seeders/%%~nxf" -F "file=@%%f"
    echo   - database/seeders/%%~nxf
)

echo.
echo [3/3] Running artisan commands...

curl -s -X POST "%DEPLOY_URL%" -d "key=%DEPLOY_KEY%&action=artisan&cmd=config:clear"
echo   - config:clear
curl -s -X POST "%DEPLOY_URL%" -d "key=%DEPLOY_KEY%&action=artisan&cmd=config:cache"
echo   - config:cache
curl -s -X POST "%DEPLOY_URL%" -d "key=%DEPLOY_KEY%&action=artisan&cmd=route:cache"
echo   - route:cache
curl -s -X POST "%DEPLOY_URL%" -d "key=%DEPLOY_KEY%&action=artisan&cmd=migrate --force"
echo   - migrate

echo.
echo =========================================
echo    Backend Deployed!
echo    URL: https://api.pod.allinonebimaposter.com
echo =========================================
echo.
pause
