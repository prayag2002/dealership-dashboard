import type {
  DealershipData,
  Lead,
  KpiData,
  BranchMetrics,
  RepMetrics,
  MonthlyData,
  FunnelStage,
  SourceMetrics,
  LostReasonMetrics,
  DelayMetrics,
  DateRange,
  LeadStatus,
} from './types';
import { getMonthFromDate, formatMonthShort, formatSource } from './utils';
import { getReferenceDate } from '../store/filters';

// ─── Filtering ────────────────────────────────────────────────────────────

export function filterLeadsByDateRange(leads: Lead[], range: DateRange): Lead[] {
  return leads.filter((lead) => {
    const month = getMonthFromDate(lead.created_at);
    return month >= range.start && month <= range.end;
  });
}

// ─── Network-Level KPIs ──────────────────────────────────────────────────

export function computeKpis(data: DealershipData, range: DateRange): KpiData {
  const leads = filterLeadsByDateRange(data.leads, range);
  const delivered = leads.filter((l) => l.status === 'delivered');
  const active = leads.filter((l) =>
    ['new', 'contacted', 'test_drive', 'negotiation', 'order_placed'].includes(l.status)
  );

  const targets = data.targets.filter((t) => t.month >= range.start && t.month <= range.end);

  const deliveryRecords = data.deliveries.filter((d) => {
    const leadIds = new Set(leads.map((l) => l.id));
    return leadIds.has(d.lead_id);
  });

  return {
    totalRevenue: delivered.reduce((sum, l) => sum + l.deal_value, 0),
    targetRevenue: targets.reduce((sum, t) => sum + t.target_revenue, 0),
    totalDelivered: delivered.length,
    targetUnits: targets.reduce((sum, t) => sum + t.target_units, 0),
    conversionRate: leads.length > 0 ? (delivered.length / leads.length) * 100 : 0,
    pipelineValue: active.reduce((sum, l) => sum + l.deal_value, 0),
    pipelineCount: active.length,
    avgDeliveryDays:
      deliveryRecords.length > 0
        ? deliveryRecords.reduce((sum, d) => sum + d.days_to_deliver, 0) / deliveryRecords.length
        : 0,
  };
}

// ─── Branch Metrics ───────────────────────────────────────────────────────

export function computeBranchMetrics(
  data: DealershipData,
  range: DateRange
): BranchMetrics[] {
  return data.branches.map((branch) => {
    const leads = filterLeadsByDateRange(
      data.leads.filter((l) => l.branch_id === branch.id),
      range
    );
    const delivered = leads.filter((l) => l.status === 'delivered');
    const lost = leads.filter((l) => l.status === 'lost');
    const active = leads.filter((l) =>
      ['new', 'contacted', 'test_drive', 'negotiation', 'order_placed'].includes(l.status)
    );

    const targets = data.targets.filter(
      (t) => t.branch_id === branch.id && t.month >= range.start && t.month <= range.end
    );

    const targetUnits = targets.reduce((sum, t) => sum + t.target_units, 0);
    const targetRevenue = targets.reduce((sum, t) => sum + t.target_revenue, 0);
    const revenue = delivered.reduce((sum, l) => sum + l.deal_value, 0);

    const manager = data.sales_reps.find(
      (r) => r.branch_id === branch.id && r.role === 'branch_manager'
    );

    // Compute delivery days for this branch
    const branchLeadIds = new Set(leads.map((l) => l.id));
    const deliveryRecords = data.deliveries.filter((d) => branchLeadIds.has(d.lead_id));
    const avgDeliveryDays =
      deliveryRecords.length > 0
        ? deliveryRecords.reduce((sum, d) => sum + d.days_to_deliver, 0) / deliveryRecords.length
        : 0;

    // Trend: compare last 2 months in range
    const months = targets.map((t) => t.month).sort();
    let trend: 'up' | 'down' | 'flat' = 'flat';
    if (months.length >= 2) {
      const lastMonth = months[months.length - 1];
      const prevMonth = months[months.length - 2];
      const lastDel = leads.filter(
        (l) => l.status === 'delivered' && getMonthFromDate(l.created_at) === lastMonth
      ).length;
      const prevDel = leads.filter(
        (l) => l.status === 'delivered' && getMonthFromDate(l.created_at) === prevMonth
      ).length;
      if (lastDel > prevDel) trend = 'up';
      else if (lastDel < prevDel) trend = 'down';
    }

    return {
      branch,
      manager,
      totalLeads: leads.length,
      delivered: delivered.length,
      lost: lost.length,
      conversionRate: leads.length > 0 ? (delivered.length / leads.length) * 100 : 0,
      revenue,
      targetUnits,
      targetRevenue,
      achievementRate: targetUnits > 0 ? (delivered.length / targetUnits) * 100 : 0,
      pipelineValue: active.reduce((sum, l) => sum + l.deal_value, 0),
      pipelineCount: active.length,
      avgDeliveryDays,
      trend,
    };
  });
}

