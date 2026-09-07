export interface SharedIndicator {
  type: string;
  value: string;
  details?: string;
}

export interface MatchedSignalDetail {
  signal_name: string;
  weight: number;
  matched_values: string[];
  contribution: number;
}

export interface RelatedCaseItem {
  case_id: string;
  case_number: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | string;
  status: 'open' | 'investigating' | 'resolved' | 'escalated' | string;
  correlation_score: number;
  relationship_label: string;
  shared_evidence_summary: string;
  shared_indicators: SharedIndicator[];
  matching_signals: Record<string, MatchedSignalDetail>;
}

export interface CampaignCorrelationResponse {
  related_cases: RelatedCaseItem[];
  correlation_score: number;
  relationship_label: string;
  shared_indicators: SharedIndicator[];
}
