import type {
  DealershipData,
  Alert,
  DateRange,
} from './types';
import {
  computeBranchMetrics,
  computeSourceMetrics,
  computeLostReasons,
  computeModelRevenue,
  getActivePipelineLeads,
  filterLeadsByDateRange,
  computeRepMetrics,
} from './calculations';
import { formatCurrency, formatPercent } from './utils';
import { getReferenceDate } from '../store/filters';

// ─── Smart Alert Generation ───────────────────────────────────────────────

export function generateAlerts(
  data: DealershipData,
  range: DateRange,
  branchId?: string
): Alert[] {
  const alerts: Alert[] = [];
  const branchMetrics = computeBranchMetrics(data, range);

  if (branchMetrics.length === 0) return alerts;

  const avgConversion =
    branchMetrics.reduce((sum, b) => sum + b.conversionRate, 0) / branchMetrics.length;

  // 1. Critically underperforming branches
  if (!branchId) {
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
  }

  // 2. Cold leads — active leads in pre-order stages with no activity for 7+ days
  const refDate = getReferenceDate(data);
  const allPipelineLeads = getActivePipelineLeads(data, branchId);
  const preOrderStages = ['new', 'contacted', 'test_drive', 'negotiation'];
  const coldLeads = allPipelineLeads.filter(
    (l) => preOrderStages.includes(l.status) && l.daysSinceActivity >= 7
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
  const sourceMetrics = computeSourceMetrics(data, range, branchId);
  if (sourceMetrics.length >= 2) {
    const worstSource = sourceMetrics[sourceMetrics.length - 1];
    const bestSource = sourceMetrics[0];
    if (bestSource.conversionRate > worstSource.conversionRate * 2 && worstSource.total >= 5) {
      alerts.push({
        id: branchId ? `source-inefficiency-${branchId}` : 'source-inefficiency',
        severity: 'warning',
        title: `${worstSource.label} leads convert poorly`,
        description: `${formatPercent(worstSource.conversionRate)} conversion vs ${formatPercent(bestSource.conversionRate)} for ${bestSource.label}. Consider re-evaluating ${worstSource.label} ad spend.`,
        branch: branchId,
      });
    }
  }

  // 4. Top performing branches (positive alerts)
  if (!branchId && branchMetrics.length > 0) {
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
  }

  // 5. Improving branch trend
  if (!branchId) {
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
  }

  // 6. Any lost reason that accounts for ≥15% of all lost deals (dynamic)
  const lostReasons = computeLostReasons(data, range, branchId);
  const totalLost = lostReasons.reduce((sum, r) => sum + r.count, 0);
  lostReasons.forEach((r) => {
    if (r.count >= (branchId ? 3 : 10) && r.percentage >= 15 && r.reason !== 'Unknown') {
      alerts.push({
        id: branchId ? `lost-reason-${branchId}-${r.reason.toLowerCase()}` : `lost-reason-${r.reason.toLowerCase()}`,
        severity: 'warning',
        title: `${r.count} deals lost: "${r.reason}"`,
        description: `${formatCurrency(r.revenue, true)} in potential revenue lost. This accounts for ${formatPercent(r.percentage, 0)} of all lost deals.`,
        branch: branchId,
      });
    }
  });

  // 7. Overdue pipeline leads
  const overdueLeads = allPipelineLeads.filter((l) => l.isOverdue);
  if (overdueLeads.length >= (branchId ? 2 : 3)) {
    const overdueValue = overdueLeads.reduce((sum, l) => sum + l.deal_value, 0);
    alerts.push({
      id: branchId ? `overdue-pipeline-${branchId}` : 'overdue-pipeline',
      severity: 'warning',
      title: `${overdueLeads.length} leads past expected close date`,
      description: `${formatCurrency(overdueValue, true)} in pipeline at risk of slipping. These deals were expected to close already — escalate follow-ups.`,
      branch: branchId,
    });
  }

  // Sort: critical first, then warning, then positive
  const severityOrder = { critical: 0, warning: 1, positive: 2 };
  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

// ─── Natural Language Branch Summary (richer) ─────────────────────────────

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
  const branchesWithDelivery = allBranchMetrics.filter(b => b.avgDeliveryDays > 0);
  const avgDeliveryDays = branchesWithDelivery.length > 0
    ? branchesWithDelivery.reduce((sum, b) => sum + b.avgDeliveryDays, 0) / branchesWithDelivery.length
    : 0;

  const lostReasons = computeLostReasons(data, range, branchId);
  const sourceMetrics = computeSourceMetrics(data, range, branchId);
  const bestSource = sourceMetrics[0];
  const repMetrics = data.sales_reps.filter(r => r.branch_id === branchId && r.role === 'sales_officer');

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
      `This is significantly below the network average of ${formatPercent(avgConversion)}. ${bm.lost} of ${bm.totalLeads} leads were lost, a critical area requiring immediate attention.`
    );
  } else if (bm.conversionRate > avgConversion * 1.2) {
    parts.push(
      `This outperforms the network average of ${formatPercent(avgConversion)}, indicating strong sales execution.`
    );
  } else {
    parts.push(
      `This is in line with the network average of ${formatPercent(avgConversion)}.`
    );
  }

  // Target achievement
  if (bm.targetUnits > 0) {
    parts.push(
      `Target achievement: ${bm.delivered} units delivered against a target of ${bm.targetUnits} (${formatPercent(bm.achievementRate)} achievement rate).`
    );
  }

  // Top rep spotlight
  const repMetricsForSummary = computeRepMetrics(data, range, branchId);
  const eligibleReps = repMetricsForSummary.filter(r => r.totalLeads >= 5);
  const topRepByConv = [...eligibleReps].sort((a, b) => b.conversionRate - a.conversionRate)[0];
  const topRepByRev = [...eligibleReps].sort((a, b) => b.revenue - a.revenue)[0];

  if (topRepByConv && topRepByRev) {
    if (topRepByConv.rep.id === topRepByRev.rep.id) {
       parts.push(`Top performer: ${topRepByConv.rep.name} ranks first in both conversion (${formatPercent(topRepByConv.conversionRate)}) and revenue (${formatCurrency(topRepByConv.revenue, true)}).`);
    } else {
       parts.push(`Top performers: ${topRepByConv.rep.name} leads with ${formatPercent(topRepByConv.conversionRate)} conversion, while ${topRepByRev.rep.name} leads in revenue (${formatCurrency(topRepByRev.revenue, true)}).`);
    }
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
  if (bm.avgDeliveryDays > 0 && avgDeliveryDays > 0) {
    if (bm.avgDeliveryDays > avgDeliveryDays * 1.3) {
      parts.push(
        `Delivery time (${bm.avgDeliveryDays.toFixed(0)} days avg) is above the network average of ${avgDeliveryDays.toFixed(0)} days — operational bottlenecks should be investigated.`
      );
    }
  }

  // Overdue pipeline leads
  const pipelineLeads = getActivePipelineLeads(data, branchId);
  const overdueCount = pipelineLeads.filter(l => l.isOverdue).length;
  if (overdueCount > 0) {
    const overdueValue = pipelineLeads.filter(l => l.isOverdue).reduce((sum, l) => sum + l.deal_value, 0);
    parts.push(
      `${overdueCount} pipeline lead${overdueCount > 1 ? 's are' : ' is'} past the expected close date (${formatCurrency(overdueValue, true)} at risk).`
    );
  }

  // Recommendation
  if (bm.conversionRate < avgConversion * 0.5) {
    parts.push(
      `Recommendation: immediate process audit, sales training, and lead qualification review.`
    );
  } else if (bm.pipelineCount > 5) {
    parts.push(
      `Active pipeline: ${bm.pipelineCount} leads worth ${formatCurrency(bm.pipelineValue, true)}, prioritize follow-ups to maximize conversion.`
    );
  }

  return parts.join(' ');
}

