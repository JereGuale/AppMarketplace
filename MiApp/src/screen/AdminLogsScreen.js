import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getJson } from '../service/api';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

export default function AdminLogsScreen({
  userToken,
  onBack,
}) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('all');

  useEffect(() => {
    if (userToken) {
      loadLogs();
    }
  }, [userToken, filterAction]);

  async function loadLogs() {
    try {
      setLoading(true);
      let url = '/api/admin/logs?per_page=100';
      if (filterAction !== 'all') url += `&action=${filterAction}`;

      const response = await getJson(url, userToken);
      if (response && response.data) {
        setLogs(response.data);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudieron cargar los logs');
    } finally {
      setLoading(false);
    }
  }

  function getActionIcon(action) {
    const icons = {
      ban_user: '🚫',
      unban_user: '✅',
      hide_review: '👁️',
      show_review: '👀',
      resolve_dispute: '⚔️',
      reset_password: '🔑',
    };
    return icons[action] || '📋';
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function renderLogItem({ item }) {
    const actionColors = {
      ban_user: '#F56565',
      unban_user: '#48BB78',
      hide_review: '#ED8936',
      show_review: '#48BB78',
      resolve_dispute: '#5A67D8',
      reset_password: '#9F7AEA',
    };

    const color = actionColors[item.action] || '#718096';

    return (
      <View style={styles.logCard}>
        <View style={styles.logHeader}>
          <Text style={styles.logIcon}>{getActionIcon(item.action)}</Text>
          <View style={styles.logInfo}>
            <Text style={[styles.logAction, { color }]}>
              {item.action.replace(/_/g, ' ').toUpperCase()}
            </Text>
            <Text style={styles.logTime}>{formatDate(item.created_at)}</Text>
          </View>
        </View>

        <View style={styles.logDetails}>
          <Text style={styles.logDetailText}>
            👤 Admin: {item.admin?.name || 'N/A'}
          </Text>
          {item.target_type && (
            <Text style={styles.logDetailText}>
              🎯 Objetivo: {item.target_type} (ID: {item.target_id})
            </Text>
          )}
          {item.details && (
            <Text style={styles.logDetailText}>
              📝 Detalles: {typeof item.details === 'string' ? item.details : JSON.stringify(item.details)}
            </Text>
          )}
          {item.ip_address && (
            <Text style={styles.logDetailText}>
              🌐 IP: {item.ip_address}
            </Text>
          )}
        </View>
      </View>
    );
  }

  const actionOptions = [
    'all',
    'ban_user',
    'unban_user',
    'hide_review',
    'show_review',
    'resolve_dispute',
    'reset_password',
  ];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBg}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack}>
              <Text style={styles.backButton}>← Volver</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Auditoría y Logs</Text>
          </View>

          <View style={styles.container}>
            {/* Filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filtersScroll}
              contentContainerStyle={styles.filtersContent}
            >
              {actionOptions.map((action) => (
                <TouchableOpacity
                  key={action}
                  style={[
                    styles.filterBtn,
                    filterAction === action && styles.filterBtnActive,
                  ]}
                  onPress={() => setFilterAction(action)}
                >
                  <Text
                    style={
                      filterAction === action
                        ? styles.filterBtnTextActive
                        : styles.filterBtnText
                    }
                  >
                    {action === 'all'
                      ? 'Todos'
                      : action.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#5A67D8" />
              </View>
            ) : logs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>No hay logs para mostrar</Text>
              </View>
            ) : (
              <FlatList
                data={logs}
                renderItem={renderLogItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  gradientBg: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    fontSize: 16,
    color: '#13c1ac',
    fontWeight: '700',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  container: {
    padding: 20,
  },
  filtersScroll: {
    marginBottom: 20,
  },
  filtersContent: {
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  filterBtnActive: {
    backgroundColor: 'rgba(90, 103, 216, 0.3)',
    borderColor: '#5A67D8',
  },
  filterBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    fontSize: 11,
  },
  filterBtnTextActive: {
    color: '#7C8FFF',
    fontWeight: '600',
    fontSize: 11,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
  },
  logCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  logIcon: {
    fontSize: 28,
  },
  logInfo: {
    flex: 1,
  },
  logAction: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  logTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  logDetails: {
    marginLeft: 40,
    gap: 6,
  },
  logDetailText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },
});
