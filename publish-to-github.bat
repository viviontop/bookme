@echo off
echo ========================================
echo Publishing BookMe to GitHub
echo ========================================
echo.

REM Check if Git is installed
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Git is not installed!
    echo.
    echo Please install Git first:
    echo 1. Download from: https://git-scm.com/download/win
    echo 2. Install Git
    echo 3. Restart this script
    echo.
    pause
    exit /b 1
)

echo [1/6] Initializing Git repository...
git init
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to initialize Git
    pause
    exit /b 1
)

echo [2/6] Adding remote repository...
git remote remove origin 2>nul
git remote add origin https://github.com/viviontop/bookme.git
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to add remote
    pause
    exit /b 1
)

echo [3/6] Staging all files...
git add .
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to stage files
    pause
    exit /b 1
)

echo [4/6] Creating commit...
git commit -m "Initial commit: BookMe platform with messaging, admin dashboard, and map features"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to create commit
    pause
    exit /b 1
)

echo [5/6] Setting main branch...
git branch -M main
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to set branch
    pause
    exit /b 1
)

echo [6/6] Pushing to GitHub...
echo.
echo You will be prompted for your GitHub credentials.
echo If you use 2FA, you'll need a Personal Access Token instead of your password.
echo.
git push -u origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to push to GitHub
    echo.
    echo Common issues:
    echo - Authentication failed: Use a Personal Access Token
    echo   Get one at: https://github.com/settings/tokens
    echo - Repository not found: Make sure the repo exists at github.com/viviontop/bookme
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! Your code has been published to GitHub!
echo ========================================
echo.
echo Repository: https://github.com/viviontop/bookme
echo.
echo Next steps:
echo 1. Visit https://vercel.com to deploy your site for free
echo 2. Or visit https://netlify.com for alternative hosting
echo.
pause

