'use client';

import { useState, useEffect } from 'react';
import type { DealershipData, DateRange, LeadStatus } from '../../lib/types';
import { computeWhatIf } from '../../lib/calculations';
import { formatCurrency, formatPercent } from '../../lib/utils';
import { Lightbulb, TrendingUp, IndianRupee, Info } from 'lucide-react';

interface WhatIfSimulatorProps {
  data: DealershipData;
  dateRange: DateRange;
}

const transitions: { from: LeadStatus; to: LeadStatus; label: string; question: string }[] = [
  { from: 'contacted', to: 'test_drive', label: 'Contacted → Test Drive', question: 'What if more contacted leads book a test drive?' },
  { from: 'test_drive', to: 'negotiation', label: 'Test Drive → Negotiation', question: 'What if more test drives lead to price negotiation?' },
  { from: 'negotiation', to: 'order_placed', label: 'Negotiation → Order', question: 'What if more negotiations result in an order?' },
  { from: 'order_placed', to: 'delivered', label: 'Order → Delivery', question: 'What if more orders are delivered successfully?' },
];

export default function WhatIfSimulator({ data, dateRange }: WhatIfSimulatorProps) {
  const [selectedTransition, setSelectedTransition] = useState(0);
  const [improvement, setImprovement] = useState(10);

  // Reset slider when switching funnel stage
  useEffect(() => {
    setImprovement(10);
  }, [selectedTransition]);

  const t = transitions[selectedTransition];
  const result = computeWhatIf(data, dateRange, t.from, t.to, improvement);

  // Cap the slider at what's actually possible (can't exceed 100% conversion)
  const maxImprovement = Math.max(1, Math.floor(100 - result.currentConversion));
  const effectiveImprovement = Math.min(improvement, maxImprovement);

  // Recompute with capped improvement
  const cappedResult = improvement > maxImprovement
    ? computeWhatIf(data, dateRange, t.from, t.to, effectiveImprovement)
    : result;

  const atCeiling = result.currentConversion >= 99;

  return (
    <div className="card animate-in">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="kpi-icon violet" style={{ width: 32, height: 32 }}>
            <Lightbulb size={16} />
          </div>
          <span className="card-title">What-If Scenario</span>
        </div>
        <span className="card-subtitle">Model the impact of conversion improvements</span>
      </div>

      {/* Question */}
      <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, margin: '0 0 14px', lineHeight: 1.5 }}>
        {t.question}
      </p>

      {/* Transition selector */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
          Funnel Stage Transition
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

      {atCeiling ? (
        <div style={{
          padding: 16,
          background: 'var(--color-emerald-light)',
          borderRadius: 'var(--radius-md)',
          fontSize: 13,
          color: 'var(--color-emerald)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <Info size={16} />
          This stage already has {formatPercent(result.currentConversion)} conversion. No room for improvement here — focus on other stages.
        </div>
      ) : (
        <>
          {/* Slider */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                Conversion Rate Improvement
              </label>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-violet)' }}>
                +{effectiveImprovement}%
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
            {improvement > maxImprovement && (
              <p style={{ fontSize: 11, color: 'var(--color-amber)', marginTop: 6 }}>
                Capped at +{effectiveImprovement}% (conversion can&apos;t exceed 100%)
              </p>
            )}
          </div>

          {/* Current → Projected */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
            padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', fontSize: 13,
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>Current: <strong>{formatPercent(result.currentConversion)}</strong></span>
            <span style={{ color: 'var(--text-tertiary)' }}>→</span>
            <span style={{ color: 'var(--color-violet)', fontWeight: 600 }}>Projected: <strong>{formatPercent(cappedResult.projectedConversion)}</strong></span>
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
                +{cappedResult.additionalDeliveries}
              </span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <IndianRupee size={14} style={{ color: 'var(--color-blue)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>Estimated Revenue Impact</span>
              </div>
              <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-blue)' }}>
                +{formatCurrency(cappedResult.additionalRevenue, true)}
              </span>
            </div>
          </div>

          {/* Explanation */}
          {cappedResult.additionalDeliveries > 0 && (
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 10, lineHeight: 1.6, fontStyle: 'italic' }}>
              Improving <strong>{t.label.toLowerCase()}</strong> conversion by {effectiveImprovement} percentage points would move ~{cappedResult.additionalDeliveries} more leads to delivery, generating approximately {formatCurrency(cappedResult.additionalRevenue, true)} in additional revenue based on the current average deal value.
            </p>
          )}
        </>
      )}
    </div>
  );
}
