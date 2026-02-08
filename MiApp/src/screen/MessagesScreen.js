import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getConversations, resolveApiBase } from '../service/api';

const IS_WEB = Platform.OS === 'web';
const CACHE_KEY = 'cached_conversations';
const HIDDEN_KEY = 'hidden_conversations';

export default function MessagesScreen({ onBack, onOpenChat, userData = {}, refreshKey = 0 }) {
  console.log('💬 MessagesScreen renderizado');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const getSafeAvatar = (uri) => {
    if (!uri) return null;
    if (typeof uri === 'string' && uri.startsWith('/storage/')) {
      const base = resolveApiBase();
      return `${base}${uri}`;
    }
    if (IS_WEB && (uri.startsWith('file:') || uri.startsWith('blob:'))) {
      return null;
    }
    return uri;
  };

  useEffect(() => {
    console.log('🔄 MessagesScreen useEffect llamado');
    loadConversations();
  }, []);

  // Vuelve a cargar la lista cuando cambie refreshKey (ej: al enviar mensaje)
  useEffect(() => {
    if (refreshKey > 0) {
      console.log('🔄 Refrescando conversaciones...');
      loadConversations();
    }
  }, [refreshKey]);

  const loadConversations = async () => {
    console.log('🔍 Cargando conversaciones (cache + API)...');
    try {
      setLoading(true);
      
      const hiddenRaw = await AsyncStorage.getItem(HIDDEN_KEY);
      const hiddenIds = hiddenRaw ? JSON.parse(hiddenRaw) : [];

      // Intentar cargar desde cache primero
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) || [];
          const filtered = parsed.filter(c => !hiddenIds.includes(c.id));
          setConversations(filtered);
          console.log('📦 Conversaciones desde caché:', filtered.length);
        } catch (e) {
          console.log('⚠️ Error parseando caché:', e);
          await AsyncStorage.removeItem(CACHE_KEY);
        }
      }

      // Verificar token antes de hacer llamada
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        console.log('⚠️ No hay token de usuario');
        setConversations([]);
        await AsyncStorage.removeItem(CACHE_KEY);
        setLoading(false);
        return;
      }

      // Obtener datos frescos del servidor
      const data = await getConversations(userToken);
      console.log('📂 Conversaciones recibidas del servidor:', data);
      console.log('📊 Tipo de datos:', typeof data, 'Es array:', Array.isArray(data));
      console.log('📊 Cantidad:', data ? (Array.isArray(data) ? data.length : 'no es array') : 'null/undefined');
      
      if (data && Array.isArray(data)) {
        const filtered = data.filter(c => !hiddenIds.includes(c.id));
        setConversations(filtered);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
        console.log('✅ Conversaciones actualizadas:', filtered.length);
      } else {
        console.log('⚠️ Respuesta inesperada del servidor. Tipo:', typeof data);
        // Si no hay datos del servidor pero hay caché, mantener el caché
        if (!cached) {
          setConversations([]);
        }
      }
    } catch (error) {
      console.log('❌ Error cargando conversaciones:', error);
      // En caso de error, mantener las conversaciones actuales
    } finally {
      setLoading(false);
    }
  };

  const getUnreadCount = (conversation) => {
    if (!conversation.messages || !Array.isArray(conversation.messages)) return 0;
    return conversation.messages.filter(
      msg => !msg.read && msg.sender_id !== userData.id
    ).length;
  };

  const getLastMessage = (conversation) => {
    if (!conversation.messages || conversation.messages.length === 0) return 'Sin mensajes';
    // Los mensajes vienen en orden descendente (más reciente primero)
    const lastMsg = conversation.messages[0];
    const text = lastMsg.text || '';
    return text.length > 50 ? text.substring(0, 50) + '...' : text;
  };

  const getTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
  };

  const handleDeleteConversation = async (convId) => {
    try {
      const hiddenRaw = await AsyncStorage.getItem(HIDDEN_KEY);
      const hiddenIds = hiddenRaw ? JSON.parse(hiddenRaw) : [];
      const updatedHidden = Array.from(new Set([...hiddenIds, convId]));
      await AsyncStorage.setItem(HIDDEN_KEY, JSON.stringify(updatedHidden));

      const next = conversations.filter(c => c.id !== convId);
      setConversations(next);
    } catch (error) {
      console.log('Error ocultando conversación:', error);
    }
  };

  const renderConversation = ({ item }) => {
    const unreadCount = getUnreadCount(item);
    const lastMsg = getLastMessage(item);
    const lastMsgTime = item.messages && item.messages.length > 0 
      ? item.messages[0].created_at 
      : new Date().toISOString();
    
    // Determinar el otro usuario en la conversación
    const otherUser = item.user_id === userData.id 
      ? { name: item.seller?.name || 'Vendedor', id: item.seller_id, avatar: item.seller?.avatar }
      : { name: item.user?.name || 'Usuario', id: item.user_id, avatar: item.user?.avatar };

    const safeAvatar = getSafeAvatar(otherUser.avatar);
    const productName = item.product?.name
      || item.product?.title
      || item.product_name
      || item.productTitle
      || item.product?.product_name
      || '';

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => onOpenChat(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {safeAvatar ? (
            <Image source={{ uri: safeAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {otherUser.name ? otherUser.name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
          {unreadCount > 0 && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.conversationName} numberOfLines={1}>
                {otherUser.name || 'Usuario'}
              </Text>
              {productName ? (
                <Text style={styles.conversationProduct} numberOfLines={1}>
                  {productName}
                </Text>
              ) : null}
            </View>
            <Text style={styles.conversationTime}>
              {getTimeAgo(lastMsgTime)}
            </Text>
          </View>
          
          <View style={styles.messagePreview}>
            <Text 
              style={[
                styles.conversationLastMsg,
                unreadCount > 0 && styles.unreadMessage
              ]} 
              numberOfLines={1}
            >
              {lastMsg}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0d1117" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mensajes</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0084ff" />
          <Text style={styles.loadingText}>Cargando conversaciones...</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>No tienes mensajes</Text>
          <Text style={styles.emptySubtitle}>
            Cuando contactes con vendedores, tus conversaciones aparecerán aquí
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => String(item.id)}
          renderItem={renderConversation}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          windowSize={6}
          removeClippedSubviews
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0d1117',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    backgroundColor: '#0d1117',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 32,
    color: '#f8fafc',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
  },
  listContent: {
    paddingVertical: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#0d1117',
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    alignItems: 'center',
  },
  conversationBody: {
    flex: 1,
    flexDirection: 'row',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    color: '#94a3b8',
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#0d1117',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    flex: 1,
  },
  conversationProduct: {
    fontSize: 13,
    color: '#9ca3af',
  },
  conversationTime: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conversationDelete: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  deleteIcon: {
    fontSize: 18,
    color: '#ef4444',
  },
  conversationLastMsg: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  unreadMessage: {
    color: '#cbd5e1',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#E94560',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
