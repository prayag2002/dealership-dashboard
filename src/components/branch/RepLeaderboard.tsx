'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RepMetrics } from '../../lib/types';
import { formatCurrency, formatPercent } from '../../lib/utils';
import { ChevronRight, ArrowUpDown } from 'lucide-react';

interface RepLeaderboardProps {
  reps: RepMetrics[];
  branchAvgConversion: number;
}

type SortKey = 'conversionRate' | 'totalLeads' | 'successes' | 'revenue';

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'conversionRate', label: 'Conv. %' },
  { key: 'successes', label: 'Successes' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'totalLeads', label: 'Leads' },
];

export default function RepLeaderboard({ reps, branchAvgConversion }: RepLeaderboardProps) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortKey>('conversionRate');

  const sorted = [...reps].sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="card animate-in">
      <div className="card-header">
        <span className="card-title">Representative Leaderboard</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowUpDown size={12} style={{ color: 'var(--text-tertiary)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginRight: 4 }}>Sort:</span>
          {sortOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              style={{
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 11,
                fontWeight: 500,
                border: '1px solid',
                borderColor: sortBy === opt.key ? 'var(--color-blue)' : 'var(--border-primary)',
                background: sortBy === opt.key ? 'var(--color-blue-light)' : 'transparent',
                color: sortBy === opt.key ? 'var(--color-blue)' : 'var(--text-tertiary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Role</th>
              <th>Leads</th>
              <th>Successes</th>
              <th>Conv. %</th>
              <th>Revenue</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((rep, i) => {
              const isTop = i === 0 && rep[sortBy] > 0;
              return (
                <tr
                  key={rep.rep.id}
                  className="clickable"
                  onClick={() => router.push(`/rep/${rep.rep.id}`)}
                  style={{
                    background: isTop ? 'var(--color-emerald-light)' : undefined,
                    cursor: 'pointer',
                  }}
                >
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
                  <td>{rep.successes}</td>
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
