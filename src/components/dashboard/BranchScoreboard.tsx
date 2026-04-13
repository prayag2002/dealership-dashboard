'use client';

import Link from 'next/link';
import type { BranchMetrics } from '../../lib/types';
import { formatCurrency, formatPercent } from '../../lib/utils';
import { ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BranchScoreboardProps {
  metrics: BranchMetrics[];
}

export default function BranchScoreboard({ metrics }: BranchScoreboardProps) {
  const avgConversion = metrics.reduce((sum, b) => sum + b.conversionRate, 0) / metrics.length;

  function getHealthBadge(convRate: number) {
    if (convRate >= avgConversion * 1.1) return { class: 'badge-emerald', text: 'Strong' };
    if (convRate >= avgConversion * 0.7) return { class: 'badge-amber', text: 'Average' };
    return { class: 'badge-rose', text: 'At Risk' };
  }

  function getTrendIcon(trend: 'up' | 'down' | 'flat') {
    if (trend === 'up') return <TrendingUp size={14} style={{ color: 'var(--color-emerald)' }} />;
    if (trend === 'down') return <TrendingDown size={14} style={{ color: 'var(--color-rose)' }} />;
    return <Minus size={14} style={{ color: 'var(--text-tertiary)' }} />;
  }

  return (
    <div className="branch-grid">
      {metrics.map((bm, index) => {
        const health = getHealthBadge(bm.conversionRate);
        const achievementPct = Math.min(bm.achievementRate, 100);

        return (
          <Link
            key={bm.branch.id}
            href={`/branch/${bm.branch.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div
              className="card card-clickable animate-in"
              style={{ animationDelay: `${(index + 5) * 50}ms` }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {bm.branch.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {bm.branch.city} {bm.manager ? `· ${bm.manager.name}` : ''}
                  </div>
                </div>
                <span className={`badge ${health.class}`}>
                  {health.text}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>Conv. Rate</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatPercent(bm.conversionRate)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>Revenue</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatCurrency(bm.revenue, true)}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                  <span>{bm.delivered} / {bm.targetUnits} units</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {getTrendIcon(bm.trend)}
                    {formatPercent(bm.achievementRate, 0)}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${achievementPct}%`,
                      background: bm.conversionRate >= avgConversion * 0.7
                        ? 'var(--color-blue)'
                        : 'var(--color-rose)',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: 'var(--text-tertiary)', fontSize: 11 }}>
                <span>View details</span>
                <ChevronRight size={14} />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
