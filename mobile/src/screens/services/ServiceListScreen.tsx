// src/screens/services/ServiceListScreen.tsx (05 §9.3, modeled on the §10 full example)
// Services tab root: browse active services with optional category filter chips, tap a
// card to drill into ServiceDetail. Mirrors the §10 canonical pattern — FlatList of
// ServiceCard via useServices, loading/error/empty states, pull-to-refresh — and adds
// the horizontal category chip row backed by useCategories (C-3, C-4).
import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { apiErrorMessage } from '../../lib/api';
import { useCategories, useServices } from '../../hooks/queries';
import type { ServicesStackParamList } from '../../navigation/types';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  ServiceCard,
  colors,
  radius,
  spacing,
} from '../../components';

type Nav = NativeStackNavigationProp<ServicesStackParamList, 'ServiceList'>;

export function ServiceListScreen() {
  const navigation = useNavigation<Nav>();

  // Local UI state: which category chip is active (undefined = "All").
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);

  // Server state: services filtered by category, plus the categories for the chip row.
  const {
    data: services,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useServices({ is_active: true, category_id: selectedCategoryId });

  const { data: categories } = useCategories();

  // Category filter chips (horizontal scroller). Rendered above every state branch so
  // the user can still change the filter while a (filtered) query is loading.
  const chips = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      <CategoryChip
        label="All"
        active={selectedCategoryId === undefined}
        onPress={() => setSelectedCategoryId(undefined)}
      />
      {(categories ?? []).map((category) => (
        <CategoryChip
          key={category.id}
          label={category.name}
          active={selectedCategoryId === category.id}
          onPress={() => setSelectedCategoryId(category.id)}
        />
      ))}
    </ScrollView>
  );

  const list = services ?? [];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.heading}>Services</Text>
      {chips}

      {isLoading ? (
        <LoadingState message="Loading services…" />
      ) : isError ? (
        <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={list.length === 0 ? styles.flexGrow : styles.listPad}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="🔍"
              title="No services found"
              message={
                selectedCategoryId === undefined
                  ? 'There are no active services right now.'
                  : 'No services in this category. Try another filter.'
              }
            />
          }
          renderItem={({ item }) => (
            <ServiceCard
              service={item}
              onPress={() => navigation.navigate('ServiceDetail', { serviceId: item.id })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

interface CategoryChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function CategoryChip({ label, active, onPress }: CategoryChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.chipPressed,
      ]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  flexGrow: { flexGrow: 1 },
  listPad: { padding: spacing.lg, gap: spacing.md },
  chipRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipPressed: { opacity: 0.7 },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: colors.white },
});
