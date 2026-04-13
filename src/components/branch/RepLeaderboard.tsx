'use client';

import Link from 'next/link';
import type { RepMetrics } from '../../lib/types';
import { formatCurrency, formatPercent } from '../../lib/utils';
import { ChevronRight } from 'lucide-react';

interface RepLeaderboardProps {
  reps: RepMetrics[];
  branchAvgConversion: number;
}

export default function RepLeaderboard({ reps, branchAvgConversion }: RepLeaderboardProps) {
  const sorted = [...reps].sort((a, b) => b.conversionRate - a.conversionRate);

  return (
    <div className="card animate-in">
      <div className="card-header">
        <span className="card-title">Rep Leaderboard</span>
        <span className="card-subtitle">Sorted by conversion rate</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Role</th>
              <th>Leads</th>
              <th>Delivered</th>
              <th>Conv. %</th>
              <th>Revenue</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((rep, i) => {
              const isTop = i === 0 && rep.conversionRate > 0;
              const isBottom = i === sorted.length - 1 && sorted.length > 2;
              return (
                <Link
                  key={rep.rep.id}
                  href={`/rep/${rep.rep.id}`}
                  style={{ display: 'contents', textDecoration: 'none', color: 'inherit' }}
                >
                  <tr className="clickable" style={{
                    background: isTop ? 'var(--color-emerald-light)' : undefined,
                  }}>
                    <td style={{ fontWeight: 600, color: 'var(--text-tertiary)', width: 35 }}>
                      {i + 1}
                    </td>
                    <td style={{ fontWeight: 600 }}>{rep.rep.name}</td>
                    <td>
                      <span className={`badge ${rep.rep.role === 'branch_manager' ? 'badge-violet' : 'badge-blue'}`}>
                        {rep.rep.role === 'branch_manager' ? 'Manager' : 'Officer'}
                      </span>
                    </td>
                    <td>{rep.totalLeads}</td>
                    <td>{rep.delivered}</td>
                    <td>
                      <span style={{
                        fontWeight: 600,
                        color: rep.conversionRate >= branchAvgConversion
                          ? 'var(--color-emerald)'
                          : rep.conversionRate >= branchAvgConversion * 0.7
                            ? 'var(--color-amber)'
                            : 'var(--color-rose)',
                      }}>
                        {formatPercent(rep.conversionRate)}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(rep.revenue, true)}</td>
                    <td>
                      <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                    </td>
                  </tr>
                </Link>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
