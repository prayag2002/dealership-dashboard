'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useFilterStore } from '../../../store/filters';
import { loadData } from '../../../lib/data-loader';
import {
  computeBranchMetrics,
  computeRepMetrics,
  computeMonthlyData,
  computeFunnel,
  computeSourceMetrics,
  computeLostReasons,
  computeDelayMetrics,
  getActivePipelineLeads,
  filterLeadsByDateRange,
} from '../../../lib/calculations';
import { generateBranchSummary, generateAlerts } from '../../../lib/insights-engine';
import { formatCurrency, formatPercent } from '../../../lib/utils';

import DateRangePicker from '../../../components/layout/DateRangePicker';
import BranchSummary from '../../../components/branch/BranchSummary';
import TargetProgress from '../../../components/branch/TargetProgress';
import RepLeaderboard from '../../../components/branch/RepLeaderboard';
import LostAnalysis from '../../../components/branch/LostAnalysis';
import ActivePipeline from '../../../components/branch/ActivePipeline';
import ConversionFunnel from '../../../components/dashboard/ConversionFunnel';
import SourcePerformance from '../../../components/dashboard/SourcePerformance';
import AlertsPanel from '../../../components/dashboard/AlertsPanel';
import EmptyState from '../../../components/layout/EmptyState';
import {
  ArrowLeft,
  IndianRupee,
  TrendingUp,
  Layers,
  Clock,
  Truck,
} from 'lucide-react';

export default function BranchPage() {
  const params = useParams();
  const branchId = params.id as string;
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
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading branch data...</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const allBranchMetrics = computeBranchMetrics(data, dateRange);
  const bm = allBranchMetrics.find((b) => b.branch.id === branchId);
  if (!bm) return <div className="page-container"><p>Branch not found</p></div>;

  const branch = data.branches.find((b) => b.id === branchId);

  // Check if the date range has data for this branch
  const branchLeads = filterLeadsByDateRange(
    data.leads.filter((l) => l.branch_id === branchId),
    dateRange
  );
  const hasData = branchLeads.length > 0;

  const networkAvgConversion =
    allBranchMetrics.reduce((sum, b) => sum + b.conversionRate, 0) / allBranchMetrics.length;
  const branchesWithDelivery = allBranchMetrics.filter(b => b.avgDeliveryDays > 0);
  const networkAvgDeliveryDays = branchesWithDelivery.length > 0
    ? branchesWithDelivery.reduce((sum, b) => sum + b.avgDeliveryDays, 0) / branchesWithDelivery.length
    : 0;

  const repMetrics = computeRepMetrics(data, dateRange, branchId);
  const monthlyData = computeMonthlyData(data, dateRange, branchId);
  const funnelData = computeFunnel(data, dateRange, branchId);
  const sourceMetrics = computeSourceMetrics(data, dateRange, branchId);
  const lostReasons = computeLostReasons(data, dateRange, branchId);
  const delayMetrics = computeDelayMetrics(data, branchId);
  const pipelineLeads = getActivePipelineLeads(data, branchId);
  const branchSummary = generateBranchSummary(data, branchId, dateRange);
  const alerts = generateAlerts(data, dateRange).filter(
    (a) => !a.branch || a.branch === branchId
  );
  const totalLostRevenue = lostReasons.reduce((sum, r) => sum + r.revenue, 0);

  const kpis = [
    {
      title: 'Revenue',
      value: formatCurrency(bm.revenue, true),
      subtitle: bm.targetRevenue > 0 ? `Target: ${formatCurrency(bm.targetRevenue, true)}` : 'No target set',
      icon: IndianRupee,
      color: 'blue',
    },
    {
      title: 'Conversion Rate',
      value: formatPercent(bm.conversionRate),
      subtitle: `Network avg: ${formatPercent(networkAvgConversion)}`,
      icon: TrendingUp,
      color: bm.conversionRate >= networkAvgConversion ? 'emerald' : 'rose',
    },
    {
      title: 'Active Pipeline',
      value: formatCurrency(bm.pipelineValue, true),
      subtitle: `${bm.pipelineCount} active leads`,
      icon: Layers,
      color: 'amber',
    },
    {
      title: 'Avg Delivery Time',
      value: bm.avgDeliveryDays > 0 ? `${bm.avgDeliveryDays.toFixed(0)} days` : 'N/A',
      subtitle: bm.avgDeliveryDays > 0 && networkAvgDeliveryDays > 0
        ? (bm.avgDeliveryDays > networkAvgDeliveryDays * 1.2 ? 'Above network avg' : 'On track')
        : '',
      icon: Clock,
      color: bm.avgDeliveryDays > 0 && networkAvgDeliveryDays > 0 && bm.avgDeliveryDays > networkAvgDeliveryDays * 1.2 ? 'rose' : 'emerald',
    },
  ];

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" className="back-button">
            <ArrowLeft size={16} />
            Back
          </Link>
          <div>
            <h1 className="page-title">{bm.branch.name}</h1>
            <p className="page-description">
              {bm.branch.city || ''} {bm.manager ? `· Manager: ${bm.manager.name}` : ''}
            </p>
          </div>
        </div>
        <DateRangePicker />
      </div>

      {!hasData ? (
        <EmptyState
          title="No data for this branch"
          description="No leads found for this branch in the selected time range. Try adjusting the date filter."
        />
      ) : (
        <>
          {/* NL Summary */}
          <div className="section">
            <BranchSummary summary={branchSummary} />
          </div>

          {/* Branch KPIs */}
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

          {/* Target Progress + Funnel */}
          <div className="section two-col">
            <TargetProgress data={monthlyData} />
            <ConversionFunnel stages={funnelData} />
          </div>

          {/* Rep Leaderboard */}
          <div className="section">
            <RepLeaderboard reps={repMetrics} branchAvgConversion={bm.conversionRate} />
          </div>

          {/* Lost Analysis + Source Performance */}
          <div className="section two-col">
            <LostAnalysis reasons={lostReasons} totalLostRevenue={totalLostRevenue} />
            <SourcePerformance data={sourceMetrics} />
          </div>

          {/* Alerts for this branch */}
          {alerts.length > 0 && (
            <div className="section">
              <AlertsPanel alerts={alerts} />
            </div>
          )}

          {/* Delivery Delay Analysis */}
          {delayMetrics.length > 0 && (
            <div className="section">
              <div className="card animate-in">
                <div className="card-header">
                  <span className="card-title">Delivery Delays</span>
                  <span className="card-subtitle">
                    {data.deliveries.filter(d => {
                      const branchLeadIds = new Set(data.leads.filter(l => l.branch_id === branchId).map(l => l.id));
                      return branchLeadIds.has(d.lead_id) && d.delay_reason;
                    }).length} delayed deliveries
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {delayMetrics.map((d) => (
                    <div
                      key={d.reason}
                      style={{
                        padding: '8px 14px',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Truck size={14} style={{ color: 'var(--color-amber)' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{d.reason}</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active Pipeline */}
          <div className="section">
            <ActivePipeline leads={pipelineLeads} />
          </div>
        </>
      )}
    </div>
  );
}
