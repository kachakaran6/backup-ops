import React from 'react';
import { RefreshCw, Plus, Cloud, Shield } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onQuickAction?: (action: 'coolify' | 'server' | 'backup') => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onRefresh,
  isRefreshing,
  onQuickAction,
}) => {
  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur px-8 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
        {subtitle && <p className="text-xs text-zinc-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            title="Refresh current state"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        )}

        {onQuickAction && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onQuickAction('coolify')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-lg border border-zinc-700 transition-colors"
            >
              <Cloud className="w-3.5 h-3.5 text-blue-400" />
              <span>Connect Coolify</span>
            </button>
            <button
              onClick={() => onQuickAction('server')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-lg border border-zinc-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add Server</span>
            </button>
            <button
              onClick={() => onQuickAction('backup')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg shadow-sm shadow-blue-500/20 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Backup Now</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
