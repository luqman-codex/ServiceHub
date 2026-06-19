// src/lib/format/date.ts (04 §7.4)
// Converts ISO-8601 UTC strings → user-local display strings via date-fns.
import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = parseISO(iso);
  return isValid(d) ? d : null;
}

// e.g. "Jun 19, 2026, 2:30 PM" in the viewer's local timezone.
export function formatDateTime(iso: string | null | undefined): string {
  const d = parse(iso);
  return d ? format(d, 'MMM d, yyyy, h:mm a') : '—';
}

// e.g. "Jun 19, 2026"
export function formatDate(iso: string | null | undefined): string {
  const d = parse(iso);
  return d ? format(d, 'MMM d, yyyy') : '—';
}

// e.g. "2:30 PM"
export function formatTime(iso: string | null | undefined): string {
  const d = parse(iso);
  return d ? format(d, 'h:mm a') : '—';
}

// e.g. "3 hours ago"
export function formatRelative(iso: string | null | undefined): string {
  const d = parse(iso);
  return d ? formatDistanceToNow(d, { addSuffix: true }) : '—';
}

// Converts a local datetime-local input value to an ISO-8601 UTC string (with Z).
export function localInputToIsoUtc(localValue: string): string {
  const d = new Date(localValue);
  return isValid(d) ? d.toISOString() : '';
}
