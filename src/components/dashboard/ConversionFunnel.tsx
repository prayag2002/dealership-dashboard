'use client';

import type { FunnelStage } from '../../lib/types';
import { formatPercent } from '../../lib/utils';
import { STATUS_COLORS } from '../../lib/utils';

interface ConversionFunnelProps {
  stages: FunnelStage[];
}

export default function ConversionFunnel({ stages }: ConversionFunnelProps) {
  const maxCount = stages[0]?.count || 1;

  const stageColors = [
    '#3b82f6', // new - blue
    '#8b5cf6', // contacted - violet
    '#06b6d4', // test_drive - cyan
    '#f59e0b', // negotiation - amber
    '#10b981', // order_placed - emerald
    '#059669', // delivered - emerald dark
  ];

  return (
    <div className="card animate-in">
      <div className="card-header">
        <span className="card-title">Conversion Funnel</span>
        <span className="card-subtitle">Lead journey stages</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
        {stages.map((stage, i) => {
          const widthPct = Math.max((stage.count / maxCount) * 100, 12);
          return (
            <div key={stage.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'baseline' }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {stage.name}
                </span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {stage.count}
                  </span>
                  {i > 0 && stage.dropOff > 0 && (
                    <span style={{ fontSize: 10, color: 'var(--color-rose)', fontWeight: 600 }}>
                      ↓ {formatPercent(stage.dropOff, 0)}
                    </span>
                  )}
                </div>
              </div>
              <div
                className="funnel-bar"
                style={{
                  width: `${widthPct}%`,
                  background: stageColors[i] || '#94a3b8',
                }}
              >
                <span style={{ fontSize: 11, opacity: 0.9 }}>
                  {formatPercent(stage.percentage, 0)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
