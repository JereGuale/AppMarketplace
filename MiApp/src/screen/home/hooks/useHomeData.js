import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProducts, getNotifications } from '../../../service/api';
import { loadAvatarFromStorage } from '../utils/homeHelpers';

export const useHomeData = (userData) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentAvatar, setCurrentAvatar] = useState(userData.avatar);
  const [unreadCount, setUnreadCount] = useState(0);
  const searchPulse = useRef(new Animated.Value(1)).current;
  const [featuredOffset, setFeaturedOffset] = useState(0);

  useEffect(() => {
    loadProducts();
    loadAvatar();
    loadUnreadCount();
    Animated.loop(
      Animated.sequence([
        Animated.timing(searchPulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(searchPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  useEffect(() => {
    loadAvatar();
    loadUnreadCount();
  }, [userData.id, userData.avatar]);

  const loadAvatar = async () => {
    const avatar = await loadAvatarFromStorage(userData);
    setCurrentAvatar(avatar);
  };

  const loadUnreadCount = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        setUnreadCount(0);
        return;
      }
      
      const notifications = await getNotifications(userToken);
      if (notifications && Array.isArray(notifications)) {
        const unread = notifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.log('❌ Error cargando no leídos:', error);
      setUnreadCount(0);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      if (data && Array.isArray(data)) {
        setProducts(data);
      } else if (data && data.data && Array.isArray(data.data)) {
        setProducts(data.data);
      }
    } catch (err) {
      console.log('Error cargando productos:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    currentAvatar,
    unreadCount,
    searchPulse,
    featuredOffset,
    setFeaturedOffset,
  };
};
