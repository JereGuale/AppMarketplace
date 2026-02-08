@echo off
echo.
echo ========================================
echo   INICIANDO SERVIDOR LARAVEL
echo ========================================
echo.

cd /d "%~dp0"

REM Detectar IP local automáticamente
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP: =%

echo Tu IP local es: %IP%
echo.
echo El servidor estará disponible en:
echo   - http://localhost:8000 (en esta PC)
echo   - http://%IP%:8000 (desde móvil/otros dispositivos)
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

REM Inicia el servidor en todas las interfaces (0.0.0.0)
php artisan serve --host=0.0.0.0 --port=8000
