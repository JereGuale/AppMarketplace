import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateUserProfile, uploadAvatar as apiUploadAvatar } from '../../service/api';

import ProfileHeader from './components/ProfileHeader';
import AvatarCard from './components/AvatarCard';
import TabsContent from './components/TabsContent';
import EditProfileModal from './components/EditProfileModal';
import BottomNav from './components/BottomNav';
import { profileStyles } from './styles/profileStyles';
import { useProfileData } from './hooks/useProfileData';
import { clearAvatarForUser, bustCache, mockReviews } from './utils/profileHelpers';

const { width } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';
const noop = () => {};

export default function ProfileScreen({
  onLogout,
  onGoPublish,
  onGoHome,
  onGoMessages = noop,
  userData = {},
  userProducts = [],
  onUpdateAvatar,
  isVendorProfile = false,
  onSelectProduct,
}) {
  const {
    products,
    loading,
    avatar,
    setAvatar,
    avatarRefresh,
    setAvatarRefresh,
    displayCity,
    setDisplayCity,
    loadAvatar,
    setProducts,
  } = useProfileData(userData);

  const [activeTab, setActiveTab] = useState('ventas');
  const [editVisible, setEditVisible] = useState(false);
  const [newCity, setNewCity] = useState(displayCity);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  // Sincronizar newCity con displayCity cuando cambie
  React.useEffect(() => {
    setNewCity(displayCity);
  }, [displayCity]);

  const handleChangeAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    console.log('📷 Resultado del picker:', result);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newAvatar = result.assets[0].uri;
      console.log('🖼️ Nueva URI del avatar:', newAvatar);
      console.log('👤 ID del usuario:', userData.id);
      
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        if (userToken) {
          const response = await apiUploadAvatar(newAvatar, userToken);
          
          if (response && response.avatar) {
            console.log('✅ Avatar subido al servidor:', response.avatar);

            await clearAvatarForUser(userData);
            const finalUrl = bustCache(response.avatar);
            
            if (userData.id) {
              const avatarKey = `userAvatar_${userData.id}`;
              await AsyncStorage.setItem(avatarKey, finalUrl);
              
              const stored = await AsyncStorage.getItem('userData');
              const parsed = stored ? JSON.parse(stored) : {};
              parsed.avatar = finalUrl;
              await AsyncStorage.setItem('userData', JSON.stringify(parsed));
            }
            
            setAvatar(null);
            setAvatarRefresh(prev => prev + 1);
            setTimeout(() => {
              setAvatar(finalUrl);
            }, 50);
            
            if (typeof onUpdateAvatar === 'function') {
              onUpdateAvatar(finalUrl);
              console.log('✅ onUpdateAvatar llamado');
            }
            
            Alert.alert('Listo', 'Foto de perfil actualizada');
          } else {
            console.log('⚠️ Error subiendo avatar');
            Alert.alert('Error', 'No se pudo subir la foto');
          }
        }
      } catch (error) {
        console.log('❌ Error subiendo avatar:', error);
        Alert.alert('Error', 'No se pudo subir la foto');
      }
    }
  };

  const handleAvatarError = () => {
    console.log('⚠️ Avatar inválido, limpiando cache');
    clearAvatarForUser(userData);
  };

  const vendidos = products.filter(p => p.sold);
  const activos = products.filter(p => !p.sold);
  const tabData = activeTab === 'ventas' ? activos : vendidos;
  const { formatPrice } = require('../../service/priceUtils');
  const { getSafeAvatar } = require('./utils/profileHelpers');

  const { markProductSold } = require('../../service/api');

  const handleMarkSold = async (item) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      // Actualiza backend si hay endpoint, pero también actualiza UI localmente
      if (token && item.id) {
        markProductSold(item.id, token).catch(() => {});
      }
      // Mueve el producto a vendidos en el estado local
      const updated = products.map(p => p.id === item.id ? { ...p, sold: true } : p);
      setProducts(updated);
      // Cambia de pestaña para verlo en "Valoraciones" (vendidos)
      if (activeTab === 'ventas') {
        setActiveTab('valoraciones');
      }
      setTimeout(() => {
        setAvatarRefresh(prev => prev + 1);
      }, 10);
    } catch (err) {
      console.log('❌ Error marcando agotado:', err.message);
      Alert.alert('Error', 'No se pudo marcar como agotado');
    }
  };

  return (
    <SafeAreaView style={profileStyles.safe}>
      <EditProfileModal
        styles={profileStyles}
        visible={editVisible}
        saving={saving}
        newCity={newCity}
        setNewCity={setNewCity}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        onChangeAvatar={handleChangeAvatar}
        onClose={() => setEditVisible(false)}
        onSave={async () => {
          if (saving) return;
          if (newPassword && newPassword !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
          }
          setSaving(true);
          try {
            const payload = { city: newCity };
            if (newPassword) {
              payload.password = newPassword;
              payload.old_password = newPassword;
            }

            const userToken = await AsyncStorage.getItem('userToken');
            if (!userToken) {
              Alert.alert('Error', 'No hay sesión activa');
              setSaving(false);
              return;
            }

            const response = await updateUserProfile(payload, userToken);
            
            if (!response || response.message?.includes('Error') || response.message?.includes('error')) {
              Alert.alert('Error', response?.message || 'No se pudo actualizar el perfil');
              setSaving(false);
              return;
            }

            // Actualizar AsyncStorage con los nuevos datos
            if (userData?.id) {
              const stored = await AsyncStorage.getItem('userData');
              const parsed = stored ? JSON.parse(stored) : {};
              parsed.city = newCity;
              parsed.location = newCity;
              await AsyncStorage.setItem('userData', JSON.stringify(parsed));
              console.log('✅ Ciudad actualizada en AsyncStorage:', newCity);
            }
            
            // Actualizar el estado local
            setDisplayCity(newCity);
            console.log('✅ Ciudad actualizada en estado:', newCity);
            
            Alert.alert('✅ Listo', 'Perfil actualizado correctamente');
            setEditVisible(false);
            setNewPassword('');
            setConfirmPassword('');
          } catch (err) {
            console.error('Error actualizando perfil:', err);
            Alert.alert('Error', 'No se pudo guardar los cambios');
          } finally {
            setSaving(false);
          }
        }}
      />

      <ProfileHeader styles={profileStyles} isVendorProfile={isVendorProfile} onGoHome={onGoHome} />

      <ScrollView
        style={profileStyles.container}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <AvatarCard
          styles={profileStyles}
          avatarUri={getSafeAvatar(avatar) || getSafeAvatar(userData.avatar)}
          isVendorProfile={isVendorProfile}
          onPressAvatar={handleChangeAvatar}
          onAvatarError={handleAvatarError}
          userData={userData}
          displayCity={displayCity}
          activos={activos}
          vendidos={vendidos}
          onOpenEditProfile={() => setEditVisible(true)}
        />

        <TabsContent
          styles={profileStyles}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabData={tabData}
          reviews={mockReviews}
          onSelectProduct={onSelectProduct}
          formatPrice={formatPrice}
          onMarkSold={handleMarkSold}
        />

        <TouchableOpacity style={profileStyles.publishBtn} onPress={onGoPublish}>
          <Text style={profileStyles.publishBtnText}>+ Publicar nuevo artículo</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={profileStyles.logoutBtn}
          onPress={onLogout}
        >
          <Text style={profileStyles.logoutBtnText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      <BottomNav styles={profileStyles} onGoHome={onGoHome} onGoMessages={onGoMessages} />
    </SafeAreaView>
  );
}
