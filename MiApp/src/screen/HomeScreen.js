import React, { useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatPrice } from '../service/priceUtils';

import { homeStyles } from './home/styles/homeStyles';
import { useHomeData } from './home/hooks/useHomeData';
import { CATEGORIES, getSafeAvatar, getProductSize, filterProducts } from './home/utils/homeHelpers';

const { width } = Dimensions.get('window');
const { COLUMNS, SPACING, PADDING, PRODUCT_SIZE } = getProductSize();
const IS_TABLET = width >= 768;

export default function HomeScreen({ onLogout, onGoPublish, onGoProfile, onGoMessages, onGoHome, onProductSelect, onGoNotifications, userData = {} }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [likedProducts, setLikedProducts] = useState({});
  const scrollRef = React.useRef(null);

  const {
    products,
    loading,
    currentAvatar,
    unreadCount,
    searchPulse,
    featuredOffset,
    setFeaturedOffset,
  } = useHomeData(userData);

  const filteredProducts = filterProducts(products, searchQuery, selectedCategory);

  const toggleLike = (productId) => {
    setLikedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  return (
    <SafeAreaView style={homeStyles.safe}>
      <View style={homeStyles.header}>
        <Text style={homeStyles.logoText}>🛍️</Text>
        <View style={homeStyles.searchBox}>
          <Text style={homeStyles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Busca productos, marcas..."
            placeholderTextColor="#8b949e"
            style={homeStyles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={homeStyles.headerActions}>
          <TouchableOpacity onPress={onGoNotifications} style={homeStyles.messagesBtn}>
            <MaterialCommunityIcons name="bell-outline" size={22} color="#cbd5e1" />
            {unreadCount > 0 && (
              <View style={homeStyles.unreadBadge}>
                <Text style={homeStyles.unreadBadgeText} numberOfLines={1}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={onGoProfile} style={homeStyles.profileBtn}>
            {getSafeAvatar(currentAvatar) ? (
              <Image 
                source={{ uri: getSafeAvatar(currentAvatar) }} 
                style={homeStyles.profileAvatar}
                onError={(e) => console.log('❌ Error cargando avatar:', e.nativeEvent.error)}
                onLoad={() => console.log('✅ Avatar cargado')}
              />
            ) : (
              <View style={homeStyles.profilePlaceholder}>
                <MaterialCommunityIcons name="account" size={22} color="#cbd5e1" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={homeStyles.container}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={["#111826", "#0b1220"]} style={[homeStyles.heroBanner, IS_TABLET ? homeStyles.heroRow : homeStyles.heroCol]}>
          <Image 
            source={require('../../assets/carrito.jpg')}
            style={IS_TABLET ? homeStyles.heroBannerImage : homeStyles.heroBannerImageMobile}
            resizeMode="contain"
          />
          <View style={homeStyles.heroTextColumn}>
            <Text style={homeStyles.heroBadge}>Destacados</Text>
            <Text style={homeStyles.heroBannerTitle}>Encuentra lo que buscas</Text>
            <Text style={homeStyles.heroBannerSubtitle}>Descubre miles de productos a tu alrededor</Text>
            <View style={homeStyles.heroActions}>
              <TouchableOpacity style={homeStyles.heroPrimaryBtn} onPress={onGoPublish}>
                <Text style={homeStyles.heroPrimaryText}>Vender ahora</Text>
              </TouchableOpacity>
              <TouchableOpacity style={homeStyles.heroGhostBtn} onPress={() => {
                if (scrollRef.current) {
                  scrollRef.current.scrollTo({ y: featuredOffset, animated: true });
                }
              }}>
                <Text style={homeStyles.heroGhostText}>Explorar productos</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        <View style={homeStyles.sectionHeader} onLayout={e => setFeaturedOffset(e.nativeEvent.layout.y - 20)}>
          <Text style={homeStyles.sectionTitle}>Destacados</Text>
        </View>

        <View style={homeStyles.categoriesSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={homeStyles.categoriesContent}
          >
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(selectedCategory === cat.name ? '' : cat.name)}
                style={[
                  homeStyles.categoryTag,
                  selectedCategory === cat.name && { backgroundColor: cat.color, opacity: 1 }
                ]}
              >
                <View style={[homeStyles.categoryDot, { backgroundColor: cat.color }]} />
                <Text style={[
                  homeStyles.categoryTagText,
                  selectedCategory === cat.name && homeStyles.categoryTagTextActive
                ]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading && (
          <View style={homeStyles.loadingContainer}>
            <ActivityIndicator size="large" color="#13c1ac" />
            <Text style={homeStyles.loadingText}>Cargando productos...</Text>
          </View>
        )}

        {!loading && filteredProducts.length > 0 ? (
          <View style={homeStyles.productsGrid}>
            <FlatList
              data={filteredProducts}
              keyExtractor={(item, index) => item.id ? String(item.id) : `product-${index}`}
              numColumns={COLUMNS}
              columnWrapperStyle={homeStyles.row}
              scrollEnabled={false}
              renderItem={({item, index}) => (
                <TouchableOpacity 
                  style={[homeStyles.productCard, { width: PRODUCT_SIZE, height: PRODUCT_SIZE + 70 }]}
                  onPress={() => onProductSelect && onProductSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={[homeStyles.imageWrapper, { height: PRODUCT_SIZE }]}>
                    {(() => {
                      const firstImage = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : (item.image || null);
                      return firstImage ? (
                        <Image 
                          source={typeof firstImage === 'string' ? { uri: firstImage } : firstImage}
                          style={homeStyles.productImage}
                          resizeMode="cover"
                          onError={(error) => console.log('❌ Error cargando imagen:', error.nativeEvent.error)}
                        />
                      ) : (
                        <View style={homeStyles.imagePlaceholder}>
                          <Text style={homeStyles.placeholderIcon}>📦</Text>
                        </View>
                      );
                    })()}
                    
                    <View style={homeStyles.priceBadge}>
                      <Text style={homeStyles.priceBadgeText}>{formatPrice(item.price)}</Text>
                    </View>

                    <TouchableOpacity 
                      style={homeStyles.likeBtn}
                      onPress={() => toggleLike(item.id || index)}
                    >
                      <Text style={homeStyles.likeBtnIcon}>
                        {likedProducts[item.id || index] ? '❤️' : '🤍'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={homeStyles.productInfo}>
                    <Text style={homeStyles.productTitle} numberOfLines={2}>
                      {item.name || item.title}
                    </Text>
                    {item.user?.name && (
                      <Text style={homeStyles.productSeller} numberOfLines={1}>
                        por {item.user.name}
                      </Text>
                    )}
                    {item.location && (
                      <Text style={homeStyles.productLocation} numberOfLines={1}>
                        {item.location}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        ) : (
          <View style={homeStyles.emptyState}>
            <Text style={homeStyles.emptyIcon}>📦</Text>
            <Text style={homeStyles.emptyTitle}>Sin productos</Text>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      <View style={homeStyles.bottomNav}>
        <TouchableOpacity style={[homeStyles.navItem, homeStyles.navItemActive]} onPress={onGoHome}>
          <MaterialCommunityIcons name="home-variant" size={22} color="#6b7280" />
          <Text style={[homeStyles.navLabel, homeStyles.navLabelActive]}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={homeStyles.navItem} onPress={onGoMessages}>
          <MaterialCommunityIcons name="chat-outline" size={22} color="#6b7280" />
          <Text style={homeStyles.navLabel}>Mensajes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={homeStyles.navItem} onPress={onGoProfile}>
          <MaterialCommunityIcons name="account-circle" size={22} color="#6b7280" />
          <Text style={homeStyles.navLabel}>Perfil</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={homeStyles.fab} onPress={onGoPublish}>
        <Text style={homeStyles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
