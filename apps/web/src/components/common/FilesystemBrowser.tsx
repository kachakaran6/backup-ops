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
  Server as ServerIcon,
} from 'lucide-react';
import {
  browseServerFilesystem,
  FilesystemEntry,
  FilesystemBrowseResponse,
} from '../../services/api';
import { Server } from '../../types';

interface FilesystemBrowserProps {
  /** The server ID to browse */
  serverId: string;
  /** Optional server object to display rich connection details */
  server?: Server;
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
  server,
  onSelect,
  onCancel,
  initialPath = '/',
  directoriesOnly = false,
  title = 'Browse Server Filesystem',
}) => {
  const [currentPath, setCurrentPath] = useState<string>(initialPath || '/');
  const [entries, setEntries] = useState<FilesystemEntry[]>([]);
  const [serverName, setServerName] = useState<string>(server?.name || '');
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
        setEntries(result.entries || []);
        setCurrentPath(result.currentPath || path);
        setParentPath(result.parentPath);
        if (result.serverName) {
          setServerName(result.serverName);
        }
        setManualPathInput(result.currentPath || path);
      } catch (err: any) {
        setError(err.message || 'Failed to load directory from server');
        setEntries([]);
      } finally {
        setLoading(false);
      }
    },
    [serverId],
  );

  useEffect(() => {
    loadDirectory(initialPath || '/');
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
    return filtered.sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [entries, searchQuery, directoriesOnly]);

  const formatSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const isOnline = server?.status === 'online';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
      <div className="op-card-elevated w-full max-w-2xl shadow-2xl border-border animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header with Real Server Details */}
        <div className="flex items-center justify-between border-b border-border p-4 shrink-0 bg-surface-secondary/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center">
              <ServerIcon className="w-4 h-4 text-brand-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-text-primary">
                  {server?.name || serverName || 'Server Filesystem'}
                </h3>
                {server?.host && (
                  <span className="text-[11px] font-mono text-text-muted bg-surface-secondary px-1.5 py-0.5 rounded border border-border">
                    {server.host}:{server.port || 22}
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded border font-medium ${
                    isOnline
                      ? 'bg-success/10 text-success border-success/30'
                      : 'bg-surface-secondary text-text-muted border-border'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-success animate-pulse' : 'bg-text-muted'}`}></span>
                  {server?.status ? server.status.toUpperCase() : 'CONNECTED'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-text-muted font-mono">
                {server?.os && <span>{server.os}</span>}
                {server?.connectionMode && <span>· {server.connectionMode.toUpperCase()}</span>}
                <span>· Path: <strong className="text-text-secondary">{currentPath}</strong></span>
              </div>
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
        <div className="border-b border-border px-4 py-2.5 space-y-2 shrink-0 bg-surface-primary">
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

          {/* Manual Path Input */}
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

          {/* Search Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter current directory..."
              className="op-input w-full !pl-8 text-xs !py-1.5 font-sans"
            />
          </div>
        </div>

        {/* Directory Listing Body */}
        <div className="flex-1 overflow-y-auto min-h-[260px] p-2 space-y-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
              <span className="text-xs">Querying live server filesystem...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded bg-error/10 border border-error/30 text-error text-xs flex items-start gap-2.5 m-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">Filesystem Query Failed</span>
                <span className="text-text-secondary">{error}</span>
              </div>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted space-y-1">
              <Folder className="w-8 h-8 opacity-40" />
              <span className="text-xs font-medium">Directory is empty</span>
              <span className="text-[11px] text-text-muted font-mono">{currentPath}</span>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div
                key={entry.path}
                onClick={() => {
                  if (entry.type === 'directory') {
                    navigateTo(entry.path);
                  }
                }}
                className={`flex items-center justify-between p-2 rounded transition-colors text-xs font-mono group ${
                  entry.type === 'directory'
                    ? 'cursor-pointer hover:bg-surface-secondary text-text-primary'
                    : 'text-text-secondary cursor-default hover:bg-surface-secondary/50'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {entry.type === 'directory' ? (
                    <Folder className="w-4 h-4 text-brand-primary shrink-0" />
                  ) : (
                    <File className="w-4 h-4 text-text-muted shrink-0" />
                  )}
                  <span className={`truncate ${entry.type === 'directory' ? 'font-medium' : ''}`}>
                    {entry.name}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-text-muted shrink-0 text-[11px]">
                  {entry.permissions && (
                    <span className="hidden sm:inline font-mono opacity-60">{entry.permissions}</span>
                  )}
                  {entry.sizeBytes !== undefined && (
                    <span className="w-16 text-right">{formatSize(entry.sizeBytes)}</span>
                  )}
                  {entry.type === 'directory' && (
                    <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Directory Selector */}
        <div className="border-t border-border p-3 flex items-center justify-between bg-surface-secondary/40 shrink-0">
          <div className="text-xs text-text-muted font-mono truncate max-w-[320px]">
            Selected: <span className="text-text-primary font-semibold">{currentPath}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onCancel} className="op-btn-ghost text-xs">
              Cancel
            </button>
            <button
              onClick={() => onSelect(currentPath)}
              disabled={loading || !!error}
              className="op-btn-primary text-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Select This Directory</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
