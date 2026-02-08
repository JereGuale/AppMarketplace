import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Dimensions } from 'react-native';
import { resolveApiBase } from '../../../service/api';

const IS_WEB = Platform.OS === 'web';

export const CATEGORIES = [
  { id: '1', name: 'Kobord', color: '#1db8a6', icon: '🎧' },
  { id: '2', name: 'Moda', color: '#6cc04d', icon: '👕' },
  { id: '3', name: 'Tecnología', color: '#1db8a6', icon: '💻' },
  { id: '4', name: 'Carros', color: '#ffc107', icon: '🚗' },
  { id: '5', name: 'Hogar', color: '#2563eb', icon: '🏠' },
  { id: '6', name: 'Libros', color: '#6dd5ed', icon: '📚' },
];

const normalize = (text = '') =>
  text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();

export const getSafeAvatar = (uri) => {
  if (!uri) return null;
  if (typeof uri === 'string' && uri.startsWith('/storage/')) {
    const base = resolveApiBase();
    return `${base}${uri}`;
  }
  if (IS_WEB && (uri.startsWith('file:') || uri.startsWith('blob:'))) {
    return null;
  }
  return uri;
};

export const getProductSize = () => {
  const { width } = Dimensions.get('window');
  const IS_WEB = Platform.OS === 'web';
  const COLUMNS = IS_WEB
    ? (width >= 1600 ? 3 : width >= 1200 ? 3 : width >= 900 ? 2 : 2)
    : (width >= 1200 ? 4 : width >= 900 ? 3 : 2);
  const SPACING = IS_WEB ? 10 : 12;
  const PADDING = IS_WEB ? 16 : 16;
  const MAX_CARD_WIDTH = IS_WEB ? 420 : 280;
  
  return {
    COLUMNS,
    SPACING,
    PADDING,
    MAX_CARD_WIDTH,
    PRODUCT_SIZE: Math.min(
      (width - PADDING * 2 - SPACING * (COLUMNS - 1)) / COLUMNS,
      MAX_CARD_WIDTH
    ),
  };
};

export const filterProducts = (products, searchQuery, selectedCategory) => {
  const normSearch = normalize(searchQuery);
  const normSelected = normalize(selectedCategory);

  const synonyms = {
    tecnologia: ['tecnologia', 'tecnología', 'tech', 'technology', 'electronica', 'electrónica', 'gadgets'],
    carros: ['carros', 'coches', 'autos', 'automovil', 'automóvil', 'vehiculos', 'vehículos', 'car'],
    moda: ['moda', 'ropa', 'vestimenta', 'outfit'],
    hogar: ['hogar', 'casa', 'muebles', 'decoracion', 'decoración'],
    libros: ['libros', 'book', 'lectura'],
    kobord: ['kobord']
  };

  const matchesCategorySyn = (itemCat, tagsList) => {
    if (!normSelected) return true;
    const target = normSelected;
    const candidateList = synonyms[target] || [target];
    const haystack = [itemCat, ...tagsList];
    return haystack.some(h => candidateList.some(s => h.includes(s)));
  };

  return products.filter(item => {
    const nameField = item.name || item.title || '';
    const matchesSearch = normalize(nameField).includes(normSearch);

    const rawCat = item.category || item.category_name || '';
    const itemCat = normalize(rawCat);

    // Algunos productos traen tags/labels: intenta matchear también contra tags
    const tags = Array.isArray(item.tags) ? item.tags.map(t => normalize(t)) : [];

    const matchesCategory = matchesCategorySyn(itemCat, tags);

    return matchesSearch && matchesCategory;
  });
};

export const loadAvatarFromStorage = async (userData) => {
  try {
    if (userData?.id) {
      // Primero intenta cargar desde el servidor (userData.avatar)
      const serverAvatar = getSafeAvatar(userData.avatar);
      if (serverAvatar) {
        console.log('✅ Avatar cargado desde servidor:', userData.id);
        return serverAvatar;
      }
      
      // Fallback: buscar en AsyncStorage (por si estuviera guardado localmente)
      const avatarKey = `userAvatar_${userData.id}`;
      const savedAvatar = await AsyncStorage.getItem(avatarKey);
      if (savedAvatar) {
        console.log('🖼️ Avatar encontrado en almacenamiento local:', userData.id);
        return getSafeAvatar(savedAvatar);
      }
      
      console.log('⚠️ Sin avatar disponible para usuario:', userData.id);
      return null;
    }
    return getSafeAvatar(userData?.avatar) || null;
  } catch (error) {
    console.log('❌ Error cargando avatar en HomeScreen:', error);
    return null;
  }
};
