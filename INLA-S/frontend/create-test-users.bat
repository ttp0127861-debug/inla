@echo off
setlocal

set AWS_PROFILE=general-admin
set USER_POOL_ID=ap-southeast-1_2d8iwcBko
set TEMP_PASSWORD=InlaTest@2026!

echo Creating test users...

REM ADMIN + EXECUTOR
aws cognito-idp admin-create-user --user-pool-id %USER_POOL_ID% --username test.admin@inla.vn --user-attributes Name=email,Value=test.admin@inla.vn Name=email_verified,Value=true Name=name,Value="Test Admin" Name=custom:level,Value=manager --temporary-password %TEMP_PASSWORD% --message-action SUPPRESS --profile %AWS_PROFILE%
aws cognito-idp admin-set-user-password --user-pool-id %USER_POOL_ID% --username test.admin@inla.vn --password %TEMP_PASSWORD% --permanent --profile %AWS_PROFILE%
aws cognito-idp admin-add-user-to-group --user-pool-id %USER_POOL_ID% --username test.admin@inla.vn --group-name ADMIN --profile %AWS_PROFILE%
aws cognito-idp admin-add-user-to-group --user-pool-id %USER_POOL_ID% --username test.admin@inla.vn --group-name EXECUTOR --profile %AWS_PROFILE%

REM DIRECTOR
aws cognito-idp admin-create-user --user-pool-id %USER_POOL_ID% --username test.director@inla.vn --user-attributes Name=email,Value=test.director@inla.vn Name=email_verified,Value=true Name=name,Value="Test Director" Name=custom:level,Value=manager --temporary-password %TEMP_PASSWORD% --message-action SUPPRESS --profile %AWS_PROFILE%
aws cognito-idp admin-set-user-password --user-pool-id %USER_POOL_ID% --username test.director@inla.vn --password %TEMP_PASSWORD% --permanent --profile %AWS_PROFILE%
aws cognito-idp admin-add-user-to-group --user-pool-id %USER_POOL_ID% --username test.director@inla.vn --group-name DIRECTOR --profile %AWS_PROFILE%

REM SALES
aws cognito-idp admin-create-user --user-pool-id %USER_POOL_ID% --username test.sales@inla.vn --user-attributes Name=email,Value=test.sales@inla.vn Name=email_verified,Value=true Name=name,Value="Test Sales" Name=custom:level,Value=staff --temporary-password %TEMP_PASSWORD% --message-action SUPPRESS --profile %AWS_PROFILE%
aws cognito-idp admin-set-user-password --user-pool-id %USER_POOL_ID% --username test.sales@inla.vn --password %TEMP_PASSWORD% --permanent --profile %AWS_PROFILE%
aws cognito-idp admin-add-user-to-group --user-pool-id %USER_POOL_ID% --username test.sales@inla.vn --group-name SALES --profile %AWS_PROFILE%

REM QA
aws cognito-idp admin-create-user --user-pool-id %USER_POOL_ID% --username test.qa@inla.vn --user-attributes Name=email,Value=test.qa@inla.vn Name=email_verified,Value=true Name=name,Value="Test QA" Name=custom:level,Value=manager --temporary-password %TEMP_PASSWORD% --message-action SUPPRESS --profile %AWS_PROFILE%
aws cognito-idp admin-set-user-password --user-pool-id %USER_POOL_ID% --username test.qa@inla.vn --password %TEMP_PASSWORD% --permanent --profile %AWS_PROFILE%
aws cognito-idp admin-add-user-to-group --user-pool-id %USER_POOL_ID% --username test.qa@inla.vn --group-name QA --profile %AWS_PROFILE%

REM R&D
aws cognito-idp admin-create-user --user-pool-id %USER_POOL_ID% --username test.rnd@inla.vn --user-attributes Name=email,Value=test.rnd@inla.vn Name=email_verified,Value=true Name=name,Value="Test R&D" Name=custom:level,Value=manager --temporary-password %TEMP_PASSWORD% --message-action SUPPRESS --profile %AWS_PROFILE%
aws cognito-idp admin-set-user-password --user-pool-id %USER_POOL_ID% --username test.rnd@inla.vn --password %TEMP_PASSWORD% --permanent --profile %AWS_PROFILE%
aws cognito-idp admin-add-user-to-group --user-pool-id %USER_POOL_ID% --username test.rnd@inla.vn --group-name R&D --profile %AWS_PROFILE%

REM ACCOUNTING
aws cognito-idp admin-create-user --user-pool-id %USER_POOL_ID% --username test.accounting@inla.vn --user-attributes Name=email,Value=test.accounting@inla.vn Name=email_verified,Value=true Name=name,Value="Test Accounting" Name=custom:level,Value=manager --temporary-password %TEMP_PASSWORD% --message-action SUPPRESS --profile %AWS_PROFILE%
aws cognito-idp admin-set-user-password --user-pool-id %USER_POOL_ID% --username test.accounting@inla.vn --password %TEMP_PASSWORD% --permanent --profile %AWS_PROFILE%
aws cognito-idp admin-add-user-to-group --user-pool-id %USER_POOL_ID% --username test.accounting@inla.vn --group-name ACCOUNTING --profile %AWS_PROFILE%

echo.
echo Done. Test users created with password: %TEMP_PASSWORD%
echo.
echo Accounts:
echo   test.admin@inla.vn       (ADMIN + EXECUTOR)
echo   test.director@inla.vn    (DIRECTOR)
echo   test.sales@inla.vn       (SALES)
echo   test.qa@inla.vn          (QA)
echo   test.rnd@inla.vn         (R&D)
echo   test.accounting@inla.vn  (ACCOUNTING)
pause
