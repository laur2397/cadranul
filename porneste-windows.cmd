@echo off
rem Dublu clic pe acest fisier ca sa pornesti Cadranul pe Windows.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0porneste-windows.ps1" %*
pause
