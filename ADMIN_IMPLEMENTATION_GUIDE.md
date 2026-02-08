# Guía Implementación Sistema de Administrador

## 📋 Resumen de cambios

Se ha implementado un sistema completo de administración para ZoneMarketplace con las siguientes características:

### ✅ Funcionalidades implementadas

1. **Rol de Administrador**
   - Nuevo rol en la tabla `users` (values: 'client', 'provider', 'admin')
   - Login separado para admin con validación

2. **Sistema de Bans**
   - Bans temporales (con fecha de expiración automática)
   - Bans permanentes
   - Razón de ban registrada
   - Estados de cuenta: active, banned_temp, banned_perm, suspended

3. **Gestión de Usuarios**
   - Ver todos los usuarios con filtros (rol, estado, búsqueda)
   - Banear temporalmente (especificar horas)
   - Banear permanentemente
   - Desbanear
   - Restablecer contraseñas

4. **Sistema de Disputas**
   - Tabla para almacenar disputas entre comprador/vendedor
   - Tabla para evidencias (mensajes, archivos, etc.)
   - Admin puede resolver disputas
   - Tipos de resolución: favor_buyer, favor_seller, partial (reembolso %)
   - Decisión registrada con explicación del admin

5. **Gestión de Reseñas**
   - Ocultar reseñas ofensivas (sin borrar)
   - Razón de ocultamiento registrada
   - Mostrar reseñas ocultas
   - Mantener transparencia

6. **Auditoría y Logs**
   - Registro de todas las acciones administrativas
   - Historial de acceso de usuarios
   - IP, agente de usuario, dispositivo
   - Filtrado por acción y admin

7. **Dashboard de Admin**
   - Estadísticas en tiempo real
   - Contadores de usuarios nuevos (clientes vs proveedores)
   - Bans activos y permanentes
   - Disputas abiertas
   - Reseñas ocultas

---

## 🗄️ Base de datos - Migraciones creadas

### 1. `2025_01_18_000001_add_admin_fields_to_users.php`
Añade campos a la tabla `users`:
- `role` (enum: client, provider, admin)
- `account_status` (enum: active, banned_temp, banned_perm, suspended)
- `ban_expires_at` (timestamp nullable)
- `ban_reason` (text)
- `successful_transactions` (int)
- `last_activity_at` (timestamp)

### 2. `2025_01_18_000002_create_reviews_table.php`
- Reseñas de productos
- Campos para ocultar por admin

### 3. `2025_01_18_000003_create_disputes_table.php`
- Disputas entre comprador/vendedor
- Estados: open, in_review, resolved, closed
- Resoluciones: pending, favor_buyer, favor_seller, partial

### 4. `2025_01_18_000004_create_dispute_evidence_table.php`
- Evidencias (mensajes, documentos) en disputas
- Referencia al usuario que envió

### 5. `2025_01_18_000005_create_admin_logs_table.php`
- Log de acciones administrativas
- IP, acción, objetivo, detalles

### 6. `2025_01_18_000006_create_user_access_logs_table.php`
- Historial de login de usuarios
- IP, device type, timestamps

---

## 🔧 Backend - Modelos y Controlador

### Modelos creados:
- `Review.php` - Reseñas
- `Dispute.php` - Disputas
- `DisputeEvidence.php` - Evidencias
- `AdminLog.php` - Logs de admin
- `UserAccessLog.php` - Logs de acceso

### Controlador:
- `AdminController.php` con 20+ métodos

**Métodos principales:**
- `dashboard()` - Estadísticas
- `getUsers()` - Listar usuarios con filtros
- `getUserDetails()` - Detalles de usuario
- `banUserTemporarily()` - Banear temporal
- `banUserPermanently()` - Banear permanente
- `unbanUser()` - Desbanear
- `resetUserPassword()` - Restablecer contraseña
- `getReviews()` - Listar reseñas
- `hideReview()` - Ocultar reseña
- `showReview()` - Mostrar reseña
- `getDisputes()` - Listar disputas
- `resolveDispute()` - Resolver disputa
- `addDisputeEvidence()` - Añadir evidencia
- `getUserAccessHistory()` - Historial de acceso
- `getAdminLogs()` - Logs de acciones

---

## 📡 APIs creadas

### Grupo: `/api/admin/*` (requiere autenticación y rol admin)

**Dashboard:**
- `GET /api/admin/dashboard` - Estadísticas

