// src/components/PrimaryButton.tsx
// The app's primary call-to-action button. A Pressable + Text (RN has no <button>),
// with built-in loading (ActivityIndicator, no double-submit) and disabled states
// per the form-feedback principles in 04 §7.4. A `variant="secondary"` outline style
// is provided for less prominent actions (e.g. Cancel).
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors, radius, spacing } from './theme';

export interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;
  const isSecondary = variant === 'secondary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isSecondary ? styles.secondary : styles.primary,
        pressed && !isDisabled && (isSecondary ? styles.secondaryPressed : styles.primaryPressed),
        isDisabled && (isSecondary ? styles.secondaryDisabled : styles.primaryDisabled),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? colors.primary : colors.white} />
      ) : (
        <Text style={[styles.label, isSecondary ? styles.secondaryLabel : styles.primaryLabel]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  primaryPressed: { backgroundColor: colors.primaryDark },
  primaryDisabled: { backgroundColor: colors.disabled },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryPressed: { backgroundColor: colors.surface },
  secondaryDisabled: { borderColor: colors.disabled },
  label: { fontSize: 16, fontWeight: '600' },
  primaryLabel: { color: colors.white },
  secondaryLabel: { color: colors.primary },
});
