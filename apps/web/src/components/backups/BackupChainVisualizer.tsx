import React from 'react';
import { Backup } from '../../types';
import {
  GitCommit,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  HardDrive,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

interface BackupChainVisualizerProps {
  chainNumber: number;
  status: 'healthy' | 'broken' | 'pruned' | 'warning' | string;
  databaseName?: string;
  backups: Backup[];
  onSelectBackup?: (backup: Backup) => void;
  onRestoreFromBackup?: (backup: Backup) => void;
}

export const BackupChainVisualizer: React.FC<BackupChainVisualizerProps> = ({
  chainNumber,
  status,
  databaseName,
  backups,
  onSelectBackup,
  onRestoreFromBackup,
}) => {
  // Sort sequence ascending (1 = Base, 2 = Incr 1, 3 = Incr 2...)
  const sorted = [...backups].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  const baseBackup = sorted.find((b) => b.type === 'base' || b.type === 'full') || sorted[0];
  const incrementalBackups = sorted.filter((b) => b !== baseBackup);

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const isChainHealthy = status.toLowerCase() === 'healthy';

  return (
    <div className="bg-surface border border-border rounded-lg p-4 sm:p-5 my-3">
      {/* Chain Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-md bg-surface-secondary border border-border text-brand-primary">
            <GitCommit className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-primary text-sm">
                Recovery Lineage #{chainNumber}
              </span>
              {databaseName && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-surface-secondary text-text-secondary border border-border font-mono">
                  {databaseName}
                </span>
              )}
            </div>
            <div className="text-xs text-text-muted mt-0.5">
              {sorted.length} recovery point{sorted.length !== 1 ? 's' : ''} in sequential chain
            </div>
          </div>
        </div>

        {/* Chain Status Badge */}
        <div className="flex items-center gap-2">
          {isChainHealthy ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-success/10 text-success border border-success/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              HEALTHY RECOVERY LINEAGE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-error/10 text-error border border-error/30">
              <XCircle className="w-3.5 h-3.5" />
              BROKEN RECOVERY LINEAGE
            </span>
          )}
        </div>
      </div>

      {/* Visual Tree */}
      <div className="mt-4 space-y-3">
        {/* Base Backup Box */}
        {baseBackup && (
          <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 before:top-6 before:bottom-0 before:w-0.5 before:bg-border">
            <div className="absolute left-1.5 top-2 w-3.5 h-3.5 rounded-full bg-brand-primary ring-4 ring-surface" />
            <div className="p-3 sm:p-4 rounded-lg bg-surface-secondary border border-border hover:border-border-strong transition-colors">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-primary/15 text-brand-primary border border-brand-primary/30 tracking-wide uppercase font-mono">
                      {baseBackup.type.toUpperCase()} ANCHOR
                    </span>
                    <span className="text-xs font-mono text-text-secondary">
                      seq #{baseBackup.sequence || 1}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-text-primary mt-1 flex items-center gap-2">
                    <span>{formatSize(baseBackup.sizeBytes)}</span>
                    <span className="text-xs font-normal text-text-muted font-mono">
                      ({new Date(baseBackup.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-success" />
                    <span className="font-mono text-[11px]">{baseBackup.verificationState}</span>
                  </span>
                  {onRestoreFromBackup && (
                    <button
                      onClick={() => onRestoreFromBackup(baseBackup)}
                      className="op-btn-secondary !py-1 !px-2.5 text-xs flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3 text-brand-primary" />
                      <span>Restore Base</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-2 text-xs text-text-muted flex flex-wrap gap-x-4 gap-y-1 font-mono">
                <span>Path: <code className="text-text-secondary">{baseBackup.storagePath.split('/').pop()}</code></span>
                <span>SHA-256: <code className="text-text-secondary">{baseBackup.checksumSha256 ? baseBackup.checksumSha256.slice(0, 10) + '...' : 'pending'}</code></span>
              </div>
            </div>
          </div>
        )}

        {/* Incremental Nodes */}
        {incrementalBackups.map((inc, index) => {
          const isLast = index === incrementalBackups.length - 1;
          const isFailed = inc.status === 'failed' || inc.verificationState === 'failed';

          return (
            <div
              key={inc.id}
              className={`relative pl-6 sm:pl-8 ${
                !isLast ? 'before:absolute before:left-3 before:top-6 before:bottom-0 before:w-0.5 before:bg-border' : ''
              }`}
            >
              <div
                className={`absolute left-1.5 top-2 w-3.5 h-3.5 rounded-full ring-4 ring-surface ${
                  isFailed ? 'bg-error' : 'bg-success'
                }`}
              />
              <div
                className={`p-3 sm:p-4 rounded-lg bg-surface-secondary/70 border transition-colors ${
                  isFailed
                    ? 'border-error/40 bg-error/10'
                    : 'border-border hover:border-border-strong'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase font-mono border ${
                          isFailed
                            ? 'bg-error/10 text-error border-error/30'
                            : 'bg-surface-elevated text-text-secondary border-border'
                        }`}
                      >
                        {inc.type.toUpperCase()} #{inc.sequence}
                      </span>
                      {inc.parentBackupId && (
                        <span className="text-xs text-text-muted">
                          Parent: <code className="font-mono text-text-secondary">{inc.parentBackupId.slice(0, 8)}</code>
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-text-primary mt-1 flex items-center gap-2">
                      <span>+{formatSize(inc.sizeBytes)} delta</span>
                      <span className="text-xs font-normal text-text-muted font-mono">
                        ({new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs flex items-center gap-1 font-mono text-[11px] ${
                        isFailed ? 'text-error' : 'text-success'
                      }`}
                    >
                      {isFailed ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      )}
                      <span>{inc.verificationState}</span>
                    </span>
                    {onRestoreFromBackup && (
                      <button
                        onClick={() => onRestoreFromBackup(inc)}
                        className="op-btn-secondary !py-1 !px-2.5 text-xs flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3 text-brand-primary" />
                        <span>Restore Point</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-2 text-xs text-text-muted flex flex-wrap gap-x-4 gap-y-1 font-mono">
                  <span>Delta Storage: <code className="text-text-secondary">{inc.storagePath.split('/').pop()}</code></span>
                  <span>Point: <span className="text-text-secondary">{new Date(inc.recoveryPointTime || inc.createdAt).toLocaleString()}</span></span>
                </div>
              </div>
            </div>
          );
        })}

        {incrementalBackups.length === 0 && (
          <div className="text-xs text-text-muted pl-8 italic">
            No incremental or WAL backups have branched from this base snapshot yet. Next scheduled run will produce Incremental #2.
          </div>
        )}
      </div>
    </div>
  );
};
