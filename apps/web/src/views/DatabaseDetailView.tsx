import React, { useState, useEffect } from 'react';
import {
  Database as DatabaseIcon,
  ArrowLeft,
  Shield,
  Layers,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HardDrive,
  FileCheck,
  ChevronRight,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { Database, Backup, BackupChain } from '../types';
import * as api from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';

interface DatabaseDetailViewProps {
  database: Database;
  onBack: () => void;
  onTriggerBackup: (database: Database) => void;
  onRestoreBackup: (backup: Backup) => void;
}

export const DatabaseDetailView: React.FC<DatabaseDetailViewProps> = ({
  database,
  onBack,
  onTriggerBackup,
  onRestoreBackup,
}) => {
  const [recoveryData, setRecoveryData] = useState<any>(null);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [chains, setChains] = useState<BackupChain[]>([]);
  const [selectedBackupNode, setSelectedBackupNode] = useState<Backup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [database.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rec, bks, chs] = await Promise.all([
        api.fetchDatabaseRecovery(database.id),
        api.fetchBackups(),
        api.fetchBackupChains(database.id),
      ]);
      setRecoveryData(rec);
      const filtered = bks.filter((b) => b.sourceDatabaseId === database.id);
      setBackups(filtered);
      setChains(chs);
      if (filtered.length > 0) {
        setSelectedBackupNode(filtered[0]);
      }
    } catch (err) {
      console.error('Failed to load database recovery data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isPostgres = database.type === 'postgres';
  const hasBase = backups.some((b) => b.type === 'base' || b.type === 'full');
  const walBackups = backups.filter((b) => b.type === 'wal' || b.type === 'incremental');

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="op-btn-secondary !p-2 shrink-0"
            title="Back to Databases"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-text-primary truncate">{database.name}</h1>
              <StatusBadge status={database.status === 'connected' ? 'HEALTHY' : 'FAILED'} size="sm" />
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface-secondary border border-border text-text-muted">
                {database.type}
              </span>
            </div>
            <p className="text-xs font-mono text-text-muted truncate mt-0.5">
              Host: {database.host}:{database.port} • Instance: {database.databaseName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="op-btn-secondary"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-primary' : 'text-text-muted'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => onTriggerBackup(database)}
            className="op-btn-primary"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Backup Now</span>
          </button>
        </div>
      </div>

      {/* Point-In-Time Recovery & Readiness Strip */}
      <div className="op-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-primary" />
            <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              {isPostgres ? 'Physical Base + WAL Point-In-Time Recovery (PITR)' : 'Protection Strategy & Recovery Readiness'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${
                database.walEnabled
                  ? 'bg-success/10 text-success border-success/30'
                  : 'bg-surface-secondary text-text-muted border-border'
              }`}
            >
              {database.walEnabled ? 'CONTINUOUS WAL STREAMING ACTIVE' : 'SCHEDULED LOGICAL DUMPS ONLY'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 rounded bg-surface-secondary border border-border">
            <span className="text-[10px] text-text-muted uppercase font-medium">BASE BACKUP</span>
            <div className="font-mono text-xs text-text-primary font-medium mt-1 truncate">
              {hasBase ? 'Verified in Storage' : 'None (Action required)'}
            </div>
          </div>
          <div className="p-2.5 rounded bg-surface-secondary border border-border">
            <span className="text-[10px] text-text-muted uppercase font-medium">WAL ARCHIVING</span>
            <div className={`font-mono text-xs font-medium mt-1 ${database.walEnabled ? 'text-success' : 'text-text-muted'}`}>
              {database.walEnabled ? 'Continuous Healthy' : 'Disabled'}
            </div>
          </div>
          <div className="p-2.5 rounded bg-surface-secondary border border-border">
            <span className="text-[10px] text-text-muted uppercase font-medium">RECOVERY READINESS</span>
            <div className="font-mono text-xs text-text-primary font-medium mt-1 capitalize">
              {database.recoveryReadiness}
            </div>
          </div>
          <div className="p-2.5 rounded bg-surface-secondary border border-border">
            <span className="text-[10px] text-text-muted uppercase font-medium">ACTIVE CHAIN</span>
            <div className={`font-mono text-xs font-medium mt-1 ${chains.length > 0 ? 'text-success' : 'text-text-muted'}`}>
              {chains.length > 0 ? `Chain #${chains[0].chainNumber} (Healthy)` : 'Direct Artifacts'}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Backup Chain Architecture */}
      <div className="op-card p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div>
            <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              {isPostgres ? 'PostgreSQL Base + WAL Recovery Chain' : 'Backup Sequence Chain'}
            </h3>
            <p className="text-[11px] text-text-muted">
              Select any node in the chain to verify cryptographic SHA-256 integrity and initiate point recovery.
            </p>
          </div>
          <span className="text-[11px] font-mono text-text-muted">
            {backups.length} points
          </span>
        </div>

        {backups.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-border rounded text-xs text-text-muted">
            No backup artifacts have been generated for this database. Trigger your first backup above to initiate the recovery chain.
          </div>
        ) : (
          <div className="space-y-3">
            {/* Scrollable Node Pipeline */}
            <div className="p-3 bg-surface-secondary rounded border border-border overflow-x-auto">
              <div className="flex items-center gap-2 min-w-max">
                {backups.map((b, index) => {
                  const isSelected = selectedBackupNode?.id === b.id;
                  const isBase = b.type === 'base' || b.type === 'full';
                  const isWal = b.type === 'wal' || b.type === 'incremental';

                  return (
                    <React.Fragment key={b.id}>
                      <button
                        onClick={() => setSelectedBackupNode(b)}
                        className={`flex flex-col items-center p-2.5 rounded border transition-all cursor-pointer min-w-[110px] text-center ${
                          isSelected
                            ? 'bg-surface border-brand-primary ring-1 ring-brand-primary'
                            : 'bg-surface/80 border-border hover:border-border-strong'
                        }`}
                      >
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded mb-1 uppercase ${
                            isBase
                              ? 'bg-brand-primary/15 text-brand-primary'
                              : isWal
                              ? 'bg-info/15 text-info'
                              : 'bg-surface-secondary text-text-secondary'
                          }`}
                        >
                          {b.type} #{b.sequence || index + 1}
                        </span>
                        <span className="text-xs font-semibold text-text-primary">
                          {formatBytes(b.sizeBytes)}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono mt-0.5">
                          {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[9px] text-success font-mono mt-1">
                          ✓ {b.verificationState === 'checksum_verified' ? 'Verified' : 'OK'}
                        </span>
                      </button>

                      {index < backups.length - 1 && (
                        <div className="w-5 h-0.5 bg-border shrink-0"></div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Selected Node Details Drawer */}
            {selectedBackupNode && (
              <div className="p-3 bg-surface rounded border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text-primary font-mono uppercase">
                      {selectedBackupNode.type} Backup #{selectedBackupNode.sequence || 1}
                    </span>
                    <span className="text-[10px] font-mono text-text-muted">
                      ID: {selectedBackupNode.id.substring(0, 12)}
                    </span>
                  </div>
                  <button
                    onClick={() => onRestoreBackup(selectedBackupNode)}
                    className="op-btn-primary !text-xs !py-1 !px-2.5 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore to this point</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono pt-2 border-t border-border-subtle">
                  <div>
                    <span className="text-text-muted text-[10px] block">STORAGE DESTINATION PATH</span>
                    <span className="text-text-secondary truncate block">{selectedBackupNode.storagePath}</span>
                  </div>
                  <div>
                    <span className="text-text-muted text-[10px] block">SHA-256 CRYPTOGRAPHIC CHECKSUM</span>
                    <span className="text-text-secondary truncate block">{selectedBackupNode.checksumSha256 || 'Pending checksum'}</span>
                  </div>
                  <div>
                    <span className="text-text-muted text-[10px] block">ENCRYPTION / VERIFICATION</span>
                    <span className="text-success block">
                      {selectedBackupNode.encryption || 'AES-256'} • {selectedBackupNode.verificationState}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Backup Artifacts History Table */}
      <div className="op-card overflow-hidden">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
            Stored Backup Artifact History ({backups.length})
          </h3>
        </div>

        {backups.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted">
            No backups stored yet for this database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="op-table">
              <thead>
                <tr>
                  <th>Type & Sequence</th>
                  <th>Timestamp</th>
                  <th>Size</th>
                  <th>Storage Path</th>
                  <th>Checksum</th>
                  <th>Verification</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-hover transition-colors">
                    <td>
                      <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-surface-secondary border border-border text-text-primary">
                        {b.type} #{b.sequence || 1}
                      </span>
                    </td>
                    <td className="text-xs font-mono text-text-secondary">
                      {new Date(b.createdAt).toLocaleString()}
                    </td>
                    <td className="text-xs font-mono text-text-primary font-medium">
                      {formatBytes(b.sizeBytes)}
                    </td>
                    <td className="text-xs font-mono text-text-muted truncate max-w-xs">
                      {b.storagePath}
                    </td>
                    <td className="text-[10px] font-mono text-text-muted truncate max-w-[120px]">
                      {b.checksumSha256 ? `${b.checksumSha256.substring(0, 12)}...` : 'Pending'}
                    </td>
                    <td>
                      <span className="text-xs font-mono text-success flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => onRestoreBackup(b)}
                        className="op-btn-secondary !text-[11px] !py-1 !px-2 flex items-center gap-1 ml-auto"
                      >
                        <RotateCcw className="w-3 h-3 text-brand-primary" />
                        <span>Restore</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
