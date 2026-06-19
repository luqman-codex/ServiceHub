// src/screens/bookings/CreateBookingScreen.tsx (05 §9.5 — Create Booking, C-6)
// Pick a future date + time and optional address/notes, then create a PENDING booking.
//  - serviceId arrives as a route param (ServicesStackParamList).
//  - scheduled_at is chosen with @react-native-community/datetimepicker (date then time)
//    and sent as a future ISO-8601 UTC string via Date.toISOString() (02 §8.6, §12).
//  - address/notes are managed by react-hook-form; useCreateBooking POSTs /bookings,
//    invalidates ['bookings'], then we navigate to the new BookingDetail (05 §9.5).
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type {
  BookingsStackParamList,
  ServicesStackParamList,
} from '../../navigation/types';
import { useService } from '../../hooks/queries';
import { useCreateBooking } from '../../hooks/mutations';
import { apiErrorMessage } from '../../lib/api';
import { formatMoney } from '../../lib/format';
import {
  DateTimeInput,
  ErrorState,
  FormField,
  LoadingState,
  PrimaryButton,
  ScreenContainer,
  colors,
  radius,
  spacing,
} from '../../components';

type CreateBookingRouteProp = RouteProp<ServicesStackParamList, 'CreateBooking'>;
// On success we hop the user over to the Bookings tab's detail screen.
type BookingsNav = NativeStackNavigationProp<BookingsStackParamList, 'BookingDetail'>;

interface CreateBookingForm {
  address: string;
  notes: string;
}

// Returns the next round 30-minute slot so the default is always in the future.
function defaultScheduledAt(): Date {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 30);
  return d;
}

export function CreateBookingScreen() {
  const route = useRoute<CreateBookingRouteProp>();
  const navigation = useNavigation<BookingsNav>();
  const { serviceId } = route.params;

  const serviceQuery = useService(serviceId);
  const createBooking = useCreateBooking();

  const [scheduledAt, setScheduledAt] = useState<Date>(defaultScheduledAt);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateBookingForm>({
    defaultValues: { address: '', notes: '' },
  });

  const isFuture = scheduledAt.getTime() > Date.now();

  const onSubmit = (values: CreateBookingForm) => {
    setSubmitError(null);

    // Mirror the server rule (02 §12): scheduled_at must be strictly in the future.
    if (!isFuture) {
      setSubmitError('Please choose a date and time in the future.');
      return;
    }

    createBooking.mutate(
      {
        service_id: serviceId,
        scheduled_at: scheduledAt.toISOString(),
        address: values.address.trim() ? values.address.trim() : null,
        notes: values.notes.trim() ? values.notes.trim() : null,
      },
      {
        onSuccess: (created) => {
          navigation.navigate('BookingDetail', { bookingId: created.id });
        },
        onError: (err) => {
          setSubmitError(apiErrorMessage(err));
        },
      },
    );
  };

  if (serviceQuery.isPending) {
    return (
      <ScreenContainer>
        <LoadingState message="Loading service…" />
      </ScreenContainer>
    );
  }

  if (serviceQuery.isError) {
    return (
      <ScreenContainer>
        <ErrorState
          message={apiErrorMessage(serviceQuery.error)}
          onRetry={() => serviceQuery.refetch()}
        />
      </ScreenContainer>
    );
  }

  const service = serviceQuery.data;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Book this service</Text>

        <View style={styles.summary}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.price}>
            {formatMoney(service.price, service.currency)}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Date & time</Text>
          <DateTimeInput
            value={scheduledAt}
            onChange={setScheduledAt}
            minimumDate={new Date()}
            hasError={!isFuture}
          />
          {!isFuture ? (
            <Text style={styles.fieldError}>
              Please choose a date and time in the future.
            </Text>
          ) : null}
        </View>

        <Controller
          control={control}
          name="address"
          render={({ field: { value, onChange, onBlur } }) => (
            <FormField
              label="Address (optional)"
              placeholder="Where should the provider go?"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.address?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field: { value, onChange, onBlur } }) => (
            <FormField
              label="Notes (optional)"
              placeholder="Anything the provider should know?"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={4}
              inputStyle={styles.notesInput}
              error={errors.notes?.message}
            />
          )}
        />

        {submitError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{submitError}</Text>
          </View>
        ) : null}

        <PrimaryButton
          title="Confirm booking"
          onPress={handleSubmit(onSubmit)}
          loading={createBooking.isPending}
          disabled={!isFuture}
        />

        {createBooking.isPending ? (
          <View style={styles.pendingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.pendingText}>Creating your booking…</Text>
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl, gap: spacing.md },
  heading: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  serviceName: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  price: { fontSize: 16, fontWeight: '700', color: colors.accent },
  field: { gap: spacing.xs, marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  pickerButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  pickerButtonPressed: { backgroundColor: colors.surface },
  pickerButtonError: { borderColor: colors.error },
  pickerText: { flex: 1, fontSize: 16, color: colors.text },
  pickerHint: { fontSize: 14, fontWeight: '600', color: colors.primary },
  fieldError: { fontSize: 13, color: colors.error },
  notesInput: { minHeight: 96, textAlignVertical: 'top', paddingTop: spacing.sm },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  errorBannerText: { color: colors.error, fontSize: 14 },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pendingText: { color: colors.textMuted, fontSize: 14 },
});
