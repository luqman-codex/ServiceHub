// src/components/DateTimeInput.tsx — NATIVE (iOS/Android) date + time field.
// Metro resolves DateTimeInput.web.tsx on the web target instead, so the native-only
// @react-native-community/datetimepicker is never bundled for web.
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { formatDateTime } from '../lib/format';
import { colors, radius, spacing } from './theme';

export interface DateTimeInputProps {
  value: Date;
  onChange: (next: Date) => void;
  minimumDate?: Date;
  hasError?: boolean;
}

export function DateTimeInput({ value, onChange, minimumDate, hasError }: DateTimeInputProps) {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<'date' | 'time'>('date');

  const open = () => {
    setMode('date');
    setShow(true);
  };

  // Android fires onChange once per modal; we chain date → time (05 §9.5 UX note).
  const handle = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (event.type === 'dismissed' || !selected) {
      setShow(false);
      return;
    }
    if (mode === 'date') {
      const next = new Date(value);
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      onChange(next);
      setMode('time');
      setShow(true);
    } else {
      const next = new Date(value);
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      onChange(next);
      setShow(false);
    }
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choose date and time"
        onPress={open}
        style={({ pressed }) => [styles.button, hasError && styles.error, pressed && styles.pressed]}
      >
        <Text style={styles.text}>{formatDateTime(value.toISOString())}</Text>
        <Text style={styles.hint}>Change</Text>
      </Pressable>
      {show ? (
        <DateTimePicker
          value={value}
          mode={mode}
          minimumDate={minimumDate}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handle}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
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
  pressed: { backgroundColor: colors.surface },
  error: { borderColor: colors.error },
  text: { flex: 1, fontSize: 16, color: colors.text },
  hint: { fontSize: 14, fontWeight: '600', color: colors.primary },
});
