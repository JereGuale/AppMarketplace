# 🔐 Guía del Panel de Administración - Zone Marketplace

## ✅ Estado: COMPLETAMENTE FUNCIONAL

Todo el panel de administración está implementado y funcionando correctamente.

---

## 📋 Inicio de Sesión Admin

### Credenciales de Prueba
```
Email: admin@gmail.com
Contraseña: Admin123456
```

### Pasos para Ingresar:
1. **Abre la app** en Expo
2. **Presiona** el botón "🔐 Iniciar como Administrador" (debajo del formulario de login)
3. **Ingresa** las credenciales de admin
4. **Presiona** "Acceder como Admin"

---

## 📊 Pantallas del Admin Panel

### 1. **Dashboard (Inicio)**
- Muestra estadísticas generales del marketplace
- Métricas visualizadas:
  - ✅ **Usuarios totales** (4 usuarios actualmente)
  - ✅ **Clientes nuevos esta semana** (3)
  - ✅ **Proveedores nuevos esta semana** (1)
  - ✅ **Bans temporales activos** (0)
  - ✅ **Bans permanentes** (0)
  - ✅ **Disputas abiertas** (0)
  - ✅ **Reseñas ocultas** (0)

**Acceso:** Pantalla principal del panel

---

### 2. **Gestión de Usuarios** 👥
Acceso desde sidebar: "Usuarios" o botón rojo "Gestión de Usuarios"

**Funcionalidades:**
- 📋 Ver lista de todos los usuarios (no-admin)
- 🔍 Buscar por nombre o email
- 🏷️ Filtrar por rol: Clientes, Proveedores, Todos
- 🔒 Filtrar por estado: Activos, Baneados, Todos

**Acciones disponibles:**
- 🚫 **Ban Temporal**: Banear por X horas con razón
- 🔴 **Ban Permanente**: Banear de forma permanente
- ♻️ **Desbanear**: Recuperar acceso de usuario baneado
- 🔑 **Reset Contraseña**: Generar nueva contraseña para usuario

**Usuarios de prueba:**
- Juan Pérez (juan@test.com) - Cliente
- María López (maria@test.com) - Proveedor
- Pedro García (pedro@test.com) - Cliente

---

### 3. **Gestión de Disputas** ⚔️
Acceso desde sidebar: "Disputas" o botón azul "Gestión de Disputas"

**Funcionalidades:**
- 📋 Ver lista de todas las disputas
- 🔍 Filtrar por estado: Abierta, Resuelta, Escalada, Todas
- 📖 Ver detalles completos de cada disputa

**Acciones disponibles:**
- ✅ **Resolver Disputa**: Decidir ganador y % de reembolso
- 📎 **Agregar Evidencia**: Añadir mensajes/archivos a la disputa
- 💰 **Gestionar Reembolsos**: Establecer porcentaje de devolución

**Estados de disputa:**
- `open` - Disputas abiertas y sin resolver
- `resolved` - Disputas ya resueltas por admin
- `escalated` - Disputas escaladas a nivel superior

---

### 4. **Gestión de Reseñas** ⭐
Acceso desde sidebar: "Reseñas" o botón verde "Gestión de Reseñas"

**Funcionalidades:**
- 📋 Ver lista de todas las reseñas
- 🔍 Filtrar por: Reseñas ofensivas, Reseñas ocultas, Todas

**Acciones disponibles:**
- 👁️ **Ocultar Reseña**: Ocultar contenido ofensivo sin borrar
- 👁️‍🗨️ **Mostrar Reseña**: Recuperar visibilidad de reseña oculta
- 💬 **Ver Detalles**: Ver contenido completo de la reseña

**Información de reseña:**
- Calificación (1-5 estrellas)
- Comentario del revisor
- Producto revisado
- Usuario que escribió la reseña
- Fecha de creación

---

### 5. **Auditoría (Logs)** 📝
Acceso desde sidebar: "Auditoría" o botón naranja "Auditoría y Logs"

**Funcionalidades:**
- 📋 Ver registro completo de acciones administrativas
- 🔍 Filtrar por tipo de acción:
  - 🚫 `ban_user` - Bans de usuarios
  - ♻️ `unban_user` - Desban de usuarios
  - 🔐 `reset_password` - Cambios de contraseña
  - 👁️ `hide_review` - Reseñas ocultadas
  - ⚔️ `resolve_dispute` - Disputas resueltas

