# CRM AI Assistant - Local AI Server

This directory contains the local runtime configuration for the CRM AI Assistant.

## Model

The expected model is:

`server/models/Qwen3-4B-Q4_K_M.gguf`

The `models` directory and all `.gguf` files must remain local and must not be committed to Git.

## Runtime

The server uses `llama.cpp` and expects the Windows binaries under:

`server/llama.cpp/`

The launcher expects:

`server/llama.cpp/llama-server.exe`

## Start

Run:

`server/start-server.bat`

The local API will listen on:

`http://127.0.0.1:8080`

## Architecture

Chrome Extension -> `ai/ai-service.js` -> Local HTTP API -> llama.cpp -> Qwen GGUF model

The Chrome extension is not connected to this API yet. The next integration step is to update the AI service after the local model server has been verified independently.
