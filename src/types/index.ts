export interface Customer {
  id: string;
  first_name: string;
  last_name?: string;
  phone_number: string;
  company_name?: string;
  uploaded_at: string;
  campaign_id?: string;
}

export interface SurveyCall {
  id: string;
  customer_first_name: string;
  customer_phone: string;
  call_sid: string;
  call_status: 'queued' | 'in-progress' | 'completed' | 'failed' | 'no-answer';
  call_duration?: number;
  created_at: string;
  updated_at: string;
}

export interface SurveyResponse {
  id: string;
  call_id: string;
  question_number: number;
  question_text: string;
  response_text: string;
  response_sentiment?: 'positive' | 'neutral' | 'negative';
  created_at: string;
}

export interface CallWithResponses extends SurveyCall {
  responses: SurveyResponse[];
}

export interface CampaignSummary {
  total_calls: number;
  completed_calls: number;
  failed_calls: number;
  no_answer_calls: number;
  completion_rate: number;
  average_duration: number;
}

