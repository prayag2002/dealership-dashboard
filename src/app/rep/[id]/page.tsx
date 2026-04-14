'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useFilterStore } from '../../../store/filters';
import { loadData } from '../../../lib/data-loader';
import {
  computeRepMetrics,
  computeRepMonthlyData,
  computeBranchMetrics,
  filterLeadsByDateRange,
} from '../../../lib/calculations';
import { formatCurrency, formatPercent, formatStatus, STATUS_COLORS } from '../../../lib/utils';
import {
  ArrowLeft,
  IndianRupee,
  TrendingUp,
  Users,
  Timer,
} from 'lucide-react';
import SafeResponsiveContainer from '../../../components/charts/SafeResponsiveContainer';
import DateRangePicker from '../../../components/layout/DateRangePicker';
import EmptyState from '../../../components/layout/EmptyState';

export default function RepPage() {
  const params = useParams();
  const repId = params.id as string;
  const { data, setData, dateRange } = useFilterStore();

  useEffect(() => {
    if (!data) {
      loadData().then(setData);
    }
  }, [data, setData]);

  if (!data) {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, border: '3px solid var(--border-primary)', borderTopColor: 'var(--color-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading rep data...</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const rep = data.sales_reps.find((r) => r.id === repId);
  if (!rep) return <div className="page-container"><p>Rep not found</p></div>;

  const branch = data.branches.find((b) => b.id === rep.branch_id);
  const allRepMetrics = computeRepMetrics(data, dateRange, rep.branch_id);
  const repMetric = allRepMetrics.find((r) => r.rep.id === repId);

  if (!repMetric) return <div className="page-container"><p>No data for this rep</p></div>;

  const branchMetrics = computeBranchMetrics(data, dateRange).find(
    (b) => b.branch.id === rep.branch_id
  );
  const branchAvgConversion = branchMetrics?.conversionRate || 0;
  const monthlyData = computeRepMonthlyData(data, repId, dateRange);

  // Lead status distribution
  const repLeads = filterLeadsByDateRange(
    data.leads.filter((l) => l.assigned_to === repId),
    dateRange
  );

  const hasData = repLeads.length > 0;

  const statusCounts = repLeads.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    name: formatStatus(status),
    value: count,
    color: STATUS_COLORS[status] || '#94a3b8',
  }));

  const kpis = [
    {
      title: 'Leads Handled',
      value: String(repMetric.totalLeads),
      subtitle: `${repMetric.delivered} delivered, ${repMetric.lost} lost`,
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Conversion Rate',
      value: formatPercent(repMetric.conversionRate),
      subtitle: `Branch avg: ${formatPercent(branchAvgConversion)}`,
      icon: TrendingUp,
      color: repMetric.conversionRate >= branchAvgConversion ? 'emerald' : 'rose',
    },
    {
      title: 'Revenue Generated',
      value: formatCurrency(repMetric.revenue, true),
      subtitle: 'From delivered deals',
      icon: IndianRupee,
      color: 'violet',
    },
    {
      title: 'Avg Cycle Time',
      value: repMetric.avgCycleTime > 0 ? `${repMetric.avgCycleTime.toFixed(0)} days` : 'N/A',
      subtitle: 'Lead to delivery',
      icon: Timer,
      color: 'amber',
    },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href={`/branch/${rep.branch_id}`} className="back-button">
            <ArrowLeft size={16} />
            {branch?.name || 'Back'}
          </Link>
          <div>
            <h1 className="page-title">{rep.name}</h1>
            <p className="page-description">
              {rep.role === 'branch_manager' ? 'Branch Manager' : 'Sales Officer'} · {branch?.name} · Joined {rep.joined}
            </p>
          </div>
        </div>
        <DateRangePicker />
      </div>

      {!hasData ? (
        <EmptyState
          title="No data for this rep"
          description="No leads found for this rep in the selected time range. Try adjusting the date filter."
        />
      ) : (
        <>
          {/* KPIs */}
          <div className="section">
            <div className="kpi-grid-4">
              {kpis.map((kpi, i) => (
                <div key={kpi.title} className="card animate-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="card-header">
                    <span className="card-title">{kpi.title}</span>
                    <div className={`kpi-icon ${kpi.color}`}>
                      <kpi.icon size={18} />
                    </div>
                  </div>
                  <div className="card-value">{kpi.value}</div>
                  <div className="card-subtitle">{kpi.subtitle}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Performance + Status Distribution */}
          <div className="section two-col">
            <div className="card animate-in">
              <div className="card-header">
                <span className="card-title">Monthly Performance</span>
              </div>
              <div className="chart-container-sm">
                <SafeResponsiveContainer>
                  <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="deliveredLeads" name="Delivered" fill="#059669" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar dataKey="newLeads" name="New Leads" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={24} opacity={0.3} />
                  </BarChart>
                </SafeResponsiveContainer>
              </div>
            </div>

            <div className="card animate-in">
              <div className="card-header">
                <span className="card-title">Lead Status Distribution</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 160, height: 160 }}>
                  <SafeResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                      >
                        {statusData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </SafeResponsiveContainer>
                </div>
                <div style={{ flex: 1, fontSize: 12 }}>
                  {statusData.map((s) => (
                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{s.name}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Lead Table */}
          <div className="section">
            <div className="card animate-in">
              <div className="card-header">
                <span className="card-title">All Leads</span>
                <span className="badge badge-blue">{repLeads.length} total</span>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Model</th>
                      <th>Source</th>
                      <th>Status</th>
                      <th>Value</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repLeads.map((lead) => {
                      const statusColor =
                        lead.status === 'delivered' ? 'badge-emerald' :
                          lead.status === 'lost' ? 'badge-rose' :
                            lead.status === 'order_placed' ? 'badge-emerald' :
                              'badge-blue';
                      return (
                        <tr key={lead.id}>
                          <td style={{ fontWeight: 500 }}>{lead.customer_name}</td>
                          <td>{lead.model_interested}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{lead.source.replace(/_/g, ' ')}</td>
                          <td>
                            <span className={`badge ${statusColor}`}>{formatStatus(lead.status)}</span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{formatCurrency(lead.deal_value, true)}</td>
                          <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                            {new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
