import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { resolveApiBase } from '../../../service/api';

const IS_WEB = Platform.OS === 'web';

export const bustCache = (url) => {
  if (!url || typeof url !== 'string') return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}t=${Date.now()}`;
};

export const buildAvatarUrl = (uri) => {
  if (!uri) return null;
  if (typeof uri === 'string' && uri.startsWith('/storage/')) {
    return `${resolveApiBase()}${uri}`;
  }
  return uri;
};

export const getSafeAvatar = (uri) => {
  if (!uri) return null;
  // Normalize relative storage paths to absolute backend URL
  if (typeof uri === 'string' && uri.startsWith('/storage/')) {
    const base = resolveApiBase();
    return `${base}${uri}`;
  }
  if (IS_WEB && (uri.startsWith('file:') || uri.startsWith('blob:'))) {
    return null;
  }
  return uri;
};

export const clearAvatarForUser = async (userData) => {
  try {
    if (userData?.id) {
      const avatarKey = `userAvatar_${userData.id}`;
      await AsyncStorage.removeItem(avatarKey);
    }
    const stored = await AsyncStorage.getItem('userData');
    if (stored) {
      const parsed = JSON.parse(stored);
      delete parsed.avatar;
      await AsyncStorage.setItem('userData', JSON.stringify(parsed));
    }
  } catch (err) {
    console.log('⚠️ No se pudo limpiar avatar local:', err.message);
  }
};

export const getInitialCity = (userData) => {
  const candidate = userData.location || userData.city || '';
  if (typeof candidate === 'string' && candidate.includes('@')) return '';
  return candidate;
};

export const mockReviews = [
  { id: 1, userName: 'María López', rating: 5, comment: 'Excelente vendedor, muy rápido en la entrega', date: '15 nov.' },
  { id: 2, userName: 'Carlos Ruiz', rating: 5, comment: 'Todo perfecto, producto tal como se describe', date: '10 nov.' },
  { id: 3, userName: 'Ana García', rating: 4, comment: 'Buena experiencia de compra', date: '5 nov.' },
];
