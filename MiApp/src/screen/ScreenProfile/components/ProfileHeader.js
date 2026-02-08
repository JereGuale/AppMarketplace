import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function ProfileHeader({ styles, isVendorProfile, onGoHome }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => onGoHome && onGoHome()}>
        <Text style={styles.backBtn}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{isVendorProfile ? 'Perfil del Vendedor' : 'Mi perfil'}</Text>
      <View style={{ width: 24 }} />
    </View>
  );
}
