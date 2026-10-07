@echo off
setlocal
cd /d "%~dp0"

echo ================================
echo  Atlas Cloud - restauracao de teste do backup
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
set /p TARGET="Ambiente de destino (digite local): "

call pnpm run backup:restore-local -- --target "%TARGET%"

echo.
pause
