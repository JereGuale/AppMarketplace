import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProducts } from '../../../service/api';
import { getSafeAvatar, bustCache, getInitialCity } from '../utils/profileHelpers';

export const useProfileData = (userData) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(userData.avatar);
  const [avatarRefresh, setAvatarRefresh] = useState(0);
  const initialCity = getInitialCity(userData);
  const [displayCity, setDisplayCity] = useState(initialCity);

  useEffect(() => {
    setAvatar(null);
    const clearPrevAvatar = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const avatarKeys = keys.filter(k => k.startsWith('userAvatar_'));
        await AsyncStorage.multiRemove(avatarKeys.filter(k => k !== `userAvatar_${userData?.id || ''}`));
      } catch (err) {
        console.log('⚠️ No se pudo limpiar cache de avatares:', err.message);
      }
    };

    clearPrevAvatar();

    const ensureUserData = async () => {
      if (!userData?.id) {
        try {
          const stored = await AsyncStorage.getItem('userData');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.id) {
              userData.id = parsed.id;
              userData.name = userData.name || parsed.name;
              userData.city = userData.city || parsed.city;
              userData.location = userData.location || parsed.location;
              userData.avatar = userData.avatar || parsed.avatar;
            }
          }
        } catch (err) {
          console.log('⚠️ No se pudo restaurar userData de AsyncStorage:', err);
        }
      }
    };

    ensureUserData().then(() => {
      if (userData?.location || userData?.city) {
        const candidate = userData.location || userData.city || '';
        const safeCity = (typeof candidate === 'string' && candidate.includes('@')) ? '' : candidate;
        setDisplayCity(safeCity);
      }
      loadMyProducts();
      loadAvatar();
    });
  }, [userData.id]);

  const loadAvatar = async () => {
    try {
      console.log('🔍 ProfileScreen - Cargando avatar...');
      
      if (userData?.id) {
        // Primero intenta usar el avatar del servidor (userData.avatar)
        const safeUser = getSafeAvatar(userData.avatar);
        if (safeUser) {
          console.log('✅ Avatar cargado desde servidor');
          setAvatar(bustCache(safeUser));
        } else {
          // Fallback: buscar en AsyncStorage
          const avatarKey = `userAvatar_${userData.id}`;
          const savedAvatar = await AsyncStorage.getItem(avatarKey);
          if (savedAvatar) {
            console.log('🖼️ Avatar encontrado en almacenamiento local');
            setAvatar(bustCache(getSafeAvatar(savedAvatar)));
          } else {
            console.log('⚠️ No hay avatar disponible');
            setAvatar(null);
          }
        }
      } else {
        console.log('⚠️ No hay userData.id disponible');
        const safe = getSafeAvatar(userData.avatar);
        setAvatar(safe ? bustCache(safe) : null);
      }
    } catch (error) {
      console.log('❌ Error cargando avatar:', error);
    }
  };

  const loadMyProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts();
      console.log('Response completa:', JSON.stringify(response, null, 2));
      console.log('User ID:', userData.id);
      
      const productsArray = Array.isArray(response) ? response : (response?.data || []);
      console.log('Products array length:', productsArray.length);
      
      console.log('🔍 userData.id:', userData?.id, 'tipo:', typeof userData?.id);
      
      const myProducts = productsArray.filter(p => {
        const productUserId = String(p.user_id || p.user?.id || '');
        const userDataId = String(userData?.id || '');
        const matches = productUserId === userDataId && productUserId !== '';
        return matches;
      });
      console.log('✅ Productos encontrados:', myProducts.length);
      setProducts(myProducts);
    } catch (error) {
      console.log('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    setProducts,
    loading,
    avatar,
    setAvatar,
    avatarRefresh,
    setAvatarRefresh,
    displayCity,
    setDisplayCity,
    loadAvatar,
  };
};
