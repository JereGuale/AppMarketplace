import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { postJson } from '../service/api';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: '1', name: 'Electrónica', icon: '💻' },
  { id: '2', name: 'Vehículos', icon: '🚗' },
  { id: '3', name: 'Alquileres', icon: '🏠' },
  { id: '4', name: 'Equipaje y Bolsos', icon: '👜' },
  { id: '5', name: 'Moda', icon: '👕' },
  { id: '6', name: 'Hogar', icon: '🛋️' },
  { id: '7', name: 'Deporte', icon: '⚽' },
  { id: '8', name: 'Libros', icon: '📚' },
];

export default function PublishScreen({ onBack, onPublish }) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const isPublishing = useRef(false);
  const isGettingLocation = useRef(false);

  async function pickImage() {
    if (images.length >= 6) {
      Alert.alert('Límite alcanzado', 'Puedes subir máximo 6 fotos');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages([...images, result.assets[0].uri]);
    }
  }

  function removeImage(index) {
    setImages(images.filter((_, i) => i !== index));
  }

  async function getLocation() {
    // Prevenir múltiples solicitudes de ubicación
    if (isGettingLocation.current) {
      console.log('⚠️ Ya se está obteniendo la ubicación, ignorando click...');
      return;
    }

    try {
      isGettingLocation.current = true;
      setLoadingLocation(true);
      setError('');
      
      console.log('📍 Solicitando permiso de ubicación...');
      let { status } = await Location.requestForegroundPermissionsAsync();
      console.log('📍 Estatus de permiso:', status);
      
      if (status !== 'granted') {
        setError('Permiso de ubicación denegado. Por favor, habilítalo en configuración.');
        setLoadingLocation(false);
        isGettingLocation.current = false;
        return;
      }

      console.log('📍 Obteniendo posición actual...');
      let position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeoutMs: 10000,
      });
      
      console.log('📍 Posición obtenida:', position.coords);
      let { coords } = position;
      
      // Intentar con expo-location primero
      try {
        console.log('📍 Intentando geocódigo inverso con expo-location...');
        let reverseGeo = await Location.reverseGeocodeAsync({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });

        console.log('📍 Resultado del geocódigo:', reverseGeo);
        
        if (reverseGeo && reverseGeo.length > 0) {
          const geo = reverseGeo[0];
          const city = geo.city || geo.name || geo.street || '';
          const country = geo.country || '';
          const region = geo.region || geo.district || '';
          
          let locationText = '';
          
          // Construir la ubicación de forma inteligente
          if (city) locationText = city;
          if (region && region !== city) locationText += (locationText ? ', ' : '') + region;
          if (country && country !== region && country !== city) locationText += (locationText ? ', ' : '') + country;
          
          if (!locationText) {
            locationText = `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
          }
          
          if (locationText.trim()) {
            console.log('📍 Ubicación final (expo):', locationText);
            setLocation(locationText);
            setError('');
            return;
          }
        }
      } catch (geoErr) {
        console.warn('⚠️ Geocódigo inverso de expo falló:', geoErr.message);
      }

      // Fallback: usar Nominatim (OpenStreetMap) API
      try {
        console.log('📍 Intentando geocódigo inverso con Nominatim...');
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10&addressdetails=1`;
        const response = await fetch(nominatimUrl, { timeout: 8000 });
        const data = await response.json();
        
        console.log('📍 Resultado de Nominatim:', data);
        
        if (data && data.address) {
          const addr = data.address;
          let locationText = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
          
          if (addr.state && addr.state !== locationText) {
            locationText += (locationText ? ', ' : '') + addr.state;
          }
          if (addr.country && addr.country !== addr.state && addr.country !== locationText) {
            locationText += (locationText ? ', ' : '') + addr.country;
          }
          
          if (!locationText) {
            locationText = `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
          }
          
          console.log('📍 Ubicación final (Nominatim):', locationText);
          setLocation(locationText);
          setError('');
        } else {
          throw new Error('Sin datos de Nominatim');
        }
      } catch (nominatimErr) {
        console.warn('⚠️ Nominatim también falló:', nominatimErr.message);
        // Fallback final: coordenadas con mensaje
        const fallbackLocation = `Ubicación: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
        console.log('📍 Usando fallback:', fallbackLocation);
        setLocation(fallbackLocation);
        setError('');
      }
    } catch (err) {
      console.error('❌ Error de ubicación:', err);
      setError('No se pudo obtener la ubicación. Por favor ingresa tu ubicación manualmente.');
    } finally {
      setLoadingLocation(false);
      isGettingLocation.current = false;
    }
  }

  async function handlePublish() {
    // Prevenir múltiples publicaciones
    if (isPublishing.current) {
      console.log('⚠️ Ya se está publicando, ignorando click...');
      return;
    }

    if (!title.trim() || !price || !description.trim() || images.length === 0 || !category) {
      setError('Completa el nombre, precio, detalles, categoría y sube al menos una foto.');
      return;
    }

    if (isNaN(price) || parseFloat(price) <= 0) {
      setError('El precio debe ser un número válido mayor a 0.');
      return;
    }

    setError('');
    setLoading(true);
    isPublishing.current = true;

    try {
      // Obtener token
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setError('Sesión expirada. Por favor inicia sesión nuevamente.');
        setLoading(false);
        return;
      }

      // Convertir imágenes a base64
      const base64Images = [];
      for (let i = 0; i < images.length; i++) {
        const response = await fetch(images[i]);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        const base64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
        });
        base64Images.push(base64);
      }

      // Enviar al servidor
      const categoryName = CATEGORIES.find(c => c.id === category)?.name || 'General';
      const productData = {
        title: title.trim(),
        price: parseFloat(price),
        description: description.trim(),
        location: location.trim() || 'No especificada',
        category: categoryName,
        images: base64Images,
      };

      const response = await postJson('/api/products', productData, token);
      
      if (response && response.id) {
        setSuccess('¡Producto publicado exitosamente!');
        
        if (typeof onPublish === 'function') {
          onPublish({
            ...response,
            images: images,
          });
        }

        setTimeout(() => {
          setSuccess('');
          setTitle('');
          setPrice('');
          setDescription('');
          setLocation('');
          setCategory('');
          setImages([]);
          setError('');
          onBack();
        }, 1500);
      } else {
        setError('Error al publicar el producto');
      }
    } catch (err) {
      console.log('Error:', err);
      setError('Error al publicar. Intenta nuevamente.');
    } finally {
      setLoading(false);
      isPublishing.current = false;
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0d1117" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.headerClose}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vende tu producto</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>✓ {success}</Text>
          </View>
        ) : null}

        {/* Top Row: Fotos (Left) + Nombre/Detalles (Right) */}
        <View style={styles.topRow}>
          {/* Fotos Section - Left */}
          <View style={styles.leftColumn}>
            <Text style={styles.sectionLabel}>Fotos</Text>

            <View style={styles.imagesContainer}>
            {images.map((img, index) => (
              <View key={index} style={styles.imageItem}>
                <Image source={{ uri: img }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeImage(index)}
                >
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            {images.length < 6 && (
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                <Text style={styles.addIcon}>+</Text>
                <Text style={styles.addText}>Añadir imagen</Text>
              </TouchableOpacity>
            )}
          </View>
          </View>

          {/* Right Column: Nombre/Detalles */}
          <View style={styles.rightColumn}>
            {/* Nombre Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Nombre</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: iPhone 13 Pro"
                placeholderTextColor="#666"
                value={title}
                onChangeText={setTitle}
                maxLength={60}
              />
            </View>

            {/* Categoría Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Categoría</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesContainer}
              >
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryBtn,
                      category === cat.id && styles.categoryBtnActive
                    ]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    <Text style={[
                      styles.categoryName,
                      category === cat.id && styles.categoryNameActive
                    ]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Detalles Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Detalles</Text>
              <TextInput
                style={[styles.input, styles.detailsInput]}
                placeholder="Describe el producto, estado..."
                placeholderTextColor="#666"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Precio Section - Full Width */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Precio</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="0.00"
              placeholderTextColor="#666"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Ubicación Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Ubicación (Opcional)</Text>
          <View style={styles.locationContainer}>
            <TextInput
              style={styles.locationInput}
              placeholder="Ingresa tu ubicación"
              placeholderTextColor="#666"
              value={location}
              onChangeText={setLocation}
            />
            <TouchableOpacity
              style={styles.locationBtn}
              onPress={getLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color="#13c1ac" />
              ) : (
                <Text style={styles.locationIcon}>📍</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.publishBtn, (loading || isPublishing.current) && styles.publishBtnDisabled]}
          onPress={handlePublish}
          disabled={loading || isPublishing.current}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.publishBtnText}>Publicar</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0d1117',
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  headerClose: {
    fontSize: 24,
    color: '#8b949e',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e6edf3',
  },

  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  /* Top Row Layout */
  topRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  leftColumn: {
    flex: 0.4,
  },
  rightColumn: {
    flex: 0.6,
  },

  /* Alert Messages */
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#E94560',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 16,
  },
  errorText: {
    color: '#E94560',
    fontWeight: '600',
    fontSize: 13,
  },
  successBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 16,
  },
  successText: {
    color: '#22c55e',
    fontWeight: '600',
    fontSize: 13,
  },

  /* Sections */
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e6edf3',
    marginBottom: 10,
  },

  /* Fotos */
  imagesContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  imageItem: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#111827',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addImageBtn: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    backgroundColor: '#111827',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#30363d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    fontSize: 48,
    color: '#8b949e',
    marginBottom: 8,
  },
  addText: {
    fontSize: 13,
    color: '#8b949e',
    fontWeight: '600',
  },

  /* Inputs */
  input: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#e6edf3',
  },
  detailsInput: {
    height: 150,
    textAlignVertical: 'top',
    paddingTop: 12,
  },

  /* Precio */
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 8,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E94560',
    paddingLeft: 14,
  },
  priceInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 14,
    color: '#e6edf3',
  },

  /* Categorías */
  categoriesContainer: {
    marginVertical: 8,
  },
  categoryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 8,
    minWidth: 80,
  },
  categoryBtnActive: {
    backgroundColor: '#0084ff',
    borderColor: '#0084ff',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 11,
    color: '#8b949e',
    fontWeight: '500',
    textAlign: 'center',
  },
  categoryNameActive: {
    color: '#ffffff',
    fontWeight: '600',
  },

  /* Ubicación */
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationInput: {
    flex: 1,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#e6edf3',
  },
  locationBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationIcon: {
    fontSize: 20,
  },

  /* Footer */
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#0d1117',
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  publishBtn: {
    backgroundColor: '#E94560',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishBtnDisabled: {
    opacity: 0.6,
  },
  publishBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
