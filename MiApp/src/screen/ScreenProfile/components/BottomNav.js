import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BottomNav({ styles, onGoHome, onGoMessages }) {
  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity style={styles.navItem} onPress={() => onGoHome && onGoHome()}>
        <MaterialCommunityIcons name="home-variant" size={22} color="#9ca3af" />
        <Text style={styles.navLabel}>Inicio</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.navItem} onPress={() => onGoMessages && onGoMessages()}>
          <MaterialCommunityIcons name="chat-outline" size={22} color="#9ca3af" />
        <Text style={styles.navLabel}>Mensajes</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
        <MaterialCommunityIcons name="account-circle" size={24} color="#cbd5e1" />
        <Text style={[styles.navLabel, styles.navLabelActive]}>Perfil</Text>
      </TouchableOpacity>
    </View>
  );
}
