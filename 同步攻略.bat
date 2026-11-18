@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js was not found. Please install Node.js and try again.
  pause
  exit /b 1
)
node "sync-guides.js"
set "sync_result=%errorlevel%"
pause
exit /b %sync_result%
