// src/screens/profile/ProfileScreen.tsx (05 §9.8)
// The signed-in customer's own profile (C-10) + logout (C-2). Profile tab root.
//  - useProfile() → GET /profile (02 §8.2) → UserDTO
//  - useUpdateProfile() → PATCH /profile { name?, phone? }  (edit name/phone; email read-only)
//  - useChangePassword() → PATCH /profile/password { current_password, new_password }
//  - useAuth().logout() → clears the token so RootNavigator returns to Login (best-effort
//    POST /auth/logout happens inside the hook).
//
// Both forms use react-hook-form + the shared <FormField>. Server problems are surfaced
// per-field: 422 VALIDATION_ERROR maps error.details[] onto the matching fields, and a
// 401 INVALID_CREDENTIALS on password change becomes "Current password is incorrect."
// (05 §9.8 Errors). Anything else falls back to apiErrorMessage() in a banner.
import React, { useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';

import { apiErrorMessage } from '../../lib/api';
import { useProfile } from '../../hooks/queries';
import { useUpdateProfile, useChangePassword } from '../../hooks/mutations';
import { useAuth } from '../../hooks/useAuth';
import type { UserDTO, ErrorEnvelope } from '../../types/dto';
import {
  ScreenContainer,
  PrimaryButton,
  FormField,
  LoadingState,
  ErrorState,
  colors,
  spacing,
  radius,
} from '../../components';

// --- Server-error helpers (02 §3.2 envelope) -------------------------------

/** Pull the per-field VALIDATION_ERROR details (02 §3.2) off an axios error, if any. */
function fieldErrorsOf(error: unknown): Record<string, string> {
  const e = error as AxiosError<ErrorEnvelope>;
  const out: Record<string, string> = {};
  const details = e.response?.data?.error?.details;
  if (Array.isArray(details)) {
    for (const d of details) out[d.field] = d.message;
  }
  return out;
}

/** True when the response is a 401 INVALID_CREDENTIALS (wrong current password). */
function isInvalidCredentials(error: unknown): boolean {
  const e = error as AxiosError<ErrorEnvelope>;
  return (
    e.response?.status === 401 ||
    e.response?.data?.error?.code === 'INVALID_CREDENTIALS'
  );
}

// --- Profile form: edit name + phone (email immutable) ---------------------

interface ProfileFormValues {
  name: string;
  phone: string;
}

function ProfileSection({ user }: { user: UserDTO }) {
  const updateProfile = useUpdateProfile();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    defaultValues: { name: user.name, phone: user.phone ?? '' },
  });

  // Re-sync defaults if the cached profile changes underneath the form.
  useEffect(() => {
    reset({ name: user.name, phone: user.phone ?? '' });
  }, [user.name, user.phone, reset]);

  const onSubmit = (values: ProfileFormValues) => {
    const trimmedPhone = values.phone.trim();
    updateProfile.mutate(
      { name: values.name.trim(), phone: trimmedPhone === '' ? null : trimmedPhone },
      {
        onSuccess: () => Alert.alert('Saved', 'Your profile has been updated.'),
        onError: (err) => {
          const fields = fieldErrorsOf(err);
          if (fields.name) setError('name', { message: fields.name });
          if (fields.phone) setError('phone', { message: fields.phone });
        },
      },
    );
  };

  const bannerMessage =
    updateProfile.isError && Object.keys(fieldErrorsOf(updateProfile.error)).length === 0
      ? apiErrorMessage(updateProfile.error)
      : null;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Profile</Text>
      <Text style={styles.cardSubtitle}>Update your name and phone number.</Text>

      <Controller
        control={control}
        name="name"
        rules={{
          required: 'Name is required',
          minLength: { value: 2, message: 'Name must be at least 2 characters' },
          maxLength: { value: 120, message: 'Name must be at most 120 characters' },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField
            label="Name"
            placeholder="Jane Customer"
            autoCapitalize="words"
            autoComplete="name"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.name?.message}
          />
        )}
      />

      {/* Email is read-only / immutable here (02 §8.2). */}
      <View style={styles.field}>
        <Text style={styles.readonlyLabel}>Email</Text>
        <View style={styles.readonlyBox}>
          <Text style={styles.readonlyValue} selectable>
            {user.email}
          </Text>
        </View>
        <Text style={styles.hint}>Your email address cannot be changed here.</Text>
      </View>

      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField
            label="Phone"
            placeholder="+1 555 123 4567"
            keyboardType="phone-pad"
            autoComplete="tel"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.phone?.message}
          />
        )}
      />

      {bannerMessage ? <Text style={styles.banner}>{bannerMessage}</Text> : null}

      <PrimaryButton
        title="Save changes"
        onPress={handleSubmit(onSubmit)}
        loading={updateProfile.isPending}
      />
    </View>
  );
}

