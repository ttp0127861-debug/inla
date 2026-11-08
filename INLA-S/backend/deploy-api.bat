@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ========================================
echo Packaging backend API modules
echo ========================================

call "%~dp0customer\deploy-customer-api.bat" package
if errorlevel 1 (
    echo customer package failed.
    pause
    exit /b 1
)

call "%~dp0quotation\deploy-quotation-api.bat" package
if errorlevel 1 (
    echo quotation package failed.
    pause
    exit /b 1
)

call "%~dp0users\deploy-user-api.bat" package
if errorlevel 1 (
    echo users package failed.
    pause
    exit /b 1
)

if not defined DATABASE_URL (
    echo DATABASE_URL is not set. Set Neon connection string before deploy, e.g.:
    echo   set DATABASE_URL=postgresql://...
    pause
    exit /b 1
)

set AWS_PROFILE=inla-admin
set TF_DIR=%~dp0..\terraform\api

echo.
echo ========================================
echo Terraform init + apply (all API Lambdas)
echo ========================================
cd /d "%TF_DIR%"
call terraform init
if errorlevel 1 (
    echo terraform init failed.
    pause
    exit /b 1
)
call terraform apply -auto-approve
if errorlevel 1 (
    echo terraform apply failed.
    pause
    exit /b 1
)

echo.
echo ========================================
echo All API modules deployed.
echo ========================================
pause
exit /b 0
