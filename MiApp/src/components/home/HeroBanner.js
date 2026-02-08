import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const IS_TABLET = width >= 768;

export default function HeroBanner({ onPublish, onExplore }) {
  return (
    <LinearGradient 
      colors={["#111826", "#0b1220"]} 
      style={[styles.heroBanner, IS_TABLET ? styles.heroRow : styles.heroCol]}
    >
      <Image 
        source={require('../../../assets/carrito.jpg')}
        style={IS_TABLET ? styles.heroBannerImage : styles.heroBannerImageMobile}
        resizeMode="contain"
      />
      <View style={styles.heroTextColumn}>
        <Text style={styles.heroBadge}>Destacados</Text>
        <Text style={styles.heroBannerTitle}>Encuentra lo que buscas</Text>
        <Text style={styles.heroBannerSubtitle}>Descubre miles de productos a tu alrededor</Text>
        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.heroPrimaryBtn} onPress={onPublish}>
            <Text style={styles.heroPrimaryText}>Vender ahora</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.heroGhostBtn} onPress={onExplore}>
            <Text style={styles.heroGhostText}>Explorar productos</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  heroBanner: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    padding: IS_TABLET ? 28 : 16,
    marginHorizontal: IS_TABLET ? 16 : 12,
    marginTop: 12,
    marginBottom: 20,
    minHeight: IS_TABLET ? 220 : 'auto',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#22304a',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  heroCol: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  heroTextColumn: {
    flex: 1,
    paddingLeft: IS_TABLET ? 12 : 0,
    gap: 8,
    alignItems: IS_TABLET ? 'flex-start' : 'center',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#111827',
    color: '#7dd3fc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: '#1d4ed8',
  },
  heroBannerTitle: {
    fontSize: IS_TABLET ? 32 : 20,
    fontWeight: '900',
    color: '#f8fafc',
    marginBottom: 4,
    letterSpacing: -0.4,
    textAlign: IS_TABLET ? 'left' : 'center',
    maxWidth: IS_TABLET ? '100%' : 220,
  },
  heroBannerSubtitle: {
    fontSize: IS_TABLET ? 16 : 12,
    color: '#e2e8f0',
    marginBottom: 18,
    lineHeight: IS_TABLET ? 22 : 18,
    textAlign: IS_TABLET ? 'left' : 'center',
    maxWidth: IS_TABLET ? '100%' : 220,
  },
  heroActions: {
    flexDirection: IS_TABLET ? 'row' : 'column',
    alignItems: 'center',
    gap: 10,
    width: IS_TABLET ? 'auto' : '100%',
  },
  heroPrimaryBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: IS_TABLET ? 26 : 20,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 10,
    minWidth: IS_TABLET ? 'auto' : 160,
    alignItems: 'center',
  },
  heroPrimaryText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  heroGhostBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: IS_TABLET ? 20 : 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    minWidth: IS_TABLET ? 'auto' : 160,
    alignItems: 'center',
  },
  heroGhostText: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 12,
  },
  heroBannerImage: {
    width: 180,
    height: 180,
    borderRadius: 14,
    marginRight: 16,
  },
  heroBannerImageMobile: {
    width: 120,
    height: 120,
    borderRadius: 14,
    marginBottom: 8,
  },
});
