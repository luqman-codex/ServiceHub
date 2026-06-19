// src/screens/bookings/BookingHistoryScreen.tsx (05 §9.6 — Booking History, C-7/C-8)
// The Bookings tab root: a FlatList of BookingCard for the customer's own bookings.
//  - useBookings({ status }) reads GET /bookings?include=service (server scopes to self,
//    02 §5) sorted by scheduled_at desc (set in the hook's queryFn).
//  - A horizontal ScrollView of filter chips drives the local statusFilter ('ALL' or one
//    of the 6 BookingStatus values).
//  - Tapping a card navigates to BookingDetail { bookingId }.
//  - Pull-to-refresh via RefreshControl; loading / error / empty / success all handled.
import React, { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BookingsStackParamList } from '../../navigation/types';
import type { BookingStatus } from '../../types/dto';
import { useBookings } from '../../hooks/queries';
import { apiErrorMessage } from '../../lib/api';
import {
  BookingCard,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenContainer,
  colors,
  radius,
  spacing,
} from '../../components';

type BookingHistoryNav = NativeStackNavigationProp<
  BookingsStackParamList,
  'BookingHistory'
>;

type StatusFilter = 'ALL' | BookingStatus;

// 'ALL' first, then the 6 statuses in lifecycle order (05 §9.6 / 01 §4).
const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function BookingHistoryScreen() {
  const navigation = useNavigation<BookingHistoryNav>();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  // Only send a status param when a real status is selected ('ALL' → undefined).
  const bookingsQuery = useBookings({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });

  const renderFilters = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRow}
    >
      {FILTERS.map((filter) => {
        const active = filter.value === statusFilter;
        return (
          <Text
            key={filter.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => setStatusFilter(filter.value)}
            style={[styles.chip, active && styles.chipActive]}
          >
            {filter.label}
          </Text>
        );
      })}
    </ScrollView>
  );

  const renderBody = () => {
    if (bookingsQuery.isPending) {
      return <LoadingState message="Loading your bookings…" />;
    }

    if (bookingsQuery.isError) {
      return (
        <ErrorState
          message={apiErrorMessage(bookingsQuery.error)}
          onRetry={() => bookingsQuery.refetch()}
        />
      );
    }

    const bookings = bookingsQuery.data;

    if (bookings.length === 0) {
      return (
        <EmptyState
          icon="🗓️"
          title="No bookings yet"
          message={
            statusFilter === 'ALL'
              ? 'When you book a service it will show up here.'
              : 'No bookings match this filter.'
          }
        />
      );
    }

    return (
      <FlatList
        data={bookings}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            onPress={() =>
              navigation.navigate('BookingDetail', { bookingId: item.id })
            }
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={bookingsQuery.isRefetching}
            onRefresh={() => bookingsQuery.refetch()}
            tintColor={colors.primary}
          />
        }
      />
    );
  };

  return (
    <ScreenContainer>
      <Text style={styles.heading}>My bookings</Text>
      {renderFilters()}
      <View style={styles.bodyWrap}>{renderBody()}</View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  filterRow: { gap: spacing.sm, paddingVertical: spacing.xs, paddingRight: spacing.lg },
  chip: {
    overflow: 'hidden',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    color: colors.white,
  },
  bodyWrap: { flex: 1, marginTop: spacing.sm },
  listContent: { paddingBottom: spacing.xl },
  separator: { height: spacing.md },
});
