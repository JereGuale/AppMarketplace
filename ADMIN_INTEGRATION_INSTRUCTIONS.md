# Instrucciones de Integración - Sistema de Admin

## 📍 Ubicación en App.js

Para integrar las nuevas pantallas de admin en tu `App.js`, sigue estos pasos:

---

## 1️⃣ Importar las nuevas pantallas

Al inicio de tu `App.js`, añade estas importaciones:

```javascript
import AdminPanelScreen from './src/screen/AdminPanelScreen';
import AdminUsersScreen from './src/screen/AdminUsersScreen';
import AdminDisputesScreen from './src/screen/AdminDisputesScreen';
import AdminReviewsScreen from './src/screen/AdminReviewsScreen';
import AdminLogsScreen from './src/screen/AdminLogsScreen';
```

---

## 2️⃣ Modificar el estado de navegación

En tu estado de `App.js`, añade una propiedad para la pantalla actual:

```javascript
const [currentScreen, setCurrentScreen] = useState('login');
// Ya probablemente tengas: 'login', 'register', 'home', 'chat', etc.
// Ahora añade: 'admin', 'admin-users', 'admin-disputes', 'admin-reviews', 'admin-logs'
```

---

## 3️⃣ Lógica de navegación (parte del render principal)

Modifica tu render/switch para incluir:

```javascript
// Después de verificar si está autenticado y obtener userData:

if (currentScreen === 'admin') {
  return (
    <AdminPanelScreen
      userToken={userToken}
      onNavigateUsers={() => setCurrentScreen('admin-users')}
      onNavigateDisputes={() => setCurrentScreen('admin-disputes')}
      onNavigateReviews={() => setCurrentScreen('admin-reviews')}
      onNavigateLogs={() => setCurrentScreen('admin-logs')}
      onLogout={() => {
        setCurrentScreen('login');
        setUserToken(null);
        setUserData(null);
      }}
    />
  );
}

if (currentScreen === 'admin-users') {
  return (
    <AdminUsersScreen
      userToken={userToken}
      onBack={() => setCurrentScreen('admin')}
    />
  );
}

if (currentScreen === 'admin-disputes') {
  return (
    <AdminDisputesScreen
      userToken={userToken}
      onBack={() => setCurrentScreen('admin')}
    />
  );
}

if (currentScreen === 'admin-reviews') {
  return (
    <AdminReviewsScreen
      userToken={userToken}
      onBack={() => setCurrentScreen('admin')}
    />
  );
}

if (currentScreen === 'admin-logs') {
  return (
    <AdminLogsScreen
      userToken={userToken}
      onBack={() => setCurrentScreen('admin')}
    />
  );
}
```

---

## 4️⃣ Modificar el callback de login exitoso

En tu `LoginScreen`, cuando el login es exitoso, añade esta lógica:

```javascript
if (typeof onLoginSuccess === 'function') {
  const userData = {
    ...userPayload,
    token: response.token,
    isAdmin: userPayload.role === 'admin',  // ← IMPORTANTE
  };
  
  onLoginSuccess(userData);
}
```

---

## 5️⃣ En tu componente principal (App.js), detectar admin

Cuando recibas el callback de `onLoginSuccess`:

```javascript
function handleLoginSuccess(user) {
  setUserToken(user.token);
  setUserData(user);
  
  // ← NUEVA LÓGICA
  if (user.isAdmin) {
    setCurrentScreen('admin');
  } else {
    setCurrentScreen('home');
  }
  // ← FIN NUEVA LÓGICA
}
```

---

## 📋 Checklist de integración

- [ ] Importar las 5 nuevas pantallas
- [ ] Añadir estados de navegación para admin
- [ ] Implementar switch/if para las 5 pantallas
- [ ] Modificar LoginScreen para devolver isAdmin
- [ ] Añadir lógica en handleLoginSuccess
- [ ] Testear login como admin
- [ ] Verificar que los botones de navegación funcionen

---

## 🧪 Testing

1. **Login como admin:**
   - Ve a LoginScreen
   - Haz clic en "🔐 Iniciar como Administrador"
   - Ingresa credenciales admin
   - Deberías ver AdminPanelScreen

2. **Botones de acciones:**
   - "Gestión de Usuarios" → AdminUsersScreen
   - "Gestión de Disputas" → AdminDisputesScreen
   - "Gestión de Reseñas" → AdminReviewsScreen
   - "Auditoría y Logs" → AdminLogsScreen

3. **Botón Volver:**
   - Desde cualquier sub-pantalla, "← Volver" regresa a AdminPanelScreen

---

## 📝 Ejemplo completo de integración

Ver el archivo `APP_INTEGRATION_EXAMPLE.js` para un ejemplo completo.

---

**¡Listo! Las pantallas admin están integradas.**
