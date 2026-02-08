// ProductDetailScreen - VERSIÓN ACTUALIZADA con lápices inline
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatPrice, renderStars } from '../service/priceUtils';
import { resolveApiBase } from '../service/api';

const { width, height } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';

export default function ProductDetailScreen({
  product,
  onBack,
  onOpenChat,
  onGoProfile,
  onEditProduct,
  onEditImages,
  onEditPricing,
  userData = {},
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [sellerAvatar, setSellerAvatar] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editType, setEditType] = useState('');
  const [editValue, setEditValue] = useState('');
  const [localProduct, setLocalProduct] = useState(product);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [localImages, setLocalImages] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const toFullUrl = (uri) => {
    if (!uri || uri === 'null') return null;
    if (typeof uri !== 'string') return uri;

    // Si es una URI local del dispositivo, retornarla tal cual
    if (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('blob:')) {
      return uri;
    }

    const normalized = uri.replace(/\\/g, '/');
    if (/^https?:\/\//i.test(normalized)) return normalized;

    const clean = normalized.replace(/^\//, '');
    if (clean.startsWith('storage/')) return `${resolveApiBase()}/${clean}`;
    if (clean.startsWith('avatars/')) return `${resolveApiBase()}/storage/${clean}`;
    if (clean.startsWith('public/')) return `${resolveApiBase()}/${clean}`;
    return `${resolveApiBase()}/${clean}`;
  };

  // Recalcular images cada vez que localProduct cambie
  const images = React.useMemo(() => {
    return (localProduct.images || (localProduct.image ? [localProduct.image] : []))
      .map(toFullUrl)
      .filter(Boolean);
  }, [localProduct.images, localProduct.image]);

  const isOwner = localProduct.user?.id === userData.id || localProduct.user_id === userData.id;
  
  // DEBUG
  console.log('🔍 ProductDetailScreen isOwner check:');
  console.log('   - userData.id:', userData.id);
  console.log('   - product.user?.id:', product.user?.id);
  console.log('   - product.user_id:', product.user_id);
  console.log('   - isOwner:', isOwner);

  const getSafeAvatar = (uri) => {
    if (!uri) return null;
    if (IS_WEB && (uri.startsWith('file:') || uri.startsWith('blob:'))) {
      return null;
    }
    return toFullUrl(uri);
  };

  useEffect(() => {
    loadSellerAvatar();
  }, [product.user?.id, product.user_id, product.user?.avatar]);

  useEffect(() => {
    setLocalProduct(product);
  }, [product]);

  const loadSellerAvatar = async () => {
    try {
      const sellerId = product.user?.id || product.user_id;
      const avatarCandidate =
        product.user?.avatar ||
        product.user?.avatar_url ||
        product.user?.profile_photo_url ||
        product.user?.photo;

      console.log('📸 AVATAR DEBUG ProductDetail:');
      console.log('   - sellerId:', sellerId);
      console.log('   - product.user:', JSON.stringify(product.user, null, 2));
      console.log('   - avatarCandidate RAW:', avatarCandidate);

      if (sellerId) {
        const avatarKey = `userAvatar_${sellerId}`;
        const savedAvatar = await AsyncStorage.getItem(avatarKey);
        console.log('   - savedAvatar from storage:', savedAvatar);
        const safeSaved = getSafeAvatar(savedAvatar);
        console.log('   - safeSaved after processing:', safeSaved);
        if (safeSaved) {
          setSellerAvatar(safeSaved);
          console.log('✅ Avatar del vendedor cargado desde storage:', safeSaved);
          return;
        }
      }

      const backendAvatar = getSafeAvatar(avatarCandidate);
      console.log('   - backendAvatar after processing:', backendAvatar);
      if (backendAvatar) {
        setSellerAvatar(backendAvatar);
        console.log('✅ Avatar del vendedor cargado desde backend:', backendAvatar);
      } else {
        console.log('❌ Avatar del vendedor: No se pudo cargar');
      }
    } catch (error) {
      console.log('Error cargando avatar del vendedor:', error);
    }
  };

  const handleOpenChat = () => {
    console.log('💬 Presionando botón de chat');
    console.log('onOpenChat type:', typeof onOpenChat);
    if (typeof onOpenChat === 'function') {
      console.log('✅ Llamando onOpenChat con producto:', product.id);
      onOpenChat(product);
    } else {
      console.log('❌ onOpenChat no es función');
    }
  };

  const handleDeleteProduct = () => {
    console.log('🗑️ Botón de eliminar presionado');
    console.log('📦 Producto a eliminar:', localProduct.id, localProduct.title);
    setShowDeleteModal(true);
  };

  const confirmDeleteProduct = async () => {
    try {
      console.log('🔄 Iniciando eliminación...');
      setIsDeleting(true);
      
      const userToken = await AsyncStorage.getItem('userToken');
      
      if (!userToken) {
        console.log('❌ No hay token de usuario');
        Alert.alert('Error', 'No estás autenticado');
        setIsDeleting(false);
        setShowDeleteModal(false);
        return;
      }

      const apiUrl = `${resolveApiBase()}/api/products/${localProduct.id}`;
      console.log('📡 Enviando DELETE a:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Respuesta recibida:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Producto eliminado exitosamente:', data);
        setIsDeleting(false);
        setShowDeleteModal(false);
        
        // Esperar un momento y volver
        setTimeout(() => {
          console.log('🔙 Volviendo a la pantalla anterior');
          onBack();
        }, 500);
      } else {
        const errorData = await response.json();
        console.log('❌ Error del servidor:', errorData);
        setIsDeleting(false);
        setShowDeleteModal(false);
        Alert.alert('Error', errorData.message || 'No se pudo eliminar la publicación');
      }
    } catch (error) {
      console.log('❌ Error de red o excepción:', error);
      setIsDeleting(false);
      setShowDeleteModal(false);
      Alert.alert('Error', 'No se pudo conectar con el servidor. Verifica tu conexión.');
    }
  };

  const handleEdit = async (type) => {
    console.log('🖊️ Abriendo modal de edición para:', type);
    setEditType(type);
    
    if (type === 'product') {
      setEditValue(localProduct.title || localProduct.name || '');
    } else if (type === 'pricing') {
      setEditValue(localProduct.price ? String(localProduct.price) : '');
    } else if (type === 'description') {
      setEditValue(localProduct.description || '');
    }
    
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    console.log('💾 Guardando:', editType, editValue);
    
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        Alert.alert('Error', 'No estás autenticado');
        return;
      }

      const apiBase = resolveApiBase();
      let updatedData = {};
      
      if (editType === 'product') {
        updatedData = { title: editValue.trim() };
      } else if (editType === 'pricing') {
        const priceValue = parseFloat(editValue);
        if (isNaN(priceValue)) {
          Alert.alert('Error', 'El precio debe ser un número válido');
          return;
        }
        updatedData = { price: priceValue };
      } else if (editType === 'description') {
        updatedData = { description: editValue.trim() };
      }

      console.log('🚀 Actualizando producto ID:', localProduct.id, updatedData);
      
      const response = await fetch(`${apiBase}/api/products/${localProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify(updatedData),
      });

      const data = await response.json();
      console.log('✅ Respuesta del servidor:', data);

      if (response.ok) {
        // Actualizar producto local
        const updated = { ...localProduct, ...updatedData };
        setLocalProduct(updated);
        
        Alert.alert('Éxito', 
          editType === 'product' ? 'Título actualizado' :
          editType === 'pricing' ? 'Precio actualizado' :
          'Descripción actualizada'
        );
      } else {
        Alert.alert('Error', data.message || 'No se pudo actualizar el producto');
      }
    } catch (error) {
      console.log('❌ Error actualizando producto:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    }
    
    setEditModalVisible(false);
    setEditValue('');
  };

  const getEditTitle = () => {
    if (editType === 'product') return 'Editar título';
    if (editType === 'pricing') return 'Editar precio';
    if (editType === 'description') return 'Editar descripción';
    return 'Editar';
  };

  const handleOpenImageManager = () => {
    console.log('🖼️ Abriendo gestor de imágenes');
    const currentImages = (localProduct.images || (localProduct.image ? [localProduct.image] : []))
      .map(toFullUrl)
      .filter(Boolean);
    console.log('📊 Imágenes cargadas en modal:', currentImages.length);
    setLocalImages(currentImages);
    setImageModalVisible(true);
  };

  const handleAddImages = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permiso denegado', 'Necesitas dar permiso para acceder a la galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        const updatedImages = [...localImages, ...newImages];
        setLocalImages(updatedImages);
        console.log('➕ Imágenes añadidas:', newImages.length);
        console.log('📊 Total imágenes ahora:', updatedImages.length);
        Alert.alert('✅ Éxito', `${newImages.length} imagen(es) añadida(s). Total: ${updatedImages.length}`);
      }
    } catch (error) {
      console.log('❌ Error seleccionando imágenes:', error);
      Alert.alert('Error', 'No se pudieron seleccionar las imágenes');
    }
  };

  const handleRemoveImage = (index) => {
    console.log('🗑️ Intentando eliminar imagen en índice:', index);
    console.log('📊 Total imágenes antes:', localImages.length);
    Alert.alert(
      'Eliminar imagen',
      '¿Estás seguro de que deseas eliminar esta imagen?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const updated = localImages.filter((_, i) => i !== index);
            setLocalImages(updated);
            console.log('✅ Imagen eliminada exitosamente');
            console.log('📊 Total imágenes después:', updated.length);
            Alert.alert('✅ Eliminada', `Imagen eliminada. Total: ${updated.length}`);
          },
        },
      ]
    );
  };

  const handleSaveImages = async () => {
    if (localImages.length === 0) {
      Alert.alert('Error', 'Debes tener al menos una imagen');
      return;
    }

    console.log('💾 Guardando imágenes...', localImages.length);
    console.log('🖼️ Imágenes a guardar:', localImages);
    
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        Alert.alert('Error', 'No hay sesión activa');
        return;
      }

      // Separar imágenes existentes del servidor vs nuevas imágenes locales (incluye blobs web)
      const existingImages = [];
      const newLocalImages = [];
      const newBlobImages = [];
      
      localImages.forEach(img => {
        if (typeof img !== 'string') return;

        // Si es una URL del servidor con storage/, extraer la ruta relativa
        if (img.includes('/storage/')) {
          const relativePath = img.split('/storage/')[1];
          console.log('📦 Imagen existente del servidor:', relativePath);
          existingImages.push(relativePath);
          return;
        }

        // Si es una ruta local de archivo en dispositivo
        if (img.startsWith('file://') || img.startsWith('content://')) {
          console.log('🆕 Imagen nueva local (device):', img.substring(0, 50));
          newLocalImages.push(img);
          return;
        }

        // Si es blob (web) guardarlo para convertirlo a File
        if (img.startsWith('blob:')) {
          console.log('🆕 Imagen nueva blob (web):', img.substring(0, 50));
          newBlobImages.push(img);
          return;
        }

        // Otro tipo de URL relativa (ej: "products/1/image.jpg")
        if (!img.startsWith('http://') && !img.startsWith('https://')) {
          console.log('📦 Imagen relativa:', img);
          existingImages.push(img);
        }
      });

      console.log('📦 Imágenes existentes:', existingImages.length);
      console.log('🆕 Imágenes nuevas (device):', newLocalImages.length);
      console.log('🆕 Imágenes nuevas (web/blob):', newBlobImages.length);

      // Crear FormData para subir las imágenes
      const formData = new FormData();

      // Agregar imágenes existentes como JSON
      formData.append('existing_images', JSON.stringify(existingImages));

      // Agregar nuevas imágenes desde dispositivo
      for (let i = 0; i < newLocalImages.length; i++) {
        const imageUri = newLocalImages[i];
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('new_images[]', {
          uri: imageUri,
          name: filename || `image_${i}.jpg`,
          type: type,
        });
      }

      // Agregar nuevas imágenes desde blob (web)
      if (IS_WEB && newBlobImages.length > 0) {
        const blobFiles = await Promise.all(newBlobImages.map(async (uri, idx) => {
          const res = await fetch(uri);
          const blob = await res.blob();
          const mime = blob.type || 'image/jpeg';
          const ext = mime.split('/')[1] || 'jpg';
          const name = `image_${Date.now()}_${idx}.${ext}`;
          return new File([blob], name, { type: mime });
        }));

        blobFiles.forEach((file) => {
          formData.append('new_images[]', file);
        });
      }

      console.log('📤 Enviando al servidor...');
      
      const response = await fetch(`${resolveApiBase()}/api/products/${localProduct.id}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          // NO incluir Content-Type para FormData, fetch lo hace automáticamente
        },
        body: formData,
      });

      const data = await response.json();
      console.log('📡 Respuesta del servidor:', data);

      if (response.ok && data.product) {
        // Actualizar el producto local con la respuesta del servidor
        console.log('✅ Producto actualizado desde servidor');
        setLocalProduct(data.product);
        Alert.alert('✅ Éxito', 'Imágenes actualizadas correctamente');
        setImageModalVisible(false);
      } else {
        console.log('⚠️ Error del servidor:', data.message || 'Error desconocido');
        Alert.alert('Error', data.message || 'No se pudieron guardar las imágenes');
      }
    } catch (error) {
      console.error('❌ Error guardando imágenes:', error);
      Alert.alert('Error', 'No se pudieron guardar las imágenes: ' + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0d1117" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>↗</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbText}>Inicio</Text>
          <Text style={styles.breadcrumbSeparator}> / </Text>
          <Text style={styles.breadcrumbText}>{localProduct.category || 'Categoría'}</Text>
          <Text style={styles.breadcrumbSeparator}> / </Text>
          <Text style={styles.breadcrumbText} numberOfLines={1}>{localProduct.title || localProduct.name}</Text>
        </View>

        {/* Contenedor principal - Imágenes arriba, info debajo */}
        <View style={styles.mainContent}>
          {/* Galería de imágenes */}
          <View style={styles.imageSection}>
            {images.length > 0 ? (
              <>
                <View style={styles.mainImageWrapper}>
                  <View style={styles.mainImageContainer}>
                    <Image
                      source={typeof images[currentImageIndex] === 'string' ? { uri: images[currentImageIndex] } : images[currentImageIndex]}
                      style={styles.mainImage}
                      resizeMode="contain"
                    />
                    {/* Indicador de foto */}
                    <View style={styles.imageCounter}>
                      <Text style={styles.imageCounterText}>
                        {currentImageIndex + 1}/{images.length}
                      </Text>
                    </View>
                    {/* Botón siguiente */}
                    {images.length > 1 && (
                      <TouchableOpacity 
                        style={styles.nextImageBtn}
                        onPress={() => setCurrentImageIndex((currentImageIndex + 1) % images.length)}
                      >
                        <Text style={styles.nextImageBtnText}>›</Text>
                      </TouchableOpacity>
                    )}
                    {/* Favorito o Editar imagen */}
                    {!isOwner && (
                      <TouchableOpacity style={styles.favoriteBtn}>
                        <Text style={styles.favoriteBtnText}>🤍</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Botón agregar imágenes - Solo para propietarios */}
                {isOwner && (
                  <View style={styles.addImageButtonContainer}>
                    <TouchableOpacity 
                      style={styles.addImageButtonCircle}
                      onPress={handleOpenImageManager}
                    >
                      <Text style={styles.addImageButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Thumbnails */}
                {images.length > 1 && (
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.thumbnails}
                    contentContainerStyle={styles.thumbnailsContent}
                  >
                    {images.map((img, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => setCurrentImageIndex(idx)}
                        style={[
                          styles.thumbnail,
                          currentImageIndex === idx && styles.thumbnailActive,
                        ]}
                      >
                        <Image
                          source={typeof img === 'string' ? { uri: img } : img}
                          style={styles.thumbnailImage}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </>
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderIcon}>📦</Text>
              </View>
            )}
          </View>

          {/* Panel derecho - Información */}
          <View style={styles.infoPanel}>
            {/* Título y precio */}
            <View style={styles.titleSection}>
              <View style={styles.editableRow}>
                {isOwner && (
                  <TouchableOpacity style={styles.leftEditBtn} onPress={() => {
                    console.log('🖊️ Editar título');
                    handleEdit('product');
                  }}>
                    <Text style={styles.leftEditIcon}>✎</Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.title}>{localProduct.title || localProduct.name}</Text>
              </View>
              <Text style={styles.condition}>Como nuevo • {localProduct.category || 'Categoría'} • Negro</Text>
              <View style={styles.editableRow}>
                {isOwner && (
                  <TouchableOpacity style={styles.leftEditBtn} onPress={() => {
                    console.log('🖊️ Editar precio');
                    handleEdit('pricing');
                  }}>
                    <Text style={styles.leftEditIcon}>✎</Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.price}>{formatPrice(localProduct.price)}</Text>
              </View>
            </View>

            {/* Botón Chat solo si NO es dueño */}
            {!isOwner && (
              <TouchableOpacity 
                style={styles.chatButton}
                onPress={handleOpenChat}
              >
                <Text style={styles.chatButtonText}>Chat</Text>
              </TouchableOpacity>
            )}

            {/* Card del vendedor */}
            <TouchableOpacity 
              style={styles.sellerCard}
              onPress={() => {
                console.log('👤 Ver perfil del vendedor:', product.user?.id);
                if (typeof onGoProfile === 'function' && product.user?.id) {
                  // Pasar el perfil del vendedor a la pantalla de perfil
                  onGoProfile(product.user);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.sellerInfo}>
                {sellerAvatar ? (
                  <Image
                    source={{ uri: sellerAvatar }}
                    style={styles.sellerAvatar}
                    onError={(e) => {
                      console.log('❌ Error cargando avatar del vendedor:', e.nativeEvent.error);
                    }}
                    onLoad={() => {
                      console.log('✅ Avatar del vendedor cargado correctamente');
                    }}
                  />
                ) : getSafeAvatar(product.user?.avatar) ? (
                  <Image
                    source={{ uri: getSafeAvatar(product.user?.avatar) }}
                    style={styles.sellerAvatar}
                  />
                ) : (
                  <View style={styles.sellerAvatarPlaceholder}>
                    <Text style={styles.sellerAvatarIcon}>👤</Text>
                  </View>
                )}
                <View style={styles.sellerDetails}>
                  <Text style={styles.sellerName}>{product.user?.name || 'Usuario'}</Text>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.ratingStars}>{renderStars(product.user?.rating || 5)}</Text>
                    <Text style={styles.ratingText}>{product.user?.rating || 5}.0</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {/* Descripción */}
            <View style={styles.descriptionSection}>
              <View style={styles.editableRow}>
                {isOwner && (
                  <TouchableOpacity style={styles.leftEditBtn} onPress={() => {
                    console.log('🖊️ Editar descripción');
                    handleEdit('description');
                  }}>
                    <Text style={styles.leftEditIcon}>✎</Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.descriptionTitle}>Descripción</Text>
              </View>
              <Text style={styles.description}>{localProduct.description || 'Sin descripción'}</Text>
            </View>

            {/* Botón eliminar solo para el dueño */}
            {isOwner && (
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={handleDeleteProduct}
                activeOpacity={0.8}
              >
                <View style={styles.deleteButtonContent}>
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                  <Text style={styles.deleteButtonText}>Eliminar publicación</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modal de edición */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{getEditTitle()}</Text>
            
            <TextInput
              style={[
                styles.modalInput,
                editType === 'description' && styles.modalInputMultiline
              ]}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={editType === 'product' ? 'Título del producto' : editType === 'pricing' ? 'Precio' : 'Descripción'}
              placeholderTextColor="#6b7280"
              multiline={editType === 'description'}
              numberOfLines={editType === 'description' ? 4 : 1}
              keyboardType={editType === 'pricing' ? 'numeric' : 'default'}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.modalButtonTextSave}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de gestión de imágenes */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.imageModalOverlay}>
          <View style={styles.imageModalContent}>
            <View style={styles.imageModalHeader}>
              <Text style={styles.imageModalTitle}>Gestionar imágenes</Text>
              <TouchableOpacity onPress={() => setImageModalVisible(false)}>
                <Text style={styles.imageModalClose}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.imageModalScroll}>
              <Text style={styles.imageCountInfo}>Total: {localImages.length} imágenes</Text>
              <View style={styles.imageGrid}>
                {localImages.map((img, index) => {
                  console.log(`📸 Renderizando imagen ${index}:`, img?.substring?.(0, 50));
                  
                  // Determinar la fuente de la imagen
                  let imageSource;
                  let isBlobUrl = false;
                  
                  if (typeof img === 'string') {
                    imageSource = { uri: img };
                    isBlobUrl = img.startsWith('blob:');
                  } else if (img?.uri) {
                    imageSource = { uri: img.uri };
                    isBlobUrl = img.uri.startsWith('blob:');
                  } else {
                    imageSource = img;
                  }
                  
                  return (
                    <View key={`img-${index}`} style={styles.imageGridItem}>
                      {IS_WEB && isBlobUrl ? (
                        // En web, usar img HTML nativo para blobs
                        <img 
                          src={imageSource.uri} 
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          alt={`Imagen ${index + 1}`}
                          onError={(e) => {
                            console.log(`❌ Error cargando imagen ${index}:`, e);
                          }}
                        />
                      ) : (
                        <Image 
                          source={imageSource} 
                          style={styles.imageGridImage}
                          resizeMode="cover"
                          onError={(e) => {
                            console.log(`❌ Error cargando imagen ${index}:`, e.nativeEvent.error);
                          }}
                        />
                      )}
                      <TouchableOpacity 
                        style={styles.imageRemoveBtn}
                        onPress={() => {
                          console.log('🔴🔴🔴 CLICK DETECTADO en X - índice:', index);
                          console.log('🔴 Total imágenes:', localImages.length);
                          const updated = localImages.filter((_, i) => i !== index);
                          console.log('🔴 Nuevas imágenes después de filtrar:', updated.length);
                          setLocalImages(updated);
                          Alert.alert('✅ Eliminada', `Imagen ${index + 1} eliminada. Total: ${updated.length}`);
                        }}
                        activeOpacity={0.6}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                      >
                        <Text style={styles.imageRemoveBtnText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
                
                {/* Botón para añadir más imágenes */}
                <TouchableOpacity 
                  style={styles.addImageGridItem}
                  onPress={handleAddImages}
                >
                  <Text style={styles.addImageIcon}>+</Text>
                  <Text style={styles.addImageText}>Añadir</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.imageModalFooter}>
              <TouchableOpacity 
                style={[styles.imageModalButton, styles.imageModalButtonCancel]}
                onPress={() => setImageModalVisible(false)}
              >
                <Text style={styles.imageModalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.imageModalButton, styles.imageModalButtonSave]}
                onPress={handleSaveImages}
              >
                <Text style={styles.imageModalButtonTextSave}>Guardar cambios</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !isDeleting && setShowDeleteModal(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="warning" size={48} color="#dc2626" />
            </View>
            
            <Text style={styles.deleteModalTitle}>Eliminar publicación</Text>
            <Text style={styles.deleteModalMessage}>
              ¿Estás seguro de que deseas eliminar "{localProduct.title || localProduct.name}"?
              {"\n\n"}
              Esta acción no se puede deshacer.
            </Text>
            
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.deleteModalCancelButton]}
                onPress={() => {
                  console.log('❌ Eliminación cancelada');
                  setShowDeleteModal(false);
                }}
                disabled={isDeleting}
              >
                <Text style={styles.deleteModalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.deleteModalConfirmButton]}
                onPress={confirmDeleteProduct}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.deleteModalConfirmText}>Eliminar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0d1117',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    backgroundColor: '#0f172a',
  },
  headerBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnText: {
    fontSize: 24,
    color: '#f8fafc',
    fontWeight: '300',
  },

  /* Breadcrumb */
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    backgroundColor: '#0d1117',
    display: 'none',
  },
  breadcrumbText: {
    fontSize: 12,
    color: '#7dd3fc',
    fontWeight: '500',
  },
  breadcrumbSeparator: {
    fontSize: 12,
    color: '#4b5563',
    marginHorizontal: 4,
  },

  /* Contenido principal */
  mainContent: {
    flexDirection: 'column',
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: 0,
    backgroundColor: '#0d1117',
  },

  /* Imagen */
  imageSection: {
    width: '100%',
    paddingHorizontal: 0,
    paddingVertical: 0,
    position: 'relative',
    overflow: 'visible',
  },
  mainImageWrapper: {
    width: '100%',
    aspectRatio: IS_WEB ? 0.95 : 1,
    maxHeight: IS_WEB ? 620 : undefined,
  },
  mainImageContainer: {
    backgroundColor: '#111827',
    borderRadius: 0,
    width: '100%',
    height: '100%',
    marginBottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Botón agregar imágenes */
  addImageButtonContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-end',
    backgroundColor: '#0d1117',
  },
  addImageButtonCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
  },
  addImageButtonText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
    lineHeight: 36,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#1f2937',
    borderRadius: 0,
    overflow: 'hidden',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 48,
  },
  imageCounter: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  nextImageBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextImageBtnText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '300',
  },
  favoriteBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  favoriteBtnText: {
    fontSize: 20,
  },
  thumbnails: {
    height: 50,
  },
  thumbnailsContent: {
    gap: 6,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
  },
  thumbnailActive: {
    borderColor: '#7dd3fc',
    borderWidth: 2,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },

  /* Panel info */
  infoPanel: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#0d1117',
    justifyContent: 'flex-start',
  },
  titleSection: {
    marginBottom: 16,
  },
  editableRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftEditBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginRight: 8,
  },
  leftEditIcon: {
    fontSize: 18,
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 12,
    color: '#f8fafc',
    fontSize: 16,
    marginBottom: 20,
  },
  modalInputMultiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#374151',
  },
  modalButtonSave: {
    backgroundColor: '#3b82f6',
  },
  modalButtonTextCancel: {
    color: '#d1d5db',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextSave: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  imageModalContent: {
    backgroundColor: '#1f2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    borderTopWidth: 1,
    borderColor: '#374151',
  },
  imageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  imageModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  imageModalClose: {
    fontSize: 36,
    color: '#9ca3af',
    fontWeight: '300',
  },
  imageModalScroll: {
    flex: 1,
    padding: 16,
  },
  imageCountInfo: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageGridItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#111827',
  },
  imageGridImage: {
    width: '100%',
    height: '100%',
  },
  imageRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  imageRemoveBtnText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 24,
  },
  addImageGridItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#374151',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  addImageIcon: {
    fontSize: 36,
    color: '#3b82f6',
    marginBottom: 4,
  },
  addImageText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
  },
  imageModalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  imageModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  imageModalButtonCancel: {
    backgroundColor: '#374151',
  },
  imageModalButtonSave: {
    backgroundColor: '#3b82f6',
  },
  imageModalButtonTextCancel: {
    color: '#d1d5db',
    fontSize: 16,
    fontWeight: '600',
  },
  imageModalButtonTextSave: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    flex: 1,
    lineHeight: 28,
  },
  condition: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0084ff',
    marginBottom: 16,
  },

  /* Chat Button */
  chatButton: {
    backgroundColor: '#0084ff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  chatButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  /* Delete Button */
  deleteButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 12,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },

  /* Delete Modal */
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalContent: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  deleteModalHeader: {
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteModalMessage: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  deleteModalCancelButton: {
    backgroundColor: '#374151',
  },
  deleteModalConfirmButton: {
    backgroundColor: '#dc2626',
  },
  deleteModalCancelText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  deleteModalConfirmText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  /* Seller Card */
  sellerCard: {
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#111827',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  sellerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sellerAvatarIcon: {
    fontSize: 24,
    color: '#6b7280',
  },
  sellerAvatarIcon: {
    fontSize: 20,
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingStars: {
    fontSize: 12,
  },
  ratingText: {
    fontSize: 11,
    color: '#fbbf24',
    fontWeight: '600',
  },

  /* Description */
  descriptionSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  description: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
  },

  /* Message Modal */
  messageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  messageModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  messageModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  messageModalClose: {
    fontSize: 24,
    color: '#999',
  },
  messageModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  messageProduct: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  messageProductImage: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginRight: 10,
  },
  messageProductInfo: {
    flex: 1,
  },
  messageProductTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  messageProductPrice: {
    fontSize: 12,
    color: '#E94560',
    fontWeight: '700',
    marginTop: 2,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#333',
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  messageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  messageCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    alignItems: 'center',
  },
  messageCancelBtnText: {
    color: '#666',
    fontWeight: '700',
    fontSize: 14,
  },
  messageSendBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#13c1ac',
    alignItems: 'center',
  },
  messageSendBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
