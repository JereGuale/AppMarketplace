import React, {useEffect, useState, useCallback} from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/screen/LoginScreen';
import RegisterScreen from './src/screen/RegisterScreen';
import HomeScreen from './src/screen/HomeScreen';
import ProfileScreen from './src/screen/ScreenProfile/ProfileScreen';
import PublishScreen from './src/screen/PublishScreen';
import ProductDetailScreen from './src/screen/ProductDetailScreen';
import MessagesScreen from './src/screen/MessagesScreen';
import ChatScreen from './src/screen/ChatScreenMessages';
import NotificationsScreen from './src/screen/NotificationsScreen';
// Admin Screens
import AdminPanelScreen from './src/screen/AdminPanelScreen';
import AdminUsersScreen from './src/screen/AdminUsersScreen';
import AdminDisputesScreen from './src/screen/AdminDisputesScreen';
import AdminReviewsScreen from './src/screen/AdminReviewsScreen';
import AdminLogsScreen from './src/screen/AdminLogsScreen';

export default function App() {
  const [screen,setScreen] = useState('login');
  const [products, setProducts] = useState([]);
  const [userData, setUserData] = useState({});
  const [userToken, setUserToken] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [chatProduct, setChatProduct] = useState(null);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [previousScreen, setPreviousScreen] = useState('home');
  const [messagesRefresh, setMessagesRefresh] = useState(0);

  // Elimina avatares guardados en cache salvo el del usuario actual (si se indica)
  const clearAvatarCache = async (keepUserId = null) => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const avatarKeys = keys.filter(k => k.startsWith('userAvatar_'));
      const toDelete = keepUserId
        ? avatarKeys.filter(k => k !== `userAvatar_${keepUserId}`)
        : avatarKeys;
      if (toDelete.length) {
        await AsyncStorage.multiRemove(toDelete);
      }
    } catch (err) {
      console.log('⚠️ No se pudo limpiar cache de avatares:', err.message);
    }
  };

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

  // Al iniciar la app, intentar restaurar sesión y usuario
  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('userData');
        const storedToken =
          (await AsyncStorage.getItem('userToken')) ||
          (await AsyncStorage.getItem('zm_token'));

        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          // Si no tiene id, no podemos filtrar productos
          if (parsedUser?.id) {
            setUserData(parsedUser);
            setUserToken(storedToken);
            // Redirigir según el rol
            if (parsedUser.role === 'admin' || parsedUser.isAdmin) {
              setScreen('adminPanel');
            } else {
              setScreen('home');
            }
          }
        }
      } catch (err) {
        console.log('Error restaurando sesión:', err);
      }
    };

    bootstrapAuth();
  }, []);

  async function handleUpdateAvatar(avatarData) {
    setUserData(prev => ({ ...prev, avatar: avatarData }));
  }

  async function handleLoginSuccess(data){
    console.log('🔐 handleLoginSuccess data:', JSON.stringify(data));
    // Cargar el avatar específico del usuario
    let userWithAvatar = data || {};
    try {
      if (data && data.id) {
        // Borra cualquier avatar de otros usuarios para evitar mezclas
        await clearAvatarCache(data.id);
        const avatarKey = `userAvatar_${data.id}`;
        const savedAvatar = await AsyncStorage.getItem(avatarKey);
        if (savedAvatar) {
          userWithAvatar.avatar = savedAvatar;
        }
      }
    } catch (err) {
      console.log('Error cargando avatar:', err);
    }
    console.log('🔐 userWithAvatar final:', JSON.stringify(userWithAvatar));
    setUserData(userWithAvatar);
    // Guardar token en estado
    if (data && data.token) {
      setUserToken(data.token);
    }
    // Redirigir según el rol del usuario
    if (userWithAvatar.role === 'admin' || userWithAvatar.isAdmin) {
      console.log('🔐 Usuario es admin, redirigiendo a adminPanel');
      setScreen('adminPanel');
    } else {
      console.log('🔐 Usuario normal, redirigiendo a home');
      setScreen('home');
    }
  }
  async function handleRegisterSuccess(data){
    console.log('📝 handleRegisterSuccess data:', JSON.stringify(data));
    setUserData(data || {});
    setScreen('home');
  }
  const handleLogout = useCallback(async () => {
    console.log('🔄 handleLogout en App.js iniciado');
    try {
      // Limpiar avatar cache
      try {
        await clearAvatarCache();
        console.log('✓ Avatar cache limpiado');
      } catch (e) {
        console.log('⚠️ Error limpiando avatar cache:', e);
      }
      
      // Limpiar AsyncStorage
      try {
        await AsyncStorage.removeItem('userToken');
        console.log('✓ userToken removido');
      } catch (e) {
        console.log('⚠️ Error removiendo userToken:', e);
      }
      
      try {
        await AsyncStorage.removeItem('zm_token');
        console.log('✓ zm_token removido');
      } catch (e) {
        console.log('⚠️ Error removiendo zm_token:', e);
      }
      
      try {
        await AsyncStorage.removeItem('userData');
        console.log('✓ userData removido');
      } catch (e) {
        console.log('⚠️ Error removiendo userData:', e);
      }
      
      // Limpiar estado
      setUserToken(null);
      console.log('✓ userToken state limpiado');
      
      setUserData({});
      console.log('✓ userData state limpiado');
      
      // Redirigir a login
      setScreen('login');
      console.log('✅ Redirigido a login');
    } catch (err) {
      console.error('❌ Error en handleLogout:', err);
      // Aún así redirigir aunque haya error
      setScreen('login');
      setUserData({});
      setUserToken(null);
    }
  }, []);
  function handleGoPublish(){
    setScreen('publish');
  }
  function handleGoProfile(vendor = null){
    console.log('👤 handleGoProfile:', vendor ? 'Vendedor' : 'Mi perfil');
    const resolveUserId = async () => {
      let currentId = userData?.id;
      if (!currentId) {
        try {
          const stored = await AsyncStorage.getItem('userData');
          if (stored) {
            const parsed = JSON.parse(stored);
            currentId = parsed?.id;
          }
        } catch (err) {
          console.log('⚠️ No se pudo leer userData de AsyncStorage:', err);
        }
      }

      const isOtherVendor = vendor && vendor.id && currentId && vendor.id !== currentId;

      if (isOtherVendor) {
        console.log('👤 Viendo perfil del vendedor:', vendor.id);
        setVendorProfile(vendor);
        setScreen('vendorProfile');
      } else {
        console.log('👤 Viendo mi perfil');
        setVendorProfile(null);
        setScreen('profile');
      }
    };

    resolveUserId();
  }
  function handleGoMessages(){
    console.log('💬 handleGoMessages llamado');
    console.log('Screen actual:', screen);
    setPreviousScreen(screen); // Guardar pantalla actual
    setScreen('messages');
    console.log('🔄 Cambiando pantalla a: messages');
  }
  function handleGoNotifications(){
    console.log('🔔 handleGoNotifications llamado');
    setScreen('notifications');
  }
  function handlePublishProduct(product){
    // Agregar ID único si no tiene
    const newProduct = {
      ...product,
      id: product.id || Math.random().toString(),
      name: product.title,
    };
    setProducts(prev => [newProduct, ...prev]);
    setScreen('home');
  }
  function handleProductSelect(product) {
    setPreviousScreen(screen); // Guardar pantalla actual
    setSelectedProduct(product);
    setScreen('productDetail');
  }
  function handleOpenChat(conversationOrProduct) {
    console.log('💬 Abriendo chat desde:', screen);
    setPreviousScreen(screen); // Guardar pantalla actual (puede ser 'messages' o 'productDetail')
    if (conversationOrProduct.messages) {
      setSelectedConversation(conversationOrProduct);
      setChatProduct(null);
    } else {
      setSelectedConversation(null);
      setChatProduct(conversationOrProduct);
    }
    setScreen('chat');
  }
  function handleMessageSent() {
    console.log('Mensaje enviado');
    setMessagesRefresh(prev => prev + 1); // Fuerza recarga de lista de conversaciones
  }
  function handleGoHome() {
    console.log('🏠 Volviendo al home');
    setSelectedProduct(null);
    setSelectedConversation(null);
    setChatProduct(null);
    setVendorProfile(null);
    setScreen('home');
  }

  return (
    <View style={{flex:1}}>
      {screen === 'login' && (
        <LoginScreen onNavigateRegister={() => setScreen('register')} onLoginSuccess={handleLoginSuccess} />
      )}
      {screen === 'register' && (
        <RegisterScreen onNavigateLogin={() => setScreen('login')} onRegisterSuccess={handleRegisterSuccess} />
      )}
      {screen === 'home' && (
        <HomeScreen 
          onLogout={handleLogout} 
          onGoPublish={handleGoPublish} 
          onGoProfile={handleGoProfile} 
          onGoMessages={handleGoMessages}
          onGoNotifications={handleGoNotifications}
          onGoHome={handleGoHome}
          onProductSelect={handleProductSelect}
          userProducts={products} 
          userData={userData}
        />
      )}
      {screen === 'profile' && (
        <ProfileScreen 
          onLogout={handleLogout} 
          onGoPublish={handleGoPublish} 
          onGoHome={handleGoHome}
          onGoMessages={handleGoMessages}
          userData={userData} 
          userProducts={products} 
          onUpdateAvatar={handleUpdateAvatar}
          onSelectProduct={handleProductSelect}
          isVendorProfile={vendorProfile !== null}
        />
      )}
      {screen === 'publish' && (
        <PublishScreen onBack={() => setScreen('home')} onPublish={handlePublishProduct} />
      )}
      {screen === 'productDetail' && selectedProduct && (
        <ProductDetailScreen 
          product={selectedProduct} 
          onBack={goBackSafe} 
          onOpenChat={handleOpenChat}
          onGoProfile={handleGoProfile}
          userData={userData}
        />
      )}
      {screen === 'messages' && (
        <MessagesScreen 
          onBack={() => {
            setPreviousScreen('home');
            setScreen('home');
          }} 
          onOpenChat={handleOpenChat}
          userData={userData}
          refreshKey={messagesRefresh}
        />
      )}
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
      {screen === 'chat' && (
        <ChatScreen 
          onBack={goBackSafe} 
          conversation={selectedConversation}
          product={chatProduct}
          userData={userData}
          onMessageSent={handleMessageSent}
        />
      )}
      {screen === 'vendorProfile' && vendorProfile && (
        <ProfileScreen 
          onLogout={handleLogout}
          onGoPublish={handleGoPublish} 
          onGoHome={handleGoHome} 
          userData={vendorProfile}
          userProducts={[]} 
          onUpdateAvatar={() => {}}
          onSelectProduct={handleProductSelect}
          isVendorProfile={true}
        />
      )}
      {/* Admin Screens */}
      {screen === 'adminPanel' && (
        <AdminPanelScreen 
          onLogout={handleLogout}
          onNavigate={(destination) => setScreen(destination)}
          userData={userData}
          userToken={userToken}
        />
      )}
      {screen === 'adminUsers' && (
        <AdminUsersScreen 
          onBack={() => setScreen('adminPanel')}
          userData={userData}
          userToken={userToken}
        />
      )}
      {screen === 'adminDisputes' && (
        <AdminDisputesScreen 
          onBack={() => setScreen('adminPanel')}
          userData={userData}
          userToken={userToken}
        />
      )}
      {screen === 'adminReviews' && (
        <AdminReviewsScreen 
          onBack={() => setScreen('adminPanel')}
          userData={userData}
          userToken={userToken}
        />
      )}
      {screen === 'adminLogs' && (
        <AdminLogsScreen 
          onBack={() => setScreen('adminPanel')}
          userData={userData}
          userToken={userToken}
        />
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({});
