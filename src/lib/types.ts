// ─── Raw Data Types (matches dealership_data.json) ────────────────────────

export interface Metadata {
  generated_at: string;
  description: string;
  date_range: string;
  notes: string;
}

export interface Branch {
  id: string;
  name: string;
  city: string;
}

export interface SalesRep {
  id: string;
  name: string;
  branch_id: string;
  role: 'branch_manager' | 'sales_officer';
  joined: string;
}

export interface StatusHistoryEntry {
  status: LeadStatus;
  timestamp: string;
  note: string;
}

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'test_drive'
  | 'negotiation'
  | 'order_placed'
  | 'delivered'
  | 'lost';

export interface Lead {
  id: string;
  customer_name: string;
  phone: string;
  source: LeadSource;
  model_interested: string;
  status: LeadStatus;
  assigned_to: string;
  branch_id: string;
  created_at: string;
  last_activity_at: string;
  status_history: StatusHistoryEntry[];
  expected_close_date: string;
  deal_value: number;
  lost_reason: string | null;
}

export type LeadSource =
  | 'website'
  | 'walk_in'
  | 'referral'
  | 'social_media'
  | 'phone_enquiry'
  | 'auto_expo';

export interface Target {
  branch_id: string;
  month: string; // "2025-06" format
  target_units: number;
  target_revenue: number;
}

export interface DeliveryRecord {
  lead_id: string;
  order_date: string;
  delivery_date: string;
  days_to_deliver: number;
  delay_reason: string | null;
}

export interface DealershipData {
  metadata: Metadata;
  branches: Branch[];
  sales_reps: SalesRep[];
  leads: Lead[];
  targets: Target[];
  deliveries: DeliveryRecord[];
}

// ─── Computed Types (used by UI) ──────────────────────────────────────────

export interface KpiData {
  totalRevenue: number;
  targetRevenue: number;
  totalDelivered: number;
  targetUnits: number;
  conversionRate: number;
  pipelineValue: number;
  pipelineCount: number;
  avgDeliveryDays: number;
}

export interface BranchMetrics {
  branch: Branch;
  manager: SalesRep | undefined;
  totalLeads: number;
  delivered: number;
  lost: number;
  conversionRate: number;
  revenue: number;
  targetUnits: number;
  targetRevenue: number;
  achievementRate: number;
  pipelineValue: number;
  pipelineCount: number;
  avgDeliveryDays: number;
  trend: 'up' | 'down' | 'flat';
}

export interface RepMetrics {
  rep: SalesRep;
  branchName: string;
  totalLeads: number;
  successes: number;
  lost: number;
  conversionRate: number;
  revenue: number;
  avgCycleTime: number;
  pipelineCount: number;
  pipelineValue: number;
}

export interface MonthlyData {
  month: string;
  label: string;
  actualRevenue: number;
  targetRevenue: number;
  actualUnits: number;
  targetUnits: number;
  newLeads: number;
  deliveredLeads: number;
  lostLeads: number;
}

export interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
  dropOff: number;
}

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'positive';
  title: string;
  description: string;
  branch?: string;
}

export interface SourceMetrics {
  source: LeadSource;
  label: string;
  total: number;
  delivered: number;
  lost: number;
  conversionRate: number;
  avgDealValue: number;
}

export interface LostReasonMetrics {
  reason: string;
  count: number;
  percentage: number;
  revenue: number;
}

export interface DelayMetrics {
  reason: string;
  count: number;
  percentage: number;
}

export interface DateRange {
  start: string; // "2025-06"
  end: string;   // "2025-12"
}
