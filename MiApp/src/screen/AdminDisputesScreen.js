import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Dimensions,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getJson, postJson } from '../service/api';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

export default function AdminDisputesScreen({
  userToken,
  onBack,
}) {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('open');
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [resolution, setResolution] = useState('pending');
  const [decision, setDecision] = useState('');
  const [refundPercentage, setRefundPercentage] = useState('100');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (userToken) {
      loadDisputes();
    }
  }, [userToken, filterStatus]);

  async function loadDisputes() {
    try {
      setLoading(true);
      let url = '/api/admin/disputes?per_page=50';
      if (filterStatus !== 'all') url += `&status=${filterStatus}`;

      const response = await getJson(url, userToken);
      if (response && response.data) {
        setDisputes(response.data);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudieron cargar las disputas');
    } finally {
      setLoading(false);
    }
  }

  async function resolveDispute() {
    if (!selectedDispute || !decision || resolution === 'pending') {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    setSubmitting(true);
    try {
      const response = await postJson(
        `/api/admin/disputes/${selectedDispute.id}/resolve`,
        {
          resolution,
          decision,
          refund_percentage: parseInt(refundPercentage),
        },
        userToken
      );

      if (response && response.message) {
        Alert.alert('Éxito', response.message);
        setModalVisible(false);
        loadDisputes();
      }
    } catch (err) {
      Alert.alert('Error', 'Error al resolver la disputa');
    } finally {
      setSubmitting(false);
    }
  }

  function openDisputeModal(dispute) {
    setSelectedDispute(dispute);
    setResolution('pending');
    setDecision('');
    setRefundPercentage('100');
    setModalVisible(true);
  }

  async function loadDisputeDetails(disputeId) {
    try {
      const response = await getJson(`/api/admin/disputes/${disputeId}`, userToken);
      if (response) {
        setSelectedDispute(response);
        setDetailsVisible(true);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudieron cargar los detalles');
    }
  }

  function renderDisputeItem({ item }) {
    const statusColor = {
      open: '#F56565',
      in_review: '#ED8936',
      resolved: '#48BB78',
      closed: '#718096',
    };

    return (
      <View style={styles.disputeCard}>
        <View style={styles.disputeHeader}>
          <View>
            <Text style={styles.disputeTitle}>
              Producto: {item.product?.name || 'N/A'}
            </Text>
            <Text style={styles.disputeMoney}>${item.amount}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { borderColor: statusColor[item.status] },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor[item.status] }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <Text style={styles.disputeParties}>
          🆚 {item.buyer?.name} vs {item.seller?.name}
        </Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: 'rgba(90, 103, 216, 0.2)' }]}
            onPress={() => loadDisputeDetails(item.id)}
          >
            <Text style={{ color: '#7C8FFF', fontWeight: '600', fontSize: 12 }}>
              Ver detalles
            </Text>
          </TouchableOpacity>

          {item.status === 'open' && (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: 'rgba(72, 187, 120, 0.2)' }]}
              onPress={() => openDisputeModal(item)}
            >
              <Text style={{ color: '#48BB78', fontWeight: '600', fontSize: 12 }}>
                Resolver
              </Text>
            </TouchableOpacity>
          )}
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
            <Text style={styles.headerTitle}>Gestión de Disputas</Text>
          </View>

          <View style={styles.container}>
            {/* Filters */}
            <View style={styles.filtersRow}>
              {['all', 'open', 'in_review', 'resolved'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterBtn,
                    filterStatus === status && styles.filterBtnActive,
                  ]}
                  onPress={() => setFilterStatus(status)}
                >
                  <Text
                    style={
                      filterStatus === status
                        ? styles.filterBtnTextActive
                        : styles.filterBtnText
                    }
                  >
                    {status === 'all' ? 'Todas' : status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#5A67D8" />
              </View>
            ) : (
              <FlatList
                data={disputes}
                renderItem={renderDisputeItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            )}
          </View>
        </ScrollView>

        {/* Resolve Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Resolver Disputa</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {selectedDispute && (
                  <>
                    <Text style={styles.modalLabel}>
                      Comprador: {selectedDispute.buyer?.name}
                    </Text>
                    <Text style={styles.claimText}>
                      Reclamo: {selectedDispute.buyer_claim}
                    </Text>

                    <Text style={styles.modalLabel}>
                      Vendedor: {selectedDispute.seller?.name}
                    </Text>
                    <Text style={styles.claimText}>
                      Respuesta: {selectedDispute.seller_response || 'Sin respuesta'}
                    </Text>

                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Resolución:</Text>
                      <View style={styles.resolutionOptions}>
                        {['favor_buyer', 'favor_seller', 'partial'].map((opt) => (
                          <TouchableOpacity
                            key={opt}
                            style={[
                              styles.optionBtn,
                              resolution === opt && styles.optionBtnActive,
                            ]}
                            onPress={() => setResolution(opt)}
                          >
                            <Text
                              style={[
                                styles.optionText,
                                resolution === opt && styles.optionTextActive,
                              ]}
                            >
                              {opt === 'favor_buyer'
                                ? 'A favor del comprador'
                                : opt === 'favor_seller'
                                ? 'A favor del vendedor'
                                : 'Parcial'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {resolution === 'partial' && (
                      <View style={styles.formGroup}>
                        <Text style={styles.label}>% Reembolso al comprador:</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="100"
                          keyboardType="number-pad"
                          value={refundPercentage}
                          onChangeText={setRefundPercentage}
                        />
                      </View>
                    )}

                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Decisión (explicación):</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Explica tu decisión..."
                        multiline
                        numberOfLines={5}
                        value={decision}
                        onChangeText={setDecision}
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={resolveDispute}
                      disabled={submitting}
                    >
                      <LinearGradient
                        colors={['#5A67D8', '#4C51BF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.submitGradient}
                      >
                        {submitting ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.submitText}>Resolver Disputa</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Details Modal */}
        <Modal
          visible={detailsVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setDetailsVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Detalles de la Disputa</Text>
                <TouchableOpacity onPress={() => setDetailsVisible(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {selectedDispute && (
                  <>
                    <Text style={styles.sectionLabel}>Información General</Text>
                    <Text style={styles.detailText}>
                      ID: {selectedDispute.id}
                    </Text>
                    <Text style={styles.detailText}>
                      Monto: ${selectedDispute.amount}
                    </Text>
                    <Text style={styles.detailText}>
                      Estado: {selectedDispute.status}
                    </Text>

                    <Text style={styles.sectionLabel}>Reclamo del Comprador</Text>
                    <Text style={styles.detailText}>{selectedDispute.buyer_claim}</Text>

                    <Text style={styles.sectionLabel}>Respuesta del Vendedor</Text>
                    <Text style={styles.detailText}>
                      {selectedDispute.seller_response || 'Sin respuesta'}
                    </Text>

                    {selectedDispute.status === 'resolved' && (
                      <>
                        <Text style={styles.sectionLabel}>Decisión del Admin</Text>
                        <Text style={styles.detailText}>
                          {selectedDispute.admin_decision}
                        </Text>
                      </>
                    )}
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
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
  disputeCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  disputeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  disputeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disputeMoney: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B9D',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  disputeParties: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
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
    maxHeight: '85%',
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
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C8FFF',
    marginTop: 12,
    marginBottom: 4,
  },
  claimText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(90, 103, 216, 0.1)',
    borderRadius: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  formGroup: {
    marginVertical: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  resolutionOptions: {
    gap: 8,
  },
  optionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  optionBtnActive: {
    backgroundColor: 'rgba(90, 103, 216, 0.3)',
    borderColor: '#5A67D8',
  },
  optionText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  optionTextActive: {
    color: '#7C8FFF',
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
    marginBottom: 20,
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
});
