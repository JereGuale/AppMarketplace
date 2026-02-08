# 📱 EXPLICACIÓN TÉCNICA: ZoneMarketplace

## 🎯 RESUMEN DEL PROYECTO

**ZoneMarketplace** es una aplicación móvil de marketplace completa tipo OLX/MercadoLibre, donde los usuarios pueden:
- Registrarse y autenticarse
- Publicar productos para vender
- Ver productos de otros usuarios
- Chatear con vendedores
- Recibir notificaciones
- Gestionar su perfil

---

## 🏗️ ARQUITECTURA DEL PROYECTO

### **Stack Tecnológico**

#### Frontend (MiApp)
- **React Native** con **Expo** - Framework multiplataforma para iOS/Android
- **AsyncStorage** - Almacenamiento local para tokens y datos de usuario
- **fetch API** - Comunicación HTTP con el backend

#### Backend (ZoneMarketplaceBackend)
- **Laravel 11** - Framework PHP para APIs REST
- **MySQL** - Base de datos relacional
- **Laravel Sanctum** - Autenticación basada en tokens
- **CORS** configurado - Permite peticiones cross-origin

---

## 🔄 CONEXIÓN FRONTEND ↔ BACKEND

### **1. Detección Automática de la API**

El archivo `MiApp/src/service/api.js` maneja la conexión:

```javascript
// PRIORIDADES DE CONFIGURACIÓN:
1. Variable de entorno (EXPO_PUBLIC_API_BASE)
2. Auto-detección desde hostUri de Expo
3. Valores por defecto:
   - Android Emulador: http://10.0.2.2:8000
   - iOS/Web: http://localhost:8000
```

**¿Por qué es importante?**
- En desarrollo, tu PC ejecuta Laravel en `localhost:8000`
- Pero el emulador de Android NO puede acceder a `localhost`
- La IP `10.0.2.2` es el gateway que usa Android para alcanzar la máquina host

### **2. Sistema de Autenticación**

#### Flujo de Login:

```
FRONTEND (LoginScreen.js)
    ↓ Usuario ingresa email/password
    ↓
API Request: POST /api/login
    {
      "email": "usuario@mail.com",
      "password": "123456"
    }
    ↓
BACKEND (AuthController.php)
    ↓ Valida credenciales con Auth::attempt()
    ↓ Genera token con Sanctum
    ↓
Response:
    {
      "user": {...datos del usuario...},
      "token": "eyJ0eXAiOiJKV1..."
    }
    ↓
FRONTEND
    ↓ Guarda token en AsyncStorage
    ↓ Guarda datos de usuario
    ↓ Navega a HomeScreen
```

#### ¿Cómo funciona Sanctum?

Laravel Sanctum genera un **token de texto plano** único para cada usuario:
- El token se almacena en la tabla `personal_access_tokens`
- En cada request protegido, el frontend envía: `Authorization: Bearer {token}`
- Laravel verifica el token y autentica al usuario automáticamente

---

## 📋 ENDPOINTS DE LA API

### **Rutas Públicas** (No requieren autenticación)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/register | Registrar nuevo usuario |
| POST | /api/login | Iniciar sesión |
| GET | /api/products | Listar todos los productos |
| GET | /api/products/{id} | Ver detalle de un producto |

### **Rutas Protegidas** (Requieren token)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| PUT | /api/user/profile | Actualizar perfil del usuario |
| POST | /api/user/avatar | Subir avatar del usuario |
| POST | /api/products | Crear nuevo producto |
| PUT | /api/products/{id} | Editar producto propio |
| DELETE | /api/products/{id} | Eliminar producto propio |
| GET | /api/my-products | Ver mis productos |
| GET | /api/conversations | Listar conversaciones |
| POST | /api/messages | Enviar mensaje |
| GET | /api/notifications | Obtener notificaciones |

---

## 💾 ESTRUCTURA DE LA BASE DE DATOS

### **Tabla: users**
```sql
- id (PRIMARY KEY)
- name (string)
- email (string, UNIQUE)
- phone (string)
- city (string)
- password (hash)
- avatar (string, nullable) → Ruta a imagen
- created_at, updated_at
```

### **Tabla: products**
```sql
- id (PRIMARY KEY)
- user_id (FOREIGN KEY → users.id)
- title (string)
- description (text)
- price (decimal)
- location (string)
- category (string)
- images (JSON) → Array de rutas ["products/1_123.jpg", ...]
- sold (boolean)
- created_at, updated_at
```

