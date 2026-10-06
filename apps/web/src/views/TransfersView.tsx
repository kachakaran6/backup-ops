import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowRight,
  ArrowUpDown,
  Plus,
  RefreshCw,
  Pause,
  Play,
  RotateCcw,
  X,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  HardDrive,
  Server as ServerIcon,
  AlertCircle,
  Activity,
  Layers,
  FolderOpen,
  Check,
  Search,
} from 'lucide-react';
import { Server } from '../types';
import * as api from '../services/api';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/StatusBadge';
import { FilterBar } from '../components/common/FilterBar';
import { LogViewer } from '../components/common/LogViewer';
import { TableSkeleton, MetricCardsSkeleton } from '../components/common/Skeleton';
import { FilesystemBrowser } from '../components/common/FilesystemBrowser';

interface TransfersViewProps {
  servers?: Server[];
  onRefresh?: () => void;
}

export const TransfersView: React.FC<TransfersViewProps> = ({ servers: propServers, onRefresh: propOnRefresh }) => {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [servers, setServers] = useState<Server[]>(propServers || []);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterState, setFilterState] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTransfer, setSelectedTransfer] = useState<any | null>(null);

  // New Transfer Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [sourceServerId, setSourceServerId] = useState<string>('');
  const [sourcePath, setSourcePath] = useState<string>('');
  const [destinationServerId, setDestinationServerId] = useState<string>('');
  const [destinationPath, setDestinationPath] = useState<string>('');
  const [mode, setMode] = useState<'copy' | 'move'>('copy');
  const [verifyChecksum, setVerifyChecksum] = useState<boolean>(true);
  const [confirmMove, setConfirmMove] = useState<boolean>(false);
  const [starting, setStarting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [browsingTarget, setBrowsingTarget] = useState<'source' | 'destination' | null>(null);

  // Pre-flight check state
  const [preflightResult, setPreflightResult] = useState<api.PreflightResult | null>(null);
  const [preflightLoading, setPreflightLoading] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [transferData, serverData] = await Promise.all([
        api.fetchTransfers(),
        propServers && propServers.length > 0 ? Promise.resolve(propServers) : api.fetchServers(),
      ]);
      setTransfers(transferData);
      if (serverData && serverData.length > 0) {
        setServers(serverData);
        if (!sourceServerId && serverData[0]) setSourceServerId(serverData[0].id);
        if (!destinationServerId && serverData[1]) setDestinationServerId(serverData[1].id);
        else if (!destinationServerId && serverData[0]) setDestinationServerId(serverData[0].id);
      }
    } catch (err) {
      console.error('Failed to load transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(async () => {
      try {
        const data = await api.fetchTransfers();
        setTransfers(data);
      } catch {}
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedTransfer) {
      const updated = transfers.find((t) => t.id === selectedTransfer.id);
      if (updated) setSelectedTransfer(updated);
    }
  }, [transfers]);

  // Handle source server change (resets source path)
  const handleSourceServerChange = (newServerId: string) => {
    setSourceServerId(newServerId);
    setSourcePath('');
    setPreflightResult(null);
  };

  // Handle destination server change (resets destination path)
  const handleDestinationServerChange = (newServerId: string) => {
    setDestinationServerId(newServerId);
    setDestinationPath('');
    setPreflightResult(null);
  };

  // Run real Pre-flight validation
  const runPreflightCheck = useCallback(async () => {
    if (!sourcePath || !destinationPath) {
      return;
    }
    setPreflightLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.preflightTransfer({
        sourceServerId: sourceServerId || undefined,
        sourcePath,
        destinationServerId: destinationServerId || undefined,
        destinationPath,
      });
      setPreflightResult(res);
      if (!res.canTransfer && res.errors.length > 0) {
        setErrorMessage(res.errors.join('; '));
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Pre-flight validation failed');
      setPreflightResult(null);
    } finally {
      setPreflightLoading(false);
    }
  }, [sourceServerId, sourcePath, destinationServerId, destinationPath]);

  // Trigger preflight when both paths are defined
  useEffect(() => {
    if (sourcePath && destinationPath && showModal) {
      const t = setTimeout(() => {
        runPreflightCheck();
      }, 400);
      return () => clearTimeout(t);
    } else {
      setPreflightResult(null);
    }
  }, [sourcePath, destinationPath, sourceServerId, destinationServerId, showModal]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCount = transfers.filter(
    (t) => t.state === 'running' || t.state === 'planning' || t.state === 'verifying',
  ).length;
  const queuedCount = transfers.filter((t) => t.state === 'queued').length;
  const completedCount = transfers.filter((t) => t.state === 'completed').length;
  const failedCount = transfers.filter((t) => t.state === 'failed').length;

  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      if (filterState === 'active' && !(t.state === 'running' || t.state === 'planning' || t.state === 'verifying'))
        return false;
      if (filterState === 'queued' && t.state !== 'queued') return false;
      if (filterState === 'completed' && t.state !== 'completed') return false;
      if (filterState === 'failed' && t.state !== 'failed') return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          t.id.toLowerCase().includes(q) ||
          (t.sourcePath && t.sourcePath.toLowerCase().includes(q)) ||
          (t.destinationPath && t.destinationPath.toLowerCase().includes(q)) ||
          (t.sourceServerName && t.sourceServerName.toLowerCase().includes(q)) ||
          (t.destinationServerName && t.destinationServerName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [transfers, filterState, searchQuery]);

  const handleStartTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourcePath || !destinationPath) {
      setErrorMessage('Please select both Source and Destination directories.');
      return;
    }
    if (mode === 'move' && !confirmMove) {
      setErrorMessage('Explicit safety confirmation is required for MOVE operations.');
      return;
    }

    setStarting(true);
    setErrorMessage(null);
    try {
      await api.createTransfer({
        sourceServerId: sourceServerId || undefined,
        sourcePath,
        destinationServerId: destinationServerId || undefined,
        destinationPath,
        mode,
        verifyChecksum,
        confirmDestructiveMove: mode === 'move' ? confirmMove : undefined,
      });
      setShowModal(false);
      setConfirmMove(false);
      setSourcePath('');
      setDestinationPath('');
      setPreflightResult(null);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to start transfer');
    } finally {
      setStarting(false);
    }
  };

  const handlePause = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.pauseTransfer(id);
      loadData();
    } catch (err: any) {
      alert(`Pause failed: ${err.message}`);
    }
  };

  const handleResume = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.resumeTransfer(id);
      loadData();
    } catch (err: any) {
      alert(`Resume failed: ${err.message}`);
    }
  };

  const handleCancel = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to cancel this transfer?')) return;
    try {
      await api.cancelTransfer(id);
      loadData();
    } catch (err: any) {
      alert(`Cancel failed: ${err.message}`);
    }
  };

  const handleRetry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.retryTransfer(id);
      loadData();
    } catch (err: any) {
      alert(`Retry failed: ${err.message}`);
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatSpeed = (bytesPerSec?: number) => {
    if (!bytesPerSec || bytesPerSec === 0) return '0 MB/s';
    return `${(bytesPerSec / (1024 * 1024)).toFixed(2)} MB/s`;
  };

  const formatEta = (seconds?: number) => {
    if (seconds === undefined || seconds === null || seconds <= 0) return '0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s remaining` : `${s}s remaining`;
  };

  const mapStatusBadge = (state: string) => {
    switch (state) {
      case 'running':
      case 'planning':
      case 'verifying':
        return 'RUNNING';
      case 'completed':
        return 'HEALTHY';
      case 'failed':
        return 'FAILED';
      case 'paused':
        return 'WARNING';
      case 'queued':
        return 'QUEUED';
      default:
        return 'UNKNOWN';
    }
  };

  const selectedSourceServer = servers.find((s) => s.id === sourceServerId);
  const selectedDestServer = servers.find((s) => s.id === destinationServerId);

  if (loading && transfers.length === 0) {
    return (
      <div className="space-y-4 animate-in fade-in duration-150">
        <MetricCardsSkeleton count={4} />
        <TableSkeleton rows={5} columns={8} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="text-sm font-semibold text-text-primary tracking-tight font-mono uppercase">
            Data Movement &amp; Server Transfers
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Real, authenticated, stream-piped server-to-server data movement with live SHA-256 verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="op-btn-secondary"
            title="Refresh Transfers"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-primary' : 'text-text-muted'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => {
              setSourcePath('');
              setDestinationPath('');
              setPreflightResult(null);
              setErrorMessage(null);
              setShowModal(true);
            }}
            className="op-btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Transfer</span>
          </button>
        </div>
      </div>

      {/* Operational Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Total Transfers</span>
            <div className="text-lg font-semibold font-mono text-text-primary">{transfers.length}</div>
          </div>
          <ArrowUpDown className="w-4 h-4 text-text-muted" />
        </div>
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-brand-primary uppercase tracking-wider">Active In-Flight</span>
            <div className="text-lg font-semibold font-mono text-brand-primary">{activeCount}</div>
          </div>
          <span className="w-2 h-2 rounded-full bg-brand-primary ring-4 ring-brand-primary/20"></span>
        </div>
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-success uppercase tracking-wider">Completed &amp; Verified</span>
            <div className="text-lg font-semibold font-mono text-success">{completedCount}</div>
          </div>
          <CheckCircle2 className="w-4 h-4 text-success" />
        </div>
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-error uppercase tracking-wider">Failed</span>
            <div className="text-lg font-semibold font-mono text-error">{failedCount}</div>
          </div>
          <AlertCircle className="w-4 h-4 text-error" />
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchPlaceholder="Filter transfers by path, host name, or job ID..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filterOptions={[
          { id: 'all', label: 'All Transfers', count: transfers.length },
          { id: 'active', label: 'Active', count: activeCount },
          { id: 'queued', label: 'Queued', count: queuedCount },
          { id: 'completed', label: 'Completed', count: completedCount },
          { id: 'failed', label: 'Failed', count: failedCount },
        ]}
        selectedFilter={filterState}
        onFilterChange={setFilterState}
        totalCount={transfers.length}
        filteredCount={filteredTransfers.length}
      />

      {/* Transfers Table */}
      {filteredTransfers.length === 0 ? (
        <EmptyState
          icon={ArrowUpDown}
          title="No transfers found"
          description={
            transfers.length === 0
              ? 'No server-to-server data movement operations have been registered. Click "New Transfer" to move or copy directories.'
              : 'No transfers match the selected filter.'
          }
          actionText="Start Transfer"
          onAction={() => {
            setSourcePath('');
            setDestinationPath('');
            setPreflightResult(null);
            setShowModal(true);
          }}
        />
      ) : (
        <div className="op-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="op-table">
              <thead>
                <tr>
                  <th>Operation</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Progress / Speed / ETA</th>
                  <th>Transferred</th>
                  <th>Checksum</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransfers.map((t) => {
                  const pct = t.progress?.percentage || 0;
                  const isRunning = t.state === 'running' || t.state === 'planning' || t.state === 'verifying';
                  const isPaused = t.state === 'paused';
                  const isFailed = t.state === 'failed';

                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTransfer(t)}
                      className="cursor-pointer hover:bg-surface-hover transition-colors font-mono"
                    >
                      <td>
                        <span
                          className={`uppercase text-xs font-semibold px-2 py-0.5 rounded border ${
                            t.mode === 'move'
                              ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/30'
                              : 'bg-info/10 text-info border-info/30'
                          }`}
                        >
                          {t.mode || t.operationType}
                        </span>
                      </td>

                      <td className="max-w-[200px]">
                        <div className="text-xs font-sans font-semibold text-text-primary truncate">
                          {t.sourceServerName || 'Source'}
                        </div>
                        <div className="text-[11px] text-text-muted truncate font-mono" title={t.sourcePath}>
                          {t.sourcePath}
                        </div>
                      </td>

                      <td className="max-w-[200px]">
                        <div className="text-xs font-sans font-semibold text-text-primary truncate">
                          {t.destinationServerName || 'Destination'}
                        </div>
                        <div className="text-[11px] text-text-muted truncate font-mono" title={t.destinationPath}>
                          {t.destinationPath}
                        </div>
                      </td>

                      <td className="min-w-[220px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-text-muted truncate max-w-[130px] font-sans">
                              {t.progress?.currentStep || (isRunning ? 'Streaming' : t.state)}
                            </span>
                            <span className="font-semibold text-text-primary">{pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-surface-secondary rounded-full overflow-hidden border border-border">
                            <div
                              className={`h-full transition-all duration-300 rounded-full ${
                                t.state === 'completed'
                                  ? 'bg-success'
                                  : t.state === 'failed'
                                  ? 'bg-error'
                                  : isPaused
                                  ? 'bg-warning'
                                  : 'bg-brand-primary'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          {isRunning && (
                            <div className="flex justify-between text-[10px] text-text-muted">
                              <span>{formatSpeed(t.progress?.transferSpeedBytesPerSec)}</span>
                              <span>{formatEta(t.progress?.etaSeconds)}</span>
                            </div>
                          )}
                          {isPaused && (
                            <div className="text-[10px] text-warning">
                              Transfer paused. Checkpoint saved.
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="text-xs text-text-secondary whitespace-nowrap">
                        {formatBytes(t.progress?.bytesProcessed)}
                        <span className="text-[10px] text-text-muted block">
                          of {formatBytes(t.progress?.totalBytes)}
                        </span>
                      </td>

                      <td className="text-xs">
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-text-secondary">
                          <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
                          {t.checksum ? 'SHA-256' : 'Active'}
                        </span>
                      </td>

                      <td>
                        <StatusBadge status={mapStatusBadge(t.state)} size="sm" />
                      </td>

                      <td className="text-right font-sans" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {isRunning && (
                            <button
                              onClick={(e) => handlePause(t.id, e)}
                              className="op-btn-secondary !text-[11px] !py-1 !px-2 flex items-center gap-1"
                              title="Pause Transfer"
                            >
                              <Pause className="w-3 h-3 text-warning" />
                              <span className="hidden sm:inline">Pause</span>
                            </button>
                          )}
                          {isPaused && (
                            <button
                              onClick={(e) => handleResume(t.id, e)}
                              className="op-btn-primary !text-[11px] !py-1 !px-2 flex items-center gap-1"
                              title="Resume Transfer"
                            >
                              <Play className="w-3 h-3" />
                              <span className="hidden sm:inline">Resume</span>
                            </button>
                          )}
                          {isFailed && (
                            <button
                              onClick={(e) => handleRetry(t.id, e)}
                              className="op-btn-secondary !text-[11px] !py-1 !px-2 flex items-center gap-1"
                              title="Retry Transfer"
                            >
                              <RotateCcw className="w-3 h-3 text-brand-primary" />
                              <span className="hidden sm:inline">Retry</span>
                            </button>
                          )}
                          {isRunning && (
                            <button
                              onClick={(e) => handleCancel(t.id, e)}
                              className="op-btn-secondary !text-[11px] !py-1 !px-1.5 text-error hover:bg-error/10"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedTransfer(t)}
                            className="op-btn-secondary !text-[11px] !py-1 !px-2 flex items-center gap-1"
                            title="Inspect Logs"
                          >
                            <FileText className="w-3 h-3 text-text-muted" />
                            <span className="hidden sm:inline">Logs</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Transfer Wizard Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="op-card-elevated max-w-2xl w-full p-5 space-y-4 shadow-2xl border-border animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center">
                  <ArrowUpDown className="w-4 h-4 text-brand-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-text-primary">Server-to-Server Data Movement</h3>
                  <p className="text-[11px] text-text-muted">Real streaming data transfer with rate control and SHA-256 verification.</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-surface-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded bg-error/10 border border-error/30 text-error text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold block">Validation Error</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleStartTransfer} className="space-y-4 text-xs">
              {/* Step 1: Source */}
              <div className="p-3.5 rounded bg-surface-secondary/50 border border-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold text-brand-primary uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>1. Source Server &amp; Directory</span>
                  </div>
                  {selectedSourceServer && (
                    <span className="text-[10px] text-text-muted font-mono">
                      {selectedSourceServer.host} · {selectedSourceServer.os || 'Linux'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-text-secondary mb-1 font-medium">Source Server</label>
                    <select
                      value={sourceServerId}
                      onChange={(e) => handleSourceServerChange(e.target.value)}
                      className="op-input"
                    >
                      {servers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.host}:{s.port || 22})
                        </option>
                      ))}
                      {servers.length === 0 && <option value="">Local Host</option>}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-text-secondary font-medium">Source Directory</label>
                      <button
                        type="button"
                        onClick={() => setBrowsingTarget('source')}
                        className="text-[11px] text-brand-primary hover:underline flex items-center gap-1 font-medium"
                      >
                        <FolderOpen className="w-3 h-3" />
                        <span>Browse Server</span>
                      </button>
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        required
                        value={sourcePath}
                        onChange={(e) => {
                          setSourcePath(e.target.value);
                          setPreflightResult(null);
                        }}
                        placeholder="No directory selected"
                        className="op-input font-mono flex-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setBrowsingTarget('source')}
                        className="op-btn-secondary px-2.5 py-1.5 text-xs flex items-center gap-1 shrink-0"
                        title="Browse Server Filesystem"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-brand-primary" />
                        <span className="hidden sm:inline">Browse</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Destination */}
              <div className="p-3.5 rounded bg-surface-secondary/50 border border-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold text-brand-primary uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>2. Destination Server &amp; Directory</span>
                  </div>
                  {selectedDestServer && (
                    <span className="text-[10px] text-text-muted font-mono">
                      {selectedDestServer.host} · {selectedDestServer.os || 'Linux'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-text-secondary mb-1 font-medium">Destination Server</label>
                    <select
                      value={destinationServerId}
                      onChange={(e) => handleDestinationServerChange(e.target.value)}
                      className="op-input"
                    >
                      {servers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.host}:{s.port || 22})
                        </option>
                      ))}
                      {servers.length === 0 && <option value="">Local Host</option>}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-text-secondary font-medium">Destination Directory</label>
                      <button
                        type="button"
                        onClick={() => setBrowsingTarget('destination')}
                        className="text-[11px] text-brand-primary hover:underline flex items-center gap-1 font-medium"
                      >
                        <FolderOpen className="w-3 h-3" />
                        <span>Browse Server</span>
                      </button>
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        required
                        value={destinationPath}
                        onChange={(e) => {
                          setDestinationPath(e.target.value);
                          setPreflightResult(null);
                        }}
                        placeholder="No directory selected"
                        className="op-input font-mono flex-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setBrowsingTarget('destination')}
                        className="op-btn-secondary px-2.5 py-1.5 text-xs flex items-center gap-1 shrink-0"
                        title="Browse Destination Server Filesystem"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-brand-primary" />
                        <span className="hidden sm:inline">Browse</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pre-flight Check Display */}
              {preflightLoading && (
                <div className="p-3 rounded bg-surface-secondary border border-border flex items-center gap-2 text-text-muted">
                  <RefreshCw className="w-4 h-4 animate-spin text-brand-primary" />
                  <span>Running live pre-flight inspection (discovering files &amp; checking destination capacity)...</span>
                </div>
              )}

              {preflightResult && !preflightLoading && (
                <div
                  className={`p-3.5 rounded border space-y-2 animate-in fade-in duration-150 ${
                    preflightResult.canTransfer
                      ? 'bg-success/5 border-success/30'
                      : 'bg-error/5 border-error/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold flex items-center gap-1.5 ${
                        preflightResult.canTransfer ? 'text-success' : 'text-error'
                      }`}
                    >
                      {preflightResult.canTransfer ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      <span>Pre-flight Inspection: {preflightResult.canTransfer ? 'Ready for Transfer' : 'Action Required'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={runPreflightCheck}
                      className="text-[11px] text-text-muted hover:text-text-primary underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Re-check</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[11px] font-mono pt-1">
                    <div className="bg-surface-primary/60 p-2 rounded border border-border space-y-0.5">
                      <span className="text-text-muted block text-[10px]">SOURCE DATA INVENTORY</span>
                      <div className="text-text-primary font-semibold">
                        {preflightResult.source.totalFiles} files · {formatBytes(preflightResult.source.totalBytes)}
                      </div>
                      <div className="text-[10px] text-text-muted truncate">
                        {preflightResult.source.serverName}:{preflightResult.source.path}
                      </div>
                    </div>

                    <div className="bg-surface-primary/60 p-2 rounded border border-border space-y-0.5">
                      <span className="text-text-muted block text-[10px]">DESTINATION CAPACITY</span>
                      <div className="text-text-primary font-semibold">
                        {preflightResult.destination.availableBytes
                          ? `${formatBytes(preflightResult.destination.availableBytes)} available`
                          : 'Writable'}
                      </div>
                      <div className="text-[10px] text-text-muted truncate">
                        {preflightResult.destination.serverName}:{preflightResult.destination.path}
                      </div>
                    </div>
                  </div>

                  {preflightResult.warnings && preflightResult.warnings.length > 0 && (
                    <div className="text-[11px] text-warning flex items-center gap-1 pt-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{preflightResult.warnings.join(' ')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Transfer Mode & Checksum */}
              <div className="space-y-2">
                <label className="block text-text-secondary font-medium">Operation Mode</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setMode('copy')}
                    className={`p-3 rounded border cursor-pointer transition-colors ${
                      mode === 'copy'
                        ? 'border-info bg-info/10 text-text-primary'
                        : 'border-border bg-surface-secondary text-text-secondary hover:border-border-strong'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center justify-between">
                      <span>COPY</span>
                      {mode === 'copy' && <CheckCircle2 className="w-3.5 h-3.5 text-info" />}
                    </div>
                    <p className="text-[11px] text-text-muted mt-1 leading-normal">
                      Streams data to destination. Source directory remains completely untouched.
                    </p>
                  </div>

                  <div
                    onClick={() => setMode('move')}
                    className={`p-3 rounded border cursor-pointer transition-colors ${
                      mode === 'move'
                        ? 'border-brand-primary bg-brand-primary/10 text-text-primary'
                        : 'border-border bg-surface-secondary text-text-secondary hover:border-border-strong'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center justify-between">
                      <span>MOVE</span>
                      {mode === 'move' && <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary" />}
                    </div>
                    <p className="text-[11px] text-text-muted mt-1 leading-normal">
                      Streams, verifies destination SHA-256 match, and only then safely deletes source files.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-verify"
                  checked={verifyChecksum}
                  onChange={(e) => setVerifyChecksum(e.target.checked)}
                  className="rounded border-border text-brand-primary focus:ring-brand-primary"
                />
                <label htmlFor="chk-verify" className="text-xs text-text-secondary cursor-pointer">
                  Require SHA-256 checksum verification before declaring success
                </label>
              </div>

              {/* MOVE Safety Warning & Explicit Confirmation */}
              {mode === 'move' && (
                <div className="p-3 rounded-md bg-warning/10 border border-warning/30 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 text-warning font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Destructive Move Safeguard Notice</span>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    Source data will only be deleted <strong>after</strong> destination transfer completes and SHA-256 checksum is verified 100%. If verification fails, the source is never touched.
                  </p>
                  <label className="flex items-start gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={confirmMove}
                      onChange={(e) => setConfirmMove(e.target.checked)}
                      className="rounded border-border text-warning focus:ring-warning mt-0.5"
                    />
                    <span className="text-[11px] text-text-primary font-medium">
                      I understand and confirm that source files will be removed only upon verified destination match.
                    </span>
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="op-btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    starting ||
                    !sourcePath ||
                    !destinationPath ||
                    (preflightResult !== null && !preflightResult.canTransfer) ||
                    (mode === 'move' && !confirmMove)
                  }
                  className="op-btn-primary"
                >
                  {starting
                    ? 'Initiating Transfer...'
                    : mode === 'move'
                    ? 'Start Move Operation'
                    : 'Start Copy Operation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Modal with LogViewer */}
      {selectedTransfer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl op-card-elevated p-5 shadow-2xl space-y-4 border-border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-primary" />
                <h3 className="font-semibold text-sm text-text-primary">
                  Transfer Telemetry — <span className="font-mono text-xs text-text-muted">{selectedTransfer.id}</span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedTransfer(null)}
                className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-surface-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-surface-secondary rounded border border-border font-mono text-xs">
              <div>
                <span className="text-text-muted block text-[10px]">OPERATION</span>
                <span className="text-text-primary uppercase font-medium">{selectedTransfer.mode || selectedTransfer.operationType}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px]">STATE</span>
                <span className="text-text-primary uppercase font-medium">{selectedTransfer.state}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px]">SPEED</span>
                <span className="text-text-primary font-medium">{formatSpeed(selectedTransfer.progress?.transferSpeedBytesPerSec)}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px]">TRANSFERRED</span>
                <span className="text-text-primary font-medium">{formatBytes(selectedTransfer.progress?.bytesProcessed)}</span>
              </div>
            </div>

            <LogViewer
              title={`Transfer Session [${(selectedTransfer.mode || 'transfer').toUpperCase()}]`}
              logs={
                selectedTransfer.logs && selectedTransfer.logs.length > 0
                  ? selectedTransfer.logs.map((l: any) => ({
                      timestamp: l.timestamp || new Date().toISOString(),
                      level: l.level || 'info',
                      component: 'TransferEngine',
                      message: typeof l === 'string' ? l : l.message,
                    }))
                  : [
                      {
                        timestamp: new Date().toISOString(),
                        level: 'info' as const,
                        component: 'TransferEngine',
                        message: `Transfer initialized for ${selectedTransfer.sourcePath} -> ${selectedTransfer.destinationPath}.`,
                      },
                    ]
              }
            />

            <div className="flex justify-end pt-2 border-t border-border">
              <button
                onClick={() => setSelectedTransfer(null)}
                className="op-btn-secondary"
              >
                Close Telemetry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filesystem Browser Modal */}
      {browsingTarget && (
        <FilesystemBrowser
          serverId={browsingTarget === 'source' ? sourceServerId : destinationServerId}
          server={
            browsingTarget === 'source'
              ? servers.find((s) => s.id === sourceServerId)
              : servers.find((s) => s.id === destinationServerId)
          }
          initialPath={browsingTarget === 'source' ? sourcePath : destinationPath}
          title={
            browsingTarget === 'source'
              ? `Select Source Directory (${servers.find((s) => s.id === sourceServerId)?.name || 'Source'})`
              : `Select Destination Directory (${servers.find((s) => s.id === destinationServerId)?.name || 'Destination'})`
          }
          directoriesOnly={false}
          onSelect={(selected) => {
            if (browsingTarget === 'source') {
              setSourcePath(selected);
            } else {
              setDestinationPath(selected);
            }
            setBrowsingTarget(null);
          }}
          onCancel={() => setBrowsingTarget(null)}
        />
      )}
    </div>
  );
};
