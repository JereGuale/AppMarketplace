# FIX: Pantalla en blanco al volver desde Mensajes

## Problema
Cuando el usuario usaba el botón de back dentro del panel de mensajes o después de enviar un mensaje, la app se quedaba en blanco.

## Causa Raíz
El problema estaba en el manejo incorrecto del estado `previousScreen` en App.js:

1. **Cuando navegabas a MessagesScreen**: No se guardaba `previousScreen`, por lo que cuando volvías desde un chat abierto dentro de mensajes, se quedaba sin saber a dónde ir.
2. **Flujo de navegación**: 
   - Home → Messages (previousScreen no se actualiza)
   - Messages → Chat (previousScreen se guarda como 'messages')
   - Volver desde Chat → Intenta ir a 'messages' pero el estado estaba inconsistente

## Cambios Realizados

### 1. App.js - Actualizar `handleGoMessages()`
```javascript
function handleGoMessages(){
  console.log('💬 handleGoMessages llamado');
  setPreviousScreen(screen); // ← NUEVO: Guardar pantalla actual
  setScreen('messages');
}
```

### 2. App.js - Mejorar `handleOpenChat()`
```javascript
function handleOpenChat(conversationOrProduct) {
  console.log('💬 Abriendo chat desde:', screen);
  setPreviousScreen(screen); // Guarda 'messages' o 'productDetail'
  if (conversationOrProduct.messages) {
    setSelectedConversation(conversationOrProduct);
    setChatProduct(null);
  } else {
    setSelectedConversation(null);
    setChatProduct(conversationOrProduct);
  }
  setScreen('chat');
}
```

### 3. App.js - Mejorar `goBackSafe()`
```javascript
const goBackSafe = () => {
  console.log('🔙 goBackSafe llamado. previousScreen:', previousScreen);
  setSelectedProduct(null);
  setSelectedConversation(null);
  setChatProduct(null);
  setVendorProfile(null);
  const targetScreen = previousScreen || 'home';
  console.log('🔙 Volviendo a pantalla:', targetScreen);
  setScreen(targetScreen);
};
```

### 4. App.js - Actualizar render de MessagesScreen
```javascript
{screen === 'messages' && (
  <MessagesScreen 
    onBack={() => {
      setPreviousScreen('home'); // Asegurar que la siguiente navegación sepa volver a home
      setScreen('home');
    }} 
    onOpenChat={handleOpenChat}
    userData={userData}
    refreshKey={messagesRefresh}
  />
)}
```

### 5. App.js - Actualizar render de NotificationsScreen (mismo patrón)
```javascript
{screen === 'notifications' && (
  <NotificationsScreen 
    onBack={() => {
      setPreviousScreen('home');
      setScreen('home');
    }} 
    onOpenChat={handleOpenChat}
    userData={userData}
  />
)}
```

## Flujo de Navegación Corregido

### Escenario 1: Mensajes → Chat → Back
1. Home
2. Usuario toca "Mensajes" → handleGoMessages() guarda previousScreen='home'
3. Usuario toca una conversación → handleOpenChat() guarda previousScreen='messages'
4. Usuario toca back → goBackSafe() va a previousScreen='messages'
5. Usuario toca back en Mensajes → va a home ✅

### Escenario 2: Producto → Chat → Back
1. Home
2. Usuario toca un producto → handleProductSelect() guarda previousScreen='home'
3. Usuario abre chat desde producto → handleOpenChat() guarda previousScreen='productDetail'
4. Usuario toca back → goBackSafe() va a previousScreen='productDetail'
5. Usuario toca back en ProductDetail → goBackSafe() va a previousScreen='home' ✅

## Logs de Debug
Se agregaron logs para facilitar el debugging:
- `🔙 goBackSafe llamado. previousScreen:`
- `💬 Abriendo chat desde:`
- `🔄 Cambiando pantalla a: messages`

## Testing
Para verificar que funciona:
1. Ir a Mensajes
2. Abrir una conversación
3. Enviar un mensaje (si es nueva conversación)
4. Presionar back → debe volver a Mensajes
5. Presionar back en Mensajes → debe volver a Home
6. Repetir desde Notificaciones
7. Repetir desde ProductDetail