### **Tabla: conversations**
```sql
- id (PRIMARY KEY)
- product_id (FOREIGN KEY → products.id)
- buyer_id (FOREIGN KEY → users.id)
- seller_id (FOREIGN KEY → users.id)
- created_at, updated_at
```

### **Tabla: messages**
```sql
- id (PRIMARY KEY)
- conversation_id (FOREIGN KEY → conversations.id)
- sender_id (FOREIGN KEY → users.id)
- message (text)
- is_read (boolean)
- created_at, updated_at
```

### **Tabla: notifications**
```sql
- id (PRIMARY KEY)
- user_id (FOREIGN KEY → users.id)
- title (string)
- message (text)
- type (string) → "new_message", "product_sold", etc.
- is_read (boolean)
- data (JSON) → Información adicional
- created_at, updated_at
```

---

## 🔐 IMPLEMENTACIÓN DE SEGURIDAD

### **1. Hashing de Contraseñas**
```php
// Al registrar:
'password' => Hash::make($request->password)

// Al login, Laravel compara automáticamente:
Auth::attempt(['email' => $email, 'password' => $password])
```

### **2. Middleware de Autenticación**
```php
// En routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    // Solo usuarios autenticados pueden acceder aquí
});
```

### **3. Validación de Propietario**
```php
// En ProductController:
if ($product->user_id !== auth()->id()) {
    return response()->json(['message' => 'No autorizado'], 403);
}
```

### **4. CORS Configurado**
Permite que React Native (cliente externo) haga peticiones al servidor Laravel:
```php
'allowed_origins' => ['*'],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
```

---

## 📸 MANEJO DE IMÁGENES

### **Flujo de Subida de Imágenes:**

1. **Frontend**: Usuario selecciona foto con `expo-image-picker`
2. **Conversión**: Se convierte a Base64
   ```javascript
   const base64 = await FileSystem.readAsStringAsync(uri, {
     encoding: FileSystem.EncodingType.Base64
   });
   ```

3. **Envío**: Se envía en el cuerpo del JSON
   ```javascript
   {
     "images": ["data:image/jpeg;base64,/9j/4AAQ..."]
   }
   ```

4. **Backend**: Laravel decodifica y guarda
   ```php
   $imageData = base64_decode($base64Image);
   Storage::disk('public')->put($filename, $imageData);
   ```

5. **Almacenamiento**: Se guarda en `storage/app/public/products/`

6. **URL de Acceso**: 
   ```
   http://localhost:8000/storage/products/1_1234567890.jpg
   ```

### **Configuración de Storage:**
Laravel utiliza un **symbolic link** de `public/storage` → `storage/app/public/`:
```bash
php artisan storage:link
```

---

## 🧩 COMPONENTES PRINCIPALES

### **Frontend**

#### **App.js** - Controlador principal
- Maneja navegación entre pantallas con `useState`
- Gestiona estado global de usuario y productos
- Restaura sesión al iniciar la app desde AsyncStorage

#### **LoginScreen.js / RegisterScreen.js**
- Formularios de autenticación
- Llaman a `api.login()` o `api.register()`
- Guardan token y navegan a Home

#### **HomeScreen.js**
- Muestra lista de productos con `FlatList`
- Filtro por categorías
- Carga productos desde `/api/products`

#### **ProductDetailScreen.js**
- Muestra detalle completo del producto
- Botón "Contactar vendedor" → Abre chat
- Si es dueño: permite editar/eliminar

#### **PublishScreen.js**
- Formulario para publicar productos
- Selector de imágenes (hasta 6)
- Envía a `POST /api/products`

#### **MessagesScreen.js**
- Lista de conversaciones activas
- Muestra último mensaje y fecha

#### **ChatScreenMessages.js**
- Chat en tiempo real (simulado con polling)
- Envío de mensajes
- Scroll automático a mensajes nuevos

#### **ProfileScreen.js**
- Muestra datos del usuario
- Tabs: Mis productos / Vendidos
- Editar perfil y avatar

---

### **Backend**

#### **AuthController.php**
- `register()`: Crea usuario, hashea password, genera token
- `login()`: Valida credenciales, genera token
- `updateProfile()`: Actualiza ciudad/password
- `uploadAvatar()`: Guarda imagen de perfil

