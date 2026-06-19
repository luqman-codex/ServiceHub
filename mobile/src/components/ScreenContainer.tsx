// src/components/ScreenContainer.tsx
// Standard screen wrapper: a safe-area-aware View with consistent padding and a
// white background. Use this around static/scrollable screen content so nothing
// draws under the notch / status bar / home indicator (05 §3, §11).
import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors, spacing } from './theme';

export interface ScreenContainerProps {
  children: React.ReactNode;
  /** Which insets to apply. Defaults to the top edge (tabs handle the bottom). */
  edges?: Edge[];
  /** Remove the default horizontal/vertical padding (e.g. for full-bleed lists). */
  noPadding?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ScreenContainer({
  children,
  edges = ['top'],
  noPadding = false,
  style,
}: ScreenContainerProps) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <View style={[styles.content, noPadding && styles.noPadding, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  noPadding: { paddingHorizontal: 0, paddingTop: 0 },
});
