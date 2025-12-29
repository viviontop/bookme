@echo off
echo ========================================
echo Updating GitHub Repository
echo ========================================
echo.

REM Check if Git is installed
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Using Git from Program Files...
    set GIT_CMD="C:\Program Files\Git\bin\git.exe"
) else (
    set GIT_CMD=git
)

echo [1/3] Staging all changes...
%GIT_CMD% add .
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to stage files
    pause
    exit /b 1
)

echo [2/3] Creating commit...
echo Enter commit message (or press Enter for default):
set /p COMMIT_MSG=
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Update: Latest changes

%GIT_CMD% commit -m "%COMMIT_MSG%"
if %ERRORLEVEL% NEQ 0 (
    echo No changes to commit, or commit failed
    pause
    exit /b 1
)

echo [3/3] Pushing to GitHub...
%GIT_CMD% push
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to push to GitHub
    echo Make sure you're authenticated with GitHub
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! Changes pushed to GitHub!
echo ========================================
echo.
echo Repository: https://github.com/viviontop/bookme
echo.
pause

