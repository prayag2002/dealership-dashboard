'use client';

import { useState } from 'react';
import { useFilterStore, extractAvailableMonths } from '../../store/filters';
import { formatMonth } from '../../lib/utils';
import { Calendar, ChevronDown } from 'lucide-react';

/** Derive smart presets from available months */
function derivePresets(months: string[]): { label: string; start: string; end: string }[] {
  if (months.length === 0) return [];
  const first = months[0];
  const last = months[months.length - 1];

  const presets: { label: string; start: string; end: string }[] = [
    { label: 'All', start: first, end: last },
  ];

  // Extract unique years
  const years = Array.from(new Set(months.map((m) => m.split('-')[0]))).sort();

  // If multi-year data, add year presets
  if (years.length > 1) {
    years.forEach((year) => {
      const yearMonths = months.filter((m) => m.startsWith(year));
      if (yearMonths.length > 0) {
        presets.push({
          label: year,
          start: yearMonths[0],
          end: yearMonths[yearMonths.length - 1],
        });
      }
    });
  }

  // Add quarter presets for current context
  // For multi-year: only show quarters of the latest year to avoid too many buttons
  const targetYear = years[years.length - 1];
  const targetMonths = months.filter((m) => m.startsWith(targetYear));

  const quarterMap = new Map<string, string[]>();
  targetMonths.forEach((m) => {
    const mo = parseInt(m.split('-')[1], 10);
    const q = Math.ceil(mo / 3);
    const key = `Q${q}`;
    if (!quarterMap.has(key)) quarterMap.set(key, []);
    quarterMap.get(key)!.push(m);
  });

  const sortedQuarters = Array.from(quarterMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  sortedQuarters.forEach(([label, qMonths]) => {
    // Only add quarter if it has data and we don't already have too many presets
    if (presets.length < 8) {
      presets.push({
        label: years.length > 1 ? `${label} '${targetYear.slice(2)}` : label,
        start: qMonths[0],
        end: qMonths[qMonths.length - 1],
      });
    }
  });

  return presets;
}

export default function DateRangePicker() {
  const { data, dateRange, setDateRange } = useFilterStore();
  const [showCustom, setShowCustom] = useState(false);

  if (!data) return null;

  const availableMonths = extractAvailableMonths(data);
  const presets = derivePresets(availableMonths);

  const isPresetActive = (preset: { start: string; end: string }) =>
    dateRange.start === preset.start && dateRange.end === preset.end;

  const isCustomActive = !presets.some((p) => isPresetActive(p));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <div className="date-picker">
        {presets.map((preset) => (
          <button
            key={preset.label}
            className={`date-picker-btn ${isPresetActive(preset) ? 'active' : ''}`}
            onClick={() => {
              setDateRange({ start: preset.start, end: preset.end });
              setShowCustom(false);
            }}
          >
            {preset.label}
          </button>
        ))}
        <button
          className={`date-picker-btn ${isCustomActive || showCustom ? 'active' : ''}`}
          onClick={() => setShowCustom(!showCustom)}
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Calendar size={12} />
          Custom
          <ChevronDown size={10} />
        </button>
      </div>

      {showCustom && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-md)',
            fontSize: 12,
          }}
        >
          <select
            value={dateRange.start}
            onChange={(e) => {
              const newStart = e.target.value;
              setDateRange({
                start: newStart,
                end: newStart > dateRange.end ? newStart : dateRange.end,
              });
            }}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 8px',
              fontSize: 12,
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {formatMonth(m)}
              </option>
            ))}
          </select>
          <span style={{ color: 'var(--text-tertiary)' }}>to</span>
          <select
            value={dateRange.end}
            onChange={(e) => {
              const newEnd = e.target.value;
              setDateRange({
                start: newEnd < dateRange.start ? newEnd : dateRange.start,
                end: newEnd,
              });
            }}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 8px',
              fontSize: 12,
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            {availableMonths
              .filter((m) => m >= dateRange.start)
              .map((m) => (
                <option key={m} value={m}>
                  {formatMonth(m)}
                </option>
              ))}
          </select>
        </div>
      )}
    </div>
  );
}