#### **ProductController.php**
- `index()`: Lista todos los productos con datos del usuario
- `show($id)`: Producto específico
- `store()`: Crear producto con imágenes
- `update($id)`: Editar producto (solo dueño)
- `destroy($id)`: Eliminar producto (solo dueño)
- `myProducts()`: Productos del usuario autenticado
- `markSold($id)`: Marcar como vendido

#### **MessageController.php**
- `index()`: Lista conversaciones del usuario
- `show($id)`: Mensajes de una conversación
- `store()`: Crear nuevo mensaje
- `destroy($id)`: Eliminar conversación

#### **NotificationController.php**
- `index()`: Notificaciones del usuario
- `markAsRead($id)`: Marcar notificación leída
- `markAllAsRead()`: Marcar todas leídas
- `destroy($id)`: Eliminar notificación

---

## 🔄 FLUJOS PRINCIPALES

### **Publicar un Producto**

```
1. Usuario en HomeScreen presiona "Publicar"
   ↓
2. Navega a PublishScreen
   ↓
3. Completa formulario:
   - Título
   - Descripción
   - Precio
   - Ubicación
   - Categoría
   - Imágenes (hasta 6)
   ↓
4. Presiona "Publicar"
   ↓
5. Frontend convierte imágenes a Base64
   ↓
6. Envía POST /api/products con token Bearer
   ↓
7. Backend (ProductController):
   - Valida datos
   - Decodifica imágenes Base64
   - Guarda en storage/app/public/products/
   - Crea registro en BD con user_id
   ↓
8. Retorna producto creado con ID
   ↓
9. Frontend actualiza lista de productos
   ↓
10. Navega de vuelta a HomeScreen
```

### **Iniciar Conversación con Vendedor**

```
1. Usuario ve producto interesante
   ↓
2. Presiona "Ver detalle"
   ↓
3. En ProductDetailScreen presiona "Contactar"
   ↓
4. Frontend verifica si existe conversación:
   GET /api/conversations (busca por product_id)
   ↓
5. Si NO existe:
   - Crea conversación (backend auto-crea)
   ↓
6. Si SÍ existe:
   - Abre conversación existente
   ↓
7. Navega a ChatScreenMessages
   ↓
8. Usuario escribe mensaje
   ↓
9. Envía POST /api/messages:
   {
     "conversation_id": 5,
     "message": "¿Está disponible?"
   }
   ↓
10. Backend crea mensaje con sender_id
    ↓
11. Frontend actualiza chat
    ↓
12. Vendedor recibe notificación
```

---

## 🎨 ESTADO Y NAVEGACIÓN

La app usa **navegación por estado** (no React Navigation):

```javascript
const [screen, setScreen] = useState('login');

// Cambiar pantalla:
setScreen('home');
setScreen('profile');
setScreen('productDetail');
```

### **Estados Globales:**
- `screen`: Pantalla actual
- `userData`: Datos del usuario logueado
- `products`: Lista de productos
- `selectedProduct`: Producto seleccionado para detalle
- `selectedConversation`: Conversación abierta
- `messagesRefresh`: Trigger para recargar mensajes

---

## 🚀 EJECUCIÓN DEL PROYECTO

### **Backend (Laravel):**
```bash
# 1. Instalar dependencias
composer install

# 2. Configurar .env
cp .env.example .env
# Editar DB_DATABASE, DB_USERNAME, DB_PASSWORD

# 3. Generar key
php artisan key:generate

# 4. Migrar base de datos
php artisan migrate

# 5. Crear link simbólico para storage
php artisan storage:link

# 6. Iniciar servidor
php artisan serve
# Corre en http://localhost:8000
```

### **Frontend (React Native):**
```bash
# 1. Instalar dependencias
cd MiApp
npm install

# 2. Iniciar Expo
npx expo start

# 3. Escanear QR con Expo Go (móvil)
# O presionar 'a' para Android emulator
```

---

## 🔍 CONCEPTOS CLAVE PARA EXPLICAR

### **1. API RESTful**
- Arquitectura cliente-servidor
- Operaciones CRUD con verbos HTTP (GET, POST, PUT, DELETE)
- Respuestas en JSON
- Stateless (sin estado entre requests)

