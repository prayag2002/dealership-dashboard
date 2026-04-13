'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { MonthlyData } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';

interface TargetProgressProps {
  data: MonthlyData[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="label">{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 4 }}>
          <span style={{ color: entry.color, fontSize: 12 }}>{entry.name}</span>
          <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)' }}>
            {entry.name.includes('Revenue') ? formatCurrency(entry.value, true) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function TargetProgress({ data }: TargetProgressProps) {
  return (
    <div className="card animate-in">
      <div className="card-header">
        <span className="card-title">Monthly Target vs Actual</span>
        <span className="card-subtitle">Units delivered per month</span>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
            <XAxis
              dataKey="label"
              stroke="var(--border-primary)"
              tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              stroke="var(--border-primary)"
              tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
              tickLine={false}
              width={35}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="targetUnits"
              name="Target Units"
              fill="var(--border-primary)"
              radius={[4, 4, 0, 0]}
              barSize={28}
              opacity={0.4}
            />
            <Bar
              dataKey="actualUnits"
              name="Actual Units"
              fill="#2563eb"
              radius={[4, 4, 0, 0]}
              barSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
