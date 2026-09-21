export type RiskLevel = 'High' | 'Medium' | 'Low';
export type Severity = 'critical' | 'serious' | 'warning';

export interface Alert {
  type: string;
  severity: Severity;
  text: string;
}

export interface Project {
  project_id: string;
  name: string;
  ministry?: string;
  sector: string;
  state?: string;
  agency?: string;
  status?: string;
  delay_reason?: string;
  original_cost?: number;
  revised_cost?: number;
  expenditure?: number;
  progress?: number;
  start_date?: string;
  original_end?: string;
  anticipated_end?: string;
  planned_progress: number | null;
  spend_ratio: number | null;
  spi: number | null;
  cpi: number | null;
  reported_delay_months: number | null;
  reported_cost_overrun_pct: number | null;
  forecast_end: string | null;
  forecast_cost: number | null;
  predicted_delay_months: number | null;
  predicted_cost_overrun_pct: number | null;
  delay_probability: number | null;
  risk_score: number;
  risk_level: RiskLevel;
  drivers: { factor: string; contribution: number }[];
  alerts: Alert[];
}

export interface SectorStat {
  sector: string;
  count: number;
  original_cost: number;
  revised_cost: number;
  expenditure: number;
  avg_predicted_delay: number | null;
  avg_cost_overrun: number | null;
  avg_risk: number | null;
  high_risk: number;
}

export interface Summary {
  total_projects: number;
  original_cost: number;
  revised_cost: number;
  expenditure: number;
  avg_progress: number | null;
  avg_predicted_delay: number | null;
  avg_reported_delay: number | null;
  delayed_projects: number;
  risk_counts: Record<RiskLevel, number>;
  alert_count: number;
  alert_types: { type: string; count: number }[];
  sectors: SectorStat[];
  delay_reasons: { reason: string; count: number }[];
}

export interface ModelInfo {
  type: string;
  label: string;
  evaluation: string;
  train_size: number;
  test_size: number;
  accuracy: number;
  baseline_accuracy: number;
  baseline: string;
  positive_rate: number;
  drivers: { feature: string; weight: number }[];
}

export interface Recommendation {
  action: string;
  owner?: string;
  priority?: 'High' | 'Medium' | 'Low';
  impact?: string;
}

export interface AIResult {
  summary: string;
  root_causes: string[];
  recommendations: Recommendation[];
  watch_items: string[];
  source: 'openrouter' | 'rules';
  model?: string;
  fallback_reason?: string;
}

export interface Dataset {
  _id: string;
  filename: string;
  uploaded_at: string;
  as_of: string;
  mapping: { field: string; label: string; column: string }[];
  missing: string[];
  skipped_rows: number;
  model: ModelInfo | null;
  summary: Summary;
  projects: Project[];
  recommendations: Record<string, AIResult>;
  brief: AIResult | null;
}

export interface DatasetListItem {
  _id: string;
  filename: string;
  uploaded_at: string;
  as_of: string;
  summary: { total_projects: number; risk_counts: Record<RiskLevel, number> };
}

export interface Health {
  status: string;
  store: 'mongodb' | 'memory';
  llm: { configured: boolean; model: string };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  source?: 'openrouter' | 'rules';
  model?: string;
  focus?: string[];
}

/** A request from elsewhere in the UI to open the assistant and ask something. */
export interface AskRequest {
  text: string;
  projectId?: string;
  nonce: number;
}
