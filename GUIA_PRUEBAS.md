# 🧪 Guía de Pruebas - ZoneMarketplace

## 🚀 Iniciar Servidores

### Backend (Laravel)
```powershell
cd "C:\Users\Jere Guale\Desktop\ZoneMarketplace\ZoneMarketplaceBackend"
php artisan serve --host=192.168.0.7 --port=8000
```

### Frontend Web
```powershell
cd "C:\Users\Jere Guale\Desktop\ZoneMarketplace\MiApp"
npx expo start
# Presiona 'w' en la terminal
```

### Frontend Móvil
```powershell
cd "C:\Users\Jere Guale\Desktop\ZoneMarketplace\MiApp"
npx expo start
# Escanea el QR con Expo Go
```

---

## ✅ Pruebas de Sincronización

### 1. **Prueba de Avatares**
- [ ] Registrar usuario desde móvil
- [ ] Subir avatar desde ProfileScreen en móvil
- [ ] Abrir web, iniciar sesión con el mismo usuario
- [ ] **Verificar:** Avatar aparece en web inmediatamente

### 2. **Prueba de Mensajes (Móvil → Web)**
- [ ] Usuario A (móvil): Enviar mensaje a vendedor
- [ ] Usuario B (web): Abrir MessagesScreen
- [ ] **Verificar:** Conversación aparece en la lista
- [ ] Usuario B (web): Abrir conversación
- [ ] **Verificar:** Mensaje recibido visible
- [ ] **Verificar:** Badge de no leídos desaparece al abrir

### 3. **Prueba de Mensajes (Web → Móvil)**
- [ ] Usuario A (web): Enviar mensaje a vendedor
- [ ] Usuario B (móvil): Abrir MessagesScreen
- [ ] **Verificar:** Conversación aparece
- [ ] **Verificar:** Badge en HomeScreen incrementa

### 4. **Prueba de Notificaciones**
- [ ] Usuario A: Enviar mensaje a Usuario B
- [ ] Usuario B: Abrir NotificationsScreen
- [ ] **Verificar:** Notificación aparece
- [ ] **Verificar:** Estilo diferente para no leída (borde azul)
- [ ] Usuario B: Tocar notificación
- [ ] **Verificar:** Se marca como leída
- [ ] **Verificar:** Badge en HomeScreen decrementa

### 5. **Prueba de Eliminar Conversación**
- [ ] Usuario A: Abrir MessagesScreen
- [ ] Usuario A: Deslizar conversación y eliminar
- [ ] **Verificar:** Conversación desaparece
- [ ] Usuario B (en otra plataforma): Refrescar
- [ ] **Verificar:** Conversación también eliminada

### 6. **Prueba de Marcar Todas Como Leídas**
- [ ] Tener 3+ notificaciones no leídas
- [ ] Abrir NotificationsScreen
- [ ] **Verificar:** Botón "Marcar todas" visible
- [ ] Presionar "Marcar todas"
- [ ] **Verificar:** Todas cambian a leídas
- [ ] **Verificar:** Badge en HomeScreen = 0

---

## 🐛 Debugging

### Ver Logs del Backend
```powershell
# En ZoneMarketplaceBackend
Get-Content storage/logs/laravel.log -Tail 50 -Wait
```

### Ver Logs del Frontend
- **Web:** Abre DevTools del navegador (F12) → Console
- **Móvil:** Los logs aparecen en la terminal donde ejecutaste `expo start`

### Verificar Base de Datos (PostgreSQL)
```sql
-- Conectar a PostgreSQL y ejecutar:
\c zonemarketplace

-- Ver conversaciones
SELECT * FROM conversations;

-- Ver mensajes
SELECT * FROM messages ORDER BY created_at DESC LIMIT 10;

-- Ver notificaciones
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;

-- Ver usuarios con avatares
SELECT id, name, email, avatar FROM users;
```

### Endpoints de API para Probar Manualmente

#### Obtener Conversaciones
```bash
curl -H "Authorization: Bearer {tu_token}" http://192.168.0.7:8000/api/conversations
```

