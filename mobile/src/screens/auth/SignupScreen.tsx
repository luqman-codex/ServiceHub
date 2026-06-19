// src/screens/auth/SignupScreen.tsx (05 §9.2)
// Self-service signup. POST /auth/register ALWAYS creates a CUSTOMER (02 §8.1) and
// returns an AuthResultDTO, so we auto-login on success.
//
// Flow: react-hook-form collects { name, email, password, phone? } with rules
// mirroring 02 §12 (name 2–120; valid email; password 8–72 incl. ≥1 letter & ≥1
// digit; phone regex) → useRegister() → on success auth.register(result) saves the
// token + sets the user, flipping RootNavigator over to AppTabs. The server stays
// authoritative: 422 details[] map onto fields; 409 EMAIL_ALREADY_EXISTS maps to the
// email field; 429/other become a form-level message.
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AxiosError } from 'axios';

import { ScreenContainer, FormField, PrimaryButton, colors, spacing } from '../../components';
import { apiErrorMessage } from '../../lib/api';
import { useRegister, type RegisterRequest } from '../../hooks/mutations';
import { useAuth } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/types';
import type { ErrorEnvelope } from '../../types/dto';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

interface SignupFormValues {
  name: string;
  email: string;
  password: string;
  phone: string;
}

// Validation mirrors 02 §12 (server remains authoritative on 422).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;
const PHONE_RE = /^\+?[0-9 ()-]{7,30}$/;

// react-hook-form's setError needs a field name it knows about.
const KNOWN_FIELDS: ReadonlyArray<keyof SignupFormValues> = [
  'name',
  'email',
  'password',
  'phone',
];

export function SignupScreen() {
  const navigation = useNavigation<Nav>();
  const auth = useAuth();
  const registerMutation = useRegister();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupFormValues>({
    defaultValues: { name: '', email: '', password: '', phone: '' },
  });

  const onSubmit = (values: SignupFormValues) => {
    setFormError(null);
    const phone = values.phone.trim();
    const body: RegisterRequest = {
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
      // phone is optional (02 §6) — only send it when provided.
      ...(phone ? { phone } : {}),
    };
    registerMutation.mutate(body, {
      onSuccess: async (result) => {
        // Auto-login → RootNavigator swaps to AppTabs (05 §9.2).
        await auth.register(result);
      },
      onError: (error) => {
        const e = error as AxiosError<ErrorEnvelope>;
        const code = e.response?.data?.error?.code;
        const details = e.response?.data?.error?.details;
        // 422 → map per-field validation errors onto the form (02 §3.2).
        if (code === 'VALIDATION_ERROR' && details?.length) {
          details.forEach((d) => {
            const field = d.field as keyof SignupFormValues;
            if (KNOWN_FIELDS.includes(field)) {
              setError(field, { message: d.message });
            }
          });
          return;
        }
        const status = e.response?.status;
        // 409 → email already registered (05 §9.2 error map).
        if (status === 409 || code === 'EMAIL_ALREADY_EXISTS') {
          setError('email', { message: 'That email is already registered.' });
          return;
        }
        if (status === 429 || code === 'RATE_LIMITED') {
          setFormError('Too many attempts, try again shortly.');
        } else {
          setFormError(apiErrorMessage(error));
        }
      },
    });
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Sign up to book and track services.</Text>
          </View>

          {formError ? (
            <View style={styles.formError} accessibilityRole="alert">
              <Text style={styles.formErrorText}>{formError}</Text>
            </View>
          ) : null}

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
                label="Full name"
                placeholder="Jane Doe"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                autoCapitalize="words"
                textContentType="name"
                returnKeyType="next"
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            rules={{
              required: 'Email is required',
              pattern: { value: EMAIL_RE, message: 'Enter a valid email address' },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                label="Email"
                placeholder="you@example.com"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                returnKeyType="next"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            rules={{
              required: 'Password is required',
              pattern: {
                value: PASSWORD_RE,
                message: 'Use 8–72 characters with at least one letter and one number',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                label="Password"
                placeholder="At least 8 characters"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                returnKeyType="next"
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            rules={{
              validate: (value) =>
                value.trim().length === 0 ||
                PHONE_RE.test(value.trim()) ||
                'Enter a valid phone number',
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                label="Phone (optional)"
                placeholder="+1 555 123 4567"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.phone?.message}
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="telephoneNumber"
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
              />
            )}
          />

          <PrimaryButton
            title="Create account"
            onPress={handleSubmit(onSubmit)}
            loading={registerMutation.isPending}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Have an account? </Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => navigation.navigate('Login')}
              hitSlop={8}
            >
              <Text style={styles.link}>Log in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xl, flexGrow: 1 },
  header: { marginTop: spacing.lg, marginBottom: spacing.xl, gap: spacing.xs },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 15, color: colors.textMuted },
  formError: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  formErrorText: { color: colors.error, fontSize: 14 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: { fontSize: 14, color: colors.textMuted },
  link: { fontSize: 14, fontWeight: '600', color: colors.primary },
});
