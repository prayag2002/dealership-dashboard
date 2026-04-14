'use client';

import { useState } from 'react';
import type { DealershipData, DateRange, LeadStatus } from '../../lib/types';
import { computeWhatIf } from '../../lib/calculations';
import { formatCurrency, formatPercent } from '../../lib/utils';
import { Lightbulb, TrendingUp, IndianRupee } from 'lucide-react';

interface WhatIfSimulatorProps {
  data: DealershipData;
  dateRange: DateRange;
}

const transitions: { from: LeadStatus; to: LeadStatus; label: string }[] = [
  { from: 'contacted', to: 'test_drive', label: 'Contacted → Test Drive' },
  { from: 'test_drive', to: 'negotiation', label: 'Test Drive → Negotiation' },
  { from: 'negotiation', to: 'order_placed', label: 'Negotiation → Order Placed' },
  { from: 'order_placed', to: 'delivered', label: 'Order Placed → Delivered' },
];

export default function WhatIfSimulator({ data, dateRange }: WhatIfSimulatorProps) {
  const [selectedTransition, setSelectedTransition] = useState(0);
  const [improvement, setImprovement] = useState(10);

  const t = transitions[selectedTransition];
  const result = computeWhatIf(data, dateRange, t.from, t.to, improvement);

  return (
    <div className="card animate-in">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="kpi-icon violet" style={{ width: 32, height: 32 }}>
            <Lightbulb size={16} />
          </div>
          <span className="card-title">What-If Scenario</span>
        </div>
        <span className="card-subtitle">Explore potential improvements</span>
      </div>

      {/* Transition selector */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
          Funnel Stage
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {transitions.map((tr, i) => (
            <button
              key={i}
              onClick={() => setSelectedTransition(i)}
              style={{
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 11,
                fontWeight: 500,
                border: '1px solid',
                borderColor: i === selectedTransition ? 'var(--color-violet)' : 'var(--border-primary)',
                background: i === selectedTransition ? 'var(--color-violet-light)' : 'transparent',
                color: i === selectedTransition ? 'var(--color-violet)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slider */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
            Improvement
          </label>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-violet)' }}>
            +{improvement}%
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={30}
          value={improvement}
          onChange={(e) => setImprovement(Number(e.target.value))}
          style={{
            width: '100%',
            accentColor: '#7c3aed',
            height: 6,
            cursor: 'pointer',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
          <span>+1%</span>
          <span>+15%</span>
          <span>+30%</span>
        </div>
      </div>

      {/* Results */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        padding: 16,
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-secondary)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <TrendingUp size={14} style={{ color: 'var(--color-emerald)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>Additional Deliveries</span>
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-emerald)' }}>
            +{result.additionalDeliveries}
          </span>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <IndianRupee size={14} style={{ color: 'var(--color-blue)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>Revenue Impact</span>
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-blue)' }}>
            +{formatCurrency(result.additionalRevenue, true)}
          </span>
        </div>
      </div>

      {/* Context */}
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 10, lineHeight: 1.5 }}>
        Current {t.label.toLowerCase()} conversion: {formatPercent(result.currentConversion)} → Projected: {formatPercent(result.projectedConversion)}.
        {result.additionalRevenue > 0 && ` This improvement would generate approximately ${formatCurrency(result.additionalRevenue, true)} in additional revenue.`}
      </p>
    </div>
  );
}
