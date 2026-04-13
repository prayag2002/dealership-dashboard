'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { SourceMetrics } from '../../lib/types';
import { formatPercent } from '../../lib/utils';

interface SourcePerformanceProps {
  data: SourceMetrics[];
}

const barColors = ['#059669', '#10b981', '#2563eb', '#7c3aed', '#d97706', '#e11d48'];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="label">{d.label}</div>
      <div style={{ marginTop: 4, fontSize: 12 }}>
        <div>Total Leads: <strong>{d.total}</strong></div>
        <div>Delivered: <strong>{d.delivered}</strong></div>
        <div>Conversion: <strong>{formatPercent(d.conversionRate)}</strong></div>
      </div>
    </div>
  );
}

export default function SourcePerformance({ data }: SourcePerformanceProps) {
  const bestSource = data[0];
  const worstSource = data[data.length - 1];

  return (
    <div className="card animate-in">
      <div className="card-header">
        <span className="card-title">Lead Source Performance</span>
        <span className="card-subtitle">Conversion rate by source</span>
      </div>
      <div className="chart-container-sm">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v) => `${v}%`}
              stroke="var(--border-primary)"
              tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
              tickLine={false}
              domain={[0, 50]}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={100}
              stroke="var(--border-primary)"
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="conversionRate" radius={[0, 4, 4, 0]} barSize={22}>
              {data.map((entry, index) => (
                <Cell key={entry.source} fill={barColors[index % barColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {bestSource && worstSource && (
        <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--text-secondary)' }}>
          💡 <strong>{bestSource.label}</strong> converts {(bestSource.conversionRate / Math.max(worstSource.conversionRate, 1)).toFixed(1)}× better than <strong>{worstSource.label}</strong>
        </div>
      )}
    </div>
  );
}
