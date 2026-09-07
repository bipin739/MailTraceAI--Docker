import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { EmailAnalysis, ForensicTabType } from '../types/forensic';
import { getAnalysisResult, saveAnalysisResult } from '../utils/forensicStore';
import { resolveEmailIndicators } from '../utils/indicatorHelper';
import { EmailSummaryHeader } from '../components/forensic/EmailSummaryHeader';
import { ForensicTabs } from '../components/forensic/ForensicTabs';
import { OverviewTab } from '../components/forensic/OverviewTab';
import { HeadersTab } from '../components/forensic/HeadersTab';
import { ContentTab } from '../components/forensic/ContentTab';
import { IndicatorsTab } from '../components/forensic/IndicatorsTab';
import { AttachmentsTab } from '../components/forensic/AttachmentsTab';
import { RawEmailTab } from '../components/forensic/RawEmailTab';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

export const EmailForensicView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState<EmailAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ForensicTabType>('overview');

  useEffect(() => {
    setLoading(true);
    setError(null);

    const targetId = id || 'latest';
    const result = getAnalysisResult(targetId);

    if (result) {
      const resolved = resolveEmailIndicators(result);
      setAnalysis(resolved);

      // Dynamically fetch ML classification if not already cached
      const hasML = resolved.ml_phishing_probability !== undefined &&
                    resolved.ml_phishing_probability !== null &&
                    Boolean(resolved.ml_assessment);
      if (!hasML) {
        const textToAnalyze = resolved.plain_text_body || (resolved.html_body ? resolved.html_body.replace(/<[^>]+>/g, ' ') : '');
        if (resolved.subject || textToAnalyze) {
          fetch('http://localhost:8000/api/emails/ml-classify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject: resolved.subject || '',
              body: textToAnalyze || ''
            })
          })
            .then(res => (res.ok ? res.json() : null))
            .then(mlData => {
              if (mlData && mlData.available) {
                setAnalysis(prev => {
                  if (!prev) return prev;
                  const updated: EmailAnalysis = {
                    ...prev,
                    ml_phishing_probability: mlData.probability,
                    ml_assessment: mlData
                  };
                  saveAnalysisResult(targetId, updated);
                  return updated;
                });
              }
            })
            .catch(() => {});
        }
      }
    } else {
      setError('Unable to load the forensic analysis for this email.');
    }
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm font-mono text-slate-300">
          Loading forensic evidence...
        </p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-slate-950/90 rounded-2xl border border-red-900/50 backdrop-blur-xl text-center space-y-4 shadow-2xl">
        <div className="p-3 bg-red-950/50 rounded-full w-12 h-12 mx-auto flex items-center justify-center border border-red-800/50">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-100 font-mono">
          Analysis Not Found
        </h2>
        <p className="text-xs font-mono text-slate-400">
          {error || 'Unable to load the forensic analysis for this email.'}
        </p>
        <div className="pt-4">
          <button
            type="button"
            onClick={() => navigate('/analyze')}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-800/60 font-mono text-xs font-bold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Analyze Email</span>
          </button>
        </div>
      </div>
    );
  }

  const counts = {
    receivedHops: analysis.received?.length || 0,
    urls: analysis.urls?.length || 0,
    attachments: analysis.attachments?.length || analysis.indicators?.attachments?.length || 0,
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. EMAIL SUMMARY HEADER */}
      <EmailSummaryHeader email={analysis} />

      {/* 2. FORENSIC TABS */}
      <ForensicTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={counts}
      />

      {/* TAB CONTENT VIEWS */}
      <div className="transition-all duration-200">
        {activeTab === 'overview' && <OverviewTab email={analysis} />}
        {activeTab === 'headers' && <HeadersTab email={analysis} />}
        {activeTab === 'content' && <ContentTab email={analysis} />}
        {activeTab === 'indicators' && <IndicatorsTab email={analysis} />}
        {activeTab === 'attachments' && <AttachmentsTab email={analysis} />}
        {activeTab === 'raw' && <RawEmailTab email={analysis} />}
      </div>
    </div>
  );
};

export default EmailForensicView;
