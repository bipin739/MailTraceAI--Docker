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
  authentication_results: 'mx.company.com; dkim=fail header.i=@company.com; spf=fail (domain of bounce@example.net does not designate 203.0.113.25); dmarc=fail (p=reject)',
  authentication: {
    verification_type: 'observed_header',
    verification_notice: 'Observed authentication result from supplied headers (unverified by local mail server)',
    observed_header: 'mx.company.com; dkim=fail header.i=@company.com; spf=fail (domain of bounce@example.net does not designate 203.0.113.25); dmarc=fail (p=reject)',
    spf: { result: 'fail', details: 'spf=fail (domain of bounce@example.net does not designate 203.0.113.25)' },
    dkim: { result: 'fail', details: 'dkim=fail header.i=@company.com' },
    dmarc: { result: 'fail', details: 'dmarc=fail (p=reject dis=none)' },
    alignment: {
      from_domain: 'micros0ft-example.com',
      reply_to_domain: 'example.net',
      return_path_domain: 'example.net',
      reply_to_mismatch: true,
      return_path_mismatch: true
    }
  },
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
  ],
  domain_intelligence: {
    'micros0ft-example.com': {
      domain: 'micros0ft-example.com',
      dns: {
        a: ['203.0.113.88'],
        aaaa: [],
        mx: ['10 mail.micros0ft-example.com'],
        ns: ['ns1.shadow-dns.com', 'ns2.shadow-dns.com'],
        txt: ['v=spf1 include:spf.protection.outlook.com -all']
      },
      registration: {
        registrar: 'NameCheap, Inc.',
        registration_date: new Date(Date.now() - 18 * 86400000).toISOString(),
        expiration_date: new Date(Date.now() + 347 * 86400000).toISOString(),
        nameservers: ['ns1.shadow-dns.com', 'ns2.shadow-dns.com'],
        status: ['clientTransferProhibited'],
        registration_source: 'RDAP'
      },
      domain_age_days: 18,
      newly_registered_domain: true,
      is_resolvable: true,
      status_message: 'Active / Resolvable',
      lookalike: {
        domain: 'micros0ft-example.com',
        suspected_brand: 'microsoft.com',
        brand_name: 'Microsoft',
        similarity: 0.91,
        techniques: ['character_substitution', 'brand_keyword'],
        confidence_label: 'Potential brand impersonation',
        details: "Substitutes '0' for 'o' targeting Microsoft brand keyword"
      }
    },
    'company.com': {
      domain: 'company.com',
      dns: {
        a: ['198.51.100.10'],
        aaaa: [],
        mx: ['10 mx.company.com'],
        ns: ['ns1.company.com', 'ns2.company.com'],
        txt: ['v=spf1 ip4:198.51.100.10 -all']
      },
      registration: {
        registrar: 'MarkMonitor Inc.',
        registration_date: '1997-04-15T04:00:00Z',
        expiration_date: '2028-04-15T04:00:00Z',
        nameservers: ['ns1.company.com', 'ns2.company.com'],
        status: ['clientDeleteProhibited', 'clientTransferProhibited'],
        registration_source: 'RDAP'
      },
      domain_age_days: Math.floor((Date.now() - new Date('1997-04-15T04:00:00Z').getTime()) / 86400000),
      newly_registered_domain: false,
      is_resolvable: true,
      status_message: 'Active / Resolvable'
    },
    'example.net': {
      domain: 'example.net',
      dns: {
        a: ['93.184.216.34'],
        aaaa: ['2606:2800:220:1:248:1893:25c8:1946'],
        mx: ['0 .'],
        ns: ['a.iana-servers.net', 'b.iana-servers.net'],
        txt: ['v=spf1 -all']
      },
      registration: {
        registrar: 'Internet Assigned Numbers Authority',
        registration_date: '1995-07-10T04:00:00Z',
        expiration_date: '2027-07-09T04:00:00Z',
        nameservers: ['a.iana-servers.net', 'b.iana-servers.net'],
        status: ['serverDeleteProhibited', 'serverTransferProhibited'],
        registration_source: 'RDAP'
      },
      domain_age_days: Math.floor((Date.now() - new Date('1995-07-10T04:00:00Z').getTime()) / 86400000),
      newly_registered_domain: false,
      is_resolvable: true,
      status_message: 'Active / Resolvable'
    },
    'example.org': {
      domain: 'example.org',
      dns: {
        a: ['93.184.216.34'],
        aaaa: ['2606:2800:220:1:248:1893:25c8:1946'],
        mx: ['0 .'],
        ns: ['a.iana-servers.net', 'b.iana-servers.net'],
        txt: ['v=spf1 -all']
      },
      registration: {
        registrar: 'Internet Assigned Numbers Authority',
        registration_date: '1995-07-10T04:00:00Z',
        expiration_date: '2027-07-09T04:00:00Z',
        nameservers: ['a.iana-servers.net', 'b.iana-servers.net'],
        status: ['serverDeleteProhibited', 'serverTransferProhibited'],
        registration_source: 'RDAP'
      },
      domain_age_days: Math.floor((Date.now() - new Date('1995-07-10T04:00:00Z').getTime()) / 86400000),
      newly_registered_domain: false,
      is_resolvable: true,
      status_message: 'Active / Resolvable'
    }
  }
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
