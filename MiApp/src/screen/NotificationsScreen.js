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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../service/api';

const CACHE_KEY = 'cached_notifications';

const clearNotificationCache = async () => {
  await AsyncStorage.removeItem(CACHE_KEY);
};

export default function NotificationsScreen({ onBack, onOpenChat, userData = {} }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    markAllAsReadOnOpen();
  }, []);

  async function markAllAsReadOnOpen() {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (userToken) {
        await markAllNotificationsAsRead(userToken);
      }
    } catch (error) {
      console.log('Error marcando notificaciones como leídas:', error);
    }
  }

  async function loadNotifications() {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) || [];
        setNotifications(parsed);
        setLoading(false);
      } else {
        setLoading(true);
      }

      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        setNotifications([]);
        await AsyncStorage.removeItem(CACHE_KEY);
        return;
      }

      const data = await getNotifications(userToken);
      const next = Array.isArray(data) ? data : [];
      setNotifications(next);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(timestamp) {
    const now = new Date();
    const msgDate = new Date(timestamp);
    const diff = now - msgDate;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    
    return msgDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  async function handleNotificationPress(notif) {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (userToken && !notif.read) {
        await markNotificationAsRead(notif.id, userToken);
        // optimista: marcar leído en memoria y cache
        const updated = notifications.map(n => n.id === notif.id ? { ...n, read: true } : n);
        setNotifications(updated);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Error marcando notificación:', error);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (userToken) {
        await markAllNotificationsAsRead(userToken);
        const cleared = notifications.map(n => ({ ...n, read: true }));
        setNotifications(cleared);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cleared));
      }
    } catch (error) {
      console.error('Error marcando todas:', error);
    }
  }

  async function handleClearAll() {
    try {
      if (notifications.length === 0) return;
      setNotifications([]);
      await clearNotificationCache();
    } catch (error) {
      console.error('Error eliminando todas:', error);
    }
  }

  async function handleDeleteNotification(id) {
    try {
      const next = notifications.filter(n => n.id !== id);
      setNotifications(next);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error('Error eliminando notificación:', error);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={styles.headerActions}>
          {notifications.some(n => !n.read) && (
            <TouchableOpacity onPress={handleMarkAllAsRead}>
              <Text style={[styles.markAllBtn, styles.firstAction]}>Marcar todas</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={[styles.markAllBtn, { color: '#ef4444' }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de notificaciones */}
      {loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Cargando...</Text>
        </View>
      ) : notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={[styles.notificationItem, !item.read && styles.unreadItem]}>
              <TouchableOpacity
                style={styles.notificationBody}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.notificationAvatar}>
                  {item.sender?.avatar ? (
                    <Image source={{ uri: item.sender.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {(item.sender?.name || item.user?.name || 'U').charAt(0)}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationText}>
                    <Text style={styles.senderName}>{item.sender?.name || item.user?.name || 'Usuario'}</Text>
                    {' '}{item.content}
                  </Text>
                  <Text style={styles.notificationTime}>{formatTime(item.created_at)}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.notificationDelete}
                onPress={() => handleDeleteNotification(item.id)}
                activeOpacity={0.6}
              >
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.listContainer}
          initialNumToRender={10}
          windowSize={8}
          removeClippedSubviews
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyText}>No tienes notificaciones nuevas</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backBtn: {
    fontSize: 32,
    color: '#cbd5e1',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllBtn: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
    marginLeft: 12,
  },
  firstAction: {
    marginLeft: 0,
  },
  listContainer: {
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#111827',
    marginVertical: 4,
    marginHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  notificationBody: {
    flexDirection: 'row',
    flex: 1,
  },
  unreadItem: {
    backgroundColor: '#1e293b',
    borderColor: '#3b82f6',
  },
  notificationAvatar: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    color: '#94a3b8',
    fontWeight: '600',
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 15,
    color: '#e2e8f0',
    marginBottom: 4,
  },
  senderName: {
    fontWeight: '600',
    color: '#f1f5f9',
  },
  notificationTime: {
    fontSize: 13,
    color: '#64748b',
  },
  notificationDelete: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  deleteIcon: {
    fontSize: 18,
    color: '#ef4444',
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
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
});
