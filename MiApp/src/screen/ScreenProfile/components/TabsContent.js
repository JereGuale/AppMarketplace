import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Image } from 'react-native';

export default function TabsContent({
  styles,
  activeTab,
  setActiveTab,
  tabData = [],
  reviews = [],
  onSelectProduct,
  formatPrice,
  onMarkSold,
}) {
  return (
    <>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ventas' && styles.tabActive]}
          onPress={() => setActiveTab('ventas')}
        >
          <Text style={[styles.tabText, activeTab === 'ventas' && styles.tabTextActive]}>
            Ventas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'valoraciones' && styles.tabActive]}
          onPress={() => setActiveTab('valoraciones')}
        >
          <Text style={[styles.tabText, activeTab === 'valoraciones' && styles.tabTextActive]}>
            Valoraciones
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContent}>
        {activeTab === 'ventas' ? (
          tabData.length > 0 ? (
            <FlatList
              data={tabData}
              keyExtractor={(item, idx) => (item.id ? String(item.id) : `product-${idx}`)}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.productItem}
                  onPress={() => onSelectProduct && onSelectProduct(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.productItemImage}>
                    {item.images && item.images.length > 0 ? (
                      <Image
                        source={{ uri: item.images[0] }}
                        style={styles.productItemImageContent}
                        resizeMode="cover"
                      />
                    ) : item.image ? (
                      <Image
                        source={typeof item.image === 'string' ? { uri: item.image } : item.image}
                        style={styles.productItemImageContent}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Text style={styles.placeholderIcon}>📦</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.productItemInfo}>
                    <Text style={styles.productItemTitle} numberOfLines={1}>
                      {item.name || item.title}
                    </Text>
                    <Text style={styles.productItemDate}>
                      {activeTab === 'ventas' ? 'Publicado recientemente' : 'Vendido el 20 abr.'}
                    </Text>
                  </View>
                  <View style={styles.productItemRight}>
                    <Text style={styles.productItemPrice}>{formatPrice(item.price)}</Text>
                    {activeTab === 'ventas' && (
                      <TouchableOpacity
                        style={styles.markSoldBtn}
                        onPress={() => onMarkSold && onMarkSold(item)}
                      >
                        <Text style={styles.markSoldBtnText}>Marcar como agotado</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.emptyTab}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>Sin ventas activas</Text>
            </View>
          )
        ) : reviews.length > 0 ? (
          <FlatList
            data={reviews}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>{item.userName.charAt(0)}</Text>
                  </View>
                  <View style={styles.reviewInfo}>
                    <Text style={styles.reviewUserName}>{item.userName}</Text>
                    <View style={styles.reviewStars}>
                      {[...Array(5)].map((_, i) => (
                        <Text key={i} style={styles.star}>
                          {i < item.rating ? '⭐' : '☆'}
                        </Text>
                      ))}
                      <Text style={styles.reviewDate}> • {item.date}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewComment}>{item.comment}</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.emptyTab}>
            <Text style={styles.emptyIcon}>⭐</Text>
            <Text style={styles.emptyText}>Sin valoraciones aún</Text>
          </View>
        )}
      </View>
    </>
  );
}
