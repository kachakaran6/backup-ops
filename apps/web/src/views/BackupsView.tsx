import React, { useState } from 'react';
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
} from 'lucide-react';
import { Backup, BackupChain, Database as DatabaseType, StorageDestination, Policy } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { BackupChainVisualizer } from '../components/backups/BackupChainVisualizer';
import { StatusIndicator } from '../components/common/StatusIndicator';
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
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [selectedDbId, setSelectedDbId] = useState(databases[0]?.id || '');
  const [selectedStorageId, setSelectedStorageId] = useState(storageDestinations[0]?.id || '');
  const [backupStrategy, setBackupStrategy] = useState<'full' | 'incremental' | 'wal'>('full');
  const [compression, setCompression] = useState<'none' | 'gzip' | 'zstd'>('zstd');
  const [encryption, setEncryption] = useState<'none' | 'aes_256_gcm'>('aes_256_gcm');
  const [triggering, setTriggering] = useState(false);

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

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Group backups by chain
  const chainMap = new Map<string, Backup[]>();
  backups.forEach((b) => {
    const key = b.chainId || 'standalone';
    if (!chainMap.has(key)) chainMap.set(key, []);
    chainMap.get(key)!.push(b);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 op-card p-4 sm:p-5">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-text-primary flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-text-muted" />
            Backup Policies & Incremental Recovery Chains
          </h2>
          <p className="text-xs text-text-muted mt-0.5 max-w-2xl">
            Deterministic recovery lineages with Base snapshot anchors, incremental delta blocks, and Point-In-Time Recovery (PITR) WAL segments.
          </p>
        </div>

        <button
          onClick={() => {
            if (databases.length > 0 && !selectedDbId) setSelectedDbId(databases[0].id);
            if (storageDestinations.length > 0 && !selectedStorageId) setSelectedStorageId(storageDestinations[0].id);
            setShowTriggerModal(true);
          }}
          className="op-btn-primary self-start sm:self-auto"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Trigger Backup Job</span>
        </button>
      </div>

      {/* Navigation Switcher: Chains vs Artifact List */}
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('chains')}
            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer border ${
              activeTab === 'chains'
                ? 'bg-surface-elevated text-text-primary border-border-strong'
                : 'text-text-muted hover:text-text-secondary border-transparent'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>Recovery Chains ({chainMap.size})</span>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer border ${
              activeTab === 'list'
                ? 'bg-surface-elevated text-text-primary border-border-strong'
                : 'text-text-muted hover:text-text-secondary border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Backup Artifacts ({backups.length})</span>
          </button>
        </div>

        <button
          onClick={onRefresh}
          className="op-btn-secondary !p-1.5"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5 text-text-muted" />
        </button>
      </div>

      {/* Tab 1: Recovery Chains Visualization */}
      {activeTab === 'chains' && (
        <div className="space-y-4">
          {chainMap.size === 0 ? (
            <EmptyState
              icon={GitCommit}
              title="No recovery chains established yet"
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
                  databaseName={db?.name || 'Database'}
                  backups={chainBackups}
                  onRestoreFromBackup={onRestore}
                />
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Artifacts Table */}
      {activeTab === 'list' && (
        <div className="op-card p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Retained Backup Artifacts ({backups.length})
            </h4>
            <span className="text-[11px] font-mono text-text-muted">AES-256-GCM Encrypted at rest</span>
          </div>

          {backups.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No backups executed yet"
              description="Trigger an immediate backup or configure a recurring backup policy to protect database workloads."
              actionText="Trigger Backup Job"
              onAction={() => setShowTriggerModal(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="op-table">
                <thead>
                  <tr>
                    <th>Type &amp; Seq</th>
                    <th>Storage Path</th>
                    <th>Parent Link</th>
                    <th>Size / Delta</th>
                    <th>Verification</th>
                    <th>Created</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {backups.map((backup) => (
                    <tr key={backup.id}>
                      <td className="whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              backup.type === 'full' || backup.type === 'base'
                                ? 'bg-accent/15 text-accent border border-accent/25'
                                : 'bg-surface-elevated text-text-secondary border border-border'
                            }`}
                          >
                            {backup.type}
                          </span>
                          <span className="text-text-muted text-[11px]">#{backup.sequence || 1}</span>
                        </div>
                      </td>
                      <td className="max-w-xs truncate text-text-primary font-medium" title={backup.storagePath}>
                        {backup.storagePath.split('/').pop() || backup.storagePath}
                      </td>
                      <td className="whitespace-nowrap text-text-muted">
                        {backup.parentBackupId ? (
                          <span className="text-accent flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" />
                            {backup.parentBackupId.slice(0, 8)}
                          </span>
                        ) : (
                          <span className="text-text-muted italic">Base Root</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap text-text-secondary">
                        {formatBytes(backup.sizeBytes)}
                      </td>
                      <td className="whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                            backup.verificationState === 'checksum_verified'
                              ? 'bg-success-muted text-success border-success/30'
                              : 'bg-warning-muted text-warning border-warning/30'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {backup.verificationState}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-text-muted text-[11px]">
                        {new Date(backup.createdAt).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleVerify(backup.id)}
                            className="op-btn-secondary !text-[11px] !py-1 !px-2"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => onRestore(backup)}
                            className="op-btn-secondary !text-[11px] !py-1 !px-2.5 flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3 text-accent" />
                            <span>Restore</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Trigger Modal with Explicit Strategies */}
      {showTriggerModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="op-card-elevated max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-text-muted" />
                <h3 className="font-semibold text-xs text-text-primary">Trigger Asynchronous Backup</h3>
              </div>
              <button
                onClick={() => setShowTriggerModal(false)}
                className="text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTrigger} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-text-secondary mb-1">Source Database Workload</label>
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
                    className={`p-2.5 rounded-md border cursor-pointer flex flex-col justify-between transition-colors ${
                      backupStrategy === 'full'
                        ? 'border-accent bg-accent/10 text-text-primary'
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
                    className={`p-2.5 rounded-md border cursor-pointer flex flex-col justify-between transition-colors ${
                      backupStrategy === 'incremental'
                        ? 'border-accent bg-accent/10 text-text-primary'
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
                    className={`p-2.5 rounded-md border cursor-pointer flex flex-col justify-between transition-colors ${
                      backupStrategy === 'wal'
                        ? 'border-accent bg-accent/10 text-text-primary'
                        : 'border-border bg-surface-secondary text-text-secondary hover:border-border-strong'
                    }`}
                  >
                    <div className="font-semibold">WAL / PITR</div>
                    <div className="text-[10px] text-text-muted mt-1 leading-normal">
                      Write-Ahead Log stream segment for Point-In-Time recovery.
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-text-secondary mb-1">Destination Storage Target</label>
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
                  <label className="block text-text-secondary mb-1">Compression</label>
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
                  <label className="block text-text-secondary mb-1">Encryption Mode</label>
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
    </div>
  );
};
