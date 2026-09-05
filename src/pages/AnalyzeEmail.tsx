import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  SearchCode,
  Zap,
  Upload,
  Radio,
  Hash,
  ExternalLink,
  FolderPlus,
  CheckCircle2,
  Copy
} from 'lucide-react';
import { SAMPLE_EMAILS } from '../data/mockData';
import type { EmailAnalysisData } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { HeaderProtocolStatus } from '../components/common/HeaderProtocolStatus';
import { GeoTraceMap } from '../components/common/GeoTraceMap';
import { AttributionGraph } from '../components/common/AttributionGraph';

export const AnalyzeEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const emailIdParam = searchParams.get('id');
  const initialEmail = SAMPLE_EMAILS.find(e => e.id === emailIdParam) || SAMPLE_EMAILS[0];

  const [selectedSampleId, setSelectedSampleId] = useState<string>(initialEmail.id);
  const [currentEmail, setCurrentEmail] = useState<EmailAnalysisData>(initialEmail);
  const [rawInput, setRawInput] = useState<string>(initialEmail.rawHeaders + '\n\n' + initialEmail.bodyText);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'HEADERS' | 'RELAY_TRACE' | 'IOCS' | 'GRAPH'>('OVERVIEW');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  useEffect(() => {
    const found = SAMPLE_EMAILS.find(e => e.id === selectedSampleId);
    if (found) {
      setCurrentEmail(found);
      setRawInput(found.rawHeaders + '\n\n' + found.bodyText);
    }
  }, [selectedSampleId]);

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 800);
  };

  const handleCopyEvidence = () => {
    const packageText = JSON.stringify(currentEmail, null, 2);
    navigator.clipboard.writeText(packageText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setRawInput(text);
        handleRunAnalysis();
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs mb-1 font-bold uppercase tracking-wider">
            <SearchCode className="w-4 h-4 text-cyan-400" />
            <span>AI EMAIL FORENSIC ANALYSIS ENGINE</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 font-sans tracking-tight">
            Deep Email Threat & Origin Analysis
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Ingest raw RFC-822 email content, parse routing relay chains, analyze SPF/DKIM/DMARC headers, and extract IOCs.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleCopyEvidence}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono font-semibold transition-all"
          >
            {copySuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
            <span>{copySuccess ? 'COPIED JSON' : 'EXPORT EVIDENCE JSON'}</span>
          </button>
          <button
            onClick={() => navigate('/cases')}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 text-xs font-mono font-extrabold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            <FolderPlus className="w-4 h-4" />
            <span>CONVERT TO CASE</span>
          </button>
        </div>
      </div>

      {/* Preset Selector & Input Console */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <label className="text-xs font-mono font-bold text-slate-300 uppercase">
              SELECT PRESET THREAT SAMPLE OR PASTE EML HEADERS:
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={selectedSampleId}
              onChange={(e) => setSelectedSampleId(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            >
              {SAMPLE_EMAILS.map((sample) => (
                <option key={sample.id} value={sample.id}>
                  {sample.id} - {sample.category} ({sample.severity})
                </option>
              ))}
            </select>

            <label className="cursor-pointer flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-300 border border-slate-800">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>UPLOAD .EML</span>
              <input type="file" accept=".eml,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Input Textarea */}
        <div className="relative">
          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            rows={5}
            placeholder="Paste raw email headers and body text here..."
            className="w-full p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 leading-relaxed"
          />
          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="absolute bottom-3 right-3 flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-extrabold text-xs tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50 cursor-pointer"
          >
            {isAnalyzing ? (
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            <span>{isAnalyzing ? 'PARSING HYPER-GRAPH...' : 'RUN FORENSIC ANALYSIS'}</span>
          </button>
        </div>
      </div>

      {/* Main Analysis Results Console */}
      <div className="space-y-6">
        {/* Risk Score & Threat Summary Header Card */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
          {/* Risk Gauge */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 text-center">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest font-bold">
              FRAUD RISK SCORE
            </span>
            <div className="relative my-2 flex items-center justify-center">
              <div className={`text-4xl font-extrabold font-mono ${currentEmail.riskScore > 80 ? 'text-red-400' : currentEmail.riskScore > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {currentEmail.riskScore}%
              </div>
            </div>
            <RiskBadge severity={currentEmail.severity} size="md" />
          </div>

          {/* Email Subject & Threat Overview */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <span className="text-xs font-mono text-cyan-400 font-bold">
                ANALYSIS REF: {currentEmail.id}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Timestamp: {currentEmail.timestamp}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-100 font-sans">
                {currentEmail.subject}
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {currentEmail.summary}
              </p>
            </div>

            {/* NLP Sentiment Cues */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className={`p-2 rounded-lg border text-[11px] font-mono flex items-center justify-between ${currentEmail.nlpFlags.urgencyCues ? 'bg-red-950/40 border-red-900 text-red-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                <span>Urgency Cues</span>
                <span>{currentEmail.nlpFlags.urgencyCues ? 'DETECTED' : 'NONE'}</span>
              </div>

              <div className={`p-2 rounded-lg border text-[11px] font-mono flex items-center justify-between ${currentEmail.nlpFlags.financialDiversionLanguage ? 'bg-red-950/40 border-red-900 text-red-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                <span>Payment Diversion</span>
                <span>{currentEmail.nlpFlags.financialDiversionLanguage ? 'DETECTED' : 'NONE'}</span>
              </div>

              <div className={`p-2 rounded-lg border text-[11px] font-mono flex items-center justify-between ${currentEmail.nlpFlags.credentialHarvestingKeywords ? 'bg-red-950/40 border-red-900 text-red-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                <span>Credential Harvest</span>
                <span>{currentEmail.nlpFlags.credentialHarvestingKeywords ? 'DETECTED' : 'NONE'}</span>
              </div>

              <div className={`p-2 rounded-lg border text-[11px] font-mono flex items-center justify-between ${currentEmail.nlpFlags.authorityImpersonation ? 'bg-red-950/40 border-red-900 text-red-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                <span>Executive Impersonation</span>
                <span>{currentEmail.nlpFlags.authorityImpersonation ? 'DETECTED' : 'NONE'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex space-x-2 border-b border-slate-800 pb-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${activeTab === 'OVERVIEW' ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80' : 'text-slate-400 hover:text-slate-200'}`}
          >
            PROTOCOL BREAKDOWN
          </button>
          <button
            onClick={() => setActiveTab('RELAY_TRACE')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${activeTab === 'RELAY_TRACE' ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80' : 'text-slate-400 hover:text-slate-200'}`}
          >
            ORIGIN GEOLOCATION TRACE
          </button>
          <button
            onClick={() => setActiveTab('IOCS')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${activeTab === 'IOCS' ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80' : 'text-slate-400 hover:text-slate-200'}`}
          >
            EXTRACTED IOCS & HASHES
          </button>
          <button
            onClick={() => setActiveTab('GRAPH')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${activeTab === 'GRAPH' ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80' : 'text-slate-400 hover:text-slate-200'}`}
          >
            ATTRIBUTION TOPOLOGY GRAPH
          </button>
          <button
            onClick={() => setActiveTab('HEADERS')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${activeTab === 'HEADERS' ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80' : 'text-slate-400 hover:text-slate-200'}`}
          >
            RAW HEADERS
          </button>
        </div>

        {/* Tab 1: Protocol Breakdown & Key Identity Specs */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            <HeaderProtocolStatus protocols={currentEmail.protocols} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase">
                  DISPLAY NAME vs SENDER DOMAIN ALIGNMENT
                </h4>
                <div className="text-xs font-mono space-y-1">
                  <div>Display Name: <strong className="text-slate-200">{currentEmail.senderName}</strong></div>
                  <div>Header From: <strong className="text-red-400">{currentEmail.senderEmail}</strong></div>
                  <div>Return-Path: <strong className="text-red-400">{currentEmail.returnPath}</strong></div>
                  <div>Reply-To: <strong className="text-amber-400">{currentEmail.replyTo}</strong></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase">
                  BODY TEXT CONTENT FORENSICS
                </h4>
                <div className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {currentEmail.bodyText}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Geolocation & Hop Trajectory */}
        {activeTab === 'RELAY_TRACE' && (
          <GeoTraceMap originGeo={currentEmail.originGeo} hops={currentEmail.hops} />
        )}

        {/* Tab 3: Extracted Indicators of Compromise (IOCs) */}
        {activeTab === 'IOCS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Obfuscated Links */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-cyan-400 uppercase">
                <ExternalLink className="w-4 h-4" />
                <span>Extracted Obfuscated Phishing URLs ({currentEmail.iocs.urls.length})</span>
              </div>
              <div className="space-y-2">
                {currentEmail.iocs.urls.map((urlObj, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-900 border border-red-900/60 text-xs font-mono">
                    <div className="text-red-400 font-bold break-all">{urlObj.url}</div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Target Domain: {urlObj.domain}</span>
                      <span className="text-red-400 font-bold">{urlObj.riskScore}% Malicious Risk</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hashes & File Attachments */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-cyan-400 uppercase">
                <Hash className="w-4 h-4" />
                <span>Payload Executable & Attachment Hashes</span>
              </div>
              {currentEmail.iocs.hashes.length > 0 ? (
                <div className="space-y-2">
                  {currentEmail.iocs.hashes.map((h, i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono space-y-1">
                      <div className="text-slate-200 font-bold flex items-center justify-between">
                        <span>{h.filename}</span>
                        <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 text-[10px]">MALICIOUS EXECUTABLE</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">MD5: {h.md5}</div>
                      <div className="text-[10px] text-cyan-400 truncate">SHA256: {h.sha256}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-mono text-slate-400">No malicious file attachments detected in this message body.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Graph Topology */}
        {activeTab === 'GRAPH' && (
          <AttributionGraph
            senderDomain={currentEmail.senderEmail.split('@')[1] || 'unknown'}
            originIp={currentEmail.originGeo.ip}
            targetEmail={currentEmail.recipientEmail}
            campaignName={currentEmail.campaignName}
            hashes={currentEmail.iocs.hashes.map(h => h.sha256)}
          />
        )}

        {/* Tab 5: Raw Email Headers */}
        {activeTab === 'HEADERS' && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase mb-2">
              RFC-822 RAW MAIL HEADERS
            </h4>
            <pre className="p-4 bg-slate-900 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed border border-slate-800">
              {currentEmail.rawHeaders}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
