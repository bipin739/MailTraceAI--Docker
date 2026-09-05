import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  FileText,
  Ban,
  Send,
  Plus
} from 'lucide-react';
import { MOCK_CASES, SAMPLE_EMAILS } from '../data/mockData';
import { RiskBadge } from '../components/common/RiskBadge';
import { AttributionGraph } from '../components/common/AttributionGraph';
import { GeoTraceMap } from '../components/common/GeoTraceMap';

export const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const foundCase = MOCK_CASES.find(c => c.id === id || c.caseNumber === id) || MOCK_CASES[0];
  const [caseData, setCaseData] = useState(foundCase);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [newNoteText, setNewNoteText] = useState('');

  const sampleEmail = SAMPLE_EMAILS[0];

  const handleBlockDomain = () => {
    setActionSuccess(`Perimeter Firewall Rule Generated: Domain ${caseData.senderEmail.split('@')[1]} & IP ${caseData.originIp} blocked.`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleEscalateLawEnforcement = () => {
    setActionSuccess(`Evidentiary Dossier exported to CERT/CC & Interpol Cybercrime Portal.`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newCocEntry = {
      id: `COC-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      action: 'Analyst Evidence Note',
      actor: 'Alex Mercer (Lead Analyst)',
      details: newNoteText,
      hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    };

    setCaseData({
      ...caseData,
      chainOfCustody: [...caseData.chainOfCustody, newCocEntry]
    });
    setNewNoteText('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Back Button & Case Title Header */}
      <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl space-y-4">
        <button
          onClick={() => navigate('/cases')}
          className="flex items-center space-x-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO INVESTIGATIONS</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="text-xs font-mono font-bold text-cyan-400">
                {caseData.caseNumber}
              </span>
              <RiskBadge severity={caseData.severity} score={caseData.fraudRiskScore} showScore />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 font-sans tracking-tight">
              {caseData.title}
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Assigned Analyst: <strong className="text-slate-200">{caseData.assignedAnalyst}</strong> | Created: {caseData.createdAt}
            </p>
          </div>

          {/* Incident Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBlockDomain}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-red-950/80 hover:bg-red-900/80 text-red-300 border border-red-800 text-xs font-mono font-bold transition-all"
            >
              <Ban className="w-4 h-4" />
              <span>BLOCK DOMAIN & IP</span>
            </button>

            <button
              onClick={() => navigate(`/reports?caseId=${caseData.id}`)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono font-bold transition-all"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>GENERATE REPORT</span>
            </button>

            <button
              onClick={handleEscalateLawEnforcement}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 text-xs font-mono font-extrabold transition-all"
            >
              <Send className="w-4 h-4" />
              <span>SUBMIT TO CERT</span>
            </button>
          </div>
        </div>

        {actionSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
      </div>

      {/* Case Metrics & Target Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Target Recipient</span>
          <div className="text-sm font-mono font-bold text-slate-100">{caseData.targetUser}</div>
          <div className="text-xs text-cyan-400 font-mono">{caseData.targetDepartment}</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Originating Infrastructure</span>
          <div className="text-sm font-mono font-bold text-red-400">{caseData.originIp}</div>
          <div className="text-xs text-slate-300 font-mono">{caseData.originCountry} (TOR / Bulletproof Proxy)</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Threat Vector Classification</span>
          <div className="text-sm font-mono font-bold text-amber-400">{caseData.category}</div>
          <div className="text-xs text-slate-300 font-mono">Fraud Risk: {caseData.fraudRiskScore}%</div>
        </div>
      </div>

      {/* Infrastructure Attribution Graph */}
      <AttributionGraph
        senderDomain={caseData.senderEmail.split('@')[1] || 'bank-corp-update.com'}
        originIp={caseData.originIp}
        targetEmail={caseData.targetUser}
        campaignName="Operation GhostInvoice"
        hashes={caseData.evidenceHashes}
      />

      {/* Origin Geolocation & Relay Path Trace */}
      <GeoTraceMap originGeo={sampleEmail.originGeo} hops={sampleEmail.hops} />

      {/* Chain of Custody & Evidence Log */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wide">
              Cryptographic Chain-of-Custody & Evidence Preservation Log
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            SHA-256 Integrity Verified
          </span>
        </div>

        {/* Timeline Entries */}
        <div className="space-y-3">
          {caseData.chainOfCustody.map((entry) => (
            <div key={entry.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-cyan-400 font-bold">{entry.action}</span>
                <span className="text-slate-400">{entry.timestamp}</span>
              </div>
              <p className="text-slate-200">{entry.details}</p>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                <span>Actor: <strong className="text-slate-300">{entry.actor}</strong></span>
                <span className="truncate max-w-[280px]">Hash: {entry.hash}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Add Note Form */}
        <form onSubmit={handleAddNote} className="pt-2 flex gap-2">
          <input
            type="text"
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Add analyst evidence note or forensic record entry..."
            className="flex-grow p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-xs flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>LOG ENTRY</span>
          </button>
        </form>
      </div>
    </div>
  );
};
