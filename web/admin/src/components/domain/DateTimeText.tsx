// src/components/domain/DateTimeText.tsx (04 §7.4) — renders an ISO-8601 UTC string
// converted to the viewer's local timezone via the shared date helpers.
import { formatDate, formatDateTime, formatRelative, formatTime } from '@/lib/format/date';

export type DateTimeFormat = 'datetime' | 'date' | 'time' | 'relative';

export interface DateTimeTextProps {
  /** ISO-8601 UTC string from the API (e.g. "2026-06-19T14:30:00Z"). */
  value: string | null | undefined;
  format?: DateTimeFormat;
  className?: string;
}

const formatters: Record<DateTimeFormat, (iso: string | null | undefined) => string> = {
  datetime: formatDateTime,
  date: formatDate,
  time: formatTime,
  relative: formatRelative,
};

export function DateTimeText({ value, format = 'datetime', className }: DateTimeTextProps) {
  const text = formatters[format](value);
  return (
    <time dateTime={value ?? undefined} className={className}>
      {text}
    </time>
  );
}