// ─── Rep Metrics ──────────────────────────────────────────────────────────

export function computeRepMetrics(
  data: DealershipData,
  range: DateRange,
  branchId?: string
): RepMetrics[] {
  const reps = branchId
    ? data.sales_reps.filter((r) => r.branch_id === branchId)
    : data.sales_reps;

  return reps.map((rep) => {
    const leads = filterLeadsByDateRange(
      data.leads.filter((l) => l.assigned_to === rep.id),
      range
    );
    const delivered = leads.filter((l) => l.status === 'delivered');
    const lost = leads.filter((l) => l.status === 'lost');
    const active = leads.filter((l) =>
      ['new', 'contacted', 'test_drive', 'negotiation', 'order_placed'].includes(l.status)
    );

    // Average cycle time: days from created_at to delivered timestamp
    const cycleTimes = delivered
      .map((l) => {
        const deliveredEntry = l.status_history.find((h) => h.status === 'delivered');
        if (!deliveredEntry) return 0;
        const start = new Date(l.created_at).getTime();
        const end = new Date(deliveredEntry.timestamp).getTime();
        return Math.round((end - start) / (1000 * 60 * 60 * 24));
      })
      .filter((d) => d > 0);

    const branch = data.branches.find((b) => b.id === rep.branch_id);

    return {
      rep,
      branchName: branch?.name || '',
      totalLeads: leads.length,
      delivered: delivered.length,
      lost: lost.length,
      conversionRate: leads.length > 0 ? (delivered.length / leads.length) * 100 : 0,
      revenue: delivered.reduce((sum, l) => sum + l.deal_value, 0),
      avgCycleTime:
        cycleTimes.length > 0
          ? cycleTimes.reduce((sum, d) => sum + d, 0) / cycleTimes.length
          : 0,
      pipelineCount: active.length,
      pipelineValue: active.reduce((sum, l) => sum + l.deal_value, 0),
    };
  });
}

// ─── Monthly Data ─────────────────────────────────────────────────────────

export function computeMonthlyData(
  data: DealershipData,
  range: DateRange,
  branchId?: string
): MonthlyData[] {
  const months: string[] = [];
  let current = range.start;
  while (current <= range.end) {
    months.push(current);
    const [y, m] = current.split('-').map(Number);
    const nextM = m === 12 ? 1 : m + 1;
    const nextY = m === 12 ? y + 1 : y;
    current = `${nextY}-${String(nextM).padStart(2, '0')}`;
  }

  return months.map((month) => {
    const monthLeads = data.leads
      .filter((l) => (branchId ? l.branch_id === branchId : true))
      .filter((l) => getMonthFromDate(l.created_at) === month);

    const targets = data.targets.filter(
      (t) => t.month === month && (branchId ? t.branch_id === branchId : true)
    );

    // Revenue from leads delivered — use delivery timestamp month
    const deliveredLeads = data.leads
      .filter((l) => (branchId ? l.branch_id === branchId : true))
      .filter((l) => l.status === 'delivered')
      .filter((l) => {
        const delEntry = l.status_history.find((h) => h.status === 'delivered');
        return delEntry && getMonthFromDate(delEntry.timestamp) === month;
      });

    return {
      month,
      label: formatMonthShort(month), // Dynamic — works with any date
      actualRevenue: deliveredLeads.reduce((sum, l) => sum + l.deal_value, 0),
      targetRevenue: targets.reduce((sum, t) => sum + t.target_revenue, 0),
      actualUnits: deliveredLeads.length,
      targetUnits: targets.reduce((sum, t) => sum + t.target_units, 0),
      newLeads: monthLeads.length,
      deliveredLeads: deliveredLeads.length,
      lostLeads: monthLeads.filter((l) => l.status === 'lost').length,
    };
  });
}

// ─── Conversion Funnel ────────────────────────────────────────────────────

