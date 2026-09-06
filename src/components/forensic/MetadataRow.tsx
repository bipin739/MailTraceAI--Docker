import React from 'react';
import { CopyButton } from './CopyButton';

interface MetadataRowProps {
  label: string;
  value?: string | string[] | null;
  allowCopy?: boolean;
  isMonospace?: boolean;
}

export const MetadataRow: React.FC<MetadataRowProps> = ({
  label,
  value,
  allowCopy = false,
  isMonospace = true
}) => {
  const formatValue = (): string | null => {
    if (!value) return null;
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : null;
    }
    return value.trim() ? value : null;
  };

  const formattedVal = formatValue();
  const displayVal = formattedVal || 'Not available';
  const isAvailable = formattedVal !== null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between py-2.5 px-3 rounded-lg border border-slate-800/80 bg-slate-950/40 hover:bg-slate-900/40 transition-colors gap-2">
      <span className="text-xs font-mono font-semibold text-slate-400 min-w-[120px] shrink-0 pt-0.5">
        {label}
      </span>

      <div className="flex-1 flex items-center justify-between min-w-0 gap-2">
        <span
          className={`text-xs break-all ${
            isAvailable
              ? isMonospace
                ? 'font-mono text-slate-200'
                : 'text-slate-200 font-sans'
              : 'text-slate-500 italic font-mono'
          }`}
        >
          {displayVal}
        </span>

        {isAvailable && allowCopy && (
          <CopyButton text={displayVal} iconOnly className="shrink-0" />
        )}
      </div>
    </div>
  );
};
