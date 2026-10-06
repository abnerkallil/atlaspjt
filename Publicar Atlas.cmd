@echo off
setlocal
cd /d "%~dp0"

echo ================================
echo  Atlas Cloud - publicar em producao
echo ================================
echo Pasta: %cd%
echo.

where pnpm >nul 2>nul
if errorlevel 1 (
    echo ERRO: o comando "pnpm" nao foi encontrado neste computador.
    echo Instale o pnpm ^(ou rode "corepack enable" no terminal^) e tente de novo.
    echo.
    pause
    exit /b 1
)

rem DEC-009: o ambiente e digitado a cada execucao, sem valor padrao.
set TARGET=
set /p TARGET="Ambiente de destino (digite production): "

call pnpm run deploy:atlas -- --target "%TARGET%"

echo.
pause
