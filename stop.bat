@echo off
echo Stopping process on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
  echo Killing PID %%a
  taskkill /F /PID %%a 2>nul
)
echo Done. Now run start.bat
pause
