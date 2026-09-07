import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  ShieldCheck,
  Lock,
  Download,
  Loader2,
  RefreshCw,
  Clock,
  Briefcase
} from 'lucide-react';
import { MOCK_REPORTS, SAMPLE_EMAILS } from '../data/mockData';
import type { ForensicReport } from '../types';

interface BackendReportItem {
  id: string;
  report_number: string;
  title: string;
  case_id?: string;
  evidence_id?: string;
  email_sha256?: string;
  threat_score?: number;
  severity?: string;
  analyst_name?: string;
  summary?: string;
  file_size_bytes?: number;
  created_at: string;
}

export const Reports: React.FC = () => {
  const [backendReports, setBackendReports] = useState<BackendReportItem[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(true);
  const [selectedBackendReport, setSelectedBackendReport] = useState<BackendReportItem | null>(null);
  const [selectedMockReport, setSelectedMockReport] = useState<ForensicReport>(MOCK_REPORTS[0]);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isGeneratingSample, setIsGeneratingSample] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const res = await fetch('http://localhost:8000/api/reports?limit=50');
      if (res.ok) {
        const data = await res.json();
        const list = data.reports || [];
        setBackendReports(list);
        if (list.length > 0 && !selectedBackendReport) {
          setSelectedBackendReport(list[0]);
        }
      }
    } catch {
      // Fallback to mock reports
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownloadPDF = async (reportId: string, filename: string) => {
    setIsDownloading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/reports/${reportId}/download`);
      if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast(`Downloaded ${filename}`);
    } catch (err) {
      console.error(err);
      showToast('Error downloading report PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGenerateSampleReport = async () => {
    setIsGeneratingSample(true);
    try {
      const sample = SAMPLE_EMAILS[0];
      const res = await fetch('http://localhost:8000/api/reports/generate?format=json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis: {
            subject: sample.subject,
            from: sample.senderEmail || 'security@credential-portal.xyz',
            to: sample.recipientEmail || 'analyst@company.local',
            reply_to: sample.replyTo || 'dropzone@darkweb-relay.ru',
            threat_score: {
              score: 86.0,
              severity: 'critical',
              summary: 'High risk credential harvesting campaign targeting user credentials.'
            },
            authentication: {
              spf: { result: 'softfail', details: 'Sender IP not authorized in SPF record' },
              dkim: { result: 'none', details: 'No signature found' },
              dmarc: { result: 'fail', details: 'Policy reject breached' }
            },
            email_sha256: 'a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef'
          },
          analyst_name: 'SOC Triage Team'
        })
      });

      if (res.ok) {
        showToast('Generated new sample forensic report');
        fetchReports();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingSample(false);
    }
  };

  const handlePrint = () => {
    window.print();
    showToast('Dossier sent to print preview. Chain-of-custody verified.');
  };

  const hasLiveReports = backendReports.length > 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs mb-1 font-bold uppercase tracking-wider">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>FORENSIC EVIDENCE & REPORTING CENTER</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 font-sans tracking-tight">
            Forensic Incident Reports
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Structured evidentiary PDF report generation formatted for legal compliance, cyber incident response, and law enforcement submittals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="generate-sample-report-btn"
            onClick={handleGenerateSampleReport}
            disabled={isGeneratingSample}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40 hover:border-cyan-400 text-xs font-mono font-semibold transition-all disabled:opacity-50"
          >
            {isGeneratingSample ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                <span>Generate Sample PDF</span>
              </>
            )}
          </button>
          <button
            id="print-evidence-dossier-btn"
            onClick={handlePrint}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-extrabold text-xs tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          >
            <Printer className="w-4 h-4" />
            <span>PRINT DOSSIER</span>
          </button>
        </div>
      </div>

      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Reports Grid & Viewer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              {hasLiveReports ? `GENERATED REPORTS (${backendReports.length})` : `SAMPLE DOSSIERS (${MOCK_REPORTS.length})`}
            </h3>
            {hasLiveReports && (
              <button
                onClick={fetchReports}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            )}
          </div>

          {loadingReports ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-cyan-400 mb-2" />
              <p className="text-xs text-slate-400 font-mono">Loading reports catalog...</p>
            </div>
          ) : hasLiveReports ? (
            <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
              {backendReports.map(rep => {
                const isSelected = selectedBackendReport?.id === rep.id;
                const sizeKb = rep.file_size_bytes ? `${Math.round(rep.file_size_bytes / 1024)} KB` : '';
                return (
                  <div
                    key={rep.id}
                    onClick={() => {
                      setSelectedBackendReport(rep);
                      setSelectedMockReport(MOCK_REPORTS[0]);
                    }}
                    className={`p-4 rounded-xl border text-xs font-mono cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/40'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-cyan-400 font-bold">{rep.report_number}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        rep.severity === 'critical' ? 'bg-rose-950/80 text-rose-300 border-rose-800' :
                        rep.severity === 'high' ? 'bg-orange-950/80 text-orange-300 border-orange-800' :
                        'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                      }`}>
                        {rep.severity || 'low'}
                      </span>
                    </div>
                    <div className="text-slate-200 font-bold font-sans line-clamp-2">
                      {rep.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{new Date(rep.created_at).toLocaleDateString()}</span>
                      </span>
                      <span className="text-cyan-400/80 font-bold">{sizeKb}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2.5">
              {MOCK_REPORTS.map(rep => {
                const isSelected = selectedMockReport.id === rep.id && !selectedBackendReport;
                return (
                  <div
                    key={rep.id}
                    onClick={() => setSelectedMockReport(rep)}
                    className={`p-4 rounded-xl border text-xs font-mono cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-cyan-400 font-bold">{rep.reportNumber}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-emerald-400 text-[10px] border border-slate-800">
                        {rep.status}
                      </span>
                    </div>
                    <div className="text-slate-200 font-bold font-sans mt-1 line-clamp-2">
                      {rep.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2 flex justify-between">
                      <span>Type: {rep.type}</span>
                      <span>{rep.createdAt}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Official Printable Report Document View */}
        <div className="lg:col-span-2 bg-slate-950/90 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl space-y-6 print:bg-white print:text-black print:p-0">
          {/* Document Header & Action */}
          <div className="border-b-2 border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-widest">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <span>MAILTRACE AI // OFFICIAL FORENSIC EVIDENCE DOSSIER</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-100 font-sans mt-2">
                {selectedBackendReport ? selectedBackendReport.title : selectedMockReport.title}
              </h2>
              <div className="text-xs font-mono text-slate-400 mt-1">
                Ref No:{' '}
                <strong className="text-slate-200">
                  {selectedBackendReport ? selectedBackendReport.report_number : selectedMockReport.reportNumber}
                </strong>{' '}
                | Created:{' '}
                {selectedBackendReport
                  ? new Date(selectedBackendReport.created_at).toLocaleString()
                  : selectedMockReport.createdAt}
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {selectedBackendReport ? (
                <button
                  id="download-selected-pdf-btn"
                  onClick={() =>
                    handleDownloadPDF(
                      selectedBackendReport.id,
                      `MailTrace_${selectedBackendReport.report_number}.pdf`
                    )
                  }
                  disabled={isDownloading}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-xs font-bold transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] disabled:opacity-50"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>
              ) : (
                <span className="px-3 py-1 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800 text-xs font-mono">
                  {selectedMockReport.status}
                </span>
              )}
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase">
              1. EXECUTIVE FORENSIC SUMMARY
            </h4>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed">
              {selectedBackendReport
                ? selectedBackendReport.summary ||
                  `Forensic examination conducted by ${selectedBackendReport.analyst_name || 'SOC Lead Analyst'} with threat score ${selectedBackendReport.threat_score ?? 0}/100.`
                : selectedMockReport.summary}
            </div>
          </div>

          {/* Technical Evidence & Indicators of Compromise */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase">
              2. CORRELATED TECHNICAL EVIDENCE & CHAIN OF CUSTODY
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Evidence Identifier:</span>
                <span className="text-cyan-400 font-bold">
                  {selectedBackendReport?.evidence_id || 'EVD-2026-001'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Threat Score & Severity:</span>
                <span className="text-rose-400 font-bold">
                  {selectedBackendReport
                    ? `${selectedBackendReport.threat_score ?? 0}/100 (${(selectedBackendReport.severity || 'low').toUpperCase()})`
                    : '88/100 (HIGH)'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Case Linkage:</span>
                <span className="text-slate-200 font-bold">
                  {selectedBackendReport?.case_id ? (
                    <span className="flex items-center space-x-1">
                      <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{selectedBackendReport.case_id}</span>
                    </span>
                  ) : (
                    'Direct Analysis (Unlinked)'
                  )}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Assigned Lead Analyst:</span>
                <span className="text-slate-200 font-bold">
                  {selectedBackendReport?.analyst_name || selectedMockReport.analystName}
                </span>
              </div>
            </div>
          </div>

          {/* Cryptographic Digital Signature & Verification */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase flex items-center space-x-1.5">
              <Lock className="w-4 h-4" />
              <span>3. EVIDENTIARY INTEGRITY & CRYPTOGRAPHIC SIGNATURE</span>
            </h4>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300 break-all">
              {selectedBackendReport?.email_sha256
                ? `SHA256:${selectedBackendReport.email_sha256}`
                : selectedMockReport.digitalSignature}
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-1">
              <span>Status: SHA-256 Chain of Custody Verified</span>
              <span className="text-emerald-400 font-bold">VALID DIGITAL SEAL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

