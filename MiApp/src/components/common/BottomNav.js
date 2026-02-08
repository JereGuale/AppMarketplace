import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BottomNav({ activeTab, onNavigate }) {
  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => onNavigate('home')}
      >
        <MaterialCommunityIcons
          name="home-variant"
          size={22}
          color={activeTab === 'home' ? '#cbd5e1' : '#94a3b8'}
          style={styles.navIcon}
        />
        <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>Inicio</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => onNavigate('messages')}
      >
        <MaterialCommunityIcons
          name="message-outline"
          size={22}
          color={activeTab === 'messages' ? '#cbd5e1' : '#94a3b8'}
          style={styles.navIcon}
        />
        <Text style={styles.navLabel}>Mensajes</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => onNavigate('profile')}
      >
        <MaterialCommunityIcons
          name="account-circle"
          size={24}
          color={activeTab === 'profile' ? '#cbd5e1' : '#94a3b8'}
          style={styles.navIcon}
        />
        <Text style={[styles.navLabel, activeTab === 'profile' && styles.navLabelActive]}>Perfil</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    paddingBottom: Platform.OS === 'ios' ? 10 : 6,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 20,
    gap: 4,
  },
  navIcon: {
    fontSize: 24,
    color: '#94a3b8',
    fontWeight: '400',
  },
  navIconActive: {
    color: '#cbd5e1',
    fontWeight: '400',
  },
  navLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#cbd5e1',
  },
});
