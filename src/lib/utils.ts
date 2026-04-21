import { format, parseISO } from 'date-fns';

// ─── Currency Formatting ──────────────────────────────────────────────────

export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    if (value >= 1e7) return `₹${(value / 1e7).toFixed(2)} Cr`;
    if (value >= 1e5) return `₹${(value / 1e5).toFixed(2)} L`;
    if (value >= 1e3) return `₹${(value / 1e3).toFixed(2)} K`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ─── Date Helpers ─────────────────────────────────────────────────────────

export function formatMonth(monthStr: string): string {
  // "2025-06" → "Jun 2025"
  return format(parseISO(`${monthStr}-01`), 'MMM yyyy');
}

export function formatMonthShort(monthStr: string): string {
  // "2025-06" → "Jun"
  return format(parseISO(`${monthStr}-01`), 'MMM');
}

export function getMonthFromDate(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.round(Math.abs(b - a) / (1000 * 60 * 60 * 24));
}

export function daysSince(dateStr: string, referenceDate: Date): number {
  const date = new Date(dateStr).getTime();
  return Math.round((referenceDate.getTime() - date) / (1000 * 60 * 60 * 24));
}

// ─── Generic Label Formatting ─────────────────────────────────────────────

/** Converts snake_case to Title Case: "walk_in" → "Walk In" */
export function formatSnakeCase(str: string): string {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Format a source string (uses known labels with fallback) */
export function formatSource(source: string): string {
  const known: Record<string, string> = {
    website: 'Website',
    walk_in: 'Walk-in',
    referral: 'Referral',
    social_media: 'Social Media',
    phone_enquiry: 'Phone Enquiry',
    auto_expo: 'Auto Expo',
  };
  return known[source] || formatSnakeCase(source);
}

// ─── Status Label Formatting ─────────────────────────────────────────────

const statusLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  test_drive: 'Test Drive',
  negotiation: 'Negotiation',
  order_placed: 'Order Placed',
  delivered: 'Delivered',
  lost: 'Lost',
};

export function formatStatus(status: string): string {
  return statusLabels[status] || formatSnakeCase(status);
}

// ─── Color Helpers ────────────────────────────────────────────────────────

export function getHealthColor(value: number, thresholds: { good: number; warning: number }): string {
  if (value >= thresholds.good) return 'var(--color-emerald)';
  if (value >= thresholds.warning) return 'var(--color-amber)';
  return 'var(--color-rose)';
}

export function getHealthClass(value: number, thresholds: { good: number; warning: number }): string {
  if (value >= thresholds.good) return 'health-good';
  if (value >= thresholds.warning) return 'health-warning';
  return 'health-critical';
}

// ─── Chart Colors ─────────────────────────────────────────────────────────

export const CHART_COLORS = [
  '#2563eb', // blue
  '#059669', // emerald
  '#d97706', // amber
  '#e11d48', // rose
  '#7c3aed', // violet
  '#0891b2', // cyan
  '#65a30d', // lime
  '#dc2626', // red
  '#0d9488', // teal
  '#c026d3', // fuchsia
];

export const STATUS_COLORS: Record<string, string> = {
  new: '#3b82f6',
  contacted: '#8b5cf6',
  test_drive: '#06b6d4',
  negotiation: '#f59e0b',
  order_placed: '#10b981',
  delivered: '#059669',
  lost: '#ef4444',
};

/** Get a color for a branch by index (dynamic, not hardcoded to IDs) */
export function getBranchColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

// ─── Misc ─────────────────────────────────────────────────────────────────

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
