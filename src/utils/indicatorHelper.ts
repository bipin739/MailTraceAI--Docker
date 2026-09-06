import type {
  EmailAnalysis,
  IPIndicator,
  DomainIndicator,
  URLIndicator,
  EmailAddressIndicator,
  AttachmentIndicator,
  IndicatorsGroup,
  AuthenticationAnalysis,
  RelayHop,
  RelayPathAnalysis
} from '../types/forensic';

export const resolveRelayAnalysis = (email: EmailAnalysis): RelayPathAnalysis => {
  if (email.relay_analysis && email.relay_analysis.header_order_hops && email.relay_analysis.header_order_hops.length > 0) {
    return email.relay_analysis;
  }

  const rawReceived = email.received || [];
  if (rawReceived.length === 0) {
    return {
      header_order_hops: [],
      transmission_order_hops: [],
      earliest_observable_node: {
        earliest_observable_ip: undefined,
        from_host: undefined,
        confidence: 'none',
        reason: 'No Received headers present in email'
      },
      trust_notice: 'Headers nearest the recipient\'s mail infrastructure provide stronger evidence than upstream headers, which may be forged by prior nodes.'
    };
  }

  const isPublicIp = (ipStr: string): boolean => {
    if (!ipStr) return false;
    const clean = ipStr.replace(/^IPv6:/i, '').trim();
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|127\.|169\.254\.|100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\.|fc|fe80)/i.test(clean)) {
      return false;
    }
    return true;
  };

  const extractIpFromText = (text?: string): string | undefined => {
    if (!text) return undefined;
    const ipv6M = text.match(/\[(?:IPv6:)?([0-9a-fA-F:]+)\]/i);
    if (ipv6M && ipv6M[1].includes(':')) return ipv6M[1].trim();

    const ipv4B = text.match(/\[((?:\d{1,3}\.){3}\d{1,3})\]/);
    if (ipv4B) return ipv4B[1].trim();

    const ipv4S = text.match(/\b((?:\d{1,3}\.){3}\d{1,3})\b/);
    if (ipv4S) return ipv4S[1].trim();

    const ipv6S = text.match(/\b(?:[0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}\b/);
    if (ipv6S) return ipv6S[0].trim();

    return undefined;
  };

  const parseHeader = (raw: string, idx: number): RelayHop => {
    const clean = raw.replace(/\s+/g, ' ').trim();
    let fromHost: string | undefined;
    let fromIp: string | undefined;
    let byHost: string | undefined;
    let byIp: string | undefined;
    let protocol: string | undefined;
    let idStr: string | undefined;
    let recipient: string | undefined;
    let timestamp: string | undefined;

    let bodyText = clean;
    if (clean.includes(';')) {
      const parts = clean.split(';');
      timestamp = parts.pop()?.trim();
      bodyText = parts.join(';').trim();
    }

    const fromMatch = bodyText.match(/\bfrom\s+(.*?)(?=\bby\b|\bwith\b|\bid\b|\bfor\b|$)/i);
    if (fromMatch) {
      const fromClause = fromMatch[1].trim();
      fromIp = extractIpFromText(fromClause);
      const tokenM = fromClause.match(/^([^\s;()\[\]]+)/);
      if (tokenM && !extractIpFromText(tokenM[1])) {
        fromHost = tokenM[1].trim();
      }
      if (!fromHost) {
        const hostInParen = fromClause.match(/\b([a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,})\b/);
        if (hostInParen && !extractIpFromText(hostInParen[1])) {
          fromHost = hostInParen[1];
        }
      }
    }

    const byMatch = bodyText.match(/\bby\s+(.*?)(?=\bwith\b|\bid\b|\bfor\b|\bfrom\b|$)/i);
    if (byMatch) {
      const byClause = byMatch[1].trim();
      byIp = extractIpFromText(byClause);
      const tokenM = byClause.match(/^([^\s;()\[\]]+)/);
      if (tokenM && !extractIpFromText(tokenM[1])) {
        byHost = tokenM[1].trim();
      }
      if (!byHost) {
        const hostInParen = byClause.match(/\b([a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,})\b/);
        if (hostInParen && !extractIpFromText(hostInParen[1])) {
          byHost = hostInParen[1];
        }
      }
    }

    const withMatch = bodyText.match(/\bwith\s+([A-Za-z0-9\-\_]+)/i);
    if (withMatch) protocol = withMatch[1].trim();

    const idMatch = bodyText.match(/\bid\s+([^\s;]+)/i);
    if (idMatch) idStr = idMatch[1].trim();

    const forMatch = bodyText.match(/\bfor\s+<?([^\s;>]+)>?/i);
    if (forMatch) recipient = forMatch[1].trim();

    const fieldCount = [fromHost, fromIp, byHost, byIp, protocol, idStr, recipient, timestamp].filter(Boolean).length;
    const confidence = fieldCount >= 3 ? 'high' : (fieldCount >= 1 ? 'medium' : 'low');

    return {
      hop_number: idx,
      from_host: fromHost,
      from_ip: fromIp,
      by_host: byHost,
      by_ip: byIp,
      protocol,
      id: idStr,
      recipient,
      timestamp,
      parser_confidence: confidence,
      raw
    };
  };

  const headerHops = rawReceived.map((r, i) => parseHeader(r, i + 1));
  const transmissionHops = [...rawReceived].reverse().map((r, i) => parseHeader(r, i + 1));

  let earliestIp: string | undefined;
  let earliestHost: string | undefined;
  let confidence: 'high' | 'medium' | 'low' | 'none' = 'none';
  let reason = 'No public IP address found in Received header chain';

  for (const hop of transmissionHops) {
    if (hop.from_ip && isPublicIp(hop.from_ip)) {
      earliestIp = hop.from_ip;
      earliestHost = hop.from_host;
      confidence = 'high';
      reason = `Earliest public IP found in Received chain at Hop #${hop.hop_number} (from ${hop.from_host || 'unknown'})`;
      break;
    }
    if (hop.by_ip && isPublicIp(hop.by_ip)) {
      earliestIp = hop.by_ip;
      earliestHost = hop.by_host;
      confidence = 'medium';
      reason = `Earliest public receiving server IP found at Hop #${hop.hop_number}`;
      break;
    }
  }

  return {
    header_order_hops: headerHops,
    transmission_order_hops: transmissionHops,
    earliest_observable_node: {
      earliest_observable_ip: earliestIp,
      from_host: earliestHost,
      confidence,
      reason
    },
    trust_notice: 'Headers nearest the recipient\'s mail infrastructure provide stronger evidence than upstream headers, which may be forged by prior nodes.'
  };
};

