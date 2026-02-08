import { StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';

const PADDING = 16;

const getPaddingTop = () => {
  if (Platform.OS === 'android') {
    return StatusBar.currentHeight || 0;
  }
  return 0;
};

export const homeStyles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0d1117',
    paddingTop: getPaddingTop(),
  },
  container: {
    flex: 1,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PADDING,
    paddingVertical: 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    gap: 8,
  },
  logoText: {
    fontSize: 28,
    marginRight: 4,
    minWidth: 32,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#1d4ed8',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    marginHorizontal: 4,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
    color: '#93c5fd',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#e6edf3',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginLeft: 'auto',
  },
  messagesBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E94560',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  profileAvatar: {
    width: 40,
    height: 40,
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },

  /* Loading */
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#8b949e',
    marginTop: 12,
    fontSize: 14,
  },

  /* Hero Banner */
  heroBanner: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: PADDING,
    marginTop: 12,
    marginBottom: 20,
    minHeight: 'auto',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#22304a',
    gap: 16,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  heroCol: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  heroTextColumn: {
    flex: 1,
    paddingLeft: 0,
    gap: 10,
    alignItems: 'flex-start',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#111827',
    color: '#7dd3fc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: '#1d4ed8',
  },
  heroBannerTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#f8fafc',
    marginBottom: 6,
    letterSpacing: -0.4,
    textAlign: 'left',
    lineHeight: 34,
  },
  heroBannerSubtitle: {
    fontSize: 16,
    color: '#cbd5e1',
    marginBottom: 18,
    lineHeight: 24,
    textAlign: 'left',
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroPrimaryBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 10,
  },
  heroPrimaryText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  heroGhostBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  heroGhostText: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 13,
  },
  heroBannerImage: {
    width: 210,
    height: 210,
    borderRadius: 14,
    marginRight: 16,
  },
  heroBannerImageMobile: {
    width: 140,
    height: 140,
    borderRadius: 14,
    marginBottom: 8,
  },

  /* Section Header */
  sectionHeader: {
    paddingHorizontal: PADDING,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e6edf3',
  },

  /* Categorías */
  categoriesSection: {
    marginBottom: 20,
  },
  categoriesContent: {
    paddingHorizontal: PADDING,
    gap: 8,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  categoryTagText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  categoryTagTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  /* Productos */
  row: {
    justifyContent: 'flex-start',
    marginBottom: 12,
    gap: 12,
    paddingHorizontal: 0,
  },
  productCard: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1f2937',
  },

  /* Imagen */
  imageWrapper: {
    backgroundColor: '#111827',
    position: 'relative',
    overflow: 'hidden',
  },
  productImage: {
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
    fontSize: 32,
    color: '#cbd5e1',
  },

  /* Badges */
  priceBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#111827',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  priceBadgeText: {
    color: '#e6edf3',
    fontSize: 11,
    fontWeight: '700',
  },
  likeBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(17,24,39,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  likeBtnIcon: {
    fontSize: 16,
    color: '#fff',
  },

  /* Info */
  productInfo: {
    padding: 8,
  },
  productTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#e6edf3',
    marginBottom: 2,
    lineHeight: 14,
  },
  productSeller: {
    fontSize: 9,
    color: '#94a3b8',
    marginBottom: 2,
    fontStyle: 'italic',
  },
  productLocation: {
    fontSize: 10,
    color: '#cbd5e1',
    marginBottom: 2,
  },
  productsGrid: {
    paddingHorizontal: PADDING,
    paddingTop: 8,
    paddingBottom: 8,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 1320,
  },

  /* Empty State */
  emptyState: {
    gap: 8,
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: PADDING,
  },
  emptyIcon: {
    fontSize: 24,
  },
  emptyTitle: {
    fontSize: 14,
    color: '#cbd5e1',
    marginTop: 6,
  },

  /* FAB */
  fab: {
    position: 'absolute',
    bottom: 84,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E94560',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E94560',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabIcon: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 20,
    gap: 4,
  },
  navItemActive: {
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
