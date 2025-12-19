@echo off
echo ========================================
echo   GymFlow - Quick Start Script
echo ========================================
echo.

echo Checking for .env.local file...
if not exist .env.local (
    echo Creating .env.local from template...
    copy .env.example .env.local
    echo.
    echo ⚠️  IMPORTANT: Please update .env.local with your Supabase credentials!
    echo.
    echo 1. Go to https://supabase.com
    echo 2. Create a new project
    echo 3. Copy your Project URL and Anon Key
    echo 4. Update .env.local file
    echo.
    pause
) else (
    echo ✓ .env.local file found
)

echo.
echo Starting development server...
echo.
pnpm dev