// --- Change-password form --------------------------------------------------

interface ChangePasswordFormValues {
  current_password: string;
  new_password: string;
}

function ChangePasswordSection() {
  const changePassword = useChangePassword();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    getValues,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    defaultValues: { current_password: '', new_password: '' },
  });

  const onSubmit = (values: ChangePasswordFormValues) => {
    changePassword.mutate(values, {
      onSuccess: () => {
        Alert.alert('Password updated', 'Your password has been changed.');
        reset({ current_password: '', new_password: '' });
      },
      onError: (err) => {
        // 401 INVALID_CREDENTIALS → wrong current password (05 §9.8 Errors).
        if (isInvalidCredentials(err)) {
          setError('current_password', { message: 'Current password is incorrect.' });
          return;
        }
        const fields = fieldErrorsOf(err);
        if (fields.current_password) {
          setError('current_password', { message: fields.current_password });
        }
        if (fields.new_password) {
          setError('new_password', { message: fields.new_password });
        }
      },
    });
  };

  const isFieldHandled =
    isInvalidCredentials(changePassword.error) ||
    Object.keys(fieldErrorsOf(changePassword.error)).length > 0;
  const bannerMessage =
    changePassword.isError && !isFieldHandled ? apiErrorMessage(changePassword.error) : null;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Change password</Text>
      <Text style={styles.cardSubtitle}>
        Use at least 8 characters with one letter and one digit.
      </Text>

      <Controller
        control={control}
        name="current_password"
        rules={{ required: 'Current password is required' }}
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField
            label="Current password"
            placeholder="••••••••"
            secureTextEntry
            autoComplete="current-password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.current_password?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="new_password"
        rules={{
          required: 'New password is required',
          minLength: { value: 8, message: 'Must be at least 8 characters' },
          maxLength: { value: 72, message: 'Must be at most 72 characters' },
          validate: {
            hasLetterAndDigit: (v) =>
              (/[A-Za-z]/.test(v) && /\d/.test(v)) ||
              'Must include at least one letter and one digit',
            differs: (v) =>
              v !== getValues('current_password') ||
              'New password must differ from the current one',
          },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField
            label="New password"
            placeholder="••••••••"
            secureTextEntry
            autoComplete="new-password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.new_password?.message}
          />
        )}
      />

      {bannerMessage ? <Text style={styles.banner}>{bannerMessage}</Text> : null}

      <PrimaryButton
        title="Update password"
        onPress={handleSubmit(onSubmit)}
        loading={changePassword.isPending}
      />
    </View>
  );
}

// --- Logout ----------------------------------------------------------------

function LogoutSection() {
  const { logout } = useAuth();

  const confirmLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to end your session on this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        // Clearing the token flips AuthProvider → RootNavigator back to Login (05 §7).
        onPress: () => {
          void logout();
        },
      },
    ]);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Sign out</Text>
      <Text style={styles.cardSubtitle}>End your session on this device.</Text>
      <PrimaryButton title="Log out" variant="secondary" onPress={confirmLogout} />
    </View>
  );
}

// --- Screen ----------------------------------------------------------------

export function ProfileScreen() {
  const { data: user, isLoading, isError, error, refetch } = useProfile();

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingState message="Loading profile…" />
      </ScreenContainer>
    );
  }

  if (isError || !user) {
    return (
      <ScreenContainer>
        <ErrorState message={apiErrorMessage(error)} onRetry={() => void refetch()} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer noPadding>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>Account</Text>
          <ProfileSection user={user} />
          <ChangePasswordSection />
          <LogoutSection />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  field: { marginBottom: spacing.lg, gap: spacing.xs },
  readonlyLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  readonlyBox: {
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  readonlyValue: { fontSize: 16, color: colors.textMuted },
  hint: { fontSize: 13, color: colors.textSubtle },
  banner: {
    fontSize: 14,
    color: colors.error,
    marginBottom: spacing.md,
  },
});