export function computeFunnel(
  data: DealershipData,
  range: DateRange,
  branchId?: string
): FunnelStage[] {
  const leads = filterLeadsByDateRange(
    branchId ? data.leads.filter((l) => l.branch_id === branchId) : data.leads,
    range
  );

  // Count leads that REACHED each stage (not current status)
  const stages: LeadStatus[] = [
    'new',
    'contacted',
    'test_drive',
    'negotiation',
    'order_placed',
    'delivered',
  ];

  const stageLabels: Record<string, string> = {
    new: 'New Lead',
    contacted: 'Contacted',
    test_drive: 'Test Drive',
    negotiation: 'Negotiation',
    order_placed: 'Order Placed',
    delivered: 'Delivered',
  };

  const counts = stages.map((stage) => {
    return leads.filter((lead) =>
      lead.status_history.some((h) => h.status === stage)
    ).length;
  });

  return stages.map((stage, i) => ({
    name: stageLabels[stage],
    count: counts[i],
    percentage: counts[0] > 0 ? (counts[i] / counts[0]) * 100 : 0,
    dropOff: i > 0 && counts[i - 1] > 0 ? ((counts[i - 1] - counts[i]) / counts[i - 1]) * 100 : 0,
  }));
}

// ─── Source Metrics ───────────────────────────────────────────────────────

export function computeSourceMetrics(
  data: DealershipData,
  range: DateRange,
  branchId?: string
): SourceMetrics[] {
  const leads = filterLeadsByDateRange(
    branchId ? data.leads.filter((l) => l.branch_id === branchId) : data.leads,
    range
  );

  // Extract unique sources dynamically from the data
  const uniqueSources = Array.from(new Set(leads.map((l) => l.source)));

  return uniqueSources
    .map((source) => {
      const sourceLeads = leads.filter((l) => l.source === source);
      const delivered = sourceLeads.filter((l) => l.status === 'delivered');
      const lost = sourceLeads.filter((l) => l.status === 'lost');

      return {
        source,
        label: formatSource(source),
        total: sourceLeads.length,
        delivered: delivered.length,
        lost: lost.length,
        conversionRate:
          sourceLeads.length > 0 ? (delivered.length / sourceLeads.length) * 100 : 0,
        avgDealValue:
          delivered.length > 0
            ? delivered.reduce((sum, l) => sum + l.deal_value, 0) / delivered.length
            : 0,
      };
    })
    .sort((a, b) => b.conversionRate - a.conversionRate);
}

// ─── Lost Reasons ─────────────────────────────────────────────────────────

export function computeLostReasons(
  data: DealershipData,
  range: DateRange,
  branchId?: string
): LostReasonMetrics[] {
  const leads = filterLeadsByDateRange(
    branchId ? data.leads.filter((l) => l.branch_id === branchId) : data.leads,
    range
  );
  const lostLeads = leads.filter((l) => l.status === 'lost');

  const reasonMap = new Map<string, { count: number; revenue: number }>();
  lostLeads.forEach((l) => {
    const key = l.lost_reason || 'Unknown'; // null → "Unknown"
    const existing = reasonMap.get(key) || { count: 0, revenue: 0 };
    existing.count++;
    existing.revenue += l.deal_value;
    reasonMap.set(key, existing);
  });

  const total = lostLeads.length;
  return Array.from(reasonMap.entries())
    .map(([reason, { count, revenue }]) => ({
      reason,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
      revenue,
    }))
    .sort((a, b) => b.count - a.count);
}

// ─── Delivery / Delay Metrics ─────────────────────────────────────────────

