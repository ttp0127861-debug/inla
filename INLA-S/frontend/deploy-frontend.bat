@echo off
setlocal
cd /d "%~dp0"

set AWS_PROFILE=inla-admin
set S3_BUCKET=inla-s-dev-frontend
set CLOUDFRONT_ID=EZ3KMU6XEM85V

echo ========================================
echo Building frontend...
echo ========================================
call npm run build
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Syncing to S3...
echo ========================================
aws s3 sync dist/ s3://%S3_BUCKET%/ --delete --profile %AWS_PROFILE%
if errorlevel 1 (
    echo S3 sync failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Invalidating CloudFront cache...
echo ========================================
aws cloudfront create-invalidation --distribution-id %CLOUDFRONT_ID% --paths "/*" --profile %AWS_PROFILE%
if errorlevel 1 (
    echo CloudFront invalidation failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Deploy completed!
echo URL: https://d2i3ye055vm13o.cloudfront.net
echo ========================================
pause
