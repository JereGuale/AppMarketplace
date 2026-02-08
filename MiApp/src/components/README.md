# Estructura de Componentes

Esta es la nueva organización del proyecto para mantener el código limpio y fácil de mantener.

## 📁 Estructura de Carpetas

```
src/
├── components/
│   ├── common/          # Componentes reutilizables en toda la app
│   │   └── BottomNav.js
│   └── home/            # Componentes específicos del Home
│       ├── HeroBanner.js
│       ├── ProductCard.js
│       └── CategoryFilter.js
├── screen/              # Pantallas principales
│   ├── HomeScreen.js
│   ├── ProfileScreen.js
│   ├── LoginScreen.js
│   ├── RegisterScreen.js
│   └── PublishScreen.js
├── service/             # Servicios y API
│   └── api.js
└── styles/              # Estilos compartidos (futuro)
```

## 🧩 Componentes Creados

### `BottomNav.js`
Barra de navegación inferior compartida entre pantallas.
- **Props**: `activeTab`, `onNavigate`
- **Usado en**: HomeScreen, ProfileScreen

### `ProductCard.js`
Tarjeta de producto con imagen, precio y botón de favoritos.
- **Props**: `product`, `onPress`, `onToggleLike`, `isLiked`
- **Usado en**: HomeScreen

### `HeroBanner.js`
Banner hero con imagen del carrito y botones CTA.
- **Props**: `onPublish`, `onExplore`
- **Usado en**: HomeScreen

### `CategoryFilter.js`
Filtro horizontal de categorías con colores.
- **Props**: `selectedCategory`, `onSelectCategory`
- **Usado en**: HomeScreen

## ✅ Beneficios

1. **Código más limpio**: Archivos más pequeños y manejables
2. **Reutilización**: Componentes se pueden usar en múltiples pantallas
3. **Mantenimiento fácil**: Cada componente tiene su propia responsabilidad
4. **Escalabilidad**: Fácil agregar nuevos componentes
5. **Debug más rápido**: Errores más fáciles de localizar

## 🚀 Próximos Pasos

- Separar estilos comunes en `src/styles/`
- Crear componentes para ProfileScreen
- Extraer hooks personalizados a `src/hooks/`
- Agregar tests para cada componente
