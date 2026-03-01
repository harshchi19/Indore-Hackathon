/* ── Analytics responses (dict-based from backend) ─── */

export interface CO2Report {
  contract_id: string;
  energy_kwh: number;
  co2_avoided_kg: number;
  energy_source: string;
}

export interface MonthlyAnalytics {
  year: number;
  month: number;
  total_kwh: number;
  co2_avoided_kg: number;
  contracts_count: number;
}

export interface AnalyticsDashboard {
  total_energy_kwh: number;
  total_co2_avoided_kg: number;
  total_contracts: number;
  total_certificates: number;
  energy_by_source: Record<string, number>;
  monthly_trend: MonthlyAnalytics[];
}

export interface ProducerPerformance {
  producer_id: string;
  company_name: string;
  total_kwh: number;
  co2_avoided_kg: number;
  contracts_count: number;
}
