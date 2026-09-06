import type { EmailAnalysis } from '../types/forensic';
import { resolveEmailIndicators } from './indicatorHelper';

const STORAGE_KEY_PREFIX = 'mailtrace_forensic_';
const memoryStore = new Map<string, EmailAnalysis>();

export const MOCK_SAMPLE_ANALYSIS: EmailAnalysis = resolveEmailIndicators({
  id: 'sample-001',
  email_sha256: '97d4b2e811c7520e5e79603f9050d268159b360b9432df03d4083d8e57ef228a',
  subject: 'URGENT: Verify your Microsoft Account',
  from: 'Microsoft Security <security@micros0ft-example.com>',
  to: 'employee@company.com',
  cc: '',
  date: 'Sun, 7 Sep 2026 10:42:00 +0530',
  reply_to: 'support@example.net',
  return_path: 'bounce@example.net',
  message_id: '<abc123@example.com>',
  authentication_results: 'spf=fail; dkim=none; dmarc=fail',
  received: [
    'from mail.example.net (203.0.113.25) by mx.company.com; Sun, 7 Sep 2026 10:42:01 +0530',
    'from smtp.example.org (198.51.100.12) by mail.example.net; Sun, 7 Sep 2026 10:41:59 +0530'
  ],
  plain_text_body: 'Your Microsoft account requires immediate verification. Please visit the secure link below to update your login credentials.\n\nLink: https://micros0ft-example.com/login',
  html_body: '<html><body><p>Your Microsoft account requires immediate verification.</p><p>Please <a href="https://micros0ft-example.com/login">click here</a> to verify your account.</p></body></html>',
  raw_email: `From: Microsoft Security <security@micros0ft-example.com>
To: employee@company.com
Subject: URGENT: Verify your Microsoft Account
Date: Sun, 7 Sep 2026 10:42:00 +0530
Reply-To: support@example.net
Return-Path: bounce@example.net
Message-ID: <abc123@example.com>
Authentication-Results: spf=fail; dkim=none; dmarc=fail
Received: from mail.example.net (203.0.113.25) by mx.company.com; Sun, 7 Sep 2026 10:42:01 +0530
Received: from smtp.example.org (198.51.100.12) by mail.example.net; Sun, 7 Sep 2026 10:41:59 +0530
Content-Type: multipart/mixed; boundary="BOUNDARY"

--BOUNDARY
Content-Type: text/plain; charset=utf-8

Your Microsoft account requires immediate verification.
Link: https://micros0ft-example.com/login

--BOUNDARY
Content-Type: application/pdf; name="invoice.pdf"
Content-Disposition: attachment; filename="invoice.pdf"

[PDF Attachment Bytes]
--BOUNDARY--`,
  indicators: {
    ips: [
      { value: '203.0.113.25', version: 4, scope: 'public', source: 'received_header_1' },
      { value: '198.51.100.12', version: 4, scope: 'public', source: 'received_header_2' }
    ],
    domains: [
      { value: 'micros0ft-example.com', source: 'url' },
      { value: 'example.net', source: 'reply_to' },
      { value: 'example.org', source: 'received_header' },
      { value: 'company.com', source: 'to' }
    ],
    urls: [
      { value: 'https://micros0ft-example.com/login', source: 'plain_text_body' }
    ],
    email_addresses: [
      { value: 'security@micros0ft-example.com', source: 'header_from' },
      { value: 'employee@company.com', source: 'header_to' },
      { value: 'support@example.net', source: 'header_reply_to' },
      { value: 'bounce@example.net', source: 'header_return_path' }
    ],
    attachments: [
      {
        filename: 'invoice.pdf',
        mime_type: 'application/pdf',
        size: 241000,
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        md5: 'd41d8cd98f00b204e9800998ecf8427e',
        sha1: 'da39a3ee5e6b4b0d3255bfef95601890afd80709'
      }
    ]
  },
  urls: [
    'https://micros0ft-example.com/login'
  ],
  ips: [
    '203.0.113.25',
    '198.51.100.12'
  ],
  domains: [
    'micros0ft-example.com',
    'example.net',
    'example.org',
    'company.com'
  ],
  emails: [
    'security@micros0ft-example.com',
    'employee@company.com',
    'support@example.net',
    'bounce@example.net'
  ],
  attachments: [
    {
      filename: 'invoice.pdf',
      mime_type: 'application/pdf',
      size: 241000,
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    }
  ]
});

export const saveAnalysisResult = (id: string, data: EmailAnalysis): void => {
  const resolved = resolveEmailIndicators({ ...data, id });
  memoryStore.set(id, resolved);
  try {
    sessionStorage.setItem(STORAGE_KEY_PREFIX + id, JSON.stringify(resolved));
  } catch (e) {
    console.warn('Unable to persist analysis in sessionStorage', e);
  }
};

export const getAnalysisResult = (id: string): EmailAnalysis | null => {
  if (memoryStore.has(id)) {
    return resolveEmailIndicators(memoryStore.get(id)!);
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_PREFIX + id);
    if (raw) {
      const parsed = JSON.parse(raw);
      const resolved = resolveEmailIndicators(parsed);
      memoryStore.set(id, resolved);
      return resolved;
    }
  } catch (e) {
    console.warn('Error reading analysis from sessionStorage', e);
  }

  if (id === 'sample-001' || id === 'latest' || id === 'demo') {
    return MOCK_SAMPLE_ANALYSIS;
  }

  return null;
};
