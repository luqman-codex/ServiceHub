// src/components/DateTimeInput.web.tsx — WEB (Expo web) date + time field.
// react-native-web renders into the DOM, so React.createElement('input', …) yields a
// real <input type="datetime-local">. Metro picks this file for the web target; the
// native @react-native-community/datetimepicker is therefore never bundled for web.
import React from 'react';

export interface DateTimeInputProps {
  value: Date;
  onChange: (next: Date) => void;
  minimumDate?: Date;
  hasError?: boolean;
}

// Format a Date as the local "YYYY-MM-DDTHH:mm" string a datetime-local input expects.
function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DateTimeInput({ value, onChange, minimumDate, hasError }: DateTimeInputProps) {
  // `as any` keeps this compiling without the DOM lib in tsconfig; at runtime
  // react-dom renders a genuine browser date-time picker.
  return React.createElement('input' as never, {
    type: 'datetime-local',
    value: toLocalInputValue(value),
    min: minimumDate ? toLocalInputValue(minimumDate) : undefined,
    onChange: (e: { target: { value: string } }) => {
      const v = e?.target?.value;
      if (v) onChange(new Date(v));
    },
    style: {
      minHeight: 48,
      width: '100%',
      boxSizing: 'border-box',
      border: `1px solid ${hasError ? '#dc2626' : '#e2e8f0'}`,
      borderRadius: 8,
      paddingLeft: 12,
      paddingRight: 12,
      fontSize: 16,
      color: '#0f172a',
      backgroundColor: '#ffffff',
    },
  } as never);
}
