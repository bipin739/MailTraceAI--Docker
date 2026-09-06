export interface EmailAttachment {
  filename?: string;
  mime_type?: string;
  size?: number;
}

export interface EmailAnalysis {
  id?: string;
  subject?: string;
  from?: string;
  to?: string;
  cc?: string;
  date?: string;
  reply_to?: string;
  return_path?: string;
  message_id?: string;
  received?: string[];
  authentication_results?: string;
  plain_text_body?: string;
  html_body?: string;
  raw_email?: string;
  urls?: string[];
  ips?: string[];
  domains?: string[];
  emails?: string[];
  attachments?: EmailAttachment[];
}

export type ForensicTabType = 'overview' | 'headers' | 'content' | 'indicators' | 'attachments' | 'raw';
