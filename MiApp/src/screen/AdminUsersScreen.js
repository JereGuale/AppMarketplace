import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Dimensions,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getJson, postJson } from '../service/api';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

export default function AdminUsersScreen({
  userToken,
  onBack,
}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [banHours, setBanHours] = useState('24');
  const [banReason, setBanReason] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userProducts, setUserProducts] = useState([]);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);

  useEffect(() => {
    if (userToken) {
      loadUsers();
    }
  }, [userToken, search, filterRole, filterStatus]);

  async function loadUsers() {
    try {
      setLoading(true);
      let url = '/api/admin/users?per_page=50';
      if (filterRole !== 'all') url += `&role=${filterRole}`;
      if (filterStatus !== 'all') url += `&status=${filterStatus}`;
      if (search) url += `&search=${search}`;

      const response = await getJson(url, userToken);
      if (response && response.data) {
        setUsers(response.data);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }

  async function performAction() {
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      let endpoint = '';
      let body = {};

      if (actionType === 'ban_temp') {
        if (!banHours || !banReason) {
          Alert.alert('Error', 'Completa todas los campos');
          setSubmitting(false);
          return;
        }
        endpoint = `/api/admin/users/${selectedUser.id}/ban-temporary`;
        body = { hours: parseInt(banHours), reason: banReason };
      } else if (actionType === 'ban_perm') {
        if (!banReason) {
          Alert.alert('Error', 'Ingresa una razón');
          setSubmitting(false);
          return;
        }
        endpoint = `/api/admin/users/${selectedUser.id}/ban-permanent`;
        body = { reason: banReason };
      } else if (actionType === 'unban') {
        endpoint = `/api/admin/users/${selectedUser.id}/unban`;
      } else if (actionType === 'reset_password') {
        if (!newPassword || newPassword.length < 6) {
          Alert.alert('Error', 'La contraseña debe tener mínimo 6 caracteres');
          setSubmitting(false);
          return;
        }
        endpoint = `/api/admin/users/${selectedUser.id}/reset-password`;
        body = { new_password: newPassword };
      }

      const response = await postJson(endpoint, body, userToken);
      if (response && response.message) {
        Alert.alert('Éxito', response.message);
        setModalVisible(false);
        loadUsers();
      } else {
        Alert.alert('Error', response?.message || 'Error en la operación');
      }
    } catch (err) {
      Alert.alert('Error', 'Error al realizar la acción');
    } finally {
      setSubmitting(false);
    }
  }

  async function loadUserProducts() {
    if (!selectedUser) return;
    setLoadingProducts(true);
    try {
      const response = await getJson(`/api/users/${selectedUser.id}/products`, userToken);
      if (response && Array.isArray(response.data)) {
        setUserProducts(response.data);
      } else if (Array.isArray(response)) {
        setUserProducts(response);
      } else {
        setUserProducts([]);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudieron cargar las publicaciones');
      setUserProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }

  async function deleteUserProduct(productId) {
    Alert.alert(
      'Eliminar publicación',
      '¿Eliminar permanentemente esta publicación?',
      [
        { text: 'Cancelar', onPress: () => {}, style: 'cancel' },
        {
          text: 'Eliminar',
          onPress: async () => {
            setDeletingProductId(productId);
            try {
              const response = await postJson(`/api/admin/products/${productId}/delete`, {}, userToken);
              if (response && response.message) {
                Alert.alert('Éxito', 'Publicación eliminada');
                setUserProducts(userProducts.filter(p => p.id !== productId));
              } else {
                Alert.alert('Error', response?.message || 'Error al eliminar');
              }
            } catch (err) {
              Alert.alert('Error', 'Error al eliminar la publicación');
            } finally {
              setDeletingProductId(null);
            }
          },
          style: 'destructive',
        },
      ]
    );
  }

  function openActionModal(user, action) {
    setSelectedUser(user);
    setActionType(action);
    setBanHours('24');
    setBanReason('');
    setNewPassword('');
    setModalVisible(true);
  }

  function openProductsModal(user) {
    setSelectedUser(user);
    setShowProductsModal(true);
    loadUserProducts();
  }

  function renderActionModal() {
    if (!selectedUser) return null;

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {actionType === 'ban_temp' && 'Banear temporalmente'}
                {actionType === 'ban_perm' && 'Banear permanentemente'}
                {actionType === 'unban' && 'Desbanear usuario'}
                {actionType === 'reset_password' && 'Restablecer contraseña'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.userInfo}>
                Usuario: {selectedUser.name} ({selectedUser.email})
              </Text>

              {(actionType === 'ban_temp' || actionType === 'ban_perm') && (
                <>
                  {actionType === 'ban_temp' && (
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Horas de ban:</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="24"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        keyboardType="number-pad"
                        value={banHours}
                        onChangeText={setBanHours}
                      />
                    </View>
                  )}

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Razón del ban:</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Explica la razón del ban..."
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      multiline
                      numberOfLines={4}
                      value={banReason}
                      onChangeText={setBanReason}
                    />
                  </View>
                </>
              )}

              {actionType === 'reset_password' && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Nueva contraseña:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={performAction}
                disabled={submitting}
              >
                <LinearGradient
                  colors={['#FF6B9D', '#E94560']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>Confirmar</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  function renderProductsModal() {
    return (
      <Modal
        visible={showProductsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowProductsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Publicaciones de {selectedUser?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowProductsModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {loadingProducts ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="small" color="#5A67D8" />
                </View>
              ) : userProducts.length === 0 ? (
                <Text style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginVertical: 20 }}>
                  Sin publicaciones
                </Text>
              ) : (
                <FlatList
                  data={userProducts}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <View style={styles.productItem}>
                      <View style={styles.productInfo}>
                        <Text style={styles.productTitle} numberOfLines={2}>
                          {item.title || item.name}
                        </Text>
                        <Text style={styles.productPrice}>
                          ${item.price}
                        </Text>
                        <Text style={styles.productMeta}>
                          {item.category || 'General'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: 'rgba(245, 101, 101, 0.2)', marginTop: 10 }]}
                        onPress={() => deleteUserProduct(item.id)}
                        disabled={deletingProductId === item.id}
                      >
                        {deletingProductId === item.id ? (
                          <ActivityIndicator size="small" color="#F56565" />
                        ) : (
                          <Text style={{ color: '#F56565', fontWeight: '600', fontSize: 12 }}>
                            Eliminar
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                  keyExtractor={(item) => item.id.toString()}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  function renderUserItem({ item }) {
    return (
      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>{item.name}</Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.account_status === 'active'
                    ? 'rgba(72, 187, 120, 0.2)'
                    : 'rgba(245, 101, 101, 0.2)',
              },
            ]}
          >
            <Text
              style={{
                color:
                  item.account_status === 'active' ? '#48BB78' : '#F56565',
                fontSize: 11,
                fontWeight: '600',
              }}
            >
              {item.account_status === 'active' ? '✓ Activo' : '✕ ' + item.account_status}
            </Text>
          </View>
        </View>

        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userMeta}>
          Rol: {item.role} • Transacciones: {item.successful_transactions}
        </Text>

        <View style={styles.actionButtons}>
          {item.account_status === 'active' ? (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: 'rgba(255, 107, 157, 0.2)' }]}
                onPress={() => openActionModal(item, 'ban_temp')}
              >
                <Text style={{ color: '#FF6B9D', fontWeight: '600', fontSize: 12 }}>
                  Ban temp
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: 'rgba(245, 101, 101, 0.2)' }]}
                onPress={() => openActionModal(item, 'ban_perm')}
              >
                <Text style={{ color: '#F56565', fontWeight: '600', fontSize: 12 }}>
                  Ban perm
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: 'rgba(72, 187, 120, 0.2)' }]}
              onPress={() => openActionModal(item, 'unban')}
            >
              <Text style={{ color: '#48BB78', fontWeight: '600', fontSize: 12 }}>
                Desbanear
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: 'rgba(90, 103, 216, 0.2)' }]}
            onPress={() => openActionModal(item, 'reset_password')}
          >
            <Text style={{ color: '#5A67D8', fontWeight: '600', fontSize: 12 }}>
              Reset Pass
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}
            onPress={() => openProductsModal(item)}
          >
            <Text style={{ color: '#A855F7', fontWeight: '600', fontSize: 12 }}>
              Publicaciones
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
            <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
          </View>

          <View style={styles.container}>
            {/* Search and Filters */}
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar usuario..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={search}
              onChangeText={setSearch}
            />

            <View style={styles.filtersRow}>
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  filterRole === 'all' && styles.filterBtnActive,
                ]}
                onPress={() => setFilterRole('all')}
              >
                <Text style={filterRole === 'all' ? styles.filterBtnTextActive : styles.filterBtnText}>
                  Todos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  filterRole === 'client' && styles.filterBtnActive,
                ]}
                onPress={() => setFilterRole('client')}
              >
                <Text style={filterRole === 'client' ? styles.filterBtnTextActive : styles.filterBtnText}>
                  Clientes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  filterRole === 'provider' && styles.filterBtnActive,
                ]}
                onPress={() => setFilterRole('provider')}
              >
                <Text style={filterRole === 'provider' ? styles.filterBtnTextActive : styles.filterBtnText}>
                  Proveedores
                </Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#5A67D8" />
              </View>
            ) : (
              <FlatList
                data={users}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            )}
          </View>
        </ScrollView>

        {renderActionModal()}
        {renderProductsModal()}
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
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: 16,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
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
    fontSize: 12,
  },
  filterBtnTextActive: {
    color: '#7C8FFF',
    fontWeight: '600',
    fontSize: 12,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  userCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  userEmail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  userMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    width: isMobile ? '90%' : '50%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
  },
  userInfo: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 100,
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  productItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  productInfo: {
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
    marginBottom: 4,
  },
  productMeta: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
});
