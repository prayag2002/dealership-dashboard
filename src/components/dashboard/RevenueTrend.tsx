'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { MonthlyData } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';
import SafeResponsiveContainer from '../charts/SafeResponsiveContainer';

interface RevenueTrendProps {
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
            {formatCurrency(entry.value, true)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function RevenueTrend({ data }: RevenueTrendProps) {
  return (
    <div className="card animate-in">
      <div className="card-header">
        <span className="card-title">Revenue Trend</span>
        <span className="card-subtitle">Actual vs Target</span>
      </div>
      <div className="chart-container">
        <SafeResponsiveContainer>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              tickFormatter={(v) => formatCurrency(v, true)}
              width={65}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
            <Area
              type="monotone"
              dataKey="actualRevenue"
              name="Actual Revenue"
              stroke="#2563eb"
              strokeWidth={2.5}
              fill="url(#colorRevenue)"
              dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
            />
            <Area
              type="monotone"
              dataKey="targetRevenue"
              name="Target Revenue"
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              fill="none"
              dot={false}
            />
          </AreaChart>
        </SafeResponsiveContainer>
      </div>
    </div>
  );
}
