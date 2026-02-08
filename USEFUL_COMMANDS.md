# 🛠️ COMANDOS Y SCRIPTS ÚTILES

## 📋 Backend - Comandos Laravel

### 1. Ejecutar todas las migraciones
```bash
cd ZoneMarketplaceBackend
php artisan migrate
```

### 2. Ejecutar solo migraciones nuevas
```bash
php artisan migrate --step
```

### 3. Revertir última migración
```bash
php artisan migrate:rollback --step=1
```

### 4. Revertir todas las migraciones
```bash
php artisan migrate:reset
```

### 5. Refrescar migraciones (reset + migrate)
```bash
php artisan migrate:refresh
```

### 6. Ver estado de migraciones
```bash
php artisan migrate:status
```

---

## 👤 Base de datos - Scripts SQL

### Crear usuario admin
```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@example.com';
```

### Ver todos los usuarios
```sql
SELECT id, name, email, role, account_status, created_at 
FROM users 
ORDER BY created_at DESC;
```

### Ver bans activos
```sql
SELECT id, name, email, account_status, ban_expires_at, ban_reason 
FROM users 
WHERE account_status IN ('banned_temp', 'banned_perm');
```

### Ver bans temporales expirados
```sql
SELECT id, name, email, ban_expires_at 
FROM users 
WHERE account_status = 'banned_temp' 
AND ban_expires_at <= NOW();
```

### Revertir ban
```sql
UPDATE users 
SET account_status = 'active', 
    ban_expires_at = NULL,
    ban_reason = NULL 
WHERE id = 123;
```

### Ver disputas abiertas
```sql
SELECT d.id, d.product_id, d.buyer_id, d.seller_id, d.amount, d.status 
FROM disputes d 
WHERE d.status = 'open' 
ORDER BY d.created_at DESC;
```

### Ver reseñas ocultas
```sql
SELECT r.id, r.rating, r.comment, r.is_hidden_by_admin, r.hidden_at, r.hide_reason 
FROM reviews r 
WHERE r.is_hidden_by_admin = 1;
```

### Ver logs de admin
```sql
SELECT a.id, u.name as admin, a.action, a.target_type, a.target_id, a.ip_address, a.created_at 
FROM admin_logs a 
JOIN users u ON a.admin_id = u.id 
ORDER BY a.created_at DESC 
LIMIT 50;
```

### Ver historial de acceso de usuario
```sql
SELECT user_id, ip_address, device_type, logged_in_at, logged_out_at 
FROM user_access_logs 
WHERE user_id = 123 
ORDER BY logged_in_at DESC 
LIMIT 20;
```

---

## 🔄 API - Ejemplos de requests

### Login como admin
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "login_type": "admin"
  }'
```

### Obtener dashboard
```bash
curl -X GET http://localhost:8000/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Banear usuario temporalmente
```bash
curl -X POST http://localhost:8000/api/admin/users/5/ban-temporary \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hours": 24,
    "reason": "Comportamiento inapropiado"
  }'
```

### Obtener lista de usuarios
```bash
curl -X GET "http://localhost:8000/api/admin/users?role=client&status=active" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Resolver disputa
```bash
curl -X POST http://localhost:8000/api/admin/disputes/3/resolve \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resolution": "favor_buyer",
    "decision": "El comprador tiene razón, el producto no llegó",
    "refund_percentage": 100
  }'
```

### Ocultar reseña
```bash
curl -X POST http://localhost:8000/api/admin/reviews/7/hide \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Lenguaje ofensivo"
  }'
```

---

## 🧪 Testing

### 1. Verificar migraciones completadas
```bash
php artisan migrate:status
# Deberías ver todas las migraciones como "Ran"
```

### 2. Verificar modelos
```bash
# En tinker
php artisan tinker

> App\Models\User::find(1)->toArray()
> App\Models\Review::all()
> App\Models\Dispute::all()
> App\Models\AdminLog::all()
```

### 3. Testear endpoint de admin
```bash
# Obtener token primero
TOKEN=$(curl -s -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' | jq -r '.token')

# Usar token
curl -X GET http://localhost:8000/api/admin/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📱 Frontend - Debugging

### Ver datos en consola (React Native)
```javascript
console.log('User:', userData);
console.log('Is Admin:', userData?.isAdmin);
console.log('Token:', userToken);
```

### Usar React Native Debugger
```bash
# Instalar si no tienes
npm install --global react-native-debugger

# Ejecutar
react-native-debugger

# En tu app
Shake phone → Debug → Debug with Chrome
```

---

## 🔧 Troubleshooting

### Error: "No autorizado como admin"
**Solución:** Verifica que el usuario tenga `role = 'admin'` en la BD

### Error: "CORS bloqueado"
**Solución:** Verifica `config/cors.php` en Laravel

### Error: "Migración ya existe"
**Solución:** No ejecutes migraciones dos veces. Si necesitas reset:
```bash
php artisan migrate:reset && php artisan migrate
```

### Frontend no conecta al backend
**Solución:** Verifica `resolveApiBase()` en `api.js`
```javascript
// Debug
console.log('API Base:', resolveApiBase());
```

### Token inválido
**Solución:** 
- Verifica que estés pasando el token en headers
- Token debe estar en `AsyncStorage`
- Revisa que no haya expirado

---

## 📊 Monitoreo

### Ver última actividad de usuarios
```sql
SELECT u.id, u.name, u.last_activity_at, COUNT(ual.id) as total_logins
FROM users u
LEFT JOIN user_access_logs ual ON u.id = ual.user_id
WHERE u.role != 'admin'
GROUP BY u.id
ORDER BY u.last_activity_at DESC
LIMIT 20;
```

### Ver usuarios más activos
```sql
SELECT u.id, u.name, COUNT(ual.id) as login_count, MAX(ual.logged_in_at) as last_login
FROM users u
LEFT JOIN user_access_logs ual ON u.id = ual.user_id
GROUP BY u.id
ORDER BY login_count DESC
LIMIT 10;
```

### Ver acciones más comunes de admin
```sql
SELECT action, COUNT(*) as total
FROM admin_logs
GROUP BY action
ORDER BY total DESC;
```

---

## 🎯 Próximas tareas opcionales

- [ ] Configurar autenticación de dos factores para admin
- [ ] Crear sistema de notificaciones en tiempo real
- [ ] Implementar estadísticas avanzadas (gráficos)
- [ ] Crear exportación de datos (CSV, PDF)
- [ ] Añadir sistema de permisos granulares
- [ ] Implementar rate limiting para API

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs de Laravel: `storage/logs/`
2. Abre la consola de desarrollador del navegador/app
3. Verifica las migraciones: `php artisan migrate:status`
4. Checkea los permisos de carpetas

---

**¡Listo para producción!** 🚀
