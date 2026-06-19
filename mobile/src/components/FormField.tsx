// src/components/FormField.tsx
// A labeled text input with inline error text (04 §7.4: labels above inputs, inline
// field errors). Designed to drop into react-hook-form's <Controller>: pass the
// field's `value`, `onChangeText` (← field.onChange), `onBlur`, and the resolved
// `error` message. RN has no <form>/<label>; this composes View + Text + TextInput.
import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
} from 'react-native';
import { colors, radius, spacing } from './theme';

export interface FormFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Resolved error message (e.g. errors.email?.message from react-hook-form). */
  error?: string;
  /** Extra style merged onto the inner TextInput (e.g. taller multiline boxes). */
  inputStyle?: StyleProp<TextStyle>;
}

export function FormField({ label, error, inputStyle, ...inputProps }: FormFieldProps) {
  const hasError = Boolean(error);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textSubtle}
        style={[styles.input, hasError && styles.inputError, inputStyle]}
        {...inputProps}
      />
      {hasError ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs, marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.white,
  },
  inputError: { borderColor: colors.error },
  errorText: { fontSize: 13, color: colors.error },
});
