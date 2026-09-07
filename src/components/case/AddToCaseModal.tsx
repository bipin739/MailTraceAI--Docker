import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FolderPlus, Briefcase, CheckCircle2, AlertCircle, Loader2, X, ExternalLink, Plus } from 'lucide-react';
import type { EmailAnalysis } from '../../types/forensic';
import type { CaseListItem, CaseSeverity } from '../../types/case';

interface AddToCaseModalProps {
  email: EmailAnalysis;
  isOpen: boolean;
  onClose: () => void;
}

export const AddToCaseModal: React.FC<AddToCaseModalProps> = ({ email, isOpen, onClose }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'existing' | 'new'>('existing');
  
  // Existing cases state
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [loadingCases, setLoadingCases] = useState<boolean>(false);
  const [filterQuery, setFilterQuery] = useState<string>('');

  // New case state
  const [newTitle, setNewTitle] = useState<string>(
    email.subject ? `Investigation: ${email.subject.slice(0, 60)}` : 'Suspicious Email Investigation'
  );
  const [newDescription, setNewDescription] = useState<string>(
    `Incident investigation for suspicious email from "${email.from || 'unknown'}" with Threat Score ${email.threat_score?.score ?? 'N/A'}/100.`
  );
  const [newSeverity, setNewSeverity] = useState<CaseSeverity>(
    (email.threat_score?.severity === 'critical' ? 'critical' :
     email.threat_score?.severity === 'high' ? 'high' :
     email.threat_score?.severity === 'suspicious' ? 'medium' : 'low') as CaseSeverity
  );

  // Submission state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ caseId: string; caseNumber: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessInfo(null);
      setFilterQuery('');
      fetchCases();
    }
  }, [isOpen]);

  // Dismiss on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const fetchCases = async () => {
    setLoadingCases(true);
    try {
      const res = await fetch('http://localhost:8000/api/cases?limit=100');
      if (res.ok) {
        const data = await res.json();
        const caseList = data.cases || [];
        setCases(caseList);
        if (caseList.length > 0 && !selectedCaseId) {
          setSelectedCaseId(caseList[0].id);
        }
      }
    } catch {
      // Fallback silently if backend offline
    } finally {
      setLoadingCases(false);
    }
  };

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  // Extract clean indicators comprehensively
  const extractIndicators = () => {
    const rawDomains: string[] = [];
    if (email.indicators?.domains) {
      email.indicators.domains.forEach(d => rawDomains.push(typeof d === 'string' ? d : d.value));
    }
    if (email.domain_intelligence) {
      Object.keys(email.domain_intelligence).forEach(d => rawDomains.push(d));
    }

    const rawIps: string[] = [];
    if (email.indicators?.ips) {
      email.indicators.ips.forEach(i => rawIps.push(typeof i === 'string' ? i : i.value));
    }
    if (email.ip_intelligence) {
      Object.keys(email.ip_intelligence).forEach(ip => rawIps.push(ip));
    }
    if (email.relay_analysis?.transmission_order_hops) {
      email.relay_analysis.transmission_order_hops.forEach(hop => {
        if (hop.from_ip) rawIps.push(hop.from_ip);
        if (hop.by_ip) rawIps.push(hop.by_ip);
      });
    }

    const rawUrls: string[] = [];
    if (email.indicators?.urls) {
      email.indicators.urls.forEach(u => rawUrls.push(typeof u === 'string' ? u : u.value));
    }
    if (email.url_analysis) {
      email.url_analysis.forEach(u => rawUrls.push(u.url));
    }

    const rawAttachments: string[] = [];
    if (email.indicators?.attachments) {
      email.indicators.attachments.forEach(a => {
        if (a.sha256) rawAttachments.push(a.sha256);
        else if (a.filename) rawAttachments.push(a.filename);
      });
    }
    if (email.attachments) {
      email.attachments.forEach(a => {
        if (a.sha256) rawAttachments.push(a.sha256);
        else if (a.filename) rawAttachments.push(a.filename);
      });
    }

    return {
      domains: Array.from(new Set(rawDomains.filter(Boolean))),
      ips: Array.from(new Set(rawIps.filter(Boolean))),
      urls: Array.from(new Set(rawUrls.filter(Boolean))),
      attachments: Array.from(new Set(rawAttachments.filter(Boolean)))
    };
  };

  const getEmailPayload = () => {
    const emailId = email.id || (email.email_sha256 ? email.email_sha256.slice(0, 16) : `email-${Date.now()}`);
    return {
      email_id: emailId,
      email_sha256: email.email_sha256 || emailId,
      subject: email.subject || '(No Subject)',
      sender: email.from || 'unknown@domain.local',
      threat_score: email.threat_score?.score ?? 0,
      severity: email.threat_score?.severity ?? 'low',
      indicators: extractIndicators()
    };
  };

  const handleAttachExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId) {
      setError('Please select a case to attach this email to.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = getEmailPayload();
      const res = await fetch(`http://localhost:8000/api/cases/${selectedCaseId}/emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to attach email to case');
      }

      const targetCase = cases.find(c => c.id === selectedCaseId);
      setSuccessInfo({
        caseId: selectedCaseId,
        caseNumber: targetCase?.case_number || 'Case'
      });
    } catch (err: any) {
      setError(err.message || 'Error attaching email to case.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAndAttach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setError('Case title is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const emailPayload = getEmailPayload();

      // Create Case with initial_email atomically
      const createRes = await fetch('http://localhost:8000/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          severity: newSeverity,
          status: 'open',
          initial_email: emailPayload
        })
      });

      if (!createRes.ok) {
        const errData = await createRes.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to create case');
      }

      const createdCase = await createRes.json();

      setSuccessInfo({
        caseId: createdCase.id,
        caseNumber: createdCase.case_number
      });
    } catch (err: any) {
      setError(err.message || 'Error creating case and attaching email.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCases = cases.filter(c =>
    c.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
    c.case_number.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return createPortal(
    <div
      id="add-to-case-modal-overlay"
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-to-case-title"
    >
      <div
        id="add-to-case-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 id="add-to-case-title" className="text-base font-bold text-slate-100">
                Add Evidence to Investigation Case
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Link email indicators and findings to a SOC case
              </p>
            </div>
          </div>
          <button
            id="close-add-to-case-modal"
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 min-h-0">
          {/* Email Preview Snippet */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                Email Subject
              </span>
              <p className="text-xs font-semibold text-slate-200 truncate mt-0.5">
                {email.subject || '(No Subject)'}
              </p>
              <p className="text-[11px] font-mono text-slate-400 truncate">
                From: {email.from || 'unknown'}
              </p>
            </div>
            {email.threat_score && (
              <div className="shrink-0 text-right">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Threat Score</span>
                <span className={`text-xs font-mono font-bold ${
                  email.threat_score.score >= 80 ? 'text-rose-400' :
                  email.threat_score.score >= 60 ? 'text-orange-400' :
                  email.threat_score.score >= 30 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {email.threat_score.score}/100 ({email.threat_score.severity})
                </span>
              </div>
            )}
          </div>

          {/* Success View */}
          {successInfo ? (
            <div className="p-6 text-center space-y-4 bg-emerald-950/20 border border-emerald-800/50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-emerald-300">Email Linked Successfully</h3>
                <p className="text-xs text-slate-300">
                  Forensic evidence and indicators have been added to{' '}
                  <span className="font-mono font-bold text-white">{successInfo.caseNumber}</span>.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/cases/${successInfo.caseId}`);
                  }}
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all"
                >
                  <span>Open Case Workspace</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Selector */}
              <div className="flex rounded-xl bg-slate-950/70 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => { setActiveTab('existing'); setError(null); }}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 text-xs font-medium rounded-lg transition-all ${
                    activeTab === 'existing'
                      ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/60 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Attach to Existing Case</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('new'); setError(null); }}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 text-xs font-medium rounded-lg transition-all ${
                    activeTab === 'new'
                      ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/60 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Create New Case</span>
                </button>
              </div>

              {error && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-start space-x-2 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Tab 1: Existing Case Form */}
              {activeTab === 'existing' && (
                <form onSubmit={handleAttachExisting} className="space-y-4">
                  {loadingCases ? (
                    <div className="flex items-center justify-center py-8 text-slate-400 space-x-2 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>Loading investigation cases...</span>
                    </div>
                  ) : cases.length === 0 ? (
                    <div className="p-6 text-center space-y-3 bg-slate-950/40 rounded-xl border border-slate-800">
                      <p className="text-xs text-slate-400">No active cases found.</p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('new')}
                        className="px-3 py-1.5 bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs hover:bg-cyan-600/30 font-medium"
                      >
                        Create your first case
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Search Filter */}
                      {cases.length > 3 && (
                        <input
                          type="text"
                          value={filterQuery}
                          onChange={e => setFilterQuery(e.target.value)}
                          placeholder="Filter cases by title or ID..."
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                        />
                      )}

                      {/* Case Selection Cards */}
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {filteredCases.map(c => {
                          const isSelected = selectedCaseId === c.id;
                          return (
                            <div
                              key={c.id}
                              onClick={() => setSelectedCaseId(c.id)}
                              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                                isSelected
                                  ? 'bg-cyan-950/20 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/40'
                                  : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-mono text-[11px] font-bold text-cyan-400">{c.case_number}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                                    c.severity === 'critical' ? 'bg-rose-950/60 text-rose-400' :
                                    c.severity === 'high' ? 'bg-orange-950/60 text-orange-400' :
                                    c.severity === 'medium' ? 'bg-amber-950/60 text-amber-400' :
                                    'bg-emerald-950/60 text-emerald-400'
                                  }`}>
                                    {c.severity}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase text-slate-400 bg-slate-800">
                                    {c.status}
                                  </span>
                                </div>
                                <p className="text-xs font-medium text-slate-200 truncate mt-1">{c.title}</p>
                              </div>
                              <div className="shrink-0 text-right text-[11px] font-mono text-slate-500">
                                {c.email_count} email{c.email_count === 1 ? '' : 's'}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-2 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-4 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting || !selectedCaseId}
                          className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.2)] transition-all"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Attaching...</span>
                            </>
                          ) : (
                            <>
                              <Briefcase className="w-3.5 h-3.5" />
                              <span>Attach Evidence</span>
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              )}

              {/* Tab 2: Create New Case Form */}
              {activeTab === 'new' && (
                <form onSubmit={handleCreateAndAttach} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300 uppercase tracking-wider block">
                      Case Title <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="e.g. Credential Harvester Campaign Q3"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300 uppercase tracking-wider block">
                      Initial Severity
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['low', 'medium', 'high', 'critical'] as CaseSeverity[]).map(sev => (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setNewSeverity(sev)}
                          className={`py-2 px-2 rounded-xl text-xs font-mono uppercase font-bold border transition-all ${
                            newSeverity === sev
                              ? sev === 'critical' ? 'bg-rose-950/80 border-rose-600 text-rose-300 shadow-[0_0_10px_rgba(225,29,72,0.25)]' :
                                sev === 'high' ? 'bg-orange-950/80 border-orange-600 text-orange-300 shadow-[0_0_10px_rgba(234,88,12,0.25)]' :
                                sev === 'medium' ? 'bg-amber-950/80 border-amber-600 text-amber-300 shadow-[0_0_10px_rgba(217,119,6,0.25)]' :
                                'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300 uppercase tracking-wider block">
                      Description / Context
                    </label>
                    <textarea
                      rows={3}
                      value={newDescription}
                      onChange={e => setNewDescription(e.target.value)}
                      placeholder="Context on how this phishing campaign was discovered..."
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.2)] transition-all"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Creating & Linking...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create Case & Attach</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
