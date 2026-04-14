import type { DealershipData } from './types';

let cachedData: DealershipData | null = null;

/** Load the default bundled dataset */
export async function loadData(): Promise<DealershipData> {
  if (cachedData) return cachedData;

  const res = await fetch('/dealership_data.json');
  if (!res.ok) throw new Error('Failed to load dealership data');
  cachedData = await res.json();
  return cachedData!;
}

/** Validate that a parsed object looks like DealershipData */
export function validateDataset(obj: unknown): obj is DealershipData {
  if (!obj || typeof obj !== 'object') return false;
  const d = obj as Record<string, unknown>;

  // Required top-level arrays
  if (!Array.isArray(d.branches) || d.branches.length === 0) return false;
  if (!Array.isArray(d.sales_reps) || d.sales_reps.length === 0) return false;
  if (!Array.isArray(d.leads) || d.leads.length === 0) return false;
  if (!Array.isArray(d.targets)) return false;
  if (!Array.isArray(d.deliveries)) return false;

  // Spot-check a lead has required fields
  const sampleLead = d.leads[0] as Record<string, unknown>;
  if (
    typeof sampleLead.id !== 'string' ||
    typeof sampleLead.branch_id !== 'string' ||
    typeof sampleLead.status !== 'string' ||
    typeof sampleLead.deal_value !== 'number' ||
    typeof sampleLead.created_at !== 'string'
  ) {
    return false;
  }

  // Spot-check a branch has required fields
  const sampleBranch = d.branches[0] as Record<string, unknown>;
  if (
    typeof sampleBranch.id !== 'string' ||
    typeof sampleBranch.name !== 'string'
  ) {
    return false;
  }

  return true;
}

/** Parse an uploaded JSON file */
export async function parseUploadedData(file: File): Promise<DealershipData> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON file. Please upload a valid JSON file.');
  }

  if (!validateDataset(parsed)) {
    throw new Error(
      'Invalid dataset structure. File must contain branches, sales_reps, leads, targets, and deliveries arrays with the expected fields.'
    );
  }

  return parsed;
}