### **2. Token-Based Authentication**
- Usuario envía credenciales
- Servidor genera token único
- Cliente guarda token localmente
- Cada request incluye token en headers
- Servidor valida token y autentica

### **3. Relaciones de Base de Datos**
- **1:N** → Un usuario tiene muchos productos
- **N:M** → Conversación conecta 2 usuarios (buyer/seller)
- **1:N** → Conversación tiene muchos mensajes

### **4. Middleware**
- Filtros que se ejecutan antes de llegar al controlador
- `auth:sanctum`: Verifica token antes de permitir acceso
- CORS: Permite peticiones cross-origin

### **5. Almacenamiento Local**
- AsyncStorage: Base de datos clave-valor en el dispositivo
- Persiste sesión sin requerir login en cada apertura
- Guarda tokens, datos de usuario, cache

---

## 📊 FLUJO DE DATOS COMPLETO

```
┌─────────────────────────────────────────────────────────┐
│                    REACT NATIVE APP                      │
│                                                          │
│  ┌──────────┐   ┌──────────┐   ┌──────────────┐       │
│  │  Screen  │──▶│  api.js  │──▶│ AsyncStorage │       │
│  └──────────┘   └──────────┘   └──────────────┘       │
│       │              │                                   │
└───────┼──────────────┼───────────────────────────────────┘
        │              │
        │     HTTP Request (JSON)
        │     Authorization: Bearer {token}
        │              │
        ▼              ▼
┌─────────────────────────────────────────────────────────┐
│                    LARAVEL BACKEND                       │
│                                                          │
│  ┌──────────┐   ┌──────────────┐   ┌──────────┐       │
│  │  routes  │──▶│ Middleware   │──▶│Controller│       │
│  │  api.php │   │ auth:sanctum │   └──────────┘       │
│  └──────────┘   └──────────────┘        │              │
│                                          │              │
│                                          ▼              │
│                                  ┌──────────────┐       │
│                                  │    Model     │       │
│                                  └──────────────┘       │
│                                          │              │
│                                          ▼              │
│                                  ┌──────────────┐       │
│                                  │   MySQL DB   │       │
│                                  └──────────────┘       │
└─────────────────────────────────────────────────────────┘
```

---

## 🎓 PUNTOS CLAVE PARA LA PRESENTACIÓN

1. **Separación de responsabilidades**: Frontend solo maneja UI, Backend maneja lógica y datos
2. **Seguridad**: Tokens, validación, autorizacion por propietario
3. **Escalabilidad**: Arquitectura REST permite agregar más clientes (web, iOS nativo)
4. **Persistencia**: Base de datos relacional normalizada
5. **UX**: Almacenamiento local para sesión persistente
6. **Multimedia**: Manejo eficiente de imágenes con Base64 y storage

---

## 🐛 SOLUCIÓN DE PROBLEMAS COMUNES

| Problema | Causa | Solución |
|----------|-------|----------|
| Error de conexión | Backend no está corriendo | `php artisan serve` |
| 401 Unauthorized | Token inválido o expirado | Cerrar sesión y volver a loguearse |
| CORS error | Configuración incorrecta | Verificar `config/cors.php` |
| 10.0.2.2 no funciona | No es emulador Android | Usar IP local real (192.168.x.x) |
| Imágenes no se ven | Storage link no creado | `php artisan storage:link` |
| 500 Internal Error | Error en PHP | Revisar `storage/logs/laravel.log` |

---

## 📚 TECNOLOGÍAS Y CONCEPTOS UTILIZADOS

- **MVC** (Model-View-Controller)
- **ORM** (Eloquent de Laravel)
- **JWT** (JSON Web Tokens vía Sanctum)
- **REST API** (Representational State Transfer)
- **CRUD** (Create, Read, Update, Delete)
- **Async/Await** (Programación asíncrona)
- **Hooks** (useState, useEffect)
- **Component-Based Architecture**
- **Middleware Pattern**
- **Repository Pattern** (implícito en Models)

---

## 🎯 CONCLUSIÓN

ZoneMarketplace es una **aplicación full-stack moderna** que demuestra:
✅ Integración Frontend-Backend  
✅ Autenticación segura  
✅ Manejo de multimedia  
✅ Base de datos relacional  
✅ API REST bien estructurada  
✅ UX fluida con persistencia local  

Es un proyecto **completo y funcional** que puede escalar a producción con ajustes de seguridad y optimización.
