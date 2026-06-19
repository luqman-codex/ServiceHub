// src/lib/utils/cn.ts — tiny classnames joiner (no extra deps).
// Filters falsy values and joins with a space. Use for conditional Tailwind classes.
// Accepts arbitrary values so `cond && 'class'` expressions type-check cleanly.
export type ClassValue = unknown;

export function cn(...values: ClassValue[]): string {
  return values
    .filter((v): v is string | number => Boolean(v) && (typeof v === 'string' || typeof v === 'number'))
    .join(' ');
}
