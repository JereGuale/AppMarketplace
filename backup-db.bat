@echo off
echo ============================================
echo   BACKUP DE BASE DE DATOS
echo ============================================
echo.

cd ZoneMarketplaceBackend

echo Creando backup...
php artisan db:backup

echo.
echo ============================================
echo   Para ver todos los backups:
echo   php artisan db:backups
echo.
echo   Para restaurar un backup:
echo   php artisan db:restore nombre-archivo.sql
echo ============================================

pause
