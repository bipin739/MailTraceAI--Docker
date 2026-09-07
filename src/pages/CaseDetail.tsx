import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Mail,
  RefreshCw,
  Plus,
  Trash2,
  Send,
  Globe,
  Server,
  Link as LinkIcon,
  History,
  Copy,
  Check,
  X,
  ExternalLink,
  Target,
  GitMerge,
  Download
} from 'lucide-react';
import type {
  CaseDetail as CaseDetailType,
  CaseStatus,
  CaseSeverity,
  CaseNoteCreateRequest,
  CaseFindingCreateRequest
} from '../types/case';
import type { CampaignCorrelationResponse } from '../types/correlation';
import { RelatedInvestigationsCard } from '../components/correlation/RelatedInvestigationsCard';

const STATUS_CONFIG: Record<CaseStatus, { label: string; badge: string }> = {
  open: { label: 'Open', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
  investigating: { label: 'Investigating', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  escalated: { label: 'Escalated', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' },
  resolved: { label: 'Resolved', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
};

const SEVERITY_CONFIG: Record<CaseSeverity, { label: string; badge: string }> = {
  low: { label: 'Low', badge: 'bg-slate-500/20 text-slate-300 border-slate-500/40' },
  medium: { label: 'Medium', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
  high: { label: 'High', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  critical: { label: 'Critical', badge: 'bg-red-500/20 text-red-300 border-red-500/40 font-bold' },
};

export const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState<CaseDetailType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'emails' | 'indicators' | 'findings' | 'notes' | 'timeline' | 'correlations'>('emails');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [correlations, setCorrelations] = useState<CampaignCorrelationResponse | null>(null);
  const [loadingCorrelations, setLoadingCorrelations] = useState<boolean>(false);

  // Note form state
  const [noteText, setNoteText] = useState('');
  const [noteAuthor, setNoteAuthor] = useState('SOC Analyst');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Finding modal state
  const [showFindingModal, setShowFindingModal] = useState(false);
  const [findingType, setFindingType] = useState('lookalike_domain');
  const [findingTitle, setFindingTitle] = useState('');
  const [findingDescription, setFindingDescription] = useState('');
  const [findingSeverity, setFindingSeverity] = useState<CaseSeverity>('medium');
  const [submittingFinding, setSubmittingFinding] = useState(false);

  // Success toast banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDownloadingDossier, setIsDownloadingDossier] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDownloadDossier = async () => {
    if (!caseData) return;
    setIsDownloadingDossier(true);
    try {
      const res = await fetch(`http://localhost:8000/api/reports/case/${caseData.id}`);
      if (!res.ok) throw new Error(`Dossier generation failed (${res.status})`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Case_Dossier_${caseData.case_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Case Dossier PDF downloaded successfully');
    } catch (err) {
      console.error('Failed to download case dossier:', err);
      showToast('Failed to generate case dossier');
    } finally {
      setIsDownloadingDossier(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const fetchCaseDetail = useCallback(() => {
    if (!id) return;
    setLoading(true);
    fetch(`http://localhost:8000/api/cases/${id}`)
      .then(res => {
        if (!res.ok) throw new Error(`Case not found (${res.status})`);
        return res.json();
      })
      .then(data => {
        setCaseData(data);
        setError(null);
      })
      .catch(err => {
        setError(err.message || 'Unable to load case details');
      })
      .finally(() => {
        setLoading(false);
      });

    // Fetch related investigations
    setLoadingCorrelations(true);
    fetch(`http://localhost:8000/api/cases/${id}/correlation`)
      .then(res => (res.ok ? res.json() : null))
      .then(corrData => {
        if (corrData) setCorrelations(corrData);
      })
      .catch(() => {})
      .finally(() => {
        setLoadingCorrelations(false);
      });
  }, [id]);

  useEffect(() => {
    fetchCaseDetail();
  }, [fetchCaseDetail]);

  const handleStatusChange = async (newStatus: CaseStatus) => {
    if (!caseData) return;
    try {
      const res = await fetch(`http://localhost:8000/api/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setCaseData(updated);
        showToast(`Case status updated to ${newStatus.toUpperCase()}`);
      }
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  const handleSeverityChange = async (newSeverity: CaseSeverity) => {
    if (!caseData) return;
    try {
      const res = await fetch(`http://localhost:8000/api/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ severity: newSeverity })
      });
      if (res.ok) {
        const updated = await res.json();
        setCaseData(updated);
        showToast(`Case severity updated to ${newSeverity.toUpperCase()}`);
      }
    } catch (e) {
      console.error('Failed to update severity', e);
    }
  };

  const handleRemoveEmail = async (emailId: string) => {
    if (!caseData) return;
    if (!window.confirm('Detach this email from the investigation case?')) return;

    try {
      const res = await fetch(`http://localhost:8000/api/cases/${caseData.id}/emails/${emailId}`, {
        method: 'DELETE'
      });
      if (res.ok || res.status === 204) {
        showToast('Email detached from case');
        fetchCaseDetail();
      }
    } catch (e) {
      console.error('Failed to remove email', e);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData || !noteText.trim()) return;

    setSubmittingNote(true);
    try {
      const payload: CaseNoteCreateRequest = {
        author: noteAuthor.trim() || 'SOC Analyst',
        note_text: noteText.trim()
      };
      const res = await fetch(`http://localhost:8000/api/cases/${caseData.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setNoteText('');
        showToast('Analyst note appended');
        fetchCaseDetail();
      }
    } catch (e) {
      console.error('Failed to add note', e);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleAddFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData || !findingTitle.trim()) return;

    setSubmittingFinding(true);
    try {
      const payload: CaseFindingCreateRequest = {
        finding_type: findingType,
        title: findingTitle.trim(),
        description: findingDescription.trim(),
        severity: findingSeverity
      };
      const res = await fetch(`http://localhost:8000/api/cases/${caseData.id}/findings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowFindingModal(false);
        setFindingTitle('');
        setFindingDescription('');
        showToast('Forensic finding recorded');
        fetchCaseDetail();
      }
    } catch (e) {
      console.error('Failed to add finding', e);
    } finally {
      setSubmittingFinding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm font-mono text-slate-300">Loading case intelligence workspace...</p>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-slate-950/90 rounded-2xl border border-red-900/50 backdrop-blur-xl text-center space-y-4 shadow-2xl">
        <div className="p-3 bg-red-950/50 rounded-full w-12 h-12 mx-auto flex items-center justify-center border border-red-800/50">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-100 font-mono">Case Not Found</h2>
        <p className="text-xs font-mono text-slate-400">{error || 'Unable to locate investigation case.'}</p>
        <button
          onClick={() => navigate('/cases')}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-800/60 font-mono text-xs font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Cases</span>
        </button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[caseData.status] || STATUS_CONFIG.open;
  const severityConfig = SEVERITY_CONFIG[caseData.severity] || SEVERITY_CONFIG.medium;

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-mono shadow-2xl animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP NAVIGATION & TITLE BAR */}
      <div className="space-y-4">
        <button
          onClick={() => navigate('/cases')}
          className="inline-flex items-center space-x-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Cases</span>
        </button>

        <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs font-bold text-cyan-400 flex items-center space-x-1.5">
                  <span>{caseData.case_number}</span>
                  <button
                    onClick={() => copyToClipboard(caseData.case_number)}
                    className="hover:text-white p-0.5"
                    title="Copy Case Number"
                  >
                    {copiedText === caseData.case_number ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-500" />
                    )}
                  </button>
                </span>

                <span className="text-xs font-mono text-slate-500 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Created: {new Date(caseData.created_at).toLocaleString()}</span>
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold font-mono text-slate-100">{caseData.title}</h1>
              {caseData.description && (
                <p className="text-xs font-mono text-slate-300 max-w-3xl leading-relaxed">{caseData.description}</p>
              )}
            </div>

            {/* Status & Severity Controls */}
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Status</label>
                <select
                  value={caseData.status}
                  onChange={e => handleStatusChange(e.target.value as CaseStatus)}
                  className={`block px-2.5 py-1.5 rounded-lg font-mono text-xs font-bold border capitalize cursor-pointer focus:outline-none ${statusConfig.badge}`}
                >
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                  <option value="escalated">Escalated</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Severity</label>
                <select
                  value={caseData.severity}
                  onChange={e => handleSeverityChange(e.target.value as CaseSeverity)}
                  className={`block px-2.5 py-1.5 rounded-lg font-mono text-xs font-bold border capitalize cursor-pointer focus:outline-none ${severityConfig.badge}`}
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-800 sm:pl-3">
                <button
                  id="export-case-dossier-btn"
                  type="button"
                  onClick={handleDownloadDossier}
                  disabled={isDownloadingDossier}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/50 border border-cyan-500/60 text-cyan-300 hover:bg-cyan-900/60 hover:border-cyan-400 font-mono text-xs font-bold transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)] disabled:opacity-50"
                  title="Generate and download complete case investigation PDF dossier"
                >
                  {isDownloadingDossier ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Export Dossier PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CASE NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-950/80 rounded-xl border border-slate-800 backdrop-blur-xl">
        {[
          { id: 'emails' as const, label: 'Linked Emails', icon: <Mail className="w-4 h-4" />, count: caseData.emails.length },
          { id: 'indicators' as const, label: 'Aggregated Indicators', icon: <Target className="w-4 h-4" />, count: (caseData.aggregated_indicators.domains.length + caseData.aggregated_indicators.ips.length + caseData.aggregated_indicators.urls.length) },
          { id: 'findings' as const, label: 'Forensic Findings', icon: <ShieldAlert className="w-4 h-4" />, count: caseData.findings.length },
          { id: 'notes' as const, label: 'Analyst Notes', icon: <FileText className="w-4 h-4" />, count: caseData.notes.length },
          { id: 'timeline' as const, label: 'Audit Timeline', icon: <History className="w-4 h-4" />, count: caseData.audit_logs.length },
          { id: 'correlations' as const, label: 'Related Investigations', icon: <GitMerge className="w-4 h-4" />, count: correlations?.related_cases.length ?? 0 },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-mono font-bold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                isActive ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB VIEWS */}

      {/* TAB 1: LINKED EMAILS */}
      {activeTab === 'emails' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-mono text-slate-200">
              Emails Associated with Case ({caseData.emails.length})
            </h3>
            <button
              onClick={() => navigate('/analyze')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-400 text-xs font-mono font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Analyze & Add Another Email</span>
            </button>
          </div>

          {caseData.emails.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <Mail className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-mono text-slate-400">No emails attached to this case yet.</p>
              <button
                onClick={() => navigate('/analyze')}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-xs font-bold transition-all shadow-md"
              >
                Analyze Email & Link to Case
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {caseData.emails.map(email => (
                <div
                  key={email.id}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold font-mono text-slate-100">{email.subject}</span>
                      {email.threat_score !== undefined && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          (email.threat_score || 0) >= 70 ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-slate-800 text-slate-300'
                        }`}>
                          Score: {email.threat_score}/100
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
                      <span>Sender: <strong className="text-slate-200">{email.sender}</strong></span>
                      <span>·</span>
                      <span>Email ID: <code className="text-cyan-400">{email.email_id}</code></span>
                      <span>·</span>
                      <span>Attached: {new Date(email.added_at).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end md:self-center">
                    <Link
                      to={`/analysis/${email.email_id}`}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-800/50 text-cyan-400 text-xs font-mono font-bold transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Inspect Forensic Evidence</span>
                    </Link>
                    <button
                      onClick={() => handleRemoveEmail(email.email_id)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/50 border border-slate-800 hover:border-red-800/60 text-slate-400 hover:text-red-400 transition-colors"
                      title="Detach from Case"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AGGREGATED INDICATORS */}
      {activeTab === 'indicators' && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <h3 className="text-sm font-bold font-mono text-slate-200">Aggregated Investigation Indicators</h3>
            <p className="text-xs font-mono text-slate-400">
              Deduplicated IoCs extracted across all emails linked to this incident.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Domains */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-purple-400 text-xs font-mono font-bold">
                  <Globe className="w-4 h-4" />
                  <span>Domains ({caseData.aggregated_indicators.domains.length})</span>
                </div>
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {caseData.aggregated_indicators.domains.length === 0 ? (
                  <p className="text-xs font-mono text-slate-500 italic">No domains extracted.</p>
                ) : (
                  caseData.aggregated_indicators.domains.map(dom => (
                    <div key={dom} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-xs text-slate-200">
                      <span className="truncate">{dom}</span>
                      <button onClick={() => copyToClipboard(dom)} className="text-slate-400 hover:text-cyan-400 p-1">
                        {copiedText === dom ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* IPs */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-400 text-xs font-mono font-bold">
                  <Server className="w-4 h-4" />
                  <span>IP Addresses ({caseData.aggregated_indicators.ips.length})</span>
                </div>
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {caseData.aggregated_indicators.ips.length === 0 ? (
                  <p className="text-xs font-mono text-slate-500 italic">No IPs extracted.</p>
                ) : (
                  caseData.aggregated_indicators.ips.map(ip => (
                    <div key={ip} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-xs text-slate-200">
                      <span className="truncate">{ip}</span>
                      <button onClick={() => copyToClipboard(ip)} className="text-slate-400 hover:text-cyan-400 p-1">
                        {copiedText === ip ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* URLs (Strictly Defanged / Non-Clickable) */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-rose-400 text-xs font-mono font-bold">
                  <LinkIcon className="w-4 h-4" />
                  <span>Extracted URLs (Defanged Security Mode) ({caseData.aggregated_indicators.urls.length})</span>
                </div>
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {caseData.aggregated_indicators.urls.length === 0 ? (
                  <p className="text-xs font-mono text-slate-500 italic">No URLs extracted.</p>
                ) : (
                  caseData.aggregated_indicators.urls.map(u => {
                    const defanged = u.replace(/http:\/\//gi, 'hxxp://').replace(/https:\/\//gi, 'hxxps://').replace(/\./g, '[.]');
                    return (
                      <div key={u} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-xs text-rose-200">
                        <code className="truncate max-w-2xl select-all">{defanged}</code>
                        <button onClick={() => copyToClipboard(defanged)} className="text-slate-400 hover:text-cyan-400 p-1 flex-shrink-0" title="Copy Defanged URL">
                          {copiedText === defanged ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FORENSIC FINDINGS */}
      {activeTab === 'findings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-mono text-slate-200">
              Documented Forensic Findings ({caseData.findings.length})
            </h3>
            <button
              onClick={() => setShowFindingModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-mono font-bold transition-all shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Finding</span>
            </button>
          </div>

          {caseData.findings.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-mono text-slate-400">No forensic findings logged for this case yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {caseData.findings.map(finding => {
                const sevConfig = SEVERITY_CONFIG[finding.severity as CaseSeverity] || SEVERITY_CONFIG.medium;
                return (
                  <div key={finding.id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-cyan-400 uppercase font-bold">
                          {finding.finding_type}
                        </span>
                        <h4 className="text-sm font-bold font-mono text-slate-100">{finding.title}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border uppercase ${sevConfig.badge}`}>
                        {sevConfig.label}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-300 leading-relaxed">{finding.description}</p>
                    <div className="text-[10px] font-mono text-slate-500 pt-1">
                      Logged on {new Date(finding.created_at).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ANALYST NOTES */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          {/* Add Note Form */}
          <form onSubmit={handleAddNote} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold font-mono text-slate-200 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Add Analyst Observation or Task Note</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-1">
                <input
                  type="text"
                  placeholder="Analyst Name"
                  value={noteAuthor}
                  onChange={e => setNoteAuthor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="sm:col-span-3 flex space-x-2">
                <input
                  type="text"
                  placeholder="Record evidentiary observation, action taken, or pivot notes..."
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
                <button
                  type="submit"
                  disabled={submittingNote || !noteText.trim()}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-xs font-bold transition-all disabled:opacity-50 flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingNote ? 'Saving...' : 'Add Note'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Notes List */}
          <div className="space-y-3">
            {caseData.notes.length === 0 ? (
              <p className="text-xs font-mono text-slate-500 text-center py-6 italic">No notes recorded yet.</p>
            ) : (
              caseData.notes.map(note => (
                <div key={note.id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-cyan-400 font-bold">{note.author}</span>
                    <span className="text-slate-500 text-[10px]">{new Date(note.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap">{note.note_text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <h3 className="text-sm font-bold font-mono text-slate-200">Investigation Audit Trail</h3>
            <p className="text-xs font-mono text-slate-400">
              Immutable chronological record of all incident transitions and analyst actions.
            </p>
          </div>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {caseData.audit_logs.map(entry => (
              <div key={entry.id} className="relative space-y-1">
                <div className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-400 uppercase tracking-wider text-[11px]">{entry.action}</span>
                    <span className="text-slate-500 text-[10px]">{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{entry.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: RELATED INVESTIGATIONS (CAMPAIGN CORRELATION) */}
      {activeTab === 'correlations' && (
        <RelatedInvestigationsCard
          relatedCases={correlations?.related_cases ?? []}
          isLoading={loadingCorrelations}
          emptyMessage="No cross-case infrastructure or campaign pattern overlap observed."
        />
      )}

      {/* ADD FINDING MODAL */}
      {showFindingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <span>Add Forensic Finding</span>
              </h3>
              <button onClick={() => setShowFindingModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddFinding} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Finding Category</label>
                <select
                  value={findingType}
                  onChange={e => setFindingType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="lookalike_domain">Lookalike Domain / Typosquatting</option>
                  <option value="credential_harvesting">Credential Harvesting</option>
                  <option value="spoofed_sender">Spoofed Sender / Auth Failure</option>
                  <option value="suspicious_ip">Suspicious IP Infrastructure</option>
                  <option value="malicious_attachment">Malicious Attachment / Weaponized Payload</option>
                  <option value="bec_financial">BEC Financial Diversion</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Brand homograph impersonating microsoft.com"
                  value={findingTitle}
                  onChange={e => setFindingTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Description</label>
                <textarea
                  rows={3}
                  placeholder="Technical details, observed evidence, or impact analysis..."
                  value={findingDescription}
                  onChange={e => setFindingDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Severity</label>
                <select
                  value={findingSeverity}
                  onChange={e => setFindingSeverity(e.target.value as CaseSeverity)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowFindingModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFinding || !findingTitle.trim()}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-xs font-bold transition-all disabled:opacity-50"
                >
                  {submittingFinding ? 'Saving...' : 'Record Finding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseDetail;
