import { StyleSheet, Platform, StatusBar } from 'react-native';

const getPaddingTop = () => {
  if (Platform.OS === 'android') {
    return StatusBar.currentHeight || 0;
  }
  return 0;
};

export const profileStyles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: getPaddingTop(),
  },
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  backBtn: {
    fontSize: 28,
    color: '#e5e7eb',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e5e7eb',
  },

  /* Profile Section */
  profileSection: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  avatarPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: 72,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#0f172a',
  },
  editAvatarIcon: {
    fontSize: 18,
  },

  /* User Info */
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#e6edf3',
    marginBottom: 4,
  },
  userStatus: {
    fontSize: 14,
    color: '#8b949e',
    fontWeight: '500',
    marginBottom: 2,
  },
  userLocation: {
    fontSize: 13,
    color: '#8b949e',
    marginBottom: 16,
  },

  /* Edit Button */
  editProfileBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 20,
  },
  editProfileBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  /* Stats */
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#e6edf3',
  },
  statLabel: {
    fontSize: 11,
    color: '#8b949e',
    fontWeight: '600',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#1f2937',
  },

  /* Tabs */
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    marginTop: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b949e',
  },
  tabTextActive: {
    color: '#2563eb',
    fontWeight: '700',
  },

  /* Tab Content */
  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  /* Product Item */
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  productItemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#111827',
  },
  productItemImageContent: {
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
    fontSize: 24,
  },
  productItemInfo: {
    flex: 1,
    paddingRight: 10,
  },
  productItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e6edf3',
    marginBottom: 4,
  },
  productItemDate: {
    fontSize: 12,
    color: '#8b949e',
  },
  productItemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E94560',
    marginBottom: 8,
  },
  productItemRight: {
    minWidth: 130,
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
  },
  markSoldBtn: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#2f3b4a',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  markSoldBtnText: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 12,
  },

  /* Empty Tab */
  emptyTab: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },

  /* Review Item */
  reviewItem: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reviewAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  reviewInfo: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e6edf3',
    marginBottom: 4,
  },
  reviewStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    fontSize: 12,
    color: '#fbbf24',
  },
  reviewDate: {
    fontSize: 12,
    color: '#8b949e',
    marginLeft: 4,
  },
  reviewComment: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 20,
  },

  /* Buttons */
  publishBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#E94560',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'center',
    maxWidth: 280,
  },
  publishBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  logoutBtn: {
    marginHorizontal: 16,
    backgroundColor: '#111827',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
    alignSelf: 'center',
    maxWidth: 280,
  },
  logoutBtnText: {
    color: '#E94560',
    fontWeight: '700',
    fontSize: 13,
  },

  /* Modal editar perfil */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    color: '#e6edf3',
    fontWeight: '700',
    marginBottom: 4,
  },
  modalLabel: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  modalInput: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#e6edf3',
    fontSize: 14,
  },
  modalAvatarBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#1d4ed8',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  modalAvatarText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  modalCancel: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  modalCancelText: {
    color: '#e6edf3',
    fontWeight: '600',
  },
  modalSave: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#22c55e',
  },
  modalSaveDisabled: {
    backgroundColor: '#166534',
  },
  modalSaveText: {
    color: '#fff',
    fontWeight: '700',
  },

  /* Bottom Nav */
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    paddingBottom: Platform.OS === 'ios' ? 10 : 6,
  },
  navItem: {
    fontSize: 22,
    color: '#9ca3af',
    paddingVertical: 6,
    paddingHorizontal: 20,
    gap: 4,
    color: '#cbd5e1',
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  navIcon: {
    fontSize: 24,
    color: '#6b7280',
    fontWeight: '400',
  },
  navIconActive: {
    color: '#6b7280',
    fontWeight: '400',
  },
  navLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#6b7280',
  },
});
