// src/screens/auth/LoginScreen.tsx (05 §9.1)
// Auth-stack start screen. Authenticates an existing CUSTOMER and stores the JWT.
//
// Flow: react-hook-form collects { email, password } → useLogin() (POST /auth/login,
// 02 §8.1) → on success auth.login(result) saves the token + sets the user, which
// flips RootNavigator over to AppTabs. Failures are surfaced inline: 422 maps the
// error envelope's details[] onto the offending fields; 401/403/429 (and anything
// else) become a form-level message via apiErrorMessage.
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { useLogin, type LoginRequest } from '../../hooks/mutations';
import { useAuth } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/types';
import type { ErrorEnvelope } from '../../types/dto';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface LoginFormValues {
  email: string;
  password: string;
}

// Basic email shape check (server is authoritative on 422).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const auth = useAuth();
  const loginMutation = useLogin();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (values: LoginFormValues) => {
    setFormError(null);
    const body: LoginRequest = {
      email: values.email.trim(),
      password: values.password,
    };
    loginMutation.mutate(body, {
      onSuccess: async (result) => {
        // Persist token + set user → RootNavigator swaps to AppTabs (05 §9.1).
        await auth.login(result);
      },
      onError: (error) => {
        const e = error as AxiosError<ErrorEnvelope>;
        const code = e.response?.data?.error?.code;
        const details = e.response?.data?.error?.details;
        // 422 → map per-field validation errors onto the form (02 §3.2).
        if (code === 'VALIDATION_ERROR' && details?.length) {
          details.forEach((d) => {
            if (d.field === 'email' || d.field === 'password') {
              setError(d.field, { message: d.message });
            }
          });
          return;
        }
        // 401/403/429/other → form-level message (05 §9.1 error map).
        const status = e.response?.status;
        if (status === 401 || code === 'INVALID_CREDENTIALS') {
          setFormError('Email or password is incorrect.');
        } else if (status === 403 || code === 'ACCOUNT_INACTIVE') {
          setFormError('Your account is disabled.');
        } else if (status === 429 || code === 'RATE_LIMITED') {
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
        <View style={styles.flex}>
          <View style={styles.header}>
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.subtitle}>Welcome back — sign in to continue.</Text>
          </View>

          {formError ? (
            <View style={styles.formError} accessibilityRole="alert">
              <Text style={styles.formErrorText}>{formError}</Text>
            </View>
          ) : null}

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
            rules={{ required: 'Password is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                label="Password"
                placeholder="Your password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
              />
            )}
          />

          <PrimaryButton
            title="Sign in"
            onPress={handleSubmit(onSubmit)}
            loading={loginMutation.isPending}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => navigation.navigate('Signup')}
              hitSlop={8}
            >
              <Text style={styles.link}>Create account</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { marginTop: spacing.xl, marginBottom: spacing.xl, gap: spacing.xs },
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
