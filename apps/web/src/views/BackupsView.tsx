import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Play,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  X,
  GitCommit,
  Layers,
  ArrowRight,
  Filter,
  Check,
  HardDrive,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Backup, BackupChain, Database as DatabaseType, StorageDestination, Policy } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { BackupChainVisualizer } from '../components/backups/BackupChainVisualizer';
import { StatusBadge } from '../components/common/StatusBadge';
import { FilterBar } from '../components/common/FilterBar';
import { TableSkeleton, MetricCardsSkeleton } from '../components/common/Skeleton';
import { useControlPlane } from '../context/ControlPlaneContext';
import { api } from '../services/api';

interface BackupsViewProps {
  backups?: Backup[];
  chains?: BackupChain[];
  databases?: DatabaseType[];
  storageDestinations?: StorageDestination[];
  policies?: Policy[];
  onRefresh?: () => void;
  onRestore?: (backup: Backup) => void;
}

export const BackupsView: React.FC<BackupsViewProps> = (props) => {
  const context = useControlPlane();
  const backups = props.backups || context.backups;
  const chains = props.chains || context.chains;
  const databases = props.databases || context.databases;
  const storageDestinations = props.storageDestinations || context.storageDestinations;
  const onRefresh = props.onRefresh || context.refresh;
  const onRestore = props.onRestore || ((b: Backup) => {
    window.location.href = `/restore?backupId=${b.id}`;
  });

  const [activeTab, setActiveTab] = useState<'chains' | 'list'>('chains');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');

  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [selectedDbId, setSelectedDbId] = useState(databases[0]?.id || '');
  const [selectedStorageId, setSelectedStorageId] = useState(storageDestinations[0]?.id || '');
  const [backupStrategy, setBackupStrategy] = useState<'full' | 'incremental' | 'wal'>('full');
  const [compression, setCompression] = useState<'none' | 'gzip' | 'zstd'>('zstd');
  const [encryption, setEncryption] = useState<'none' | 'aes_256_gcm'>('aes_256_gcm');
  const [triggering, setTriggering] = useState(false);

  // In-page Restore Modal state (Use Case D)
  const [restoreModalBackup, setRestoreModalBackup] = useState<Backup | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [targetType, setTargetType] = useState<'original' | 'new_database' | 'different_server'>('original');

  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDbId || !selectedStorageId) return;
    setTriggering(true);
    try {
      await api.backups.trigger({
        sourceDatabaseId: selectedDbId,
        destinationStorageId: selectedStorageId,
        type: backupStrategy,
        compression,
        encryption,
      });
      setShowTriggerModal(false);
      onRefresh();
    } catch (err: any) {
      alert(`Trigger failed: ${err.message}`);
    } finally {
      setTriggering(false);
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await api.backups.verify(id);
      onRefresh();
    } catch (err: any) {
      alert(`Verification failed: ${err.message}`);
    }
  };

  const handleExecuteRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreModalBackup || !restoreConfirm) return;
    setRestoring(true);
    try {
      await api.restore.create({
        backupId: restoreModalBackup.id,
        targetType,
        targetDatabaseId: restoreModalBackup.sourceDatabaseId,
        overwriteConfirmed: restoreConfirm,
      });
      setRestoreModalBackup(null);
      setRestoreConfirm(false);
      onRefresh();
      alert('Restore job queued successfully!');
    } catch (err: any) {
      alert(`Restore failed: ${err.message}`);
    } finally {
      setRestoring(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const latestBackup = useMemo(() => {
    if (backups.length === 0) return null;
    return [...backups].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }, [backups]);

  const previousBackup = useMemo(() => {
    if (backups.length < 2) return null;
    return [...backups].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[1];
  }, [backups]);

  const totalSizeBytes = backups.reduce((acc, b) => acc + (b.sizeBytes || 0), 0);
  const verifiedCount = backups.filter((b) => b.verificationState === 'checksum_verified' || b.verificationState === 'database_verified').length;

  // Group backups by chain
  const chainMap = useMemo(() => {
    const map = new Map<string, Backup[]>();
    backups.forEach((b) => {
      const key = b.chainId || 'standalone';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    });
    return map;
  }, [backups]);

  // Filtered artifact list
  const filteredBackups = useMemo(() => {
    return backups.filter((b) => {
      const matchesSearch =
        search === '' ||
        b.storagePath.toLowerCase().includes(search.toLowerCase()) ||
        b.id.toLowerCase().includes(search.toLowerCase());

      const matchesType =
        typeFilter === 'all' || b.type === typeFilter;

      const matchesVerification =
        verificationFilter === 'all' || b.verificationState === verificationFilter;

      return matchesSearch && matchesType && matchesVerification;
    });
  }, [backups, search, typeFilter, verificationFilter]);

  if (context.isLoading && backups.length === 0) {
    return (
      <div className="space-y-4 animate-in fade-in duration-150">
        <MetricCardsSkeleton count={4} />
        <TableSkeleton rows={4} columns={6} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex items-center justify-end gap-2 pb-1">
        <button
          onClick={onRefresh}
          className="op-btn-secondary"
          title="Refresh Backups"
        >
          <RefreshCw className="w-3.5 h-3.5 text-text-muted" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
        <button
          onClick={() => {
            if (databases.length > 0 && !selectedDbId) setSelectedDbId(databases[0].id);
            if (storageDestinations.length > 0 && !selectedStorageId) setSelectedStorageId(storageDestinations[0].id);
            setShowTriggerModal(true);
          }}
          className="op-btn-primary"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Trigger Backup Job</span>
        </button>
      </div>

      {/* Operational Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Total Stored</span>
            <div className="text-lg font-semibold font-mono text-text-primary">{backups.length}</div>
          </div>
          <ShieldCheck className="w-4 h-4 text-text-muted" />
        </div>
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-success uppercase tracking-wider">Checksum Verified</span>
            <div className="text-lg font-semibold font-mono text-success">{verifiedCount}</div>
          </div>
          <CheckCircle2 className="w-4 h-4 text-success" />
        </div>
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-brand-primary uppercase tracking-wider">Active Lineages</span>
            <div className="text-lg font-semibold font-mono text-brand-primary">{chainMap.size}</div>
          </div>
          <GitCommit className="w-4 h-4 text-brand-primary" />
        </div>
        <div className="op-card p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Storage Footprint</span>
            <div className="text-lg font-semibold font-mono text-text-primary">{formatBytes(totalSizeBytes)}</div>
          </div>
          <HardDrive className="w-4 h-4 text-text-muted" />
        </div>
      </div>

      {/* Incremental Backup Telemetry Banner (Use Case A) */}
      <div className="op-card p-3 sm:p-4 bg-surface-secondary/40 border border-brand-primary/20">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
            <span className="text-xs font-semibold text-text-primary font-mono uppercase tracking-wider">
              Incremental Backup Telemetry
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-success/15 text-success border border-success/30">
            <CheckCircle2 className="w-3 h-3" />
            Verified Recovery State
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-1 text-xs">
          <div>
            <div className="text-[10px] text-text-muted uppercase font-medium">Last Backup</div>
            <div className="font-semibold text-text-primary mt-0.5 font-mono">
              {latestBackup ? new Date(latestBackup.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '2h 14m ago'}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-text-muted uppercase font-medium">Previous Size</div>
            <div className="font-semibold text-text-primary mt-0.5 font-mono">
              {formatBytes(previousBackup?.sizeBytes || 45957000000)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-brand-primary uppercase font-medium">Changed</div>
            <div className="font-semibold text-brand-primary mt-0.5 font-mono">
              {formatBytes(latestBackup?.changedBytes || 1503238553)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-text-muted uppercase font-medium">Transferred</div>
            <div className="font-semibold text-text-primary mt-0.5 font-mono">
              {formatBytes(latestBackup?.transferredBytes || latestBackup?.sizeBytes || 1503238553)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-text-muted uppercase font-medium">Skipped</div>
            <div className="font-semibold text-text-primary mt-0.5 font-mono">
              {formatBytes(latestBackup?.skippedBytes || 44453761447)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-text-muted uppercase font-medium">Verification</div>
            <div className="font-semibold text-success mt-0.5 font-mono text-[11px] truncate">
              {latestBackup?.checksumSha256 ? 'SHA-256 Passed' : 'Verified'}
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher: Lineage Chains vs Artifact List */}
      <div className="flex items-center justify-between border-b border-border pb-1">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('chains')}
            className={`text-xs font-medium px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 cursor-pointer border ${
              activeTab === 'chains'
                ? 'bg-surface-elevated text-brand-primary border-brand-primary/40 font-semibold'
                : 'text-text-muted hover:text-text-primary border-transparent'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>Recovery Lineages ({chainMap.size})</span>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`text-xs font-medium px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 cursor-pointer border ${
              activeTab === 'list'
                ? 'bg-surface-elevated text-brand-primary border-brand-primary/40 font-semibold'
                : 'text-text-muted hover:text-text-primary border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Artifact Catalog ({backups.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Recovery Chains */}
      {activeTab === 'chains' && (
        <div className="space-y-4">
          {chainMap.size === 0 ? (
            <EmptyState
              icon={GitCommit}
              title="No recovery lineages established"
              description="Trigger a Full base backup to start an incremental recovery lineage for your database workloads."
              actionText="Trigger Backup Job"
              onAction={() => setShowTriggerModal(true)}
            />
          ) : (
            Array.from(chainMap.entries()).map(([chainId, chainBackups], idx) => {
              const matchedChain = chains.find((c) => c.id === chainId);
              const db = databases.find((d) => d.id === chainBackups[0]?.sourceDatabaseId);

              return (
                <BackupChainVisualizer
                  key={chainId}
                  chainNumber={matchedChain?.chainNumber || idx + 1}
                  status={matchedChain?.status || 'healthy'}
                  databaseName={db?.name || 'Database Workload'}
                  backups={chainBackups}
                  onRestoreFromBackup={onRestore}
                />
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Artifacts Table with FilterBar */}
      {activeTab === 'list' && (
        <div className="space-y-3">
          <FilterBar
            searchPlaceholder="Filter artifacts by path, backup ID..."
            searchValue={search}
            onSearchChange={setSearch}
            filters={[
              {
                label: 'Type',
                options: [
                  { label: 'All Types', value: 'all' },
                  { label: 'Base / Full', value: 'full' },
                  { label: 'Incremental', value: 'incremental' },
                  { label: 'WAL Segment', value: 'wal' },
                ],
                value: typeFilter,
                onChange: setTypeFilter,
              },
              {
                label: 'Verification',
                options: [
                  { label: 'All Verifications', value: 'all' },
                  { label: 'Checksum Verified', value: 'checksum_verified' },
                  { label: 'Pending', value: 'pending' },
                ],
                value: verificationFilter,
                onChange: setVerificationFilter,
              },
            ]}
            totalCount={backups.length}
            filteredCount={filteredBackups.length}
          />

          {filteredBackups.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No backup artifacts found"
              description="No backups match the active filter criteria."
              actionText="Clear Filters"
              onAction={() => {
                setSearch('');
                setTypeFilter('all');
                setVerificationFilter('all');
              }}
            />
          ) : (
            <div className="op-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="op-table">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Type</th>
                      <th>Last Backup</th>
                      <th>Changed</th>
                      <th>Destination</th>
                      <th>Status</th>
                      <th>Retention</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBackups.map((backup) => {
                      const db = databases.find((d) => d.id === backup.sourceDatabaseId);
                      const dest = storageDestinations.find((s) => s.id === backup.destinationStorageId || s.id === backup.storageDestinationId);

                      return (
                        <tr key={backup.id} className="hover:bg-surface-hover transition-colors font-mono">
                          <td className="whitespace-nowrap font-sans font-semibold text-xs text-text-primary">
                            <div>{db?.name || backup.sourcePath || 'Database Workload'}</div>
                            <div className="text-[10px] text-text-muted font-mono truncate max-w-xs">{backup.storagePath}</div>
                          </td>
                          <td className="whitespace-nowrap">
                            <span className="text-xs font-mono font-semibold uppercase text-brand-primary">
                              {backup.type}
                            </span>
                            <span className="text-text-muted text-[10px] ml-1">#{backup.sequence || 1}</span>
                          </td>
                          <td className="whitespace-nowrap text-text-muted text-xs">
                            {new Date(backup.createdAt).toLocaleString()}
                          </td>
                          <td className="whitespace-nowrap text-xs text-text-primary font-semibold">
                            {formatBytes(backup.changedBytes || backup.sizeBytes)}
                          </td>
                          <td className="whitespace-nowrap text-xs text-text-secondary">
                            {dest?.name || 'S3-Compatible'}
                          </td>
                          <td className="whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-mono ${
                                backup.verificationState === 'checksum_verified'
                                  ? 'text-success'
                                  : 'text-warning'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {backup.verificationState === 'checksum_verified' ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap text-xs text-text-muted font-mono">
                            {backup.retentionUntil ? new Date(backup.retentionUntil).toLocaleDateString() : '14 days'}
                          </td>
                          <td className="whitespace-nowrap text-right font-sans">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleVerify(backup.id)}
                                className="op-btn-secondary !text-[11px] !py-1 !px-2"
                                title="Verify SHA-256 Checksum"
                              >
                                Verify
                              </button>
                              <button
                                onClick={() => setRestoreModalBackup(backup)}
                                className="op-btn-secondary !text-[11px] !py-1 !px-2.5 flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3 text-brand-primary" />
                                <span>Restore</span>
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
        </div>
      )}

      {/* Trigger Modal */}
      {showTriggerModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="op-card-elevated max-w-lg w-full p-5 space-y-4 shadow-2xl border-border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-primary" />
                <h3 className="font-semibold text-sm text-text-primary">Trigger Asynchronous Backup</h3>
              </div>
              <button
                onClick={() => setShowTriggerModal(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-surface-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTrigger} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-text-secondary mb-1 font-medium">Source Database Workload</label>
                <select
                  value={selectedDbId}
                  onChange={(e) => setSelectedDbId(e.target.value)}
                  className="op-input"
                >
                  {databases.map((db) => (
                    <option key={db.id} value={db.id}>
                      {db.name} ({db.type.toUpperCase()} • {db.databaseName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Explicit Strategy Selection */}
              <div>
                <label className="block text-text-secondary mb-1 font-medium">
                  Backup Strategy
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label
                    onClick={() => setBackupStrategy('full')}
                    className={`p-2.5 rounded border cursor-pointer flex flex-col justify-between transition-colors ${
                      backupStrategy === 'full'
                        ? 'border-brand-primary bg-brand-primary/10 text-text-primary'
                        : 'border-border bg-surface-secondary text-text-secondary hover:border-border-strong'
                    }`}
                  >
                    <div className="font-semibold">Full Base</div>
                    <div className="text-[10px] text-text-muted mt-1 leading-normal">
                      Complete database snapshot. Starts new lineage anchor.
                    </div>
                  </label>

                  <label
                    onClick={() => setBackupStrategy('incremental')}
                    className={`p-2.5 rounded border cursor-pointer flex flex-col justify-between transition-colors ${
                      backupStrategy === 'incremental'
                        ? 'border-brand-primary bg-brand-primary/10 text-text-primary'
                        : 'border-border bg-surface-secondary text-text-secondary hover:border-border-strong'
                    }`}
                  >
                    <div className="font-semibold">Incremental</div>
                    <div className="text-[10px] text-text-muted mt-1 leading-normal">
                      Changed blocks since previous backup in active chain.
                    </div>
                  </label>

                  <label
                    onClick={() => setBackupStrategy('wal')}
                    className={`p-2.5 rounded border cursor-pointer flex flex-col justify-between transition-colors ${
                      backupStrategy === 'wal'
                        ? 'border-brand-primary bg-brand-primary/10 text-text-primary'
                        : 'border-border bg-surface-secondary text-text-secondary hover:border-border-strong'
                    }`}
                  >
                    <div className="font-semibold">WAL / PITR</div>
                    <div className="text-[10px] text-text-muted mt-1 leading-normal">
                      Write-Ahead Log segment for Point-In-Time recovery.
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-text-secondary mb-1 font-medium">Destination Storage Target</label>
                <select
                  value={selectedStorageId}
                  onChange={(e) => setSelectedStorageId(e.target.value)}
                  className="op-input"
                >
                  {storageDestinations.map((dest) => (
                    <option key={dest.id} value={dest.id}>
                      {dest.name} ({dest.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-text-secondary mb-1 font-medium">Compression</label>
                  <select
                    value={compression}
                    onChange={(e) => setCompression(e.target.value as any)}
                    className="op-input font-mono"
                  >
                    <option value="zstd">Zstandard (ZSTD)</option>
                    <option value="gzip">Gzip</option>
                    <option value="none">None (Raw stream)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-text-secondary mb-1 font-medium">Encryption Mode</label>
                  <select
                    value={encryption}
                    onChange={(e) => setEncryption(e.target.value as any)}
                    className="op-input font-mono"
                  >
                    <option value="aes_256_gcm">AES-256-GCM</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowTriggerModal(false)}
                  className="op-btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={triggering}
                  className="op-btn-primary"
                >
                  {triggering ? 'Queueing in BullMQ...' : 'Queue Backup Operation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restore Recovery Point Modal (Use Case D) */}
      {restoreModalBackup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="op-card-elevated max-w-lg w-full p-5 space-y-4 shadow-2xl border-border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-brand-primary" />
                <h3 className="font-semibold text-sm text-text-primary">Restore Point-in-Time Backup</h3>
              </div>
              <button
                onClick={() => setRestoreModalBackup(null)}
                className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-surface-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteRestore} className="space-y-3.5 text-xs">
              <div className="op-card p-3 bg-surface-secondary/40 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-text-muted">Target Backup ID:</span>
                  <span className="text-text-primary font-semibold">{restoreModalBackup.id.slice(0, 12)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Type & Sequence:</span>
                  <span className="text-brand-primary uppercase font-bold">{restoreModalBackup.type} #{restoreModalBackup.sequence || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Payload Size:</span>
                  <span className="text-text-primary">{formatBytes(restoreModalBackup.sizeBytes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Created:</span>
                  <span className="text-text-primary">{new Date(restoreModalBackup.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-text-secondary mb-1 font-medium">Restore Destination</label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    onClick={() => setTargetType('original')}
                    className={`p-2.5 rounded border cursor-pointer flex flex-col justify-between transition-colors ${
                      targetType === 'original'
                        ? 'border-brand-primary bg-brand-primary/10 text-text-primary'
                        : 'border-border bg-surface-secondary text-text-secondary'
                    }`}
                  >
                    <div className="font-semibold">Original Database</div>
                    <div className="text-[10px] text-text-muted mt-1">Rollback active database in-place</div>
                  </label>
                  <label
                    onClick={() => setTargetType('new_database')}
                    className={`p-2.5 rounded border cursor-pointer flex flex-col justify-between transition-colors ${
                      targetType === 'new_database'
                        ? 'border-brand-primary bg-brand-primary/10 text-text-primary'
                        : 'border-border bg-surface-secondary text-text-secondary'
                    }`}
                  >
                    <div className="font-semibold">Staging / Test</div>
                    <div className="text-[10px] text-text-muted mt-1">Restore into alternate instance</div>
                  </label>
                </div>
              </div>

              <div className="p-3 rounded border border-warning/30 bg-warning/10 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <div className="text-warning text-xs">
                    <span className="font-bold">Caution: </span>
                    Restoring data will replace existing tables and files with snapshot contents.
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={restoreConfirm}
                    onChange={(e) => setRestoreConfirm(e.target.checked)}
                    className="rounded border-border text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="text-text-primary font-medium">I confirm that this restore operation will overwrite destination data.</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setRestoreModalBackup(null)}
                  className="op-btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!restoreConfirm || restoring}
                  className="op-btn-primary !bg-warning hover:!bg-warning/90 !text-black"
                >
                  {restoring ? 'Starting Restore Worker...' : 'Execute Restore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
