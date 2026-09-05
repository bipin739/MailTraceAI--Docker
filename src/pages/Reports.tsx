import React, { useState } from 'react';
import {
  FileText,
  Printer,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { MOCK_REPORTS } from '../data/mockData';
import type { ForensicReport } from '../types';

export const Reports: React.FC = () => {
  const [reports] = useState<ForensicReport[]>(MOCK_REPORTS);
  const [selectedReport, setSelectedReport] = useState<ForensicReport>(MOCK_REPORTS[0]);
  const [printSuccess, setPrintSuccess] = useState(false);

  const handlePrint = () => {
    window.print();
    setPrintSuccess(true);
    setTimeout(() => setPrintSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs mb-1 font-bold uppercase tracking-wider">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>FORENSIC EVIDENCE & REPORTING CENTER</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 font-sans tracking-tight">
            Forensic Incident Reports
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Structured evidentiary report generation formatted for legal compliance, cyber incident response, and law enforcement submittals.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-extrabold text-xs tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.4)]"
        >
          <Printer className="w-4 h-4" />
          <span>PRINT / EXPORT EVIDENCE DOSSIER</span>
        </button>
      </div>

      {printSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Dossier printed successfully. Chain-of-custody hash verified.</span>
        </div>
      )}

      {/* Reports Grid & Viewer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            GENERATED REPORTS ({reports.length})
          </h3>

          {reports.map((rep) => {
            const isSelected = selectedReport.id === rep.id;
            return (
              <div
                key={rep.id}
                onClick={() => setSelectedReport(rep)}
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

        {/* Official Printable Report Document View */}
        <div className="lg:col-span-2 bg-slate-950/90 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl space-y-6 print:bg-white print:text-black print:p-0">
          {/* Official Document Header */}
          <div className="border-b-2 border-slate-800 pb-5 flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-widest">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <span>MAILTRACE AI // OFFICIAL FORENSIC EVIDENCE DOSSIER</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-100 font-sans mt-2">
                {selectedReport.title}
              </h2>
              <div className="text-xs font-mono text-slate-400 mt-1">
                Ref No: <strong className="text-slate-200">{selectedReport.reportNumber}</strong> | Created: {selectedReport.createdAt}
              </div>
            </div>

            <div className="text-right text-xs font-mono">
              <span className="px-3 py-1 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800">
                {selectedReport.status}
              </span>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase">
              1. EXECUTIVE FORENSIC SUMMARY
            </h4>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed">
              {selectedReport.summary}
            </div>
          </div>

          {/* Technical Evidence & Indicators of Compromise */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase">
              2. CORRELATED TECHNICAL EVIDENCE & GEOLOCATION TRACE
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Earliest Origin Node IP:</span>
                <span className="text-red-400 font-bold">185.220.101.42 (Moscow, RU)</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Primary Threat Vector:</span>
                <span className="text-amber-400 font-bold">Business Email Compromise (BEC)</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">SPF / DKIM Status:</span>
                <span className="text-red-400 font-bold">FAIL (Signature Spoofing Mismatch)</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Assigned Lead Analyst:</span>
                <span className="text-slate-200 font-bold">{selectedReport.analystName}</span>
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
              {selectedReport.digitalSignature}
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
