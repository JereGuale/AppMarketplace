import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const COLUMNS = width >= 1200 ? 4 : width >= 900 ? 3 : 2;
const SPACING = 12;
const PADDING = 16;
const MAX_CARD_WIDTH = 280;
const PRODUCT_SIZE = Math.min(
  (width - PADDING * 2 - SPACING * (COLUMNS - 1)) / COLUMNS,
  MAX_CARD_WIDTH
);

export default function ProductCard({ product, onPress, onToggleLike, isLiked }) {
  const firstImage = Array.isArray(product.images) && product.images.length > 0 
    ? product.images[0] 
    : (product.image || null);

  return (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Imagen */}
      <View style={styles.imageWrapper}>
        {firstImage ? (
          <Image 
            source={typeof firstImage === 'string' ? { uri: firstImage } : firstImage}
            style={styles.productImage}
            resizeMode="cover"
            onError={(error) => console.log('❌ Error cargando imagen:', error.nativeEvent.error)}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderIcon}>📦</Text>
          </View>
        )}
        
        {/* Badge precio */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>${product.price}</Text>
        </View>

        {/* Botón favorito */}
        <TouchableOpacity 
          style={styles.likeBtn}
          onPress={onToggleLike}
        >
          <Text style={styles.likeBtnIcon}>
            {isLiked ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {product.name || product.title}
        </Text>
        {product.user?.name && (
          <Text style={styles.productSeller} numberOfLines={1}>
            por {product.user.name}
          </Text>
        )}
        {product.location && (
          <Text style={styles.productLocation} numberOfLines={1}>
            {product.location}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  productCard: {
    width: PRODUCT_SIZE,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  imageWrapper: {
    width: '100%',
    height: PRODUCT_SIZE,
    backgroundColor: '#111827',
    position: 'relative',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2937',
  },
  placeholderIcon: {
    fontSize: 32,
    color: '#cbd5e1',
  },
  priceBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(17,24,39,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  priceBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  likeBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(17,24,39,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  likeBtnIcon: {
    fontSize: 16,
    color: '#fff',
  },
  productInfo: {
    padding: 10,
  },
  productTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 3,
    lineHeight: 16,
  },
  productSeller: {
    fontSize: 10,
    color: '#cbd5e1',
    marginBottom: 2,
    fontStyle: 'italic',
  },
  productLocation: {
    fontSize: 10,
    color: '#cbd5e1',
  },
});
