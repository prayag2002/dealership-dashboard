'use client';

import { useFilterStore } from '../../store/filters';

const months = [
  { value: '2025-06', label: 'Jun' },
  { value: '2025-07', label: 'Jul' },
  { value: '2025-08', label: 'Aug' },
  { value: '2025-09', label: 'Sep' },
  { value: '2025-10', label: 'Oct' },
  { value: '2025-11', label: 'Nov' },
  { value: '2025-12', label: 'Dec' },
];

const presets = [
  { label: 'All', start: '2025-06', end: '2025-12' },
  { label: 'Q2', start: '2025-06', end: '2025-06' },
  { label: 'Q3', start: '2025-07', end: '2025-09' },
  { label: 'Q4', start: '2025-10', end: '2025-12' },
  { label: 'H2', start: '2025-07', end: '2025-12' },
];

export default function DateRangePicker() {
  const { dateRange, setDateRange } = useFilterStore();

  const isPresetActive = (preset: { start: string; end: string }) =>
    dateRange.start === preset.start && dateRange.end === preset.end;

  return (
    <div className="date-picker">
      {presets.map((preset) => (
        <button
          key={preset.label}
          className={`date-picker-btn ${isPresetActive(preset) ? 'active' : ''}`}
          onClick={() => setDateRange({ start: preset.start, end: preset.end })}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