**Información registrada:**
- ¿Quién? (Admin que realizó la acción)
- ¿Qué? (Tipo de acción)
- ¿Cuándo? (Fecha y hora exacta)
- ¿Dónde? (Usuario/entidad afectada)
- ¿Por qué? (Razón o detalles)

---

## 🔘 Botones del Sidebar

| Botón | Acción | Color |
|-------|--------|-------|
| 🏠 Dashboard | Ir al inicio del panel | Azul |
| 👥 Usuarios | Gestión de usuarios | Rosa |
| ⚔️ Disputas | Gestión de disputas | Azul |
| ⭐ Reseñas | Gestión de reseñas | Verde |
| 📝 Auditoría | Ver logs de acciones | Naranja |
| ⚙️ Configuración | Futuras opciones de configuración | Gris |
| 🚪 Salir | **Cerrar sesión** | Rojo |

---

## 🔴 Cerrar Sesión

1. **Localiza el botón "Salir"** en la parte inferior del sidebar izquierdo (color rojo)
2. **Presiona el botón** "Salir"
3. **Confirma** en el Alert "¿Deseas cerrar sesión?"
4. Se borrará toda la sesión y volverás a LoginScreen

---

## 📲 Datos de Prueba Disponibles

### Usuarios:
- **Admin**: admin@gmail.com / Admin123456
- **Cliente 1**: juan@test.com / 123456
- **Proveedor**: maria@test.com / 123456
- **Cliente 2**: pedro@test.com / 123456

### Estadísticas:
- 4 usuarios totales
- 3 clientes nuevos esta semana
- 1 proveedor nuevo esta semana
- 0 disputas abiertas
- 0 reseñas ocultas
- 0 bans activos

---

## 🔧 Backend API Endpoints

Todos los endpoints están protegidos con autenticación Sanctum y requieren:
```
Authorization: Bearer {token}
```

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Obtener estadísticas del dashboard |
| GET | `/api/admin/users` | Listar usuarios (con paginación) |
| POST | `/api/admin/users/{id}/ban-temporary` | Banear usuario temporalmente |
| POST | `/api/admin/users/{id}/ban-permanent` | Banear usuario permanentemente |
| POST | `/api/admin/users/{id}/unban` | Desbanear usuario |
| POST | `/api/admin/users/{id}/reset-password` | Restablecer contraseña |
| GET | `/api/admin/disputes` | Listar disputas |
| POST | `/api/admin/disputes/{id}/resolve` | Resolver disputa |
| GET | `/api/admin/reviews` | Listar reseñas |
| POST | `/api/admin/reviews/{id}/hide` | Ocultar reseña |
| GET | `/api/admin/logs` | Obtener logs de auditoría |

---

## 🎨 Diseño y Estilo

- **Tema**: Dark Mode con gradientes modernos
- **Iconos**: Lucide Icons (outline stroke=2)
- **Paleta de colores**:
  - Fondo: Negro profundo (#0a0a0a)
  - Primario: Azul violáceo (#5A67D8)
  - Secundario: Rosa (#FF6B9D)
  - Éxito: Verde (#48BB78)
  - Advertencia: Naranja (#F59E0B)
  - Peligro: Rojo (#F56565)

---

## ✨ Características Principales

✅ Autenticación con Sanctum  
✅ Control de rol (admin only)  
✅ Búsqueda y filtros avanzados  
✅ Modales para acciones  
✅ Confirmaciones de seguridad  
✅ Mensajes de éxito/error  
✅ Carga de datos en tiempo real  
✅ Sidebar fijo  
✅ Scroll infinito en listas  
✅ Responsive (móvil y desktop)  
✅ Auditoría completa de acciones  
✅ Gestión de bans con horas personalizables  

---

## 🚀 Próximas Mejoras (Futuras)

- [ ] Gráficos de estadísticas más detallados
- [ ] Exportar reportes en CSV/PDF
- [ ] Búsqueda avanzada con múltiples criterios
- [ ] Sistema de notificaciones en tiempo real
- [ ] Roles de admin adicionales
- [ ] Historial de cambios de usuario
- [ ] Integración con sistema de pagos
- [ ] Webhooks para eventos administrativos

---

## 📞 Soporte

Si encuentras algún problema:
1. Verifica que el servidor Laravel esté corriendo (`php artisan serve`)
2. Verifica la conexión a PostgreSQL
3. Revisa los logs: `storage/logs/laravel.log`
4. Reinicia el servidor y la app

---

**Versión**: 1.0  
**Última actualización**: 18 de Enero 2026  
**Estado**: ✅ Producción
