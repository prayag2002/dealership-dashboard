'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import type { LostReasonMetrics } from '../../lib/types';
import { formatCurrency, formatPercent } from '../../lib/utils';
import SafeResponsiveContainer from '../charts/SafeResponsiveContainer';

interface LostAnalysisProps {
  reasons: LostReasonMetrics[];
  totalLostRevenue: number;
}

const COLORS = ['#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#d97706', '#f59e0b', '#fbbf24'];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="label">{d.reason}</div>
      <div style={{ marginTop: 4, fontSize: 12 }}>
        <div>{d.count} leads ({formatPercent(d.percentage)})</div>
        <div>Revenue lost: {formatCurrency(d.revenue, true)}</div>
      </div>
    </div>
  );
}

export default function LostAnalysis({ reasons, totalLostRevenue }: LostAnalysisProps) {
  return (
    <div className="card animate-in">
      <div className="card-header">
        <span className="card-title">Lost Deal Analysis</span>
        <span className="badge badge-rose">{formatCurrency(totalLostRevenue, true)} lost</span>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ width: 160, height: 160, flexShrink: 0 }}>
          <SafeResponsiveContainer>
            <PieChart>
              <Pie
                data={reasons}
                dataKey="count"
                nameKey="reason"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
              >
                {reasons.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </SafeResponsiveContainer>
        </div>
        <div style={{ flex: 1, fontSize: 12 }}>
          {reasons.slice(0, 5).map((r, i) => (
            <div key={r.reason} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i], flexShrink: 0 }} />
              <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{r.reason}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
