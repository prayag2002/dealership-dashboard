import { create } from 'zustand';
import type { DealershipData, DateRange } from '../lib/types';
import { getMonthFromDate } from '../lib/utils';

interface AppState {
  // Data
  data: DealershipData | null;
  setData: (data: DealershipData) => void;
  isCustomDataset: boolean;

  // Filters
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;

  // UI
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

/** Extract sorted unique YYYY-MM months from leads */
export function extractAvailableMonths(data: DealershipData): string[] {
  const monthSet = new Set<string>();
  data.leads.forEach((l) => monthSet.add(getMonthFromDate(l.created_at)));
  // Also include target months
  data.targets.forEach((t) => monthSet.add(t.month));
  return Array.from(monthSet).sort();
}

/** Derive a full date range covering all data */
export function getFullRange(data: DealershipData): DateRange {
  const months = extractAvailableMonths(data);
  return { start: months[0], end: months[months.length - 1] };
}

/** Get the latest timestamp in the dataset — used as "now" */
export function getReferenceDate(data: DealershipData): Date {
  let latest = 0;
  data.leads.forEach((l) => {
    const t = new Date(l.last_activity_at).getTime();
    if (t > latest) latest = t;
  });
  data.deliveries.forEach((d) => {
    const t = new Date(d.delivery_date).getTime();
    if (t > latest) latest = t;
  });
  return latest > 0 ? new Date(latest) : new Date();
}

export const useFilterStore = create<AppState>((set) => ({
  data: null,
  setData: (data) =>
    set((state) => {
      const fullRange = getFullRange(data);
      return {
        data,
        dateRange: fullRange,
        isCustomDataset: state.isCustomDataset,
      };
    }),
  isCustomDataset: false,

  dateRange: { start: '2025-06', end: '2025-12' }, // fallback, overridden by setData
  setDateRange: (range) => set({ dateRange: range }),

  theme: 'light',
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', newTheme);
      }
      return { theme: newTheme };
    }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
