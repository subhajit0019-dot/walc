@echo off
setlocal enabledelayedexpansion

echo =====================================================================
echo           CURSED ENGINE - PUSH CLIENT PANEL TO VERCEL GITHUB         
echo =====================================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Git Status...
git status >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Initializing Git...
    git init
    git checkout -b main
)

git add .
git commit -m "deploy: update panel source" >nul 2>&1

echo.
echo [2/3] Repository Setup:
set /p REPO_URL="Enter your GitHub repository URL (paste it here and press Enter): "

if "%REPO_URL%"=="" (
    echo Error: No URL provided.
    pause
    exit /b 1
)

git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%
git branch -M main

echo.
echo [3/3] Pushing to GitHub main branch...
git push -u origin main --force

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =====================================================================
    echo [SUCCESS] Code pushed successfully!
    echo Vercel will now automatically detect the push and build your panel!
    echo =====================================================================
) else (
    echo.
    echo [FAILED] Push failed. Make sure you have created the repository on GitHub
    echo and have permissions to push to it.
)

echo.
pause
