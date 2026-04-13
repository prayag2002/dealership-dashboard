'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../lib/utils';
import { CHART_COLORS } from '../../lib/utils';

interface ModelRevenueProps {
  data: { model: string; revenue: number; units: number; avgValue: number }[];
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="label">{d.model}</div>
      <div style={{ marginTop: 4, fontSize: 12 }}>
        <div>Revenue: <strong>{formatCurrency(d.revenue, true)}</strong></div>
        <div>Units: <strong>{d.units}</strong></div>
        <div>Avg Value: <strong>{formatCurrency(d.avgValue, true)}</strong></div>
      </div>
    </div>
  );
}

export default function ModelRevenue({ data }: ModelRevenueProps) {
  return (
    <div className="card animate-in">
      <div className="card-header">
        <span className="card-title">Revenue by Model</span>
        <span className="card-subtitle">Delivered vehicles</span>
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
              tickFormatter={(v) => formatCurrency(v, true)}
              stroke="var(--border-primary)"
              tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="model"
              width={130}
              stroke="var(--border-primary)"
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="revenue"
              radius={[0, 4, 4, 0]}
              fill="#2563eb"
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
