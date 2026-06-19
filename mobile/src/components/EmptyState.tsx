// src/components/EmptyState.tsx
// Friendly empty placeholder with an emoji/icon and message — the "empty" branch
// every list screen must render (05 §9; 04 §7.4: friendly empties with a next action).
// Optionally renders a call-to-action via the `action` slot (e.g. a PrimaryButton).
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from './theme';

export interface EmptyStateProps {
  /** Emoji or short glyph shown above the message. */
  icon?: string;
  title?: string;
  message?: string;
  /** Optional call-to-action node (e.g. a PrimaryButton). */
  action?: React.ReactNode;
}

export function EmptyState({
  icon = '📭',
  title,
  message = 'Nothing here yet.',
  action,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.message}>{message}</Text>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  icon: { fontSize: 40 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center' },
  message: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  action: { marginTop: spacing.md, alignSelf: 'stretch' },
});
