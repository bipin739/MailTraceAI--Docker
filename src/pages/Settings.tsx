import React, { useState } from 'react';
import {
  Sliders,
  Shield,
  CheckCircle2,
  Save,
  Cpu
} from 'lucide-react';
import { INITIAL_SETTINGS } from '../data/mockData';
import type { SystemSettings } from '../types';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs mb-1 font-bold uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>SOC SYSTEM CONFIGURATION & PRIVACY SAFEGUARDS</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 font-sans tracking-tight">
            Platform & Compliance Settings
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Configure PII data masking, legal retention schedules, cryptographic SHA-256 chain-of-custody, and automated alert triggers.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-extrabold text-xs tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.4)]"
        >
          <Save className="w-4 h-4" />
          <span>SAVE CONFIGURATION</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>System configuration saved successfully. All privacy masking and retention rules updated.</span>
        </div>
      )}

      {/* Settings Options Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Privacy, Legal & Compliance Safeguards */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wide">
              Privacy, Legal & Compliance Safeguards
            </h3>
          </div>

          <div className="space-y-4 text-xs font-mono">
            {/* Toggle 1: PII Anonymization */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <span className="text-slate-200 font-bold block">PII Target Email Anonymization</span>
                <span className="text-slate-400 text-[11px] block">
                  Automatically mask personal names and internal email addresses in external reports
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, anonymizeTargetPII: !settings.anonymizeTargetPII })}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.anonymizeTargetPII ? 'bg-cyan-500' : 'bg-slate-800'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-slate-950 absolute top-0.5 transition-transform ${settings.anonymizeTargetPII ? 'left-6.5' : 'left-0.5'}`} />
              </button>
            </div>

            {/* Toggle 2: SHA-256 Chain of Custody */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <span className="text-slate-200 font-bold block">SHA-256 Cryptographic Chain of Custody</span>
                <span className="text-slate-400 text-[11px] block">
                  Generate immutable evidentiary hash signatures for all analyst audit logs
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, sha256ChainOfCustody: !settings.sha256ChainOfCustody })}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.sha256ChainOfCustody ? 'bg-cyan-500' : 'bg-slate-800'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-slate-950 absolute top-0.5 transition-transform ${settings.sha256ChainOfCustody ? 'left-6.5' : 'left-0.5'}`} />
              </button>
            </div>

            {/* Retention Period Dropdown */}
            <div>
              <label className="block text-slate-300 mb-1">Evidence & Header Retention Schedule</label>
              <select
                value={settings.retentionPeriodDays}
                onChange={(e) => setSettings({ ...settings, retentionPeriodDays: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value={30}>30 Days (Standard Corporate Policy)</option>
                <option value={90}>90 Days (Extended Regulatory Audit)</option>
                <option value={365}>365 Days (Legal Investigation Compliance)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card 2: AI Threat Thresholds & Webhook Integrations */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wide">
              AI Detection Thresholds & Webhooks
            </h3>
          </div>

          <div className="space-y-4 text-xs font-mono">
            {/* Auto Escalate Threshold Slider */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300 font-bold">Auto-Escalation Risk Threshold:</span>
                <span className="text-cyan-400 font-extrabold">{settings.autoEscalateThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                value={settings.autoEscalateThreshold}
                onChange={(e) => setSettings({ ...settings, autoEscalateThreshold: Number(e.target.value) })}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Emails scoring above {settings.autoEscalateThreshold}% will trigger immediate SOC alert dispatch and quarantine.
              </span>
            </div>

            {/* Webhook Endpoint Input */}
            <div>
              <label className="block text-slate-300 mb-1">SIEM / SOC Alert Webhook Endpoint</label>
              <input
                type="text"
                value={settings.webhookUrl}
                onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Allowed Subnets */}
            <div>
              <label className="block text-slate-300 mb-1">Internal Gateway Allowed IP Subnets</label>
              <input
                type="text"
                value={settings.allowedIpSubnets}
                onChange={(e) => setSettings({ ...settings, allowedIpSubnets: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
