import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
  RefreshControl,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, Users, Sword, Star, FileText, Settings, UserPlus, Store, Ban, EyeOff } from 'lucide-react-native';
import { getJson } from '../service/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

export default function AdminPanelScreen({
  onNavigate,
  onLogout,
  userData,
  userToken,
}) {
  console.log('🔐 AdminPanelScreen props:', { onLogout: !!onLogout, userData: !!userData, userToken: !!userToken });
  
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, [userToken]);

  async function loadDashboard() {
    try {
      // Usar el token prop si está disponible, sino obtener de AsyncStorage
      let token = userToken;
      if (!token) {
        token = (await AsyncStorage.getItem('userToken')) || (await AsyncStorage.getItem('zm_token'));
      }
      const response = await getJson('/api/admin/dashboard', token);
      if (response && response.timestamp) {
        setDashboard(response);
      } else {
        Alert.alert('Error', 'No se pudo cargar el dashboard');
      }
    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Error', 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    loadDashboard();
  }

  function handleLogout() {
    console.log('🔴 handleLogout PRESIONADO!');
    console.log('onLogout disponible:', !!onLogout, 'tipo:', typeof onLogout);
    setShowLogoutModal(true);
  }

  async function confirmLogout() {
    try {
      console.log('🟢 Confirmando logout...');
      setIsLoggingOut(true);
      setShowLogoutModal(false);
      
      console.log('logoutFunction disponible:', !!onLogout, 'tipo:', typeof onLogout);
      
      if (onLogout && typeof onLogout === 'function') {
        console.log('✅ Llamando a onLogout...');
        await onLogout();
        console.log('✅ onLogout completada');
      } else {
        console.error('❌ onLogout NO es función:', typeof onLogout, onLogout);
      }
    } catch (err) {
      console.error('❌ Error al ejecutar logout:', err);
      setIsLoggingOut(false);
      Alert.alert('Error', 'No se pudo cerrar sesión: ' + err.message);
    }
  }

  function cancelLogout() {
    console.log('🟡 Logout cancelado');
    setShowLogoutModal(false);
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#5A67D8" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0a0a0a', '#111827', '#0f172a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBg}
      >
        {/* Layout principal: Sidebar + Contenido */}
        <View style={styles.mainRow}>
          {/* Sidebar fija */}
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <View style={styles.sidebarAvatar}>
                <Text style={styles.sidebarAvatarText}>●</Text>
              </View>
              <View style={styles.sidebarHeaderTextWrap}>
                <Text style={styles.sidebarHeaderTitle}>Admin</Text>
              </View>
            </View>

            <View style={styles.sidebarMenu}>
              <TouchableOpacity style={[styles.menuItem, styles.menuItemActive]} activeOpacity={0.8}>
                <Home color="#b8c1ff" size={20} strokeWidth={2} />
                <Text style={styles.menuText}>Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} activeOpacity={0.8} onPress={() => onNavigate && onNavigate('adminUsers')}>
                <Users color="#b8c1ff" size={20} strokeWidth={2} />
                <Text style={styles.menuText}>Usuarios</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} activeOpacity={0.8} onPress={() => onNavigate && onNavigate('adminDisputes')}>
                <Sword color="#b8c1ff" size={20} strokeWidth={2} />
                <Text style={styles.menuText}>Disputas</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} activeOpacity={0.8} onPress={() => onNavigate && onNavigate('adminReviews')}>
                <Star color="#b8c1ff" size={20} strokeWidth={2} />
                <Text style={styles.menuText}>Reseñas</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} activeOpacity={0.8} onPress={() => onNavigate && onNavigate('adminLogs')}>
                <FileText color="#b8c1ff" size={20} strokeWidth={2} />
                <Text style={styles.menuText}>Auditoría</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} activeOpacity={0.8}>
                <Settings color="#b8c1ff" size={20} strokeWidth={2} />
                <Text style={styles.menuText}>Configuración</Text>
              </TouchableOpacity>
            </View>

            {/* Un único botón de Salir (no duplicado) */}
            <TouchableOpacity style={styles.sidebarLogout} onPress={handleLogout} activeOpacity={0.8}>
              <Text style={styles.sidebarLogoutText}>Salir</Text>
            </TouchableOpacity>
          </View>

          {/* Contenido */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
            style={styles.content}
          >
            {/* Encabezado superior */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Panel de Administración</Text>
                <Text style={styles.headerSubtitle}>Gestión de marketplace</Text>
              </View>
              {/* BOTÓN DE PRUEBA - TEMPORAL */}
              <TouchableOpacity 
                style={{ backgroundColor: '#FF4B4B', padding: 10, borderRadius: 5, marginRight: 10 }}
                onPress={() => {
                  console.log('🔵 BOTÓN DE PRUEBA PRESIONADO');
                  handleLogout();
                }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>Salir [Prueba]</Text>
              </TouchableOpacity>
              {/* Botón de salir en header desactivado para evitar duplicado visual, mantenemos sólo el de sidebar */}
            </View>

            {/* Indicador de estado del sistema */}
            <View style={styles.systemStatus}>
              <View style={styles.statusDot} />
              <Text style={styles.systemStatusText}>Sistema operativo correctamente</Text>
              <Text style={styles.systemStatusTime}>Última actualización: {new Date().toLocaleTimeString()}</Text>
            </View>

            <View style={styles.container}>
              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                {/* Total Users */}
                <LinearGradient colors={["#1f2847","#131a33"]} start={{x:0,y:0}} end={{x:1,y:1}} style={[styles.statCard, styles.glassCard, styles.statGradient]}>
                  <View style={styles.statIconContainer}>
                    <Users color="#7C8FFF" size={24} strokeWidth={2} />
                  </View>
                  <Text style={styles.statValue}>{dashboard?.total_users || 0}</Text>
                  <Text style={styles.statLabel}>Usuarios totales</Text>
                </LinearGradient>

                {/* New Clients This Week */}
                <LinearGradient colors={["#1f2847","#131a33"]} start={{x:0,y:0}} end={{x:1,y:1}} style={[styles.statCard, styles.glassCard, styles.statGradient]}>
                  <View style={styles.statIconContainer}>
                    <UserPlus color="#7C8FFF" size={24} strokeWidth={2} />
                  </View>
                  <Text style={styles.statValue}>
                    {dashboard?.new_clients_this_week || 0}
                  </Text>
                  <Text style={styles.statLabel}>Clientes esta semana</Text>
                </LinearGradient>

                {/* New Providers This Week */}
                <LinearGradient colors={["#1f2847","#131a33"]} start={{x:0,y:0}} end={{x:1,y:1}} style={[styles.statCard, styles.glassCard, styles.statGradient]}>
                  <View style={styles.statIconContainer}>
                    <Store color="#7C8FFF" size={24} strokeWidth={2} />
                  </View>
                  <Text style={styles.statValue}>
                    {dashboard?.new_providers_this_week || 0}
                  </Text>
                  <Text style={styles.statLabel}>Proveedores esta semana</Text>
                </LinearGradient>

                {/* Active Bans */}
                <LinearGradient colors={["#2b1e1e","#211414"]} start={{x:0,y:0}} end={{x:1,y:1}} style={[styles.statCard, styles.glassCard, styles.statGradient]}>
                  <View style={styles.statIconContainer}>
                    <Ban color="#F59E0B" size={24} strokeWidth={2} />
                  </View>
                  <Text style={styles.statValue}>
                    {dashboard?.active_temporary_bans || 0}
                  </Text>
                  <Text style={styles.statLabel}>Bans temporales</Text>
                </LinearGradient>

                {/* Permanent Bans */}
                <LinearGradient colors={["#2b1e1e","#211414"]} start={{x:0,y:0}} end={{x:1,y:1}} style={[styles.statCard, styles.glassCard, styles.statGradient]}>
                  <View style={styles.statIconContainer}>
                    <Ban color="#EF4444" size={24} strokeWidth={2} />
                  </View>
                  <Text style={styles.statValue}>
                    {dashboard?.permanent_bans || 0}
                  </Text>
                  <Text style={styles.statLabel}>Bans permanentes</Text>
                </LinearGradient>

              </View>

            {/* Action Buttons */}
            <View style={styles.actionsSection}>
              <Text style={styles.sectionTitle}>Acciones rápidas</Text>

              <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onNavigate && onNavigate('adminUsers')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FF6B9D', '#E94560']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionButtonGradient}
                >
                   <Users color="#fff" size={28} strokeWidth={2} />
                  <View style={styles.actionButtonText}>
                    <Text style={styles.actionButtonTitle}>Gestión de Usuarios</Text>
                    <Text style={styles.actionButtonDesc}>
                      Banear, desbanear, restablecer contraseñas
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onNavigate && onNavigate('adminDisputes')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#5A67D8', '#4C51BF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionButtonGradient}
                >
                   <Sword color="#fff" size={28} strokeWidth={2} />
                  <View style={styles.actionButtonText}>
                    <Text style={styles.actionButtonTitle}>Gestión de Disputas</Text>
                    <Text style={styles.actionButtonDesc}>
                      Resolver conflictos entre comprador y vendedor
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onNavigate && onNavigate('adminReviews')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#48BB78', '#38A169']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionButtonGradient}
                >
                   <Star color="#fff" size={28} strokeWidth={2} />
                  <View style={styles.actionButtonText}>
                    <Text style={styles.actionButtonTitle}>Gestión de Reseñas</Text>
                    <Text style={styles.actionButtonDesc}>
                      Ocultar contenido ofensivo sin eliminar
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onNavigate && onNavigate('adminLogs')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#ED8936', '#DD6B20']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionButtonGradient}
                >
                   <FileText color="#fff" size={28} strokeWidth={2} />
                  <View style={styles.actionButtonText}>
                    <Text style={styles.actionButtonTitle}>Auditoría y Logs</Text>
                    <Text style={styles.actionButtonDesc}>
                      Historial de acciones administrativas
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              </View>
            </View>

            </View>
          </ScrollView>
        </View>
      </LinearGradient>

      {/* Modal de confirmación de logout */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelLogout}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cerrar sesión</Text>
            <Text style={styles.modalMessage}>¿Estás seguro que deseas cerrar sesión?</Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={cancelLogout}
                disabled={isLoggingOut}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonConfirm, isLoggingOut && styles.modalButtonDisabled]}
                onPress={confirmLogout}
                disabled={isLoggingOut}
              >
                <Text style={styles.modalButtonText}>
                  {isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  mainRow: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: isMobile ? 0 : 240,
    backgroundColor: 'rgba(12, 18, 32, 0.9)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 20,
    paddingHorizontal: 16,
    display: isMobile ? 'none' : 'flex',
  },
  content: {
    flex: 1,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  sidebarAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 143, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124, 143, 255, 0.35)',
  },
  sidebarAvatarText: { fontSize: 14, color: '#7C8FFF' },
  sidebarHeaderTextWrap: { flex: 1 },
  sidebarHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  sidebarMenu: { gap: 6 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  menuItemActive: {
    backgroundColor: 'rgba(124, 143, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124, 143, 255, 0.35)',
  },
  menuIcon: { fontSize: 16, color: '#b8c1ff' },
  menuText: { fontSize: 14, color: '#e5e7eb', fontWeight: '600' },
  sidebarLogout: {
    marginTop: 'auto',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 75, 75, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 75, 0.35)',
  },
  sidebarLogoutText: { color: '#FF4B4B', fontWeight: '700' },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: isMobile ? 20 : 40,
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: isMobile ? 24 : 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  systemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    marginHorizontal: isMobile ? 20 : 40,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
      }
    })
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  systemStatusText: { color: '#d1fae5', fontWeight: '700' },
  systemStatusTime: { color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  container: {
    paddingHorizontal: isMobile ? 20 : 40,
    paddingVertical: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: isMobile ? 'space-between' : 'space-between',
    gap: isMobile ? 12 : 14,
    marginBottom: 40,
  },
  statCard: {
    flex: isMobile ? 0 : 1,
    flexBasis: isMobile ? '48%' : 'calc(20% - 12px)',
    minWidth: isMobile ? '48%' : 160,
    maxWidth: isMobile ? '48%' : 190,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 16,
    padding: isMobile ? 16 : 24,
    paddingVertical: isMobile ? 20 : 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 20px 40px rgba(0,0,0,0.35)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
      }
    })
  },
  statGradient: {
    borderRadius: 16,
  },
  glassCard: {
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }
    })
  },
  statIconContainer: {
    width: isMobile ? 48 : 56,
    height: isMobile ? 48 : 56,
    borderRadius: 14,
    backgroundColor: 'rgba(90, 103, 216, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 24,
  },
  statValue: {
    fontSize: isMobile ? 28 : 40,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    marginTop: 12,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: isMobile ? 11 : 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  actionsSection: {
    marginBottom: 40,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: isMobile ? 12 : 14,
    rowGap: isMobile ? 12 : 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  actionButton: {
    flex: isMobile ? 0 : 1,
    flexBasis: isMobile ? '100%' : 'calc(50% - 7px)',
    maxWidth: isMobile ? '100%' : 'calc(50% - 7px)',
    minWidth: isMobile ? '100%' : 'calc(50% - 7px)',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: isMobile ? 12 : 0,
    ...Platform.select({
      web: { boxShadow: '0 12px 24px rgba(0,0,0,0.35)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
      }
    })
  },
  actionButtonGradient: {
    flexDirection: 'row',
    padding: isMobile ? 20 : 24,
    paddingVertical: isMobile ? 22 : 26,
    alignItems: 'center',
    gap: isMobile ? 14 : 18,
  },
  actionButtonIcon: {
    fontSize: isMobile ? 32 : 36,
  },
  actionButtonText: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  actionButtonDesc: {
    fontSize: isMobile ? 13 : 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    minWidth: 300,
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalButtonConfirm: {
    backgroundColor: '#FF4B4B',
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
