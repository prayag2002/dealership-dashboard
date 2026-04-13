import type {
  DealershipData,
  Alert,
  BranchMetrics,
  DateRange,
} from './types';
import {
  computeBranchMetrics,
  computeSourceMetrics,
  computeLostReasons,
  getActivePipelineLeads,
} from './calculations';
import { formatCurrency, formatPercent } from './utils';

// ─── Smart Alert Generation ───────────────────────────────────────────────

export function generateAlerts(
  data: DealershipData,
  range: DateRange
): Alert[] {
  const alerts: Alert[] = [];
  const branchMetrics = computeBranchMetrics(data, range);
  const avgConversion =
    branchMetrics.reduce((sum, b) => sum + b.conversionRate, 0) / branchMetrics.length;

  // 1. Critically underperforming branches
  branchMetrics.forEach((bm) => {
    if (bm.conversionRate < avgConversion * 0.5 && bm.totalLeads > 10) {
      alerts.push({
        id: `critical-conv-${bm.branch.id}`,
        severity: 'critical',
        title: `${bm.branch.name} conversion rate is critically low`,
        description: `${formatPercent(bm.conversionRate)} conversion (network avg: ${formatPercent(avgConversion)}). ${bm.lost} of ${bm.totalLeads} leads lost. Immediate intervention recommended.`,
        branch: bm.branch.id,
      });
    }
  });

  // 2. Cold leads — active leads with no activity for 7+ days
  const coldLeads = getActivePipelineLeads(data).filter(
    (l) => l.daysSinceActivity >= 7
  );
  if (coldLeads.length > 0) {
    const coldByBranch = new Map<string, number>();
    coldLeads.forEach((l) => {
      coldByBranch.set(l.branch_id, (coldByBranch.get(l.branch_id) || 0) + 1);
    });

    coldByBranch.forEach((count, branchId) => {
      const branch = data.branches.find((b) => b.id === branchId);
      const branchColdLeads = coldLeads.filter((l) => l.branch_id === branchId);
      const atRiskValue = branchColdLeads.reduce((sum, l) => sum + l.deal_value, 0);
      if (count >= 2) {
        alerts.push({
          id: `cold-leads-${branchId}`,
          severity: 'warning',
          title: `${count} leads going cold at ${branch?.name || branchId}`,
          description: `${formatCurrency(atRiskValue, true)} in pipeline at risk. These leads haven't been contacted in 7+ days.`,
          branch: branchId,
        });
      }
    });
  }

  // 3. Source channel inefficiency
  const sourceMetrics = computeSourceMetrics(data, range);
  const worstSource = sourceMetrics[sourceMetrics.length - 1];
  const bestSource = sourceMetrics[0];
  if (worstSource && bestSource && bestSource.conversionRate > worstSource.conversionRate * 2) {
    alerts.push({
      id: 'source-inefficiency',
      severity: 'warning',
      title: `${worstSource.label} leads convert poorly`,
      description: `${formatPercent(worstSource.conversionRate)} conversion vs ${formatPercent(bestSource.conversionRate)} for ${bestSource.label}. Consider re-evaluating ${worstSource.label} ad spend.`,
    });
  }

  // 4. Top performing branches (positive alerts)
  const bestBranch = branchMetrics.reduce((best, bm) =>
    bm.conversionRate > best.conversionRate ? bm : best
  );
  if (bestBranch.conversionRate > avgConversion * 1.2) {
    alerts.push({
      id: `best-branch-${bestBranch.branch.id}`,
      severity: 'positive',
      title: `${bestBranch.branch.name} leads the network`,
      description: `${formatPercent(bestBranch.conversionRate)} conversion rate, ${formatCurrency(bestBranch.revenue, true)} revenue. Consider replicating their practices across other branches.`,
      branch: bestBranch.branch.id,
    });
  }

  // 5. Improving branch trend
  branchMetrics
    .filter((bm) => bm.trend === 'up')
    .forEach((bm) => {
      alerts.push({
        id: `trending-up-${bm.branch.id}`,
        severity: 'positive',
        title: `${bm.branch.name} is trending upward`,
        description: `Delivery rate improved in recent months. ${bm.delivered} total deliveries with ${formatCurrency(bm.revenue, true)} revenue.`,
        branch: bm.branch.id,
      });
    });

  // 6. High lost reasons — financing
  const lostReasons = computeLostReasons(data, range);
  const financingLost = lostReasons.find((r) => r.reason === 'Financing not approved');
  if (financingLost && financingLost.count >= 10) {
    alerts.push({
      id: 'financing-issue',
      severity: 'warning',
      title: `${financingLost.count} deals lost to financing issues`,
      description: `${formatCurrency(financingLost.revenue, true)} in potential revenue lost because financing wasn't approved. Consider partnering with additional financial institutions.`,
    });
  }

  // Sort: critical first, then warning, then positive
  const severityOrder = { critical: 0, warning: 1, positive: 2 };
  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

// ─── Natural Language Branch Summary ──────────────────────────────────────

export function generateBranchSummary(
  data: DealershipData,
  branchId: string,
  range: DateRange
): string {
  const allBranchMetrics = computeBranchMetrics(data, range);
  const bm = allBranchMetrics.find((b) => b.branch.id === branchId);
  if (!bm) return '';

  const avgConversion =
    allBranchMetrics.reduce((sum, b) => sum + b.conversionRate, 0) / allBranchMetrics.length;
  const avgDeliveryDays =
    allBranchMetrics.reduce((sum, b) => sum + b.avgDeliveryDays, 0) / allBranchMetrics.filter(b => b.avgDeliveryDays > 0).length;

  const lostReasons = computeLostReasons(data, range, branchId);
  const sourceMetrics = computeSourceMetrics(data, range, branchId);
  const bestSource = sourceMetrics[0];

  // Ranking
  const sortedByConversion = [...allBranchMetrics].sort(
    (a, b) => b.conversionRate - a.conversionRate
  );
  const rank = sortedByConversion.findIndex((b) => b.branch.id === branchId) + 1;
  const rankText = rank === 1 ? 'the top-performing branch' :
    rank === allBranchMetrics.length ? 'the lowest-performing branch' :
    `ranked #${rank} of ${allBranchMetrics.length} branches`;

  const parts: string[] = [];

  // Performance sentence
  parts.push(
    `${bm.branch.name} generated ${formatCurrency(bm.revenue, true)} in revenue from ${bm.delivered} deliveries (${formatPercent(bm.conversionRate)} conversion rate), making it ${rankText} in the network.`
  );

  // Comparison to average
  if (bm.conversionRate < avgConversion * 0.5) {
    parts.push(
      `This is significantly below the network average of ${formatPercent(avgConversion)}. ${bm.lost} of ${bm.totalLeads} leads were lost — a critical area requiring immediate attention.`
    );
  } else if (bm.conversionRate > avgConversion * 1.2) {
    parts.push(
      `This outperforms the network average of ${formatPercent(avgConversion)}, indicating strong sales execution.`
    );
  }

  // Lost reasons
  if (lostReasons.length > 0) {
    const topReasons = lostReasons.slice(0, 2);
    const reasonText = topReasons
      .map((r) => `"${r.reason}" (${r.count})`)
      .join(' and ');
    parts.push(
      `Top lost reasons: ${reasonText}. Total potential revenue lost: ${formatCurrency(lostReasons.reduce((s, r) => s + r.revenue, 0), true)}.`
    );
  }

  // Best source
  if (bestSource && bestSource.total > 0) {
    parts.push(
      `${bestSource.label} is the most effective channel at ${formatPercent(bestSource.conversionRate)} conversion.`
    );
  }

  // Delivery performance
  if (bm.avgDeliveryDays > 0) {
    if (bm.avgDeliveryDays > avgDeliveryDays * 1.3) {
      parts.push(
        `Delivery time (${bm.avgDeliveryDays.toFixed(0)} days avg) is above the network average of ${avgDeliveryDays.toFixed(0)} days — operational bottlenecks should be investigated.`
      );
    }
  }

  // Recommendation
  if (bm.conversionRate < avgConversion * 0.5) {
    parts.push(
      `Recommend: immediate process audit, sales training, and lead qualification review.`
    );
  } else if (bm.pipelineCount > 5) {
    parts.push(
      `Active pipeline: ${bm.pipelineCount} leads worth ${formatCurrency(bm.pipelineValue, true)} — prioritize follow-ups to maximize conversion.`
    );
  }

  return parts.join(' ');
}

// ─── Network Summary (for Overview page) ──────────────────────────────────

export function generateNetworkSummary(
  data: DealershipData,
  range: DateRange
): string {
  const branchMetrics = computeBranchMetrics(data, range);
  const totalRevenue = branchMetrics.reduce((sum, b) => sum + b.revenue, 0);
  const totalDelivered = branchMetrics.reduce((sum, b) => sum + b.delivered, 0);
  const totalLeads = branchMetrics.reduce((sum, b) => sum + b.totalLeads, 0);
  const avgConversion = totalLeads > 0 ? (totalDelivered / totalLeads) * 100 : 0;

  const best = branchMetrics.reduce((a, b) =>
    a.conversionRate > b.conversionRate ? a : b
  );
  const worst = branchMetrics.reduce((a, b) =>
    a.conversionRate < b.conversionRate ? a : b
  );

  return `Across ${branchMetrics.length} branches, the network generated ${formatCurrency(totalRevenue, true)} from ${totalDelivered} deliveries out of ${totalLeads} leads (${formatPercent(avgConversion)} conversion). ${best.branch.name} leads with ${formatPercent(best.conversionRate)} conversion, while ${worst.branch.name} significantly trails at ${formatPercent(worst.conversionRate)}. Walk-in remains the strongest channel. Focus areas: improving ${worst.branch.name}'s conversion and addressing financing-related lost deals.`;
}
