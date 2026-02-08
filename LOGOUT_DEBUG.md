# Guía de Depuración - Botón de Logout Admin

## Flujo Esperado del Logout

### 1. **Usuario presiona el botón "Salir"** en AdminPanelScreen
- Ubicación: Sidebar izquierdo, parte inferior (botón rojo)
- Código: `<TouchableOpacity style={styles.sidebarLogout} onPress={handleLogout} activeOpacity={0.8}>`

### 2. **Se ejecuta handleLogout() en AdminPanelScreen**
```javascript
async function handleLogout() {
  Alert.alert(
    'Cerrar sesión',
    '¿Estás seguro que deseas cerrar sesión?',
    [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Cerrar sesión',
        onPress: () => {
          // Llama directamente a onLogout sin más lógica
          onLogout && onLogout();
        },
        style: 'destructive',
      },
    ]
  );
}
```

### 3. **Se muestra Alert de confirmación**
- Opciones: "Cancelar" o "Cerrar sesión"
- Si presiona "Cancelar": No pasa nada, sigue en AdminPanel
- Si presiona "Cerrar sesión": Se ejecuta `onLogout()`

### 4. **Se ejecuta handleLogout() en App.js**
```javascript
async function handleLogout(){
  console.log('🔄 handleLogout en App.js iniciado');
  
  // 1. Limpiar avatar cache
  await clearAvatarCache();
  
  // 2. Limpiar AsyncStorage
  await AsyncStorage.removeItem('userToken');
  await AsyncStorage.removeItem('zm_token');
  await AsyncStorage.removeItem('userData');
  
  // 3. Limpiar estado
  setUserToken(null);
  setUserData({});
  
  // 4. Redirigir a login
  setScreen('login');
}
```

### 5. **Redirección a LoginScreen**
- El usuario vuelve a la pantalla de login
- Se puede ver el toggle "🔐 Iniciar como Administrador" nuevamente
- Se puede hacer login con otras credenciales

---

## Checklist de Funciones

- ✅ handleLogout en AdminPanelScreen llama a onLogout
- ✅ onLogout es pasado como prop desde App.js
- ✅ handleLogout en App.js limpia AsyncStorage
- ✅ handleLogout en App.js limpia estado
- ✅ handleLogout en App.js redirige a login
- ✅ El botón de logout está visible (rojo, parte inferior sidebar)
- ✅ El Alert de confirmación funciona
- ✅ Las props se pasan correctamente

---

## Posibles Problemas y Soluciones

### Problema: El Alert no aparece
**Solución**: El botón no está siendo presionado. Verifica que:
- El botón sea visible en el sidebar izquierdo
- El botón sea de color rojo
- El botón esté debajo de los items del menú

### Problema: El Alert aparece pero no hace nada
**Solución**: El callback onLogout no está siendo ejecutado. Verifica:
- En App.js línea ~318: `onLogout={handleLogout}` está pasado
- En AdminPanelScreen línea ~24: `onLogout,` está en destructuring

### Problema: Se limpia AsyncStorage pero no redirecciona
**Solución**: El setScreen no está funcionando. Verifica:
- `setScreen` es un estado en App.js
- Se redirige a 'login' cuando se completa logout

### Problema: Redirecciona pero no se limpia bien
**Solución**: El AsyncStorage no se está limpiando correctamente. Verifica:
- Los keys exactos son: 'userToken', 'zm_token', 'userData'
- Se usan `await` en las operaciones

---

## Console Logs para Depuración

Abre el console en Expo/React Native debugger y verifica estos logs:

```
✓ userToken removido
✓ zm_token removido
✓ userData removido
✓ userToken state limpiado
✓ userData state limpiado
✅ Redirigido a login
```

Si ves errores en lugar de estos logs, el problema está en la limpieza de AsyncStorage.

---

## Prueba Manual

1. **Abre la app**
2. **Login como admin@gmail.com / Admin123456**
3. **Presiona el botón "Salir" en el sidebar**
4. **Confirma "Cerrar sesión"**
5. **Deberías ver: LoginScreen con toggle de admin**

---

## Archivos Involucrados

- `MiApp/App.js` - Manejo de handleLogout y estado
- `MiApp/src/screen/AdminPanelScreen.js` - Botón de logout
- `MiApp/src/screen/ScreenProfile/ProfileScreen.js` - Referencia de implementación similar

---

## Timestamp
Creado: 18 de Enero 2026
Estado: En Depuración
