@echo off
rem Dublu clic: porneste Cadranul SI preluarea automata a datelor (ANM, OPCOM, drumuri, carburanti, avarii).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0porneste-windows.ps1" -CuSurse
pause
