@echo off
setlocal
cd /d "%~dp0"

echo ================================
echo  Atlas Cloud - servidor local
echo ================================
echo Pasta do projeto: %cd%
echo.

where pnpm >nul 2>nul
if errorlevel 1 (
    echo ERRO: o comando "pnpm" nao foi encontrado neste computador.
    echo Instale o pnpm ^(ou rode "corepack enable" no terminal^) e tente de novo.
    echo.
    pause
    exit /b 1
)

echo Aplicando migracoes pendentes no banco local ^(se houver^)...
echo y| call pnpm run db:migrate:local
echo.

call pnpm run dev

echo.
echo Servidor encerrado.
pause
