// src/components/StatusBadge.tsx
// Booking status → colored pill. Mirrors the web BookingStatusBadge and uses the
// canonical status → color mapping from 04 §7.3 (verbatim hues), translated to RN
// background/text colors. Color is never the sole signal — the label text is shown
// too (04 §7.4 accessibility).
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BookingStatus } from '../types/dto';
import { radius, spacing } from './theme';

interface BadgeColor {
  bg: string;
  text: string;
}

// 04 §7.3: amber / blue / indigo / green / red / slate (Tailwind 100 bg, 800 text).
const STATUS_COLOR: Record<BookingStatus, BadgeColor> = {
  PENDING: { bg: '#FEF3C7', text: '#92400E' }, // amber-100 / amber-800
  ACCEPTED: { bg: '#DBEAFE', text: '#1E40AF' }, // blue-100 / blue-800
  IN_PROGRESS: { bg: '#E0E7FF', text: '#3730A3' }, // indigo-100 / indigo-800
  COMPLETED: { bg: '#DCFCE7', text: '#166534' }, // green-100 / green-800
  REJECTED: { bg: '#FEE2E2', text: '#991B1B' }, // red-100 / red-800
  CANCELLED: { bg: '#F1F5F9', text: '#334155' }, // slate-100 / slate-700
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

export interface StatusBadgeProps {
  status: BookingStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { bg, text } = STATUS_COLOR[status];
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  label: { fontSize: 12, fontWeight: '700' },
});
