import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderLock,
  Search,
  Plus,
  ArrowUpRight,
  ShieldAlert,
  AlertCircle,
  FileText,
  Mail,
  RefreshCw,
  X,
  Copy,
  Check,
  Filter
} from 'lucide-react';
import type { CaseListItem, CaseStatus, CaseSeverity, CaseCreatePayload } from '../types/case';

const STATUS_CONFIG: Record<CaseStatus, { label: string; badge: string; border: string }> = {
  open: { label: 'Open', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40', border: 'border-sky-800/40' },
  investigating: { label: 'Investigating', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40', border: 'border-amber-800/40' },
  escalated: { label: 'Escalated', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse', border: 'border-rose-800/60' },
  resolved: { label: 'Resolved', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', border: 'border-emerald-800/40' },
};

const SEVERITY_CONFIG: Record<CaseSeverity, { label: string; badge: string }> = {
  low: { label: 'Low', badge: 'bg-slate-500/20 text-slate-300 border-slate-500/40' },
  medium: { label: 'Medium', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
  high: { label: 'High', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  critical: { label: 'Critical', badge: 'bg-red-500/20 text-red-300 border-red-500/40 font-bold' },
};

export const Cases: React.FC = () => {
  const navigate = useNavigate();

  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Case Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSeverity, setNewSeverity] = useState<CaseSeverity>('medium');
  const [newStatus, setNewStatus] = useState<CaseStatus>('open');
  const [creating, setCreating] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCases = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
    if (selectedSeverity !== 'ALL') params.append('severity', selectedSeverity);
    if (searchQuery.trim()) params.append('search', searchQuery.trim());

    fetch(`http://localhost:8000/api/cases?${params.toString()}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data && Array.isArray(data.cases)) {
          setCases(data.cases);
        }
      })
      .catch(err => {
        console.warn('Could not connect to backend cases endpoint', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedStatus, selectedSeverity, searchQuery]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormError('Case title is required.');
      return;
    }

    setCreating(true);
    setFormError(null);

    const payload: CaseCreatePayload = {
      title: newTitle.trim(),
      description: newDescription.trim(),
      severity: newSeverity,
      status: newStatus
    };

    try {
      const res = await fetch('http://localhost:8000/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Failed to create case: ${res.statusText}`);
      }

      const createdCase = await res.json();
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      navigate(`/cases/${createdCase.id}`);
    } catch (err: any) {
      setFormError(err.message || 'Error creating case');
    } finally {
      setCreating(false);
    }
  };

  const copyCaseNumber = (caseNum: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(caseNum);
    setCopiedId(caseNum);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics computation
  const metrics = {
    total: cases.length,
    open: cases.filter(c => c.status === 'open').length,
    investigating: cases.filter(c => c.status === 'investigating').length,
    escalated: cases.filter(c => c.status === 'escalated').length,
    resolved: cases.filter(c => c.status === 'resolved').length,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HEADER & ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <FolderLock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono text-slate-100 flex items-center space-x-2">
                <span>SOC Case Management</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  Platform
                </span>
              </h1>
              <p className="text-xs font-mono text-slate-400">
                Transforming forensic telemetry into structured, collaborative incident investigations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchCases}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh Cases"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Case</span>
          </button>
        </div>
      </div>

      {/* 2. METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 backdrop-blur-xl">
          <div className="text-[11px] font-mono text-slate-400">Total Cases</div>
          <div className="text-2xl font-mono font-bold text-slate-100 mt-1">{metrics.total}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-sky-900/40 backdrop-blur-xl">
          <div className="text-[11px] font-mono text-sky-400">Open</div>
          <div className="text-2xl font-mono font-bold text-sky-300 mt-1">{metrics.open}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-900/40 backdrop-blur-xl">
          <div className="text-[11px] font-mono text-amber-400">Investigating</div>
          <div className="text-2xl font-mono font-bold text-amber-300 mt-1">{metrics.investigating}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-rose-900/40 backdrop-blur-xl">
          <div className="text-[11px] font-mono text-rose-400">Escalated</div>
          <div className="text-2xl font-mono font-bold text-rose-300 mt-1">{metrics.escalated}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-900/40 backdrop-blur-xl col-span-2 sm:col-span-1">
          <div className="text-[11px] font-mono text-emerald-400">Resolved</div>
          <div className="text-2xl font-mono font-bold text-emerald-300 mt-1">{metrics.resolved}</div>
        </div>
      </div>

      {/* 3. SEARCH & FILTERS BAR */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, case number (e.g. CASE-2026-000001)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Status & Severity Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Pills */}
          <div className="flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {['ALL', 'open', 'investigating', 'escalated', 'resolved'].map(st => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 rounded-lg transition-all capitalize ${
                  selectedStatus === st
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Severity Dropdown */}
          <div className="flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-2" />
            <select
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs px-2.5 py-1.5 rounded-xl focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. CASE LIST VIEW */}
      {loading && cases.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3 rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-xs font-mono text-slate-400">Loading cases from database...</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl space-y-4">
          <div className="p-3 rounded-full bg-slate-900 border border-slate-800 text-slate-500">
            <FolderLock className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold font-mono text-slate-200">No Investigation Cases Found</h3>
            <p className="text-xs font-mono text-slate-400 max-w-sm">
              {searchQuery || selectedStatus !== 'ALL' || selectedSeverity !== 'ALL'
                ? 'No cases match your filter criteria. Try adjusting your filters or search term.'
                : 'Create your first investigation case or add analyzed emails to track security incidents.'}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-xs font-bold transition-all shadow-lg"
          >
            Create First Case
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cases.map(caseItem => {
            const statusConfig = STATUS_CONFIG[caseItem.status] || STATUS_CONFIG.open;
            const severityConfig = SEVERITY_CONFIG[caseItem.severity] || SEVERITY_CONFIG.medium;

            return (
              <div
                key={caseItem.id}
                onClick={() => navigate(`/cases/${caseItem.id}`)}
                className={`p-5 rounded-2xl bg-slate-950/80 hover:bg-slate-900/60 border ${statusConfig.border} backdrop-blur-xl cursor-pointer transition-all duration-200 hover:shadow-2xl hover:border-cyan-500/50 group flex flex-col justify-between space-y-4`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Case Number & Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-cyan-400 flex items-center space-x-1.5">
                        <span>{caseItem.case_number}</span>
                        <button
                          onClick={e => copyCaseNumber(caseItem.case_number, e)}
                          className="hover:text-white p-0.5"
                          title="Copy Case Number"
                        >
                          {copiedId === caseItem.case_number ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-500" />
                          )}
                        </button>
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border font-bold uppercase ${statusConfig.badge}`}>
                        {statusConfig.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border uppercase ${severityConfig.badge}`}>
                        {severityConfig.label}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold font-mono text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {caseItem.title}
                    </h3>
                    <p className="text-xs font-mono text-slate-400 line-clamp-2">
                      {caseItem.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                {/* Bottom Bar: Stats & Navigation */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1 text-slate-300">
                      <Mail className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{caseItem.email_count}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-slate-300">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>{caseItem.note_count}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-slate-300">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      <span>{caseItem.finding_count}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 text-[11px] text-slate-400 group-hover:text-cyan-400 transition-colors">
                    <span>Investigate</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. CREATE NEW CASE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold font-mono text-slate-100">Create Investigation Case</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs font-mono flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCase} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300 font-bold">
                  Case Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Targeted Credential Harvesting Campaign - Microsoft O365"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300 font-bold">Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide incident context, targeted departments, or initial telemetry observations..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300 font-bold">Initial Severity</label>
                  <select
                    value={newSeverity}
                    onChange={e => setNewSeverity(e.target.value as CaseSeverity)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300 font-bold">Initial Status</label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as CaseStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="open">Open</option>
                    <option value="investigating">Investigating</option>
                    <option value="escalated">Escalated</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50"
                >
                  {creating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{creating ? 'Creating...' : 'Create Case'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cases;
