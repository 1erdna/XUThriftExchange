@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  start "" http://localhost:8080
  py -m http.server 8080 -d www
) else (
  start "" http://localhost:8080
  python -m http.server 8080 -d www
)