export function computeDelayMetrics(
  data: DealershipData,
  branchId?: string
): DelayMetrics[] {
  let deliveries = data.deliveries;
  if (branchId) {
    const branchLeadIds = new Set(
      data.leads.filter((l) => l.branch_id === branchId).map((l) => l.id)
    );
    deliveries = deliveries.filter((d) => branchLeadIds.has(d.lead_id));
  }

  const delayed = deliveries.filter((d) => d.delay_reason);
  const reasonMap = new Map<string, number>();
  delayed.forEach((d) => {
    reasonMap.set(d.delay_reason!, (reasonMap.get(d.delay_reason!) || 0) + 1);
  });

  const total = delayed.length;
  return Array.from(reasonMap.entries())
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

// ─── Active Pipeline Leads ────────────────────────────────────────────────

export function getActivePipelineLeads(
  data: DealershipData,
  branchId?: string
): (Lead & { daysSinceActivity: number; repName: string; isOverdue: boolean })[] {
  const refDate = getReferenceDate(data);

  return data.leads
    .filter((l) => (branchId ? l.branch_id === branchId : true))
    .filter((l) =>
      ['new', 'contacted', 'test_drive', 'negotiation', 'order_placed'].includes(l.status)
    )
    .map((l) => {
      const rep = data.sales_reps.find((r) => r.id === l.assigned_to);
      const isOverdue = l.expected_close_date
        ? new Date(l.expected_close_date) < refDate
        : false;
      return {
        ...l,
        daysSinceActivity: Math.round(
          (refDate.getTime() - new Date(l.last_activity_at).getTime()) / (1000 * 60 * 60 * 24)
        ),
        repName: rep?.name || 'Unknown',
        isOverdue,
      };
    })
    .sort((a, b) => {
      // Overdue leads first, then by days since activity
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return b.daysSinceActivity - a.daysSinceActivity;
    });
}

// ─── Model Revenue ────────────────────────────────────────────────────────

export function computeModelRevenue(
  data: DealershipData,
  range: DateRange
): { model: string; revenue: number; units: number; avgValue: number }[] {
  const leads = filterLeadsByDateRange(data.leads, range);
  const delivered = leads.filter((l) => l.status === 'delivered');

  const modelMap = new Map<string, { revenue: number; units: number }>();
  delivered.forEach((l) => {
    const existing = modelMap.get(l.model_interested) || { revenue: 0, units: 0 };
    existing.revenue += l.deal_value;
    existing.units++;
    modelMap.set(l.model_interested, existing);
  });

  return Array.from(modelMap.entries())
    .map(([model, { revenue, units }]) => ({
      model,
      revenue,
      units,
      avgValue: units > 0 ? revenue / units : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

// ─── Rep Monthly Performance ──────────────────────────────────────────────

export function computeRepMonthlyData(
  data: DealershipData,
  repId: string,
  range: DateRange
): MonthlyData[] {
  const months: string[] = [];
  let current = range.start;
  while (current <= range.end) {
    months.push(current);
    const [y, m] = current.split('-').map(Number);
    const nextM = m === 12 ? 1 : m + 1;
    const nextY = m === 12 ? y + 1 : y;
    current = `${nextY}-${String(nextM).padStart(2, '0')}`;
  }

  return months.map((month) => {
    const monthLeads = data.leads
      .filter((l) => l.assigned_to === repId)
      .filter((l) => getMonthFromDate(l.created_at) === month);

    const deliveredLeads = data.leads
      .filter((l) => l.assigned_to === repId && l.status === 'delivered')
      .filter((l) => {
        const delEntry = l.status_history.find((h) => h.status === 'delivered');
        return delEntry && getMonthFromDate(delEntry.timestamp) === month;
      });

    return {
      month,
      label: formatMonthShort(month), // Dynamic
      actualRevenue: deliveredLeads.reduce((sum, l) => sum + l.deal_value, 0),
      targetRevenue: 0,
      actualUnits: deliveredLeads.length,
      targetUnits: 0,
      newLeads: monthLeads.length,
      deliveredLeads: deliveredLeads.length,
      lostLeads: monthLeads.filter((l) => l.status === 'lost').length,
    };
  });
}

// ─── What-If Scenario Computation ─────────────────────────────────────────

export function computeWhatIf(
  data: DealershipData,
  range: DateRange,
  stageFrom: LeadStatus,
  stageTo: LeadStatus,
  improvementPercent: number
): { additionalDeliveries: number; additionalRevenue: number; currentConversion: number; projectedConversion: number } {
  const leads = filterLeadsByDateRange(data.leads, range);

  // Count leads that reached stageFrom
  const reachedFrom = leads.filter((l) =>
    l.status_history.some((h) => h.status === stageFrom)
  ).length;

  // Count leads that reached stageTo
  const reachedTo = leads.filter((l) =>
    l.status_history.some((h) => h.status === stageTo)
  ).length;

  const currentConversion = reachedFrom > 0 ? (reachedTo / reachedFrom) * 100 : 0;
  const projectedConversion = Math.min(currentConversion + improvementPercent, 100);

  // How many additional leads would pass through?
  const additionalLeads = Math.round(
    reachedFrom * (improvementPercent / 100)
  );

  // Average deal value of delivered leads
  const deliveredLeads = leads.filter((l) => l.status === 'delivered');
  const avgDealValue = deliveredLeads.length > 0
    ? deliveredLeads.reduce((sum, l) => sum + l.deal_value, 0) / deliveredLeads.length
    : 0;

  // Not all additional leads will convert to delivery — apply downstream conversion
  const delivered = leads.filter((l) =>
    l.status_history.some((h) => h.status === 'delivered')
  ).length;
  const downstreamConversion = reachedTo > 0 ? delivered / reachedTo : 0;

  const additionalDeliveries = Math.round(additionalLeads * downstreamConversion);
  const additionalRevenue = additionalDeliveries * avgDealValue;

  return { additionalDeliveries, additionalRevenue, currentConversion, projectedConversion };
}
