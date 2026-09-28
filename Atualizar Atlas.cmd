@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

echo ================================
echo  Atlas Cloud - atualizar repositorio local
echo ================================
echo Pasta: %cd%
echo.

where git >nul 2>nul
if errorlevel 1 (
    echo ERRO: o comando "git" nao foi encontrado neste computador.
    echo Instale o Git para Windows ^(https://git-scm.com/download/win^) e tente de novo.
    echo.
    pause
    exit /b 1
)

if not exist ".git" (
    echo Esta pasta ainda nao e um repositorio git. Inicializando e conectando ao GitHub...
    git init -q
    git remote add origin https://github.com/abnerkallil/atlaspjt.git
    git symbolic-ref HEAD refs/heads/main
) else (
    git remote get-url origin >nul 2>nul
    if errorlevel 1 git remote add origin https://github.com/abnerkallil/atlaspjt.git
)

echo Baixando as atualizacoes do GitHub...
git fetch origin
if errorlevel 1 (
    echo.
    echo ERRO: nao foi possivel baixar do GitHub. Confira sua internet e tente de novo.
    echo.
    pause
    exit /b 1
)

echo Verificando se ha alteracoes locais ainda nao enviadas ao GitHub...
set HAS_CHANGES=
for /f "delims=" %%i in ('git status --porcelain 2^>nul') do set HAS_CHANGES=1

if defined HAS_CHANGES (
    echo.
    echo ATENCAO: existem alteracoes nesta pasta que ainda NAO foram commitadas/enviadas ao GitHub:
    echo.
    git status --short
    echo.
    echo Continuar vai APAGAR essas alteracoes para igualar a pasta ao GitHub ^(git reset --hard^).
    echo Se quiser manter essas alteracoes, feche esta janela agora, abra um terminal aqui e rode:
    echo   git add -A
    echo   git commit -m "sua mensagem"
    echo   git push
    echo e depois rode este atualizador de novo.
    echo.
    set /p CONFIRM="Digite APAGAR para descartar essas alteracoes e continuar mesmo assim: "
    if /I not "!CONFIRM!"=="APAGAR" (
        echo.
        echo Operacao cancelada. Nada foi alterado.
        pause
        exit /b 1
    )
)

echo Sincronizando a pasta com o "main" do GitHub ^(a versao local sera igualada a de la^)...
git reset --hard origin/main

where pnpm >nul 2>nul
if not errorlevel 1 (
    echo.
    echo Atualizando dependencias ^(pnpm install^)...
    call pnpm install

    echo.
    echo Aplicando migracoes pendentes no banco local ^(se houver^)...
    echo y| call pnpm run db:migrate:local
)

echo.
echo Pronto! Pasta local e banco local atualizados com a versao mais recente do main do GitHub.
pause
