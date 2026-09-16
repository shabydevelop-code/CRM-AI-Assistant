@echo off
setlocal

cd /d "%~dp0"

set "MODEL=%~dp0models\Qwen3-4B-Q4_K_M.gguf"
set "LLAMA_SERVER=%~dp0llama.cpp\llama-server.exe"

if not exist "%MODEL%" (
    echo [ERROR] Model not found:
    echo %MODEL%
    pause
    exit /b 1
)

if not exist "%LLAMA_SERVER%" (
    echo [ERROR] llama-server.exe not found:
    echo %LLAMA_SERVER%
    echo.
    echo Place llama.cpp Windows binaries inside server\llama.cpp\
    pause
    exit /b 1
)

echo Starting CRM AI local server...
echo Model: %MODEL%
echo URL: http://127.0.0.1:8080

"%LLAMA_SERVER%" -m "%MODEL%" --host 127.0.0.1 --port 8080 -c 4096

pause