#### Enviar Mensaje
```bash
curl -X POST http://192.168.0.7:8000/api/messages \
  -H "Authorization: Bearer {tu_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hola, mensaje de prueba",
    "seller_id": 5,
    "product_id": 10
  }'
```

#### Obtener Notificaciones
```bash
curl -H "Authorization: Bearer {tu_token}" http://192.168.0.7:8000/api/notifications
```

---

## ⚠️ Problemas Comunes

### 1. **Avatar no se muestra**
- **Causa:** Storage link no creado
- **Solución:**
  ```powershell
  cd ZoneMarketplaceBackend
  php artisan storage:link
  ```

### 2. **CORS Error**
- **Causa:** Backend no está en 192.168.0.7:8000
- **Solución:** Verificar que el servidor esté corriendo con `--host=192.168.0.7`

### 3. **401 Unauthorized**
- **Causa:** Token expirado o inválido
- **Solución:** Cerrar sesión e iniciar sesión nuevamente

### 4. **No aparecen mensajes nuevos**
- **Causa:** Frontend no está refrescando
- **Solución:** Agregar `useEffect` o pull-to-refresh

### 5. **Base de datos vacía después de migrate**
- **Causa:** Usaste `migrate:fresh` (borra todo)
- **Solución:** Usa solo `migrate` para preservar datos

---

## 📊 Verificación de Integridad

### Checklist Backend
- [ ] `php artisan route:list` muestra todas las rutas API
- [ ] `php artisan migrate:status` muestra todas las migraciones ejecutadas
- [ ] Archivo `storage/app/public/avatars` existe
- [ ] Symlink `public/storage` apunta a `storage/app/public`

### Checklist Frontend
- [ ] No hay errores en consola al iniciar
- [ ] HomeScreen carga productos correctamente
- [ ] Badge de notificaciones se actualiza
- [ ] ProfileScreen permite subir avatar
- [ ] MessagesScreen lista conversaciones

---

## 🎯 Flujo Completo de Prueba

### Escenario: Comprador envía mensaje a vendedor

1. **Setup:**
   - Usuario A (Comprador) - Móvil
   - Usuario B (Vendedor) - Web
   - Producto publicado por Usuario B

2. **Flujo:**
   ```
   [Móvil - Usuario A]
   ├─ Abrir HomeScreen
   ├─ Buscar producto de Usuario B
   ├─ Tocar producto → ProductDetailScreen
   ├─ Tocar "Enviar Mensaje"
   └─ Escribir mensaje → Enviar
   
   [Web - Usuario B]
   ├─ Verificar badge en icono de mensajes (debe incrementar)
   ├─ Abrir MessagesScreen
   ├─ Verificar nueva conversación aparece
   ├─ Abrir conversación → ChatScreen
   ├─ Verificar mensaje recibido
   ├─ Responder mensaje
   └─ Cerrar chat
   
   [Móvil - Usuario A]
   ├─ Verificar badge en HomeScreen incrementa
   ├─ Abrir NotificationsScreen
   ├─ Verificar notificación de respuesta
   ├─ Tocar notificación → abre chat
   └─ Verificar respuesta visible
   ```

3. **Resultado Esperado:**
   - ✅ Mensaje enviado aparece en ambas plataformas
   - ✅ Notificación creada automáticamente
   - ✅ Badges actualizados en tiempo real
   - ✅ Mensajes marcados como leídos al abrir
   - ✅ Avatar del usuario visible en ambos lados

---

## 📈 Monitoreo en Tiempo Real

### Terminal 1: Backend Log
```powershell
cd ZoneMarketplaceBackend
Get-Content storage/logs/laravel.log -Tail 50 -Wait
```

### Terminal 2: Expo Log
```powershell
cd MiApp
npx expo start
```

### Terminal 3: PostgreSQL Monitor
```sql
-- Ejecutar cada 5 segundos
SELECT COUNT(*) as total_mensajes FROM messages;
SELECT COUNT(*) as total_notificaciones FROM notifications WHERE read = false;
```

---

¡Buena suerte con las pruebas! 🚀
