export interface ProtocolResult {
  result?: 'pass' | 'fail' | 'softfail' | 'neutral' | 'none' | 'temperror' | 'permerror' | 'unknown' | string;
  details?: string;
}

export interface SenderAlignment {
  from_domain?: string;
  reply_to_domain?: string;
  return_path_domain?: string;
  reply_to_mismatch?: boolean;
  return_path_mismatch?: boolean;
}

export interface AuthenticationAnalysis {
  verification_type?: 'observed_header' | 'independent_validation' | string;
  verification_notice?: string;
  observed_header?: string;
  spf?: ProtocolResult;
  dkim?: ProtocolResult;
  dmarc?: ProtocolResult;
  alignment?: SenderAlignment;
}

export interface IPIndicator {
  value: string;
  version?: number;
  scope?: 'public' | 'private' | 'loopback' | 'link_local' | 'reserved' | 'unknown' | string;
  source?: string;
}

export interface DomainIndicator {
  value: string;
  source?: string;
}

export interface URLIndicator {
  value: string;
  source?: string;
}

export interface EmailAddressIndicator {
  value: string;
  source?: string;
}

export interface AttachmentIndicator {
  filename?: string;
  mime_type?: string;
  size?: number;
  sha256?: string;
  md5?: string;
  sha1?: string;
}

export interface IndicatorsGroup {
  ips?: IPIndicator[];
  domains?: DomainIndicator[];
  urls?: URLIndicator[];
  email_addresses?: EmailAddressIndicator[];
  attachments?: AttachmentIndicator[];
}

export interface EmailAttachment {
  filename?: string;
  mime_type?: string;
  size?: number;
  sha256?: string;
}

export interface EmailAnalysis {
  id?: string;
  email_sha256?: string;
  authentication?: AuthenticationAnalysis;
  indicators?: IndicatorsGroup;
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
