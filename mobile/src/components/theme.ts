// src/components/theme.ts
// Shared design tokens for the mobile UI. Colors mirror the §10 ServiceList example
// and the brand/status palette from 04 §7 (indigo primary; status colors in §7.3).
// There is no CSS cascade in RN, so we centralize tokens here and reference them
// from each component's StyleSheet.

export const colors = {
  // Brand / actions
  primary: '#4F46E5', // indigo-600 (04 §7.1 brand)
  primaryDark: '#4338CA', // indigo-700 (pressed)
  accent: '#2563EB', // blue-600 (price/links, matches §10 example)

  // Surfaces & text
  background: '#FFFFFF',
  surface: '#F9FAFB', // gray-50 card background (§10)
  border: '#E5E7EB', // gray-200
  text: '#111827', // gray-900
  textMuted: '#6B7280', // gray-500
  textSubtle: '#9CA3AF', // gray-400

  // Feedback
  error: '#B91C1C', // red-700
  white: '#FFFFFF',
  disabled: '#A5B4FC', // indigo-300 (disabled primary)
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  pill: 999,
} as const;
