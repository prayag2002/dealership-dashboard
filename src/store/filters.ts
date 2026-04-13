import { create } from 'zustand';
import type { DateRange } from '../lib/types';

interface FilterState {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  dateRange: { start: '2025-06', end: '2025-12' },
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
