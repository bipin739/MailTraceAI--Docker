import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Info,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Activity
} from 'lucide-react';
import type { ThreatScoreResult, MLAssessmentResult } from '../../types/forensic';
import { BrainCircuit } from 'lucide-react';

interface GlobalThreatScoreSectionProps {
  threatScore?: ThreatScoreResult;
  mlAssessment?: MLAssessmentResult;
  mlProbability?: number | null;
}

export const GlobalThreatScoreSection: React.FC<GlobalThreatScoreSectionProps> = ({
  threatScore,
  mlAssessment,
  mlProbability
}) => {
  const [showDetails, setShowDetails] = useState(true);

  if (!threatScore) return null;

  const { score, severity, reasons, positive_evidence, summary } = threatScore;

  // Resolve effective probability from mlProbability or mlAssessment
  const resolvedProbability = typeof mlProbability === 'number'
    ? mlProbability
    : (mlAssessment && typeof mlAssessment.probability === 'number')
      ? mlAssessment.probability
      : null;

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'critical':
        return {
          border: 'border-rose-800/80',
          bg: 'bg-rose-950/20',
          badgeBg: 'bg-rose-950 border border-rose-800 text-rose-300',
          barColor: 'bg-rose-500',
          textColor: 'text-rose-400',
          label: 'CRITICAL'
        };
      case 'high':
        return {
          border: 'border-orange-800/80',
          bg: 'bg-orange-950/20',
          badgeBg: 'bg-orange-950 border border-orange-800 text-orange-300',
          barColor: 'bg-orange-500',
          textColor: 'text-orange-400',
          label: 'HIGH'
        };
      case 'suspicious':
        return {
          border: 'border-amber-800/80',
          bg: 'bg-amber-950/20',
          badgeBg: 'bg-amber-950 border border-amber-800 text-amber-300',
          barColor: 'bg-amber-500',
          textColor: 'text-amber-400',
          label: 'SUSPICIOUS'
        };
      default:
        return {
          border: 'border-emerald-800/80',
          bg: 'bg-emerald-950/20',
          badgeBg: 'bg-emerald-950 border border-emerald-800 text-emerald-300',
          barColor: 'bg-emerald-500',
          textColor: 'text-emerald-400',
          label: 'LOW'
        };
    }
  };

  const style = getSeverityStyle(severity);

  return (
    <div className={`rounded-2xl border ${style.border} ${style.bg} p-6 backdrop-blur-xl shadow-xl space-y-6 transition-all`}>
      {/* Top Banner: Threat Score Gauge & Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center space-x-2">
            <Activity className={`w-5 h-5 ${style.textColor}`} />
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-slate-400">
              GLOBAL THREAT SCORING ENGINE
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400">
              Deterministic V1
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-slate-100">
            Threat Score Evaluation
          </h2>

          <p className="text-xs font-mono text-slate-300 leading-relaxed">
            {summary}
          </p>
        </div>

        {/* Hero Score Display */}
        <div className="flex items-center space-x-6 p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 shrink-0">
          <div className="space-y-1 text-center">
            <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
              Threat Score
            </div>
            <div className="flex items-baseline justify-center space-x-1">
              <span className={`text-4xl font-extrabold font-mono tracking-tight ${style.textColor}`}>
                {score}
              </span>
              <span className="text-sm font-mono text-slate-400">/100</span>
            </div>
          </div>

          <div className="h-10 w-px bg-slate-800" />

          <div className="space-y-1 text-center">
            <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
              Classification
            </div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-mono font-extrabold ${style.badgeBg}`}>
              {style.label}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar with Severity Ranges */}
      <div className="space-y-2">
        <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800 flex">
          <div
            className={`h-full ${style.barColor} transition-all duration-500`}
            style={{ width: `${Math.max(score, 2)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-400 px-1">
          <span className={score < 30 ? 'text-emerald-400 font-bold' : ''}>0–29 Low</span>
          <span className={score >= 30 && score < 60 ? 'text-amber-400 font-bold' : ''}>30–59 Suspicious</span>
          <span className={score >= 60 && score < 80 ? 'text-orange-400 font-bold' : ''}>60–79 High</span>
          <span className={score >= 80 ? 'text-rose-400 font-bold' : ''}>80–100 Critical</span>
        </div>
      </div>

      {/* Section 11: Content ML Assessment Display */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/60">
          <div className="flex items-center space-x-2">
            <BrainCircuit className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
              Content ML Assessment
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/50 border border-purple-800 text-purple-300">
              TF-IDF + Logistic Regression
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              ML content assessment
            </span>
          </div>
        </div>

        {resolvedProbability !== null ? (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-baseline space-x-3">
                <span className="text-xs font-mono text-slate-400">
                  Phishing probability:
                </span>
                <span className={`text-2xl font-bold font-mono ${
                  resolvedProbability >= 0.70
                    ? 'text-rose-400'
                    : resolvedProbability >= 0.40
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                }`}>
                  {Math.round(resolvedProbability * 100)}%
                </span>

                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase ${
                  resolvedProbability >= 0.50
                    ? 'bg-rose-950/80 border border-rose-800 text-rose-300'
                    : 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                }`}>
                  {mlAssessment?.classification || (resolvedProbability >= 0.50 ? 'phishing' : 'legitimate')}
                </span>

                {mlAssessment?.confidence && (
                  <span className="text-[10px] font-mono text-slate-400">
                    ({mlAssessment.confidence} confidence)
                  </span>
                )}
              </div>

              {mlAssessment?.top_features && mlAssessment.top_features.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-400">Key tokens:</span>
                  {mlAssessment.top_features.slice(0, 4).map((token, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-700 text-purple-300"
                    >
                      {token}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Probability visual gauge */}
            <div className="space-y-1">
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-500 ${
                    resolvedProbability >= 0.70
                      ? 'bg-rose-500'
                      : resolvedProbability >= 0.40
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(resolvedProbability * 100, 2)}%` }}
                />
              </div>
            </div>

            {/* Explanatory banner distinguishing ML content assessment from Overall threat score */}
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-start space-x-2">
              <Info className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
              <span>
                <strong className="text-slate-300">Model Scope Notice:</strong> "ML content assessment" ({Math.round(resolvedProbability * 100)}%) evaluates textual and semantic patterns in email text only. The "Overall threat score" ({score}/100) is the primary deterministic evaluation that combines network routing, SPF/DKIM/DMARC authentication, lookalike domains, URLs, and attachment risks, with bounded ML weighting (+10 max).
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-xs font-mono text-slate-400 flex items-center space-x-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>ML Content Assessment unavailable or email body empty. Deterministic forensic analysis continues unimpeded.</span>
          </div>
        )}
      </div>

      {/* "Why this score?" Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
              Why this score?
            </h3>
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              ({reasons.length} risk signal{reasons.length === 1 ? '' : 's'} contributed)
            </span>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-1 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span>{showDetails ? 'Hide details' : 'Show details'}</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showDetails && (
          <>
            {reasons.length === 0 ? (
              <div className="p-4 rounded-xl border border-emerald-800/40 bg-emerald-950/10 text-emerald-300 text-xs font-mono flex items-center space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>No risk signals were triggered. All inspected forensic layers conform to legitimate baselines.</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {reasons.map((reason, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-800/90 bg-slate-900/70 hover:bg-slate-900 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start space-x-3 min-w-0 flex-1">
                      <div className="px-2 py-1 rounded bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-mono font-bold shrink-0">
                        +{reason.points} pts
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-slate-100">
                            {reason.label}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-400">
                            {reason.signal}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-slate-400 break-words">
                          <span className="text-slate-400 font-semibold">Evidence:</span> {reason.evidence}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Positive / Neutral Evidence Section */}
      {positive_evidence.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-slate-800/60">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Verified Security Controls &amp; Mitigating Evidence ({positive_evidence.length})
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {positive_evidence.map((pos, pIdx) => (
              <div
                key={pIdx}
                className="p-2.5 rounded-lg border border-emerald-900/40 bg-emerald-950/10 flex items-start space-x-2.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-mono font-bold text-emerald-300">
                    {pos.label}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 truncate">
                    {pos.evidence}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forensic Multi-Signal Assurance Note */}
      <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/50 flex items-start space-x-2.5 text-[11px] font-mono text-slate-400">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-300">Forensic Rule Policy:</strong> Authentication failures alone (SPF/DKIM/DMARC) contribute at most 28 points and cannot classify an email as suspicious or critical on their own. High risk determinations strictly require corroboration across multiple independent forensic signals (such as brand typosquatting, HTML link mismatches, high-risk URLs, and credential harvesting).
        </div>
      </div>
    </div>
  );
};
