// src/components/BookingCard.tsx
// A tappable summary card for a BookingDTO, used in the Booking History list (05 §9,
// 04 §B.6). Shows the service name (from the eager-loaded service relation, with a
// fallback), the scheduled date/time, the formatted total price, and a StatusBadge.
// Wrapped in a Pressable → onPress for navigation to Booking Detail.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BookingDTO } from '../types/dto';
import { formatDateTime, formatMoney } from '../lib/format';
import { StatusBadge } from './StatusBadge';
import { colors, radius, spacing } from './theme';

export interface BookingCardProps {
  booking: BookingDTO;
  onPress: () => void;
}

export function BookingCard({ booking, onPress }: BookingCardProps) {
  const serviceName = booking.service?.name ?? `Booking #${booking.id}`;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {serviceName}
        </Text>
        <StatusBadge status={booking.status} />
      </View>

      <Text style={styles.date}>{formatDateTime(booking.scheduled_at)}</Text>

      <Text style={styles.price}>
        {formatMoney(booking.total_price, booking.currency)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  cardPressed: { opacity: 0.7 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  date: { fontSize: 13, color: colors.textMuted },
  price: { fontSize: 14, fontWeight: '700', color: colors.accent },
});
