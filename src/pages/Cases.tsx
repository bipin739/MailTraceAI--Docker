import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderLock,
  Search,
  Filter,
  Plus,
  UserCheck,
  ArrowUpRight
} from 'lucide-react';
import { MOCK_CASES } from '../data/mockData';
import type { InvestigationCase, ThreatSeverity, CaseStatus } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';

export const Cases: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<InvestigationCase[]>(MOCK_CASES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus] = useState<string>('ALL');
  const [showNewModal, setShowNewModal] = useState(false);

  // New Case Form State
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newCategory, setNewCategory] = useState<any>('BEC Fraud');
  const [newSeverity, setNewSeverity] = useState<ThreatSeverity>('HIGH');

  const filteredCases = cases.filter(c => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.targetUser.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.originIp.includes(searchQuery);

    const matchesSeverity = selectedSeverity === 'ALL' || c.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'ALL' || c.status === selectedStatus;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newCaseItem: InvestigationCase = {
      id: `CASE-2026-0${cases.length + 42}`,
      caseNumber: `INV-2026-0905-0${cases.length + 1}`,
      title: newTitle,
      severity: newSeverity,
      status: 'NEW',
      category: newCategory,
      targetUser: newTarget || 'finance-ctrl@bankcorp.com',
      targetDepartment: 'Finance & Operations',
      senderEmail: 'suspicious-sender@external-domain-check.com',
      originIp: '194.165.16.99',
      originCountry: 'Unknown',
      fraudRiskScore: 91,
      assignedAnalyst: 'Alex Mercer (Lead Cyber Analyst)',
      createdAt: '2026-09-05 11:35:00 UTC',
      updatedAt: '2026-09-05 11:35:00 UTC',
      description: 'Newly generated investigation case initialized by SOC tier-1 response.',
      relatedEmailIds: ['EML-2026-8819'],
      evidenceHashes: ['a68194f56f481c1c1f7a...'],
      chainOfCustody: [
        {
          id: `COC-${Date.now()}`,
          timestamp: '2026-09-05 11:35:00 UTC',
          action: 'Manual Case Initialization',
          actor: 'Alex Mercer',
          details: 'Initialized new case investigation record.',
          hash: 'c88104ba191024cd912e58410294101e'
        }
      ]
    };

    setCases([newCaseItem, ...cases]);
    setShowNewModal(false);
    setNewTitle('');
    setNewTarget('');
  };

  const getStatusBadge = (status: CaseStatus) => {
    switch (status) {
      case 'UNDER_INVESTIGATION':
        return <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-400 font-mono text-[10px] font-bold border border-amber-800">UNDER INVESTIGATION</span>;
      case 'CONTAINED':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-800">CONTAINED</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-1 rounded-full bg-slate-900 text-slate-400 font-mono text-[10px] font-bold border border-slate-800">CLOSED</span>;
      case 'NEW':
      default:
        return <span className="px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-800 animate-pulse">NEW CASE</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs mb-1 font-bold uppercase tracking-wider">
            <FolderLock className="w-4 h-4 text-cyan-400" />
            <span>INVESTIGATION CASE & CAMPAIGN MANAGEMENT</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 font-sans tracking-tight">
            Forensic Incident Cases
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Group, investigate, and preserve evidence chains for email threat campaigns and phishing attacks.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-extrabold text-xs tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>NEW INVESTIGATION CASE</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter Case #, Subject, User, IP..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Severity Filter */}
        <div className="flex items-center space-x-3 w-full md:w-auto overflow-x-auto">
          <div className="flex items-center space-x-1.5 text-xs font-mono text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>SEVERITY:</span>
          </div>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                selectedSeverity === sev
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCases.map((c) => (
          <div
            key={c.id}
            onClick={() => navigate(`/cases/${c.id}`)}
            className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-cyan-500/60 backdrop-blur-xl transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {c.caseNumber}
                  </span>
                  <RiskBadge severity={c.severity} score={c.fraudRiskScore} showScore />
                </div>
                {getStatusBadge(c.status)}
              </div>

              <h3 className="text-base font-bold text-slate-100 font-sans group-hover:text-cyan-300 transition-colors">
                {c.title}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-1 line-clamp-2">
                {c.description}
              </p>

              <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-mono">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Target User:</span>
                  <span className="text-slate-200 truncate block">{c.targetUser}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Origin Infrastructure:</span>
                  <span className="text-red-400 truncate block">{c.originIp} ({c.originCountry})</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-1 text-slate-400">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Analyst: <strong className="text-slate-200">{c.assignedAnalyst}</strong></span>
              </div>

              <span className="text-cyan-400 font-bold group-hover:translate-x-1 transition-transform flex items-center space-x-1">
                <span>INSPECT DOSSIER</span>
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* New Case Creation Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-mono font-bold text-cyan-400 uppercase flex items-center space-x-2">
                <FolderLock className="w-5 h-5" />
                <span>INITIALIZE NEW INCIDENT CASE</span>
              </h3>
              <button onClick={() => setShowNewModal(false)} className="text-xs text-slate-400 hover:text-slate-100">
                Close
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1">Case Title & Threat Vector Description</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Executive Spoofing & Vendor Payment Diversion"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Target Recipient Email</label>
                <input
                  type="email"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder="cfo@bankcorp.com"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Threat Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="BEC Fraud">BEC Fraud</option>
                    <option value="Executive Impersonation">Executive Impersonation</option>
                    <option value="Credential Harvesting">Credential Harvesting</option>
                    <option value="Phishing Link">Phishing Link</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Initial Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as ThreatSeverity)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  Create Case Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
