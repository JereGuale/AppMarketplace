// APP.JS - EJEMPLO DE INTEGRACIÓN COMPLETA

import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importar pantallas existentes
import LoginScreen from './src/screen/LoginScreen';
import RegisterScreen from './src/screen/RegisterScreen';
import HomeScreen from './src/screen/HomeScreen';
import ProfileScreen from './src/screen/ProfileScreen';
// ... otras pantallas

// ✅ NUEVAS IMPORTACIONES - PANTALLAS ADMIN
import AdminPanelScreen from './src/screen/AdminPanelScreen';
import AdminUsersScreen from './src/screen/AdminUsersScreen';
import AdminDisputesScreen from './src/screen/AdminDisputesScreen';
import AdminReviewsScreen from './src/screen/AdminReviewsScreen';
import AdminLogsScreen from './src/screen/AdminLogsScreen';

export default function App() {
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  
  // ✅ NUEVO - Estado para pantalla actual
  const [currentScreen, setCurrentScreen] = useState('login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bootstrapAsync();
  }, []);

  async function bootstrapAsync() {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const data = await AsyncStorage.getItem('userData');

      if (token && data) {
        setUserToken(token);
        const parsedData = JSON.parse(data);
        setUserData(parsedData);
        
        // ✅ NUEVO - Detectar si es admin
        if (parsedData.role === 'admin') {
          setCurrentScreen('admin');
        } else {
          setCurrentScreen('home');
        }
      } else {
        setCurrentScreen('login');
      }
    } catch (e) {
      console.error('Error restaurando sesión:', e);
      setCurrentScreen('login');
    } finally {
      setLoading(false);
    }
  }

  // ✅ MODIFICADO - Callback de login exitoso
  function handleLoginSuccess(user) {
    setUserToken(user.token);
    setUserData(user);
    
    // ✅ NUEVO - Detectar si es admin
    if (user.isAdmin || user.role === 'admin') {
      setCurrentScreen('admin');
    } else {
      setCurrentScreen('home');
    }
  }

  function handleLogout() {
    setUserToken(null);
    setUserData(null);
    setCurrentScreen('login');
  }

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: '#0a0a0a' }} />;
  }

  // ✅ NUEVA LÓGICA - Renderizar pantallas admin
  if (currentScreen === 'admin') {
    return (
      <AdminPanelScreen
        userToken={userToken}
        onNavigateUsers={() => setCurrentScreen('admin-users')}
        onNavigateDisputes={() => setCurrentScreen('admin-disputes')}
        onNavigateReviews={() => setCurrentScreen('admin-reviews')}
        onNavigateLogs={() => setCurrentScreen('admin-logs')}
        onLogout={handleLogout}
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

  // Pantallas normales de usuario (existentes)
  if (currentScreen === 'login') {
    return (
      <LoginScreen
        onNavigateRegister={() => setCurrentScreen('register')}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  if (currentScreen === 'register') {
    return (
      <RegisterScreen
        onNavigateLogin={() => setCurrentScreen('login')}
        onRegisterSuccess={handleLoginSuccess}
      />
    );
  }

  if (currentScreen === 'home') {
    return (
      <HomeScreen
        userToken={userToken}
        userData={userData}
        onNavigateProfile={() => setCurrentScreen('profile')}
        onLogout={handleLogout}
      />
    );
  }

  if (currentScreen === 'profile') {
    return (
      <ProfileScreen
        userToken={userToken}
        userData={userData}
        onBack={() => setCurrentScreen('home')}
        onLogout={handleLogout}
      />
    );
  }

  // Default
  return (
    <LoginScreen
      onNavigateRegister={() => setCurrentScreen('register')}
      onLoginSuccess={handleLoginSuccess}
    />
  );
}
