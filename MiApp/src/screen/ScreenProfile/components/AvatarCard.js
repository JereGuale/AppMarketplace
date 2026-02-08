import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';

export default function AvatarCard({
  styles,
  avatarUri,
  isVendorProfile,
  onPressAvatar,
  onAvatarError,
  userData,
  displayCity,
  activos = [],
  vendidos = [],
  onOpenEditProfile,
}) {
  return (
    <View style={styles.profileSection}>
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={isVendorProfile ? null : onPressAvatar}
        disabled={isVendorProfile}
      >
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatar}
            onError={onAvatarError}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
        )}
        {!isVendorProfile && (
          <View style={styles.editAvatarBadge}>
            <Text style={styles.editAvatarIcon}>📷</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.userName}>{userData.name || 'Usuario'}</Text>
      <Text style={styles.userStatus}>Vendedor</Text>
      <Text style={styles.userLocation}>
        {displayCity || userData.location || userData.city || 'Ubicación no especificada'}
      </Text>

      {!isVendorProfile && (
        <TouchableOpacity style={styles.editProfileBtn} onPress={onOpenEditProfile}>
          <Text style={styles.editProfileBtnText}>Editar perfil</Text>
        </TouchableOpacity>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{activos.length}</Text>
          <Text style={styles.statLabel}>Activas</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{vendidos.length}</Text>
          <Text style={styles.statLabel}>Vendidas</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>4.8</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>
    </View>
  );
}