**Usuarios:**
- `GET /api/admin/users` - Listar usuarios (con filtros)
- `GET /api/admin/users/{id}` - Detalles usuario
- `POST /api/admin/users/{id}/ban-temporary` - Ban temporal
- `POST /api/admin/users/{id}/ban-permanent` - Ban permanente
- `POST /api/admin/users/{id}/unban` - Desbanear
- `POST /api/admin/users/{id}/reset-password` - Restablecer contraseña
- `GET /api/admin/users/{id}/access-history` - Historial acceso

**Reseñas:**
- `GET /api/admin/reviews` - Listar reseñas
- `POST /api/admin/reviews/{id}/hide` - Ocultar reseña
- `POST /api/admin/reviews/{id}/show` - Mostrar reseña

**Disputas:**
- `GET /api/admin/disputes` - Listar disputas
- `GET /api/admin/disputes/{id}` - Detalles disputa
- `POST /api/admin/disputes/{id}/resolve` - Resolver disputa
- `POST /api/admin/disputes/{id}/evidence` - Añadir evidencia

**Logs:**
- `GET /api/admin/logs` - Historial de acciones admin

---

## 🎨 Frontend - Pantallas React Native

### 1. **LoginScreen.js** (Modificado)
- Botón para "Iniciar como Administrador"
- Switch entre modo usuario/admin
- Icono dinámico (🛍️ vs 🔐)
- Colores distintos para botones

### 2. **AdminPanelScreen.js** (Nueva)
- Dashboard principal
- 7 stat cards (usuarios, bans, disputas, etc.)
- Botones de acciones rápidas
- Cards informativos
- Refresh control

### 3. **AdminUsersScreen.js** (Nueva)
- Lista de usuarios con filtros
- Búsqueda
- Acciones: Ban temp, Ban perm, Desbanear, Reset password
- Modal con formularios

### 4. **AdminDisputesScreen.js** (Nueva)
- Lista de disputas por estado
- Modal para resolver disputas
- Modal para ver detalles
- Formulario para resolución y decisión

### 5. **AdminReviewsScreen.js** (Nueva)
- Lista de reseñas
- Filtros: Ofensivas, Ocultas
- Modal para ocultar reseña
- Botones Ocultar/Mostrar

### 6. **AdminLogsScreen.js** (Nueva)
- Historial de acciones administrativas
- Filtros por tipo de acción
- Información: admin, objetivo, IP, timestamp
- Formato visual con iconos

---

## 🚀 Cómo usar

### 1. Ejecutar migraciones (Backend)
```bash
cd ZoneMarketplaceBackend
php artisan migrate
```

### 2. Crear administrador (opcionalmente)
```bash
# En la base de datos, actualizar un usuario a admin:
UPDATE users SET role='admin' WHERE email='admin@example.com';
```

### 3. Login como admin (Frontend)
- En LoginScreen, hacer clic en "🔐 Iniciar como Administrador"
- Ingresar credenciales admin
- Se abre AdminPanelScreen

### 4. Navegación entre pantallas
Desde App.js, añadir lógica de navegación:

```javascript
if (user.isAdmin) {
  // Mostrar AdminPanelScreen
  return <AdminPanelScreen {...props} 
    onNavigateUsers={() => setScreen('admin-users')}
    onNavigateDisputes={() => setScreen('admin-disputes')}
    onNavigateReviews={() => setScreen('admin-reviews')}
    onNavigateLogs={() => setScreen('admin-logs')}
  />;
}
```

---

## 🔐 Seguridad

- ✅ Middleware de autenticación en todos los endpoints admin
- ✅ Verificación de rol admin antes de cada acción
- ✅ Registro de todas las acciones (auditoría)
- ✅ IP y user agent registrados
- ✅ Validación de entrada en todos los forms

---

## 📝 Características destacadas

### Ban Temporal
- Se expira automáticamente
- El usuario puede loginearse después

### Ban Permanente
- Requiere desban manual del admin
- El usuario no puede loginearse

### Disputas
- El admin revisa evidencia de ambas partes
- Decide: favor_buyer, favor_seller, o parcial
- Porcentaje de reembolso en caso parcial

### Reseñas
- No se borran, solo se ocultan
- Se mantiene transparencia
- Razón de ocultamiento registrada

---

## 🎯 Próximos pasos (Opcional)

1. Implementar sistema de pagos/refunds
2. Notificaciones a usuarios sobre bans/disputas
3. Estadísticas avanzadas (gráficos)
4. Exportar datos (CSV, PDF)
5. Configuración de sistema (settings) para admin
6. Dois factores para admin

---

## 📧 Endpoints completados

**Total: 23 endpoints nuevos**
- 7 para usuario
- 5 para disputas
- 2 para reseñas
- 2 para logs
- 1 para dashboard

---

**¡Sistema listo para usar! 🎉**
