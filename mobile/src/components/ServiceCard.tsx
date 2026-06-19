// src/components/ServiceCard.tsx
// A tappable catalog card for a ServiceDTO. Translated to RN primitives from the web
// domain/ServiceCard: shows the image (with a letter fallback when image_url is null),
// optional category badge, name, description, formatted price (DECIMAL string) and
// duration. Wrapped in a Pressable → onPress for navigation (RN has no <a>/<Link>).
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ServiceDTO } from '../types/dto';
import { formatDuration, formatMoney } from '../lib/format';
import { colors, radius, spacing } from './theme';

export interface ServiceCardProps {
  service: ServiceDTO;
  onPress: () => void;
}

export function ServiceCard({ service, onPress }: ServiceCardProps) {
  const duration = formatDuration(service.duration_minutes);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {service.image_url ? (
        <Image source={{ uri: service.image_url }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback]}>
          <Text style={styles.thumbFallbackText}>{service.name.charAt(0).toUpperCase()}</Text>
        </View>
      )}

      <View style={styles.body}>
        {service.category ? (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{service.category.name}</Text>
          </View>
        ) : null}

        <Text style={styles.title} numberOfLines={1}>
          {service.name}
        </Text>

        {service.description ? (
          <Text style={styles.desc} numberOfLines={2}>
            {service.description}
          </Text>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.price}>{formatMoney(service.price, service.currency)}</Text>
          {duration ? <Text style={styles.duration}>{duration}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },
  cardPressed: { opacity: 0.7 },
  thumb: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.border },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  thumbFallbackText: { fontSize: 24, fontWeight: '700', color: colors.textSubtle },
  body: { flex: 1, gap: spacing.xs },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0E7FF', // indigo-100
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  categoryText: { fontSize: 11, fontWeight: '600', color: '#3730A3' }, // indigo-800
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  desc: { fontSize: 13, color: colors.textMuted },
  footer: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: { fontSize: 14, fontWeight: '700', color: colors.accent },
  duration: { fontSize: 12, color: colors.textMuted },
});
