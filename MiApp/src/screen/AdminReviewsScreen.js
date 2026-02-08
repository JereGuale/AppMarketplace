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
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getJson, postJson } from '../service/api';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

export default function AdminReviewsScreen({
  userToken,
  onBack,
}) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOffensive, setFilterOffensive] = useState('all');
  const [filterHidden, setFilterHidden] = useState('all');
  const [selectedReview, setSelectedReview] = useState(null);
  const [hideModalVisible, setHideModalVisible] = useState(false);
  const [hideReason, setHideReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (userToken) {
      loadReviews();
    }
  }, [userToken, filterOffensive, filterHidden]);

  async function loadReviews() {
    try {
      setLoading(true);
      let url = '/api/admin/reviews?per_page=50';
      if (filterOffensive !== 'all') url += `&has_offensive=${filterOffensive === 'offensive'}`;
      if (filterHidden !== 'all') url += `&hidden=${filterHidden === 'hidden'}`;

      const response = await getJson(url, userToken);
      if (response && response.data) {
        setReviews(response.data);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudieron cargar las reseñas');
    } finally {
      setLoading(false);
    }
  }

  async function hideReview() {
    if (!selectedReview || !hideReason) {
      Alert.alert('Error', 'Ingresa una razón');
      return;
    }

    setSubmitting(true);
    try {
      const response = await postJson(
        `/api/admin/reviews/${selectedReview.id}/hide`,
        { reason: hideReason },
        userToken
      );

      if (response && response.message) {
        Alert.alert('Éxito', response.message);
        setHideModalVisible(false);
        loadReviews();
      }
    } catch (err) {
      Alert.alert('Error', 'Error al ocultar la reseña');
    } finally {
      setSubmitting(false);
    }
  }

  async function showReview(reviewId) {
    try {
      const response = await postJson(
        `/api/admin/reviews/${reviewId}/show`,
        {},
        userToken
      );

      if (response && response.message) {
        Alert.alert('Éxito', response.message);
        loadReviews();
      }
    } catch (err) {
      Alert.alert('Error', 'Error al mostrar la reseña');
    }
  }

  function openHideModal(review) {
    setSelectedReview(review);
    setHideReason('');
    setHideModalVisible(true);
  }

  function renderReviewItem({ item }) {
    const ratingStars = '⭐'.repeat(item.rating);

    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewMeta}>
            <Text style={styles.reviewer}>{item.buyer?.name}</Text>
            <Text style={styles.ratingStars}>{ratingStars}</Text>
          </View>
          <View style={styles.reviewStatus}>
            {item.has_offensive_language && (
              <View style={styles.offensiveBadge}>
                <Text style={styles.offensiveText}>⚠️ Ofensivo</Text>
              </View>
            )}
            {item.is_hidden_by_admin && (
              <View style={styles.hiddenBadge}>
                <Text style={styles.hiddenText}>👁️ Oculto</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.reviewComment}>{item.comment}</Text>

        <Text style={styles.productInfo}>
          Producto: {item.product?.name || 'N/A'} • Vendedor: {item.seller?.name}
        </Text>

        <View style={styles.actionButtons}>
          {!item.is_hidden_by_admin ? (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: 'rgba(245, 101, 101, 0.2)' }]}
              onPress={() => openHideModal(item)}
            >
              <Text style={{ color: '#F56565', fontWeight: '600', fontSize: 12 }}>
                Ocultar
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: 'rgba(72, 187, 120, 0.2)' }]}
              onPress={() => showReview(item.id)}
            >
              <Text style={{ color: '#48BB78', fontWeight: '600', fontSize: 12 }}>
                Mostrar
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
            <Text style={styles.headerTitle}>Gestión de Reseñas</Text>
          </View>

          <View style={styles.container}>
            {/* Filters */}
            <View style={styles.filtersRow}>
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  filterOffensive === 'all' && styles.filterBtnActive,
                ]}
                onPress={() => setFilterOffensive('all')}
              >
                <Text
                  style={
                    filterOffensive === 'all'
                      ? styles.filterBtnTextActive
                      : styles.filterBtnText
                  }
                >
                  Todas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  filterOffensive === 'offensive' && styles.filterBtnActive,
                ]}
                onPress={() => setFilterOffensive('offensive')}
              >
                <Text
                  style={
                    filterOffensive === 'offensive'
                      ? styles.filterBtnTextActive
                      : styles.filterBtnText
                  }
                >
                  ⚠️ Ofensivas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  filterHidden === 'hidden' && styles.filterBtnActive,
                ]}
                onPress={() => setFilterHidden('hidden')}
              >
                <Text
                  style={
                    filterHidden === 'hidden'
                      ? styles.filterBtnTextActive
                      : styles.filterBtnText
                  }
                >
                  👁️ Ocultas
                </Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#5A67D8" />
              </View>
            ) : reviews.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay reseñas para mostrar</Text>
              </View>
            ) : (
              <FlatList
                data={reviews}
                renderItem={renderReviewItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            )}
          </View>
        </ScrollView>

        {/* Hide Modal */}
        <Modal
          visible={hideModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setHideModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ocultar Reseña</Text>
                <TouchableOpacity onPress={() => setHideModalVisible(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                {selectedReview && (
                  <>
                    <Text style={styles.modalLabel}>Reseña:</Text>
                    <Text style={styles.reviewQuote}>{selectedReview.comment}</Text>

                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Razón para ocultar:</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Ej: Lenguaje ofensivo, spam, contenido inapropiado..."
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        multiline
                        numberOfLines={4}
                        value={hideReason}
                        onChangeText={setHideReason}
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={hideReview}
                      disabled={submitting}
                    >
                      <LinearGradient
                        colors={['#F56565', '#E53E3E']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.submitGradient}
                      >
                        {submitting ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.submitText}>Ocultar Reseña</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}
              </View>
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
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
  },
  reviewCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewMeta: {
    flex: 1,
  },
  reviewer: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  ratingStars: {
    fontSize: 12,
  },
  reviewStatus: {
    flexDirection: 'row',
    gap: 8,
  },
  offensiveBadge: {
    backgroundColor: 'rgba(245, 101, 101, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  offensiveText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F56565',
  },
  hiddenBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hiddenText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#A855F7',
  },
  reviewComment: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    marginBottom: 8,
  },
  productInfo: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
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
    maxHeight: '70%',
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
    marginBottom: 8,
  },
  reviewQuote: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(90, 103, 216, 0.1)',
    borderRadius: 8,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
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
});
