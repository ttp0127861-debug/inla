@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "MODE=%~1"
set AWS_PROFILE=inla-admin
set USERS_DIR=%~dp0
set TF_DIR=%~dp0..\..\terraform\api

echo ========================================
echo Installing and packaging users Lambda...
echo ========================================
cd /d "%USERS_DIR%"
if not exist dist mkdir dist
if exist dist\users.zip del /f dist\users.zip
call npm install --omit=dev
if errorlevel 1 (
    echo npm install failed!
    call :maybe_pause
    exit /b 1
)
tar -a -cf dist\users.zip src node_modules package.json
if errorlevel 1 (
    echo Lambda zip failed!
    call :maybe_pause
    exit /b 1
)
if not exist dist\users.zip (
    echo Lambda zip was not created!
    call :maybe_pause
    exit /b 1
)

if /I "%MODE%"=="package" exit /b 0

if not defined DATABASE_URL (
    echo DATABASE_URL is not set. Set Neon connection string before deploy, e.g.:
    echo   set DATABASE_URL=postgresql://...
    call :maybe_pause
    exit /b 1
)

set "BACKEND_DIR=%~dp0.."
if not exist "%BACKEND_DIR%\customer\dist\customer.zip" (
    echo ERROR: Missing customer\dist\customer.zip ^(terraform plan needs it on disk^).
    echo Run: backend\customer\deploy-customer-api.bat package
    call :maybe_pause
    exit /b 1
)
if not exist "%BACKEND_DIR%\quotation\dist\quotation.zip" (
    echo ERROR: Missing quotation\dist\quotation.zip ^(terraform plan needs it on disk^).
    echo Run: backend\quotation\deploy-quotation-api.bat package
    call :maybe_pause
    exit /b 1
)

echo.
echo ========================================
echo Terraform init...
echo ========================================
cd /d "%TF_DIR%"
call terraform init
if errorlevel 1 (
    echo terraform init failed!
    call :maybe_pause
    exit /b 1
)

echo.
echo ========================================
echo Terraform apply (users Lambda only)...
echo ========================================
call terraform apply -auto-approve -target=aws_lambda_function.users
if errorlevel 1 (
    echo terraform apply failed!
    call :maybe_pause
    exit /b 1
)

echo.
echo ========================================
echo Deploy completed!
echo ========================================
set API_URL=
for /f "usebackq delims=" %%i in (`terraform output -raw api_url`) do set API_URL=%%i
if not defined API_URL (
    echo Could not read api_url.
    call :maybe_pause
    exit /b 1
)
echo API URL: %API_URL%
echo ========================================
call :maybe_pause
exit /b 0

:maybe_pause
if /I "%MODE%"=="package" exit /b 0
if /I "%MODE%"=="nopause" exit /b 0
pause
exit /b 0
