import type { DealershipData } from './types';

let cachedData: DealershipData | null = null;

export async function loadData(): Promise<DealershipData> {
  if (cachedData) return cachedData;

  const res = await fetch('/dealership_data.json');
  if (!res.ok) throw new Error('Failed to load dealership data');
  cachedData = await res.json();
  return cachedData!;
}

// For server-side / build time usage
export function loadDataSync(): DealershipData {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const data = require('../../public/dealership_data.json');
  return data as DealershipData;
}
