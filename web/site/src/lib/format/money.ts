// src/lib/format/money.ts (04 §7.4)
// Formats a DECIMAL money STRING (e.g. "79.99") + ISO-4217 currency for display
// WITHOUT float math — we keep the string as the source of truth and only use Number
// for the locale-aware grouping/decimal layout via Intl.NumberFormat.

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
    const fixed = numeric.toFixed(2);
    return `${fixed} ${currency}`;
  }
}

// Normalizes a numeric form value to the 2-decimal STRING the API expects on submit.
export function toMoneyString(value: number | string): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return '0.00';
  return n.toFixed(2);
}
