'use client';

import type { Lead } from '../../lib/types';
import { formatCurrency, formatStatus } from '../../lib/utils';

interface ActivePipelineProps {
  leads: (Lead & { daysSinceActivity: number; repName: string })[];
}

function getAgingBadge(days: number) {
  if (days >= 14) return { class: 'badge-rose', text: `${days}d cold` };
  if (days >= 7) return { class: 'badge-amber', text: `${days}d aging` };
  return { class: 'badge-emerald', text: `${days}d` };
}

export default function ActivePipeline({ leads }: ActivePipelineProps) {
  if (leads.length === 0) {
    return (
      <div className="card animate-in">
        <div className="card-header">
          <span className="card-title">Active Pipeline</span>
        </div>
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
          No active leads in the pipeline
        </div>
      </div>
    );
  }

  return (
    <div className="card animate-in">
      <div className="card-header">
        <span className="card-title">Active Pipeline</span>
        <span className="badge badge-blue">{leads.length} leads</span>
      </div>
      <div style={{ overflowX: 'auto', maxHeight: 320, overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Model</th>
              <th>Status</th>
              <th>Rep</th>
              <th>Value</th>
              <th>Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const aging = getAgingBadge(lead.daysSinceActivity);
              return (
                <tr key={lead.id}>
                  <td style={{ fontWeight: 500 }}>{lead.customer_name}</td>
                  <td>{lead.model_interested}</td>
                  <td>
                    <span className="badge badge-blue">{formatStatus(lead.status)}</span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{lead.repName}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(lead.deal_value, true)}</td>
                  <td>
                    <span className={`badge ${aging.class}`}>{aging.text}</span>
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
