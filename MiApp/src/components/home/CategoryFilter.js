import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

const CATEGORIES = [
  { id: '1', name: 'Kobord', color: '#1db8a6', icon: '🎧' },
  { id: '2', name: 'Moda', color: '#6cc04d', icon: '👕' },
  { id: '3', name: 'Tecnología', color: '#1db8a6', icon: '💻' },
  { id: '4', name: 'Coches', color: '#ffc107', icon: '🚗' },
  { id: '5', name: 'Hogar', color: '#2563eb', icon: '🏠' },
  { id: '6', name: 'Libros', color: '#6dd5ed', icon: '📚' },
];

export default function CategoryFilter({ selectedCategory, onSelectCategory }) {
  return (
    <View style={styles.categoriesSection}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => onSelectCategory(selectedCategory === cat.name ? '' : cat.name)}
            style={[
              styles.categoryTag,
              selectedCategory === cat.name && { backgroundColor: cat.color, opacity: 1 }
            ]}
          >
            <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
            <Text style={[
              styles.categoryTagText,
              selectedCategory === cat.name && styles.categoryTagTextActive
            ]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  categoriesSection: {
    marginBottom: 20,
  },
  categoriesContent: {
    paddingHorizontal: 16,
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
    fontSize: 12,
    color: '#e2e8f0',
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
});
