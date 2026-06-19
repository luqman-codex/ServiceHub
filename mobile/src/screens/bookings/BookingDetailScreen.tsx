// src/screens/bookings/BookingDetailScreen.tsx (05 §9.7 — Booking Detail, C-8/C-9)
// Show one booking end-to-end: service, scheduled_at, status, address, notes, a timeline
// of transition timestamps, price, provider (if assigned), and payment (bonus C-11).
//  - useBooking(bookingId) reads GET /bookings/:id?include=service,provider,payment.
//  - Cancel (useCancelBooking) is shown only while PENDING, or ACCEPTED with a future
//    scheduled_at (05 §9.7 gating); server is authoritative (02 §9.1). Confirm via Alert.
//  - Pay (bonus): POST /bookings/:id/payment is fired through the shared axios instance
//    (no dedicated hook exists in mutations.ts), then we refetch the booking so the
//    eager-loaded payment relation updates.
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useRoute, type RouteProp } from '@react-navigation/native';
import type { BookingsStackParamList } from '../../navigation/types';
import type { BookingDTO } from '../../types/dto';
import { useBooking } from '../../hooks/queries';
import { useCancelBooking } from '../../hooks/mutations';
import { api, apiErrorMessage } from '../../lib/api';
import { formatDateTime, formatMoney } from '../../lib/format';
import {
  ErrorState,
  LoadingState,
  PrimaryButton,
  ScreenContainer,
  StatusBadge,
  colors,
  radius,
  spacing,
} from '../../components';

type BookingDetailRouteProp = RouteProp<BookingsStackParamList, 'BookingDetail'>;

// 05 §9.7 cancel gating: PENDING any time, or ACCEPTED while scheduled_at is in the future.
function canCancel(booking: BookingDTO): boolean {
  if (booking.status === 'PENDING') return true;
  if (booking.status === 'ACCEPTED') {
    return new Date(booking.scheduled_at).getTime() > Date.now();
  }
  return false;
}

// A single labeled timeline row, rendered only when its timestamp is present.
function TimelineRow({ label, at }: { label: string; at: string | null }) {
  if (!at) return null;
  return (
    <View style={styles.timelineRow}>
      <Text style={styles.timelineLabel}>{label}</Text>
      <Text style={styles.timelineValue}>{formatDateTime(at)}</Text>
    </View>
  );
}

export function BookingDetailScreen() {
  const route = useRoute<BookingDetailRouteProp>();
  const { bookingId } = route.params;
  const qc = useQueryClient();

  const bookingQuery = useBooking(bookingId);
  const cancelBooking = useCancelBooking();

  const [paying, setPaying] = useState(false);

  if (bookingQuery.isPending) {
    return (
      <ScreenContainer>
        <LoadingState message="Loading booking…" />
      </ScreenContainer>
    );
  }

  if (bookingQuery.isError) {
    return (
      <ScreenContainer>
        <ErrorState
          message={apiErrorMessage(bookingQuery.error)}
          onRetry={() => bookingQuery.refetch()}
        />
      </ScreenContainer>
    );
  }

  const booking = bookingQuery.data;
  const serviceName = booking.service?.name ?? `Booking #${booking.id}`;
  const showCancel = canCancel(booking);
  // Bonus pay (C-11): offer payment once work is settled and none has been recorded.
  const showPay =
    !booking.payment &&
    (booking.status === 'COMPLETED' || booking.status === 'ACCEPTED');

  const confirmCancel = () => {
    Alert.alert(
      'Cancel booking',
      'Are you sure you want to cancel this booking? This cannot be undone.',
      [
        { text: 'Keep booking', style: 'cancel' },
        {
          text: 'Cancel booking',
          style: 'destructive',
          onPress: () => {
            cancelBooking.mutate(
              { id: booking.id, cancellation_reason: 'Cancelled by customer' },
              {
                onError: (err) => {
                  // Surface the server's authoritative reason (e.g. 409, 02 §9.1).
                  Alert.alert('Could not cancel', apiErrorMessage(err));
                },
              },
            );
          },
        },
      ],
    );
  };

  const payNow = () => {
    setPaying(true);
    api
      .post(`/bookings/${booking.id}/payment`, { method: 'MOCK', status: 'PAID' })
      .then(() => {
        // Refresh the booking so the eager-loaded payment relation appears.
        void qc.invalidateQueries({ queryKey: ['booking', booking.id] });
        void qc.invalidateQueries({ queryKey: ['bookings'] });
        Alert.alert('Payment recorded', 'Your payment was recorded successfully.');
      })
      .catch((err) => {
        Alert.alert('Payment failed', apiErrorMessage(err));
      })
      .finally(() => {
        setPaying(false);
      });
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{serviceName}</Text>
          <StatusBadge status={booking.status} />
        </View>

        <View style={styles.card}>
          <DetailRow label="Scheduled for" value={formatDateTime(booking.scheduled_at)} />
          <DetailRow
            label="Total price"
            value={formatMoney(booking.total_price, booking.currency)}
          />
          {booking.address ? (
            <DetailRow label="Address" value={booking.address} />
          ) : null}
          {booking.notes ? <DetailRow label="Notes" value={booking.notes} /> : null}
        </View>

        {booking.provider ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Provider</Text>
            <DetailRow label="Name" value={booking.provider.name} />
            {booking.provider.phone ? (
              <DetailRow label="Phone" value={booking.provider.phone} />
            ) : null}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <TimelineRow label="Requested" at={booking.created_at} />
          <TimelineRow label="Accepted" at={booking.accepted_at} />
          <TimelineRow label="Started" at={booking.started_at} />
          <TimelineRow label="Completed" at={booking.completed_at} />
          <TimelineRow label="Cancelled" at={booking.cancelled_at} />
          {booking.cancellation_reason ? (
            <DetailRow label="Reason" value={booking.cancellation_reason} />
          ) : null}
        </View>

        {booking.payment ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <DetailRow
              label="Amount"
              value={formatMoney(booking.payment.amount, booking.payment.currency)}
            />
            <DetailRow label="Method" value={booking.payment.method} />
            <DetailRow label="Status" value={booking.payment.status} />
            {booking.payment.paid_at ? (
              <DetailRow label="Paid at" value={formatDateTime(booking.payment.paid_at)} />
            ) : null}
          </View>
        ) : null}

        {showPay ? (
          <PrimaryButton
            title="Pay now"
            onPress={payNow}
            loading={paying}
            style={styles.action}
          />
        ) : null}

        {showCancel ? (
          <PrimaryButton
            title="Cancel booking"
            variant="secondary"
            onPress={confirmCancel}
            loading={cancelBooking.isPending}
            style={styles.action}
          />
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

// A label/value line used throughout the detail cards.
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl, gap: spacing.md },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { flex: 1, fontSize: 22, fontWeight: '700', color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  detailLabel: { fontSize: 14, color: colors.textMuted },
  detailValue: { flex: 1, fontSize: 14, color: colors.text, textAlign: 'right', fontWeight: '500' },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  timelineLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  timelineValue: { fontSize: 13, color: colors.textMuted },
  action: { marginTop: spacing.xs },
});
