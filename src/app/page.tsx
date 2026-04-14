'use client';

import { useEffect } from 'react';
import { useFilterStore } from '../store/filters';
import { loadData } from '../lib/data-loader';
import {
  computeKpis,
  computeBranchMetrics,
  computeMonthlyData,
  computeFunnel,
  computeSourceMetrics,
  computeModelRevenue,
  filterLeadsByDateRange,
} from '../lib/calculations';
import { generateAlerts, generateNetworkSummary } from '../lib/insights-engine';

import DateRangePicker from '../components/layout/DateRangePicker';
import KpiCards from '../components/dashboard/KpiCards';
import BranchScoreboard from '../components/dashboard/BranchScoreboard';
import RevenueTrend from '../components/dashboard/RevenueTrend';
import ConversionFunnel from '../components/dashboard/ConversionFunnel';
import AlertsPanel from '../components/dashboard/AlertsPanel';
import ModelRevenue from '../components/dashboard/ModelRevenue';
import SourcePerformance from '../components/dashboard/SourcePerformance';
import WhatIfSimulator from '../components/dashboard/WhatIfSimulator';
import EmptyState from '../components/layout/EmptyState';
import { Sparkles } from 'lucide-react';

export default function OverviewPage() {
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
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading dashboard data...</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Check if filter yields any data
  const filteredLeads = filterLeadsByDateRange(data.leads, dateRange);
  const hasData = filteredLeads.length > 0;

  const kpis = computeKpis(data, dateRange);
  const branchMetrics = computeBranchMetrics(data, dateRange);
  const monthlyData = computeMonthlyData(data, dateRange);
  const funnelData = computeFunnel(data, dateRange);
  const sourceMetrics = computeSourceMetrics(data, dateRange);
  const modelRevenue = computeModelRevenue(data, dateRange);
  const alerts = generateAlerts(data, dateRange);
  const networkSummary = generateNetworkSummary(data, dateRange);

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Overview</h1>
          <p className="page-description">Network performance at a glance</p>
        </div>
        <DateRangePicker />
      </div>

      {!hasData ? (
        <EmptyState />
      ) : (
        <>
          {/* Network Summary */}
          <div className="section">
            <div className="summary-callout animate-in">
              <div className="summary-label">
                <Sparkles size={14} />
                Network Performance Summary
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                {networkSummary.split(/\.\s+/).filter(s => s.trim()).map((sentence, i) => {
                  const text = sentence.endsWith('.') ? sentence : sentence + '.';
                  const isPositive = text.includes('leads with') || text.includes('strongest');
                  const isNegative = text.includes('trails') || text.includes('Focus areas') || text.includes('contacted in 7+');
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: isNegative ? 'var(--color-rose-light)' : isPositive ? 'var(--color-emerald-light)' : 'var(--bg-secondary)',
                        fontSize: 13,
                        lineHeight: 1.5,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {text}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="section">
            <KpiCards data={kpis} />
          </div>

          {/* Branch Scoreboard */}
          <div className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Branch Performance</h2>
                <p className="section-subtitle">Click a branch to see detailed analysis</p>
              </div>
            </div>
            <BranchScoreboard metrics={branchMetrics} />
          </div>

          {/* Revenue Trend + Conversion Funnel */}
          <div className="section two-col">
            <RevenueTrend data={monthlyData} />
            <ConversionFunnel stages={funnelData} />
          </div>

          {/* What-If Simulator */}
          <div className="section two-col">
            <WhatIfSimulator data={data} dateRange={dateRange} />
            <ModelRevenue data={modelRevenue} />
          </div>

          {/* Alerts + Source Performance */}
          <div className="section two-col">
            <AlertsPanel alerts={alerts} />
            <SourcePerformance data={sourceMetrics} />
          </div>
        </>
      )}
    </div>
  );
}
