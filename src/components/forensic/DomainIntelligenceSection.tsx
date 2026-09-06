import React, { useState, useEffect } from 'react';
import { Globe, Server, Calendar, Shield, Clock, CheckCircle2, XCircle, Info, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { EmailAnalysis, DomainIntelligence } from '../../types/forensic';
import { resolveDomainIntelligence } from '../../utils/indicatorHelper';
import { CopyButton } from './CopyButton';

interface DomainIntelligenceSectionProps {
  email: EmailAnalysis;
}

export const DomainIntelligenceSection: React.FC<DomainIntelligenceSectionProps> = ({ email }) => {
  const [activeDnsTab, setActiveDnsTab] = useState<Record<string, 'A' | 'MX' | 'NS' | 'TXT'>>({});
  const [filter, setFilter] = useState<'all' | 'lookalike' | 'new' | 'resolvable'>('all');
  const [liveDomainIntel, setLiveDomainIntel] = useState<Record<string, DomainIntelligence>>({});

  // Gather unique domains
  const domainSet = new Set<string>();
  (email.indicators?.domains || []).forEach(d => domainSet.add(d.value.toLowerCase()));
  (email.domains || []).forEach(d => domainSet.add(d.toLowerCase()));
  if (email.authentication?.alignment?.from_domain) domainSet.add(email.authentication.alignment.from_domain.toLowerCase());
  if (email.authentication?.alignment?.reply_to_domain) domainSet.add(email.authentication.alignment.reply_to_domain.toLowerCase());
  if (email.authentication?.alignment?.return_path_domain) domainSet.add(email.authentication.alignment.return_path_domain.toLowerCase());

  const domainKey = Array.from(domainSet).sort().join(',');

  // Auto-enrich any domains missing registration or age via live backend API
  useEffect(() => {
    let isMounted = true;
    const initialMap = email.domain_intelligence || {};
    const domainsToFetch = domainKey ? domainKey.split(',').filter(Boolean) : [];

    domainsToFetch.forEach(async (dom) => {
      const existing = initialMap[dom];
      if (!existing || existing.domain_age_days === undefined || !existing.registration?.registration_date) {
        try {
          const resp = await fetch(`http://localhost:8000/api/emails/lookup-domain/${encodeURIComponent(dom)}`);
          if (resp.ok && isMounted) {
            const data: DomainIntelligence = await resp.json();
            setLiveDomainIntel(prev => {
              if (prev[dom]?.domain_age_days !== undefined) return prev;
              return { ...prev, [dom]: data };
            });
          }
        } catch {
          // Backend offline or unreachable, client fallback remains
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [email.id, email.domain_intelligence, domainKey]);

  const domainIntelMap: Record<string, DomainIntelligence> = {
    ...(email.domain_intelligence || {}),
    ...liveDomainIntel
  };

  const domainList: DomainIntelligence[] = Array.from(domainSet).map(dom => {
    return resolveDomainIntelligence(dom, domainIntelMap);
  });

  const lookalikeCount = domainList.filter(d => d.lookalike).length;

  const filteredDomains = domainList.filter(d => {
    if (filter === 'lookalike') return Boolean(d.lookalike);
    if (filter === 'new') return Boolean(d.newly_registered_domain);
    if (filter === 'resolvable') return d.is_resolvable;
    return true;
  });

  const formatDate = (isoStr?: string): string => {
    if (!isoStr) return 'Unavailable';
    try {
      const dt = new Date(isoStr);
      return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  const formatTechniqueName = (tech: string): string => {
    const map: Record<string, string> = {
      character_substitution: 'Character Substitution',
      brand_keyword: 'Brand Keyword',
      suspicious_subdomain_abuse: 'Subdomain Abuse',
      hyphenation: 'Hyphen Variation',
      added_affix: 'Added Prefix / Suffix',
      punycode: 'Punycode',
      unicode_homoglyphs: 'Unicode Homoglyphs',
      levenshtein_distance: 'Levenshtein Distance'
    };
    return map[tech] || tech.replace(/_/g, ' ');
  };

  const getActiveTab = (domain: string): 'A' | 'MX' | 'NS' | 'TXT' => {
    return activeDnsTab[domain] || 'A';
  };

  const setActiveTabForDomain = (domain: string, tab: 'A' | 'MX' | 'NS' | 'TXT') => {
    setActiveDnsTab(prev => ({ ...prev, [domain]: tab }));
  };

  return (
    <div className="space-y-6">
      {/* Security & Forensic Limitation Notice */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-start gap-3 backdrop-blur-sm shadow-sm">
        <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-slate-300">
          <span className="font-semibold text-slate-200">Domain Intelligence Safety Notice:</span>{' '}
          All domain intelligence is resolved strictly via server-side DNS queries and RDAP registration endpoints. Target domain web servers are never contacted, website content is never loaded, and remote scripts are never executed.
        </div>
      </div>

      {/* Lookalike Findings Banner */}
      {lookalikeCount > 0 && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/70 flex items-start gap-3 backdrop-blur-sm shadow-md">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-slate-200 space-y-1">
            <div>
              <span className="font-bold text-red-300 uppercase tracking-wider">Potential Brand Impersonation Alert:</span>{' '}
              Found <strong className="text-red-400 font-bold">{lookalikeCount}</strong> domain{lookalikeCount !== 1 ? 's' : ''} exhibiting deceptive similarity or brand keyword abuse (e.g. character substitution, extra hyphens, or suspicious subdomains).
            </div>
            <div className="text-[11px] text-slate-400 italic">
              Confidence Notice: Similarity observations indicate potential lookalike indicators and do not establish malicious intent as fact.
            </div>
          </div>
        </div>
      )}

      {/* Header Bar with Filters */}
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                Domain Infrastructure & Registration Intelligence
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-normal">
                  {domainList.length} Domain{domainList.length !== 1 ? 's' : ''}
                </span>
              </h3>
              <p className="text-xs font-mono text-slate-400">DNS record sets, authoritative registration metadata, and brand lookalike detection</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                filter === 'all' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({domainList.length})
            </button>
            {lookalikeCount > 0 && (
              <button
                onClick={() => setFilter('lookalike')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  filter === 'lookalike' ? 'bg-red-600 text-white shadow-sm' : 'text-red-400 hover:text-red-300 bg-red-950/30 border border-red-900/60'
                }`}
              >
                Impersonation ({lookalikeCount})
              </button>
            )}
            <button
              onClick={() => setFilter('new')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                filter === 'new' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              New &lt; 30d ({domainList.filter(d => d.newly_registered_domain).length})
            </button>
            <button
              onClick={() => setFilter('resolvable')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                filter === 'resolvable' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Resolvable ({domainList.filter(d => d.is_resolvable).length})
            </button>
          </div>
        </div>
      </div>

      {/* Domain Cards Grid */}
      {filteredDomains.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl space-y-2 bg-slate-950/40">
          <Globe className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs font-mono text-slate-400 font-semibold">
            No domains match the selected filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDomains.map(item => {
            const currentTab = getActiveTab(item.domain);
            const ageDisplay = item.domain_age_days !== undefined && item.domain_age_days !== null
              ? `${item.domain_age_days} days`
              : 'Registration date unavailable';

            const hasMx = item.dns.mx && item.dns.mx.length > 0;
            const hasA = (item.dns.a && item.dns.a.length > 0) || (item.dns.aaaa && item.dns.aaaa.length > 0);
            const hasNs = item.dns.ns && item.dns.ns.length > 0;
            const hasTxt = item.dns.txt && item.dns.txt.length > 0;

            return (
              <div
                key={item.domain}
                className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all backdrop-blur-xl shadow-lg space-y-4"
              >
                {/* Domain Card Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-mono font-bold text-slate-100 break-all">
                        {item.domain}
                      </span>
                      {item.punycode && (
                        <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          Punycode: {item.punycode}
                        </span>
                      )}

                      {/* Resolvable Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                          item.is_resolvable
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                            : 'bg-rose-950/80 text-rose-300 border-rose-800/80'
                        }`}
                      >
                        {item.is_resolvable ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active / Resolvable</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>{item.status_message || 'NXDOMAIN'}</span>
                          </>
                        )}
                      </span>

                      {/* Newly Registered Domain Observation Badge */}
                      {item.newly_registered_domain && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/90 text-amber-300 border border-amber-800/90"
                          title="Neutral forensic observation: Domain registered within 30 days"
                        >
                          <Clock className="w-3 h-3" />
                          <span>Newly Registered (&lt; 30d)</span>
                        </span>
                      )}

                      {/* Potential Brand Impersonation Badge */}
                      {item.lookalike && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950/90 text-red-300 border border-red-800/90"
                          title={`Potential ${item.lookalike.brand_name} brand impersonation`}
                        >
                          <ShieldAlert className="w-3 h-3 text-red-400" />
                          <span>Potential {item.lookalike.brand_name} Impersonation</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <CopyButton text={item.domain} label="Copy Domain" />
                </div>

                {/* Brand Impersonation Finding Card */}
                {item.lookalike && (
                  <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/60 backdrop-blur-sm space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-800/40 pb-2">
                      <div className="flex items-center space-x-2">
                        <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                        <span className="text-xs font-mono font-bold text-red-300 uppercase tracking-wider">
                          Potential {item.lookalike.brand_name} Impersonation
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs font-mono bg-red-950/80 px-2.5 py-1 rounded-lg border border-red-800/60">
                        <span className="text-slate-400 text-[11px]">Similarity:</span>
                        <span className="text-red-400 font-bold">{Math.round(item.lookalike.similarity * 100)}%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                      <div className="bg-slate-950/60 p-2.5 rounded-lg border border-red-950">
                        <span className="text-[10px] uppercase text-slate-400 font-bold block mb-0.5">Observed domain</span>
                        <span className="text-red-300 font-semibold break-all">{item.lookalike.domain}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-lg border border-red-950">
                        <span className="text-[10px] uppercase text-slate-400 font-bold block mb-0.5">Reference domain</span>
                        <span className="text-emerald-400 font-semibold break-all">{item.lookalike.suspected_brand}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-lg border border-red-950">
                        <span className="text-[10px] uppercase text-slate-400 font-bold block mb-0.5">Similarity</span>
                        <span className="text-amber-300 font-semibold">{Math.round(item.lookalike.similarity * 100)}%</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1.5">Detected techniques</span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.lookalike.techniques.map((tech, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-red-900/40 text-red-200 border border-red-700/60">
                            {formatTechniqueName(tech)}
                          </span>
                        ))}
                      </div>
                    </div>

                    {item.lookalike.details && (
                      <p className="text-[11px] font-mono text-slate-400 italic">
                        {item.lookalike.details}
                      </p>
                    )}
                  </div>
                )}

                {/* Registration Metadata Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                  {/* Domain Age */}
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" /> Domain Age
                    </span>
                    <p className={`font-semibold ${item.domain_age_days !== undefined && item.domain_age_days !== null ? 'text-cyan-300 text-sm font-bold' : 'text-slate-400 italic'}`}>
                      {ageDisplay}
                    </p>
                  </div>

                  {/* Registrar */}
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                      <Shield className="w-3 h-3 text-blue-400" /> Registrar
                    </span>
                    <p className="text-slate-200 font-semibold truncate" title={item.registration.registrar || 'Unavailable'}>
                      {item.registration.registrar || 'Unavailable'}
                    </p>
                    <span className="text-[10px] text-slate-400 block">
                      Source: {item.registration.registration_source || 'unavailable'}
                    </span>
                  </div>

                  {/* Registration Date */}
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-400" /> Registration Date
                    </span>
                    <p className="text-slate-300 font-semibold">
                      {formatDate(item.registration.registration_date)}
                    </p>
                  </div>

                  {/* Expiration Date */}
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-purple-400" /> Expiration Date
                    </span>
                    <p className="text-slate-300 font-semibold">
                      {formatDate(item.registration.expiration_date)}
                    </p>
                  </div>
                </div>

                {/* Delegated Nameservers */}
                {item.registration.nameservers && item.registration.nameservers.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs font-mono flex flex-wrap items-center gap-2">
                    <span className="text-slate-400 text-[11px] font-bold">Nameservers:</span>
                    {item.registration.nameservers.map((ns, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[11px]">
                        {ns}
                      </span>
                    ))}
                  </div>
                )}

                {/* DNS Records Section with Tabs */}
                <div className="bg-slate-900/50 rounded-xl border border-slate-800/80 p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800/80 pb-2">
                    <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-cyan-400" />
                      Resolved DNS Records
                    </span>

                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
                      <button
                        onClick={() => setActiveTabForDomain(item.domain, 'A')}
                        className={`px-2.5 py-1 rounded font-bold transition-colors ${
                          currentTab === 'A' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        A / AAAA ({item.dns.a.length + item.dns.aaaa.length})
                      </button>
                      <button
                        onClick={() => setActiveTabForDomain(item.domain, 'MX')}
                        className={`px-2.5 py-1 rounded font-bold transition-colors ${
                          currentTab === 'MX' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        MX ({item.dns.mx.length})
                      </button>
                      <button
                        onClick={() => setActiveTabForDomain(item.domain, 'NS')}
                        className={`px-2.5 py-1 rounded font-bold transition-colors ${
                          currentTab === 'NS' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        NS ({item.dns.ns.length})
                      </button>
                      <button
                        onClick={() => setActiveTabForDomain(item.domain, 'TXT')}
                        className={`px-2.5 py-1 rounded font-bold transition-colors ${
                          currentTab === 'TXT' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        TXT ({item.dns.txt.length})
                      </button>
                    </div>
                  </div>

                  {/* Tab Contents */}
                  <div className="font-mono text-xs">
                    {currentTab === 'A' && (
                      <div className="space-y-2">
                        {!hasA ? (
                          <p className="text-slate-500 italic text-[11px]">No A or AAAA records returned.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {item.dns.a.map((ip, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200">
                                <span><strong className="text-cyan-400">A:</strong> {ip}</span>
                                <CopyButton text={ip} iconOnly />
                              </div>
                            ))}
                            {item.dns.aaaa.map((ip, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200">
                                <span><strong className="text-purple-400">AAAA:</strong> {ip}</span>
                                <CopyButton text={ip} iconOnly />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {currentTab === 'MX' && (
                      <div className="space-y-2">
                        {!hasMx ? (
                          <p className="text-slate-500 italic text-[11px]">No MX mail exchanger records returned.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {item.dns.mx.map((mx, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200">
                                <span className="break-all"><strong className="text-blue-400">MX:</strong> {mx}</span>
                                <CopyButton text={mx} iconOnly />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {currentTab === 'NS' && (
                      <div className="space-y-2">
                        {!hasNs ? (
                          <p className="text-slate-500 italic text-[11px]">No authoritative NS records returned.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {item.dns.ns.map((ns, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200">
                                <span><strong className="text-emerald-400">NS:</strong> {ns}</span>
                                <CopyButton text={ns} iconOnly />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {currentTab === 'TXT' && (
                      <div className="space-y-2">
                        {!hasTxt ? (
                          <p className="text-slate-500 italic text-[11px]">No TXT records returned.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {item.dns.txt.map((txt, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 gap-2">
                                <span className="break-all text-[11px]"><strong className="text-amber-400">TXT:</strong> {txt}</span>
                                <CopyButton text={txt} iconOnly />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
