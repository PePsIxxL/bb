@echo off
cd /d "%~dp0"
if not exist "node_modules\" (
  echo Installing dependencies...
  call "%ProgramFiles%\nodejs\npm.cmd" install
)
echo Starting site at http://localhost:3000
echo Admin panel: http://localhost:3000/admin
call "%ProgramFiles%\nodejs\npm.cmd" start
pause
