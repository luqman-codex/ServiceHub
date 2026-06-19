// src/components/LoadingState.tsx
// Centered loading spinner with an optional message — the "loading" branch every
// data screen must render (05 §9; mirrors the §10 ServiceList example). Fills its
// parent so it can be returned directly from a screen body.
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from './theme';

export interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading…' }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  message: { color: colors.textMuted, fontSize: 14 },
});
