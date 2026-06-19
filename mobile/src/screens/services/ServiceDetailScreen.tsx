// src/screens/services/ServiceDetailScreen.tsx (05 §9.4)
// Service detail (C-5): show one service — header image (with fallback), name,
// category, description, price + currency, duration — with a "Book this service" CTA
// that pushes CreateBooking { serviceId }. Data via useService(serviceId) (include=category).
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { apiErrorMessage } from '../../lib/api';
import { useService } from '../../hooks/queries';
import { formatDuration, formatMoney } from '../../lib/format';
import type { ServicesStackParamList } from '../../navigation/types';
import { ErrorState, LoadingState, PrimaryButton, colors, radius, spacing } from '../../components';

type Nav = NativeStackNavigationProp<ServicesStackParamList, 'ServiceDetail'>;
type Route = RouteProp<ServicesStackParamList, 'ServiceDetail'>;

export function ServiceDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { serviceId } = params;

  const { data: service, isLoading, isError, error, refetch } = useService(serviceId);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <LoadingState message="Loading service…" />
      </SafeAreaView>
    );
  }

  if (isError || !service) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <ErrorState
          message={isError ? apiErrorMessage(error) : 'This service is no longer available.'}
          onRetry={() => refetch()}
        />
      </SafeAreaView>
    );
  }

  const duration = formatDuration(service.duration_minutes);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {service.image_url ? (
          <Image source={{ uri: service.image_url }} style={styles.hero} />
        ) : (
          <View style={[styles.hero, styles.heroFallback]}>
            <Text style={styles.heroFallbackText}>{service.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}

        <View style={styles.body}>
          {service.category ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{service.category.name}</Text>
            </View>
          ) : null}

          <Text style={styles.title}>{service.name}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.price}>{formatMoney(service.price, service.currency)}</Text>
            {duration ? <Text style={styles.duration}>{duration}</Text> : null}
          </View>

          {service.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this service</Text>
              <Text style={styles.description}>{service.description}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Book this service"
          onPress={() => navigation.navigate('CreateBooking', { serviceId: service.id })}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xl },
  hero: { width: '100%', height: 220, backgroundColor: colors.border },
  heroFallback: { alignItems: 'center', justifyContent: 'center' },
  heroFallbackText: { fontSize: 72, fontWeight: '700', color: colors.textSubtle },
  body: { padding: spacing.lg, gap: spacing.md },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0E7FF', // indigo-100
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  categoryText: { fontSize: 12, fontWeight: '600', color: '#3730A3' }, // indigo-800
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  price: { fontSize: 20, fontWeight: '700', color: colors.accent },
  duration: { fontSize: 15, color: colors.textMuted },
  section: { marginTop: spacing.sm, gap: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  description: { fontSize: 15, lineHeight: 22, color: colors.textMuted },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
