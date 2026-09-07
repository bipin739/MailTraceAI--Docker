import React from 'react';
import type { ForensicTabType } from '../../types/forensic';
import { LayoutDashboard, FileText, Code, Target, Paperclip, Terminal, Share2, MapPin } from 'lucide-react';

interface ForensicTabsProps {
  activeTab: ForensicTabType;
  onTabChange: (tab: ForensicTabType) => void;
  counts: {
    receivedHops: number;
    urls: number;
    attachments: number;
  };
}

export const ForensicTabs: React.FC<ForensicTabsProps> = ({
  activeTab,
  onTabChange,
  counts
}) => {
  const tabs: { id: ForensicTabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'graph', label: 'Investigation Graph', icon: <Share2 className="w-4 h-4" /> },
    { id: 'map', label: 'Investigation Map', icon: <MapPin className="w-4 h-4" /> },
    { id: 'headers', label: 'Headers', icon: <FileText className="w-4 h-4" />, badge: counts.receivedHops },
    { id: 'content', label: 'Content', icon: <Code className="w-4 h-4" /> },
    { id: 'indicators', label: 'Indicators', icon: <Target className="w-4 h-4" />, badge: counts.urls },
    { id: 'attachments', label: 'Attachments', icon: <Paperclip className="w-4 h-4" />, badge: counts.attachments },
    { id: 'raw', label: 'Raw Email', icon: <Terminal className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-950/80 rounded-xl border border-slate-800 backdrop-blur-xl">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-mono font-bold transition-all ${
              isActive
                ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {typeof tab.badge === 'number' && (
              <span
                className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
