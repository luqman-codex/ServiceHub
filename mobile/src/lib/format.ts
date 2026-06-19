// src/lib/format.ts
// Display formatters for the wire formats described in 02 §6:
//  - money fields are DECIMAL **strings** (e.g. "79.99"); we never do float math on
//    the source value, only feed it to Intl.NumberFormat for locale layout.
//  - dates are ISO-8601 UTC strings; we convert them to the device's local time.
// Adapted from the web app's src/lib/format/money.ts + date.ts to plain RN (no date-fns).

/** Formats a DECIMAL money STRING + ISO-4217 currency for display (04 §7.4). */
export function formatMoney(amount: string | null | undefined, currency = 'USD'): string {
  if (amount == null || amount === '') return '—';

  const numeric = Number(amount);
  if (Number.isNaN(numeric)) return `${amount} ${currency}`;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numeric);
  } catch {
    // Unknown currency code → fall back to a plain "<amount> <currency>" layout.
    return `${numeric.toFixed(2)} ${currency}`;
  }
}

/** Normalizes a numeric form value to the 2-decimal STRING the API expects on submit. */
export function toMoneyString(value: number | string): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return '0.00';
  return n.toFixed(2);
}

/** Renders a friendly "<duration_minutes>" label (e.g. 90 → "1 hr 30 min"). */
export function formatDuration(minutes: number | null | undefined): string | null {
  if (minutes == null) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

/** Converts an ISO-8601 UTC string to a local "Jun 19, 2026, 2:30 PM" style string. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

/** Converts an ISO-8601 UTC string to a local "Jun 19, 2026" date-only string. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/** Converts an ISO-8601 UTC string to a local "2:30 PM" time-only string. */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}