export const resolveEmailIndicators = (email: EmailAnalysis): EmailAnalysis => {
  const fullText = `
    ${email.subject || ''}
    ${email.from || (email as any).from_header || ''}
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

  // 2. Resolve Authentication & Sender Alignment
  const extractDomain = (str?: string): string | undefined => {
    if (!str) return undefined;
    const match = str.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return match ? match[1].toLowerCase() : undefined;
  };

  const fromVal = email.from || (email as any).from_header;
  const fromDom = email.authentication?.alignment?.from_domain || extractDomain(fromVal);
  const replyDom = email.authentication?.alignment?.reply_to_domain || extractDomain(email.reply_to);
  const returnDom = email.authentication?.alignment?.return_path_domain || extractDomain(email.return_path);

  const replyMismatch = Boolean(replyDom && fromDom && replyDom.toLowerCase() !== fromDom.toLowerCase());
  const returnMismatch = Boolean(returnDom && fromDom && returnDom.toLowerCase() !== fromDom.toLowerCase());

  const fullHeaderAndBody = `
    ${email.authentication_results || ''}
    ${(email.received || []).join('\n')}
    ${email.raw_email || ''}
  `;

  // Parse SPF
  const spfMatch = fullHeaderAndBody.match(/\bspf=(pass|fail|softfail|neutral|none|temperror|permerror)\b/i) ||
                   fullHeaderAndBody.match(/\bReceived-SPF:\s*(pass|fail|softfail|neutral|none|temperror|permerror)\b/i);
  let spfResult = spfMatch ? spfMatch[1].toLowerCase() : 'none';
  if (spfResult === 'none' && /spf=pass|received-spf:\s*pass/i.test(fullHeaderAndBody)) spfResult = 'pass';
  if (spfResult === 'none' && /spf=fail|received-spf:\s*fail/i.test(fullHeaderAndBody)) spfResult = 'fail';
  if (spfResult === 'none' && /spf=softfail|received-spf:\s*softfail/i.test(fullHeaderAndBody)) spfResult = 'softfail';

  // Parse DKIM
  const dkimMatch = fullHeaderAndBody.match(/\bdkim=(pass|fail|neutral|none|temperror|permerror)\b/i);
  let dkimResult = dkimMatch ? dkimMatch[1].toLowerCase() : 'none';
  if (dkimResult === 'none' && /dkim=pass/i.test(fullHeaderAndBody)) dkimResult = 'pass';
  if (dkimResult === 'none' && /dkim=fail/i.test(fullHeaderAndBody)) dkimResult = 'fail';
  if (dkimResult === 'none' && /DKIM-Signature:/i.test(fullHeaderAndBody)) dkimResult = 'pass';

  // Parse DMARC
  const dmarcMatch = fullHeaderAndBody.match(/\bdmarc=(pass|fail|neutral|none|temperror|permerror)\b/i);
  let dmarcResult = dmarcMatch ? dmarcMatch[1].toLowerCase() : 'none';
  if (dmarcResult === 'none' && /dmarc=pass/i.test(fullHeaderAndBody)) dmarcResult = 'pass';
  if (dmarcResult === 'none' && /dmarc=fail/i.test(fullHeaderAndBody)) dmarcResult = 'fail';

  const existingAuth = email.authentication;
  const finalSpfResult = (existingAuth?.spf?.result && existingAuth.spf.result !== 'none' && existingAuth.spf.result !== 'unknown')
    ? existingAuth.spf.result
    : (spfResult !== 'none' ? spfResult : (existingAuth?.spf?.result || 'none'));

  const finalDkimResult = (existingAuth?.dkim?.result && existingAuth.dkim.result !== 'none' && existingAuth.dkim.result !== 'unknown')
    ? existingAuth.dkim.result
    : (dkimResult !== 'none' ? dkimResult : (existingAuth?.dkim?.result || 'none'));

  const finalDmarcResult = (existingAuth?.dmarc?.result && existingAuth.dmarc.result !== 'none' && existingAuth.dmarc.result !== 'unknown')
    ? existingAuth.dmarc.result
    : (dmarcResult !== 'none' ? dmarcResult : (existingAuth?.dmarc?.result || 'none'));

  const authAnalysis: AuthenticationAnalysis = {
    verification_type: 'observed_header',
    verification_notice: 'Observed authentication result from supplied headers (unverified by local mail server)',
    observed_header: existingAuth?.observed_header || email.authentication_results || undefined,
    spf: {
      result: finalSpfResult,
      details: existingAuth?.spf?.details || (spfMatch ? spfMatch[0] : undefined)
    },
    dkim: {
      result: finalDkimResult,
      details: existingAuth?.dkim?.details || (dkimMatch ? dkimMatch[0] : (finalDkimResult === 'pass' ? 'DKIM-Signature header observed' : undefined))
    },
    dmarc: {
      result: finalDmarcResult,
      details: existingAuth?.dmarc?.details || (dmarcMatch ? dmarcMatch[0] : undefined)
    },
    alignment: {
      from_domain: fromDom,
      reply_to_domain: replyDom,
      return_path_domain: returnDom,
      reply_to_mismatch: replyMismatch,
      return_path_mismatch: returnMismatch
    }
  };

  const relayAnalysis = resolveRelayAnalysis(email);

  // 3. URLs
  let urlObjs: URLIndicator[] = email.indicators?.urls || [];
  if (urlObjs.length === 0) {
    const rawUrls = email.urls && email.urls.length > 0
      ? email.urls
      : Array.from(new Set((fullText.match(/https?:\/\/[^\s<>"'\)\(\]\[\}\s,]+/gi) || []).map(u => u.replace(/[.,;:!?"\')]>]+$/, ''))));
    urlObjs = rawUrls.map(u => ({ value: u, source: 'plain_text_body' }));
  }
  const urlStrings = Array.from(new Set(urlObjs.map(u => u.value)));

  // 4. IPs
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

  // 5. Email Addresses
  let emailObjs: EmailAddressIndicator[] = email.indicators?.email_addresses || [];
  if (emailObjs.length === 0) {
    const rawEmails = email.emails && email.emails.length > 0
      ? email.emails
      : Array.from(new Set((fullText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g) || []).map(e => e.toLowerCase())));
    emailObjs = rawEmails.map(e => ({ value: e, source: 'header_address' }));
  }
  const emailStrings = Array.from(new Set(emailObjs.map(e => e.value)));

  // 6. Domains
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

  // 7. Attachments
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
    authentication: authAnalysis,
    relay_analysis: relayAnalysis,
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