// ─── Network Summary (richer) ─────────────────────────────────────────────

export function generateNetworkSummary(
  data: DealershipData,
  range: DateRange
): string {
  const branchMetrics = computeBranchMetrics(data, range);
  if (branchMetrics.length === 0) return 'No data available for this time range.';

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

  const parts: string[] = [];

  // Core metrics
  parts.push(
    `Across ${branchMetrics.length} branches, the network generated ${formatCurrency(totalRevenue, true)} from ${totalDelivered} deliveries out of ${totalLeads} leads (${formatPercent(avgConversion)} conversion).`
  );

  // Best vs worst
  parts.push(
    `${best.branch.name} leads with ${formatPercent(best.conversionRate)} conversion, while ${worst.branch.name} trails at ${formatPercent(worst.conversionRate)}.`
  );

  // Model mix — top revenue driver
  const modelRevenue = computeModelRevenue(data, range);
  if (modelRevenue.length > 0) {
    const topModel = modelRevenue[0];
    const topModelPct = totalRevenue > 0 ? (topModel.revenue / totalRevenue) * 100 : 0;
    parts.push(
      `${topModel.model} drives ${formatPercent(topModelPct, 0)} of total revenue (${formatCurrency(topModel.revenue, true)}, ${topModel.units} units).`
    );
  }

  // Best source (dynamic)
  const sourceMetrics = computeSourceMetrics(data, range);
  if (sourceMetrics.length > 0) {
    const bestSource = sourceMetrics[0];
    parts.push(
      `${bestSource.label} is the strongest lead source at ${formatPercent(bestSource.conversionRate)} conversion.`
    );
  }

  // Pipeline risk
  const pipelineLeads = getActivePipelineLeads(data);
  const totalPipelineValue = pipelineLeads.reduce((sum, l) => sum + l.deal_value, 0);
  // order_placed leads are just waiting for delivery, so they aren't "cold" in terms of sales contact
  const preOrderStages = ['new', 'contacted', 'test_drive', 'negotiation'];
  const coldCount = pipelineLeads.filter(
    (l) => preOrderStages.includes(l.status) && l.daysSinceActivity >= 7
  ).length;
  
  if (pipelineLeads.length > 0) {
    let pipelineText = `Active pipeline: ${formatCurrency(totalPipelineValue, true)} across ${pipelineLeads.length} leads`;
    if (coldCount > 0) {
      pipelineText += ` — ${coldCount} haven't been contacted in 7+ days`;
    }
    parts.push(pipelineText + '.');
  }

  // Focus areas
  const lostReasons = computeLostReasons(data, range);
  const topLostReason = lostReasons[0];
  const focusAreas: string[] = [];
  if (worst.conversionRate < avgConversion * 0.5) {
    focusAreas.push(`improving ${worst.branch.name}'s conversion`);
  }
  if (topLostReason && topLostReason.reason !== 'Unknown') {
    focusAreas.push(`addressing "${topLostReason.reason}" lost deals (${topLostReason.count} occurrences)`);
  }
  if (focusAreas.length > 0) {
    parts.push(`Focus areas: ${focusAreas.join(' and ')}.`);
  }

  return parts.join(' ');
}
