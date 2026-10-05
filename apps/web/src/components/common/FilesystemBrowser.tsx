import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Folder,
  File,
  ChevronRight,
  ArrowUp,
  Loader2,
  Search,
  X,
  AlertCircle,
  HardDrive,
  Terminal,
  Check,
} from 'lucide-react';
import {
  browseServerFilesystem,
  FilesystemEntry,
  FilesystemBrowseResponse,
} from '../../services/api';

interface FilesystemBrowserProps {
  /** The server ID to browse */
  serverId: string;
  /** Called when the user selects a path (clicks "Select This Directory") */
  onSelect: (path: string) => void;
  /** Called when the user cancels browsing */
  onCancel: () => void;
  /** The initially selected path (used to pre-navigate) */
  initialPath?: string;
  /** Whether to only show directories (hide files) */
  directoriesOnly?: boolean;
  /** Title shown at the top of the browser */
  title?: string;
}

export const FilesystemBrowser: React.FC<FilesystemBrowserProps> = ({
  serverId,
  onSelect,
  onCancel,
  initialPath = '/',
  directoriesOnly = false,
  title = 'Browse Filesystem',
}) => {
  const [currentPath, setCurrentPath] = useState<string>(initialPath);
  const [entries, setEntries] = useState<FilesystemEntry[]>([]);
  const [serverName, setServerName] = useState<string>('');
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [manualPathInput, setManualPathInput] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);

  const loadDirectory = useCallback(
    async (path: string) => {
      setLoading(true);
      setError(null);
      setSearchQuery('');
      try {
        const result: FilesystemBrowseResponse = await browseServerFilesystem(serverId, path);
        if (result.error) {
          setError(result.error);
        }
        setEntries(result.entries);
        setCurrentPath(result.currentPath);
        setParentPath(result.parentPath);
        setServerName(result.serverName);
        setManualPathInput(result.currentPath);
      } catch (err: any) {
        setError(err.message || 'Failed to load directory');
      } finally {
        setLoading(false);
      }
    },
    [serverId],
  );

  useEffect(() => {
    loadDirectory(initialPath);
  }, [serverId]); // eslint-disable-line react-hooks/exhaustive-deps

  const navigateTo = useCallback(
    (path: string) => {
      setNavigationHistory((prev) => [...prev, currentPath]);
      loadDirectory(path);
    },
    [currentPath, loadDirectory],
  );

  const navigateUp = useCallback(() => {
    if (parentPath) {
      navigateTo(parentPath);
    }
  }, [parentPath, navigateTo]);

  const handleManualNavigation = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const path = manualPathInput.trim();
      if (path && path.startsWith('/')) {
        navigateTo(path);
        setShowManualInput(false);
      }
    },
    [manualPathInput, navigateTo],
  );

  const breadcrumbs = useMemo(() => {
    if (currentPath === '/') return [{ label: '/', path: '/' }];
    const parts = currentPath.split('/').filter(Boolean);
    const crumbs = [{ label: '/', path: '/' }];
    let accumulated = '';
    for (const part of parts) {
      accumulated += `/${part}`;
      crumbs.push({ label: part, path: accumulated });
    }
    return crumbs;
  }, [currentPath]);

  const filteredEntries = useMemo(() => {
    let filtered = entries;
    if (directoriesOnly) {
      filtered = filtered.filter((e) => e.type === 'directory');
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((e) => e.name.toLowerCase().includes(q));
    }
    // Sort: directories first, then alphabetically
    return filtered.sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [entries, searchQuery, directoriesOnly]);

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return '1 day ago';
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
      <div className="op-card-elevated w-full max-w-2xl shadow-2xl border-border animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center">
              <HardDrive className="w-4 h-4 text-brand-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-text-primary">{title}</h3>
              {serverName && (
                <p className="text-[11px] text-text-muted font-mono">
                  {serverName} — {currentPath}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-text-muted hover:text-text-primary p-1.5 rounded hover:bg-surface-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Breadcrumbs + Search */}
        <div className="border-b border-border px-4 py-2.5 space-y-2 shrink-0">
          {/* Breadcrumbs Row */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            <button
              onClick={navigateUp}
              disabled={!parentPath || loading}
              className="p-1 rounded hover:bg-surface-secondary text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
              title="Go up one level"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none text-xs">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.path}>
                  {idx > 0 && <ChevronRight className="w-3 h-3 text-text-muted shrink-0" />}
                  <button
                    onClick={() => navigateTo(crumb.path)}
                    className={`px-1.5 py-0.5 rounded font-mono whitespace-nowrap transition-colors ${
                      idx === breadcrumbs.length - 1
                        ? 'text-brand-primary font-semibold bg-brand-primary/10'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                    }`}
                  >
                    {crumb.label}
                  </button>
                </React.Fragment>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-1 shrink-0">
              <button
                onClick={() => setShowManualInput(!showManualInput)}
                className={`p-1.5 rounded transition-colors ${
                  showManualInput
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-secondary'
                }`}
                title="Type path manually"
              >
                <Terminal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Manual Path Input (collapsible) */}
          {showManualInput && (
            <form
              onSubmit={handleManualNavigation}
              className="flex items-center gap-2 animate-in slide-in-from-top-1 duration-150"
            >
              <input
                type="text"
                value={manualPathInput}
                onChange={(e) => setManualPathInput(e.target.value)}
                placeholder="/var/www/app"
                className="op-input flex-1 font-mono text-xs !py-1.5"
                autoFocus
              />
              <button type="submit" className="op-btn-primary !py-1.5 !px-3 !text-xs">
                Go
              </button>
            </form>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter entries..."
              className="op-input w-full !pl-8 text-xs !py-1.5"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Directory listing */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {error && (
            <div className="m-4 p-3 rounded bg-error/10 border border-error/30 text-error text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-text-muted text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
              <span>Scanning directory...</span>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted text-xs gap-2">
              <Folder className="w-8 h-8 opacity-30" />
              <span>{searchQuery ? 'No matching entries' : 'Empty directory'}</span>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredEntries.map((entry) => (
                <button
                  key={entry.path}
                  onClick={() => {
                    if (entry.type === 'directory') {
                      navigateTo(entry.path);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors group ${
                    entry.type === 'directory'
                      ? 'hover:bg-surface-hover cursor-pointer'
                      : 'opacity-60 cursor-default'
                  }`}
                >
                  {entry.type === 'directory' ? (
                    <Folder className="w-4 h-4 text-brand-primary shrink-0 group-hover:scale-110 transition-transform" />
                  ) : (
                    <File className="w-4 h-4 text-text-muted shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-xs font-mono truncate block ${
                        entry.type === 'directory'
                          ? 'text-text-primary font-medium'
                          : 'text-text-secondary'
                      }`}
                    >
                      {entry.name}
                      {entry.type === 'directory' && '/'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-[10px] text-text-muted font-mono">
                    {entry.permissions && (
                      <span className="hidden sm:inline">{entry.permissions}</span>
                    )}
                    {entry.sizeBytes !== undefined && entry.type === 'file' && (
                      <span className="w-16 text-right">{formatSize(entry.sizeBytes)}</span>
                    )}
                    {entry.modifiedAt && (
                      <span className="w-20 text-right hidden sm:inline">
                        {formatRelativeTime(entry.modifiedAt)}
                      </span>
                    )}
                  </div>

                  {entry.type === 'directory' && (
                    <ChevronRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border p-4 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] text-text-muted font-mono truncate flex-1">
              <span className="text-text-secondary font-medium">Selected:</span>{' '}
              {currentPath}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={onCancel} className="op-btn-ghost">
                Cancel
              </button>
              <button
                onClick={() => onSelect(currentPath)}
                className="op-btn-primary flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Select This Directory</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
