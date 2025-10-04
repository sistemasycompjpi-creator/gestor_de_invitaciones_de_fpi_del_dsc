@echo off
cd /d "%~dp0"
echo Iniciando servidor Flask...
venv\Scripts\python.exe main.py
pause
