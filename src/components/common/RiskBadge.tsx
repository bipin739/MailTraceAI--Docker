import React from 'react';
import type { ThreatSeverity } from '../../types';
import { ShieldAlert, ShieldCheck, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

interface RiskBadgeProps {
  severity: ThreatSeverity;
  score?: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  severity,
  score,
  showScore = false,
  size = 'md'
}) => {
  const getBadgeStyle = () => {
    switch (severity) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-950/80 text-red-400 border-red-800/80 glow-red',
          icon: <ShieldAlert className="w-3.5 h-3.5" />,
          label: 'CRITICAL THREAT'
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-950/80 text-amber-400 border-amber-800/80 glow-amber',
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
          label: 'HIGH RISK'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-950/80 text-yellow-300 border-yellow-800/80',
          icon: <AlertOctagon className="w-3.5 h-3.5" />,
          label: 'SUSPICIOUS'
        };
      case 'LOW':
        return {
          bg: 'bg-blue-950/80 text-blue-300 border-blue-800/80',
          icon: <Info className="w-3.5 h-3.5" />,
          label: 'LOW RISK'
        };
      case 'LEGITIMATE':
      default:
        return {
          bg: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80',
          icon: <ShieldCheck className="w-3.5 h-3.5" />,
          label: 'VERIFIED LEGITIMATE'
        };
    }
  };

  const style = getBadgeStyle();
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 space-x-1',
    md: 'text-xs px-2.5 py-1 space-x-1.5 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 space-x-2 font-bold tracking-wide'
  }[size];

  return (
    <span className={`inline-flex items-center rounded-full border backdrop-blur-md ${style.bg} ${sizeClasses}`}>
      {style.icon}
      <span>{style.label}</span>
      {showScore && score !== undefined && (
        <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
          {score}%
        </span>
      )}
    </span>
  );
};
