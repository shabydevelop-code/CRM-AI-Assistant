@echo off
setlocal EnableExtensions EnableDelayedExpansion

cd /d "%~dp0"

set "CONFIG=%~dp0config\model-config.json"
set "LLAMA_SERVER=%~dp0llama.cpp\llama-server.exe"
set "EXTENSION_ORIGIN=chrome-extension://ompijoldpdnnfbefaaogdagafeeapfjb"

if not exist "%CONFIG%" (
    echo [ERROR] Configuration file not found:
    echo %CONFIG%
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

for /f "usebackq tokens=*" %%A in (`powershell -NoProfile -Command "$ErrorActionPreference='Stop'; $c = Get-Content -Raw '%CONFIG%' | ConvertFrom-Json; [Console]::WriteLine($c.model); [Console]::WriteLine($c.host); [Console]::WriteLine($c.port); [Console]::WriteLine($c.contextSize); [Console]::WriteLine($c.threads)"`) do (
    if not defined MODEL_REL (
        set "MODEL_REL=%%A"
    ) else if not defined HOST (
        set "HOST=%%A"
    ) else if not defined PORT (
        set "PORT=%%A"
    ) else if not defined CONTEXT_SIZE (
        set "CONTEXT_SIZE=%%A"
    ) else if not defined THREADS (
        set "THREADS=%%A"
    )
)

if not defined MODEL_REL goto :config_error
if not defined HOST goto :config_error
if not defined PORT goto :config_error
if not defined CONTEXT_SIZE goto :config_error
if not defined THREADS goto :config_error

set "MODEL_REL=%MODEL_REL:/=\%"
set "MODEL=%~dp0%MODEL_REL%"

if not exist "%MODEL%" (
    echo [ERROR] Model not found:
    echo %MODEL%
    echo.
    echo Check the "model" value in:
    echo %CONFIG%
    pause
    exit /b 1
)

echo Starting CRM AI local server...
echo Model: %MODEL%
echo URL: http://%HOST%:%PORT%
echo Context size: %CONTEXT_SIZE%
echo Threads: %THREADS%
echo Allowed origin: %EXTENSION_ORIGIN%
echo.

"%LLAMA_SERVER%" -m "%MODEL%" --host "%HOST%" --port "%PORT%" -c "%CONTEXT_SIZE%" --threads "%THREADS%" --cors-origins "%EXTENSION_ORIGIN%"

if errorlevel 1 (
    echo.
    echo [ERROR] llama-server exited with an error.
)

pause
exit /b %errorlevel%

:config_error
echo [ERROR] Invalid configuration in:
echo %CONFIG%
echo.
echo Required properties: model, host, port, contextSize, threads
pause
exit /b 1
