import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Mail, Calendar, User, CornerDownLeft, Repeat, Hash, Briefcase } from 'lucide-react';
import type { EmailAnalysis } from '../../types/forensic';
import { CopyButton } from './CopyButton';
import { AddToCaseModal } from '../case/AddToCaseModal';

interface EmailSummaryHeaderProps {
  email: EmailAnalysis;
}

export const EmailSummaryHeader: React.FC<EmailSummaryHeaderProps> = ({ email }) => {
  const navigate = useNavigate();
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);

  const toDisplay = Array.isArray(email.to) ? email.to.join(', ') : email.to;

  return (
    <div className="bg-slate-950/90 rounded-2xl border border-slate-800 p-6 backdrop-blur-xl space-y-6 shadow-xl">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
              FORENSIC EVIDENCE ANALYSIS
            </span>
          </div>

          {email.threat_score && (
            <div className={`px-2.5 py-1 rounded-full border text-xs font-mono font-bold flex items-center space-x-1.5 ${
              email.threat_score.score >= 80 ? 'bg-rose-950/60 border-rose-800 text-rose-300' :
              email.threat_score.score >= 60 ? 'bg-orange-950/60 border-orange-800 text-orange-300' :
              email.threat_score.score >= 30 ? 'bg-amber-950/60 border-amber-800 text-amber-300' :
              'bg-emerald-950/60 border-emerald-800 text-emerald-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                email.threat_score.score >= 80 ? 'bg-rose-400' :
                email.threat_score.score >= 60 ? 'bg-orange-400' :
                email.threat_score.score >= 30 ? 'bg-amber-400' :
                'bg-emerald-400'
              }`} />
              <span>Threat Score: {email.threat_score.score}/100</span>
              <span className="opacity-80 uppercase text-[10px]">({email.threat_score.severity})</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setIsCaseModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40 hover:border-cyan-400 font-mono text-xs font-semibold transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)]"
          >
            <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
            <span>Add to Case</span>
          </button>
          {email.message_id && (
            <CopyButton
              text={email.message_id}
              label="Copy Message ID"
              className="px-3 py-1.5 bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800"
            />
          )}
          <button
            type="button"
            onClick={() => navigate('/analyze')}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-mono text-xs font-extrabold transition-all shadow-[0_0_12px_rgba(6,182,212,0.25)]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Analyze Another Email</span>
          </button>
        </div>
      </div>

      <AddToCaseModal
        email={email}
        isOpen={isCaseModalOpen}
        onClose={() => setIsCaseModalOpen(false)}
      />

      {/* Main Header Info */}
      <div className="space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-sans tracking-tight break-words">
            {email.subject || 'Not available'}
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800/60">
          {/* From */}
          <div className="flex items-start space-x-3 min-w-0">
            <User className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider block">
                From
              </span>
              <p className="text-xs font-mono text-slate-200 break-all mt-0.5">
                {email.from || 'Not available'}
              </p>
            </div>
          </div>

          {/* To */}
          <div className="flex items-start space-x-3 min-w-0">
            <Mail className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider block">
                To
              </span>
              <p className="text-xs font-mono text-slate-200 break-all mt-0.5">
                {toDisplay || 'Not available'}
              </p>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-start space-x-3 min-w-0">
            <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider block">
                Date
              </span>
              <p className="text-xs font-mono text-slate-200 break-all mt-0.5">
                {email.date || 'Not available'}
              </p>
            </div>
          </div>
        </div>

        {/* Smaller Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono border-t border-slate-800/40">
          <div className="flex flex-col">
            <span className="text-slate-400 text-[11px] flex items-center space-x-1">
              <CornerDownLeft className="w-3 h-3 text-cyan-400" />
              <span>Reply-To:</span>
            </span>
            <span className="text-slate-300 break-all mt-0.5 font-medium">
              {email.reply_to || (email.from ? `None (defaults to From)` : 'Not available')}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-slate-400 text-[11px] flex items-center space-x-1">
              <Repeat className="w-3 h-3 text-cyan-400" />
              <span>Return-Path:</span>
            </span>
            <span className="text-slate-300 break-all mt-0.5 font-medium">
              {email.return_path || 'Not available'}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-slate-400 text-[11px] flex items-center space-x-1">
              <Hash className="w-3 h-3 text-cyan-400" />
              <span>Message-ID:</span>
            </span>
            <span className="text-slate-300 break-all mt-0.5 font-medium">
              {email.message_id || 'Not available'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
