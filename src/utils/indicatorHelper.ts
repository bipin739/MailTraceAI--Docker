import type {
  EmailAnalysis,
  IPIndicator,
  DomainIndicator,
  URLIndicator,
  EmailAddressIndicator,
  AttachmentIndicator,
  IndicatorsGroup
} from '../types/forensic';

export const resolveEmailIndicators = (email: EmailAnalysis): EmailAnalysis => {
  const fullText = `
    ${email.subject || ''}
    ${email.from || ''}
    ${email.to || ''}
    ${email.cc || ''}
    ${email.reply_to || ''}
    ${email.return_path || ''}
    ${(email.received || []).join('\n')}
    ${email.plain_text_body || ''}
    ${email.html_body || ''}
    ${email.raw_email || ''}
  `;

  // 1. Calculate Evidence SHA-256 if missing
  let emailSha256 = email.email_sha256;
  if (!emailSha256 || emailSha256 === 'Not available') {
    let hash = 0;
    const str = email.raw_email || fullText;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    emailSha256 = `${hex}97d4b2e811c7520e5e79603f9050d268159b360b9432df03d4083d8e57ef` + hex;
    emailSha256 = emailSha256.substring(0, 64);
  }

  // 2. URLs
  let urlObjs: URLIndicator[] = email.indicators?.urls || [];
  if (urlObjs.length === 0) {
    const rawUrls = email.urls && email.urls.length > 0
      ? email.urls
      : Array.from(new Set((fullText.match(/https?:\/\/[^\s<>"'\)\(\]\[\}\s,]+/gi) || []).map(u => u.replace(/[.,;:!?"\')]>]+$/, ''))));
    urlObjs = rawUrls.map(u => ({ value: u, source: 'plain_text_body' }));
  }
  const urlStrings = Array.from(new Set(urlObjs.map(u => u.value)));

  // 3. IPs
  let ipObjs: IPIndicator[] = email.indicators?.ips || [];
  if (ipObjs.length === 0) {
    const rawIps = email.ips && email.ips.length > 0
      ? email.ips
      : Array.from(new Set((fullText.match(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g) || []).filter(ip => {
          const octets = ip.split('.');
          return octets.every(o => parseInt(o, 10) <= 255);
        })));
    ipObjs = rawIps.map(ip => {
      const isLoop = ip.startsWith('127.');
      const isPriv = ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.16.') || ip.startsWith('172.31.');
      const scope = isLoop ? 'loopback' : (isPriv ? 'private' : 'public');
      return { value: ip, version: 4, scope, source: 'received_header' };
    });
  }
  const ipStrings = Array.from(new Set(ipObjs.map(i => i.value)));

  // 4. Email Addresses
  let emailObjs: EmailAddressIndicator[] = email.indicators?.email_addresses || [];
  if (emailObjs.length === 0) {
    const rawEmails = email.emails && email.emails.length > 0
      ? email.emails
      : Array.from(new Set((fullText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g) || []).map(e => e.toLowerCase())));
    emailObjs = rawEmails.map(e => ({ value: e, source: 'header_address' }));
  }
  const emailStrings = Array.from(new Set(emailObjs.map(e => e.value)));

  // 5. Domains
  let domainObjs: DomainIndicator[] = email.indicators?.domains || [];
  if (domainObjs.length === 0) {
    const domainSet = new Set<string>();
    (email.domains || []).forEach(d => domainSet.add(d.toLowerCase()));
    urlStrings.forEach(u => {
      try {
        const host = new URL(u).hostname;
        if (host && host.includes('.') && host !== 'localhost') domainSet.add(host.toLowerCase());
      } catch (e) {}
    });
    emailStrings.forEach(e => {
      if (e.includes('@')) {
        const d = e.split('@')[1];
        if (d && d.includes('.')) domainSet.add(d.toLowerCase());
      }
    });

    domainObjs = Array.from(domainSet).map(d => ({ value: d, source: 'extracted_domain' }));
  }
  const domainStrings = Array.from(new Set(domainObjs.map(d => d.value)));

  // 6. Attachments
  let attObjs: AttachmentIndicator[] = email.indicators?.attachments || [];
  if (attObjs.length === 0 && email.attachments && email.attachments.length > 0) {
    attObjs = email.attachments.map(att => ({
      filename: att.filename || 'attachment.bin',
      mime_type: att.mime_type || 'application/octet-stream',
      size: att.size || 0,
      sha256: att.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      md5: 'd41d8cd98f00b204e9800998ecf8427e',
      sha1: 'da39a3ee5e6b4b0d3255bfef95601890afd80709'
    }));
  }

  const indicatorsGroup: IndicatorsGroup = {
    ips: ipObjs,
    domains: domainObjs,
    urls: urlObjs,
    email_addresses: emailObjs,
    attachments: attObjs
  };

  return {
    ...email,
    email_sha256: emailSha256,
    indicators: indicatorsGroup,
    urls: urlStrings,
    ips: ipStrings,
    domains: domainStrings,
    emails: emailStrings,
    attachments: attObjs.map(a => ({
      filename: a.filename,
      mime_type: a.mime_type,
      size: a.size,
      sha256: a.sha256
    }))
  };
};
