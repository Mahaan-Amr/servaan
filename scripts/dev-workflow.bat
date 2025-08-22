@echo off
chcp 65001 >nul
echo 🚀 Servaan Development Workflow
echo ================================

REM Check current branch
for /f "tokens=2" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo 📍 Current branch: %CURRENT_BRANCH%

if not "%CURRENT_BRANCH%"=="dev" (
    echo ⚠️  You should be on 'dev' branch for development
    echo 🔄 Switching to dev branch...
    git checkout dev
    git pull origin dev
)

echo.
echo 📋 Development Workflow Options:
echo 1. 🆕 Start new feature (create feature branch)
echo 2. 🔄 Update dev branch from master
echo 3. 🧪 Run tests locally
echo 4. 📤 Push changes to dev
echo 5. 🔀 Prepare merge to master
echo 6. 🚀 Deploy to production (from master)

set /p choice="Choose an option (1-6): "

if "%choice%"=="1" (
    set /p feature_name="Enter feature name: "
    set feature_branch=feature/%feature_name%
    echo 🆕 Creating feature branch: %feature_branch%
    git checkout -b "%feature_branch%"
    echo ✅ Feature branch created! Work on your changes...
) else if "%choice%"=="2" (
    echo 🔄 Updating dev branch from master...
    git checkout master
    git pull origin master
    git checkout dev
    git merge master
    echo ✅ Dev branch updated from master!
) else if "%choice%"=="3" (
    echo 🧪 Running tests locally...
    npm test
) else if "%choice%"=="4" (
    echo 📤 Pushing changes to dev...
    git add .
    set /p commit_msg="Enter commit message: "
    git commit -m "%commit_msg%"
    git push origin dev
    echo ✅ Changes pushed to dev!
) else if "%choice%"=="5" (
    echo 🔀 Preparing merge to master...
    echo ⚠️  This will create a pull request from dev to master
    echo 🌐 Go to: https://github.com/Mahaan-Amr/servaan/compare/master...dev
    echo 📝 Create pull request with description of changes
) else if "%choice%"=="6" (
    echo 🚀 Deploying to production...
    echo ⚠️  This should only be done after merging dev to master
    echo 🔄 The CI/CD pipeline will automatically deploy when merged to master
) else (
    echo ❌ Invalid option selected
)

echo.
echo 🎯 Remember: Always work on dev branch, merge to master for deployment!
pause
