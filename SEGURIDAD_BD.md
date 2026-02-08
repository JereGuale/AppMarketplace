# 🔒 Guía de Seguridad de Base de Datos

## ⚠️ COMANDOS PELIGROSOS (BORRAN DATOS)

Estos comandos **ELIMINAN TODOS LOS DATOS** de la base de datos. **NUNCA** los ejecutes sin hacer backup primero:

```bash
# ❌ PELIGROSO - Borra todas las tablas y datos
php artisan migrate:fresh

# ❌ PELIGROSO - Revierte y re-ejecuta migraciones (borra datos)
php artisan migrate:refresh

# ❌ PELIGROSO - Resetea la base de datos
php artisan migrate:reset

# ❌ PELIGROSO - Ejecuta seeders (puede borrar datos según configuración)
php artisan db:seed
```

## ✅ COMANDOS SEGUROS

Estos comandos **NO BORRAN DATOS** existentes:

```bash
# ✅ SEGURO - Solo ejecuta migraciones nuevas
php artisan migrate

# ✅ SEGURO - Revierte la última migración
php artisan migrate:rollback

# ✅ SEGURO - Revierte las últimas N migraciones
php artisan migrate:rollback --step=N
```

## 🛡️ SISTEMA DE BACKUP

### Crear un backup manual

```bash
# Backup con nombre automático (fecha y hora)
php artisan db:backup

# Backup con nombre personalizado
php artisan db:backup --name=antes-de-migracion

# O usar el script .bat
backup-db.bat
```

### Ver backups disponibles

```bash
php artisan db:backups
```

### Restaurar un backup

```bash
php artisan db:restore nombre-archivo.sql
```

## 📋 PROTOCOLO ANTES DE CAMBIOS

**SIEMPRE** sigue estos pasos antes de hacer cambios en la BD:

1. **Crear backup:**
   ```bash
   php artisan db:backup --name=antes-cambio
   ```

2. **Verificar que el backup existe:**
   ```bash
   php artisan db:backups
   ```

3. **Ahora sí, hacer los cambios**

4. **Si algo sale mal, restaurar:**
   ```bash
   php artisan db:restore backup_antes-cambio_YYYY-MM-DD_HHMMSS.sql
   ```

## 🔄 BACKUPS AUTOMÁTICOS

Los backups se guardan en: `ZoneMarketplaceBackend/storage/app/backups/`

El sistema automáticamente:
- ✅ Mantiene los últimos 10 backups
- ✅ Elimina backups antiguos para ahorrar espacio
- ✅ Nombra los archivos con fecha y hora

## 💾 UBICACIÓN DE LOS BACKUPS

```
ZoneMarketplace/
└── ZoneMarketplaceBackend/
    └── storage/
        └── app/
            └── backups/
                ├── backup_2026-01-19_143052.sql
                ├── backup_2026-01-19_150320.sql
                └── backup_antes-migracion_2026-01-19_160145.sql
```

## 🚨 EN CASO DE PÉRDIDA DE DATOS

Si perdiste datos y tienes un backup:

1. **Listar backups disponibles:**
   ```bash
   php artisan db:backups
   ```

2. **Restaurar el backup más reciente:**
   ```bash
   php artisan db:restore backup_YYYY-MM-DD_HHMMSS.sql
   ```

3. **Verificar que los datos se restauraron:**
   ```bash
   php artisan db:show
   ```

## 📌 RECORDATORIO

**REGLA DE ORO:** 
> Siempre haz backup ANTES de ejecutar comandos de migración, seeders, o cualquier cambio en la estructura de la BD.

**¿No estás seguro si un comando es seguro?**
> Si dudas, haz un backup primero. Los backups son rápidos y te pueden salvar de perder días de trabajo.
