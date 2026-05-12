@echo off
setlocal
cd /d "%~dp0"

where pnpm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] pnpm was not found in PATH.
  echo Install pnpm first: https://pnpm.io/installation
  pause
  exit /b 1
)

echo Starting R2 Explorer...
call pnpm tauri:dev

endlocal
