import React, { useState, useEffect } from 'react';
import {
  Database as DatabaseIcon,
  ArrowLeft,
  Shield,
  Layers,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { Database, Backup, BackupChain } from '../types';
import * as api from '../services/api';
import { StatusIndicator } from '../components/common/StatusIndicator';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [database.id]);

  const loadData = async () => {
    setLoading(true);
    const [rec, bks, chs] = await Promise.all([
      api.fetchDatabaseRecovery(database.id),
      api.fetchBackups(),
      api.fetchBackupChains(database.id),
    ]);
    setRecoveryData(rec);
    setBackups(bks.filter((b) => b.sourceDatabaseId === database.id));
    setChains(chs);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="op-btn-secondary !p-1.5 shrink-0"
            title="Back to Databases"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-semibold text-text-primary truncate">{database.name}</h2>
              <StatusIndicator status={database.status} variant="inline" />
            </div>
            <p className="text-xs font-mono text-text-muted truncate">
              {database.type.toUpperCase()} • {database.host}:{database.port} • {database.databaseName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadData}
            className="op-btn-secondary !p-1.5"
            title="Refresh database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : 'text-text-muted'}`} />
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

      {/* Recovery Status Dashboard Banner */}
      <div className="op-card p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-text-muted" />
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Point-In-Time Recovery (PITR) & Archiving Status
            </h3>
          </div>
          <span
            className={`text-xs font-mono font-medium px-2 py-0.5 rounded border ${
              database.walEnabled
                ? 'bg-success-muted text-success border-success/30'
                : 'bg-surface-secondary text-text-muted border-border'
            }`}
          >
            {database.walEnabled ? 'BASE + WAL PITR ACTIVE' : 'LOGICAL DUMPS ONLY'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-md bg-surface-secondary border border-border">
            <span className="text-[10px] text-text-muted uppercase font-medium">BASE BACKUP</span>
            <div className="font-mono text-text-primary font-medium mt-0.5 truncate">
              {recoveryData?.baseBackup ? 'Active (Verified)' : 'None created'}
            </div>
          </div>
          <div className="p-2.5 rounded-md bg-surface-secondary border border-border">
            <span className="text-[10px] text-text-muted uppercase font-medium">WAL ARCHIVING</span>
            <div className={`font-mono font-medium mt-0.5 ${recoveryData?.walStatus?.walEnabled ? 'text-success' : 'text-text-muted'}`}>
              {recoveryData?.walStatus?.walEnabled ? 'HEALTHY' : 'DISABLED'}
            </div>
          </div>
          <div className="p-2.5 rounded-md bg-surface-secondary border border-border">
            <span className="text-[10px] text-text-muted uppercase font-medium">RECOVERY READINESS</span>
            <div className="font-mono text-text-primary font-medium mt-0.5">
              {recoveryData?.recoveryReadiness?.toUpperCase() || 'UNKNOWN'}
            </div>
          </div>
          <div className="p-2.5 rounded-md bg-surface-secondary border border-border">
            <span className="text-[10px] text-text-muted uppercase font-medium">CHAIN STATUS</span>
            <div className={`font-mono font-medium mt-0.5 ${recoveryData?.recoveryChain?.status === 'healthy' ? 'text-success' : 'text-text-muted'}`}>
              {recoveryData?.recoveryChain?.status === 'healthy' ? 'VALID' : 'NO CHAIN'}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Backup Chain */}
      <div className="op-card p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
            Active Backup Chain Visualization
          </h4>
          <span className="text-[11px] font-mono text-text-muted">Chain #1</span>
        </div>

        <div className="p-4 bg-surface-secondary rounded-lg border border-border overflow-x-auto">
          <div className="flex items-center gap-3 min-w-max">
            {/* Base block */}
            <div className="flex flex-col items-center p-3 rounded-md bg-surface border border-accent/30 text-center min-w-[120px]">
              <span className="text-[10px] font-mono font-bold text-accent px-1.5 py-0.5 bg-accent/15 rounded mb-1">
                BASE
              </span>
              <span className="text-xs font-semibold text-text-primary">Full Snapshot</span>
              <span className="text-[10px] text-text-muted font-mono mt-0.5">02:00 UTC</span>
              <span className="text-[10px] text-success font-mono mt-1">✓ Verified</span>
            </div>

            <div className="w-6 h-0.5 bg-border"></div>

            {/* WAL blocks */}
            <div className="flex flex-col items-center p-3 rounded-md bg-surface border border-border text-center min-w-[100px]">
              <span className="text-[10px] font-mono text-text-secondary px-1.5 py-0.5 bg-surface-secondary rounded mb-1">
                WAL-01
              </span>
              <span className="text-xs text-text-secondary">Journal Delta</span>
              <span className="text-[10px] text-text-muted font-mono mt-0.5">04:00 UTC</span>
            </div>

            <div className="w-6 h-0.5 bg-border"></div>

            <div className="flex flex-col items-center p-3 rounded-md bg-surface border border-border text-center min-w-[100px]">
              <span className="text-[10px] font-mono text-text-secondary px-1.5 py-0.5 bg-surface-secondary rounded mb-1">
                WAL-02
              </span>
              <span className="text-xs text-text-secondary">Journal Delta</span>
              <span className="text-[10px] text-text-muted font-mono mt-0.5">06:00 UTC</span>
            </div>

            <div className="w-6 h-0.5 bg-border"></div>

            {/* Current point */}
            <div className="flex flex-col items-center p-3 rounded-md bg-surface border border-border text-center min-w-[120px]">
              <span className="text-[10px] font-mono font-bold text-success px-1.5 py-0.5 bg-success-muted rounded mb-1">
                CURRENT
              </span>
              <span className="text-xs font-semibold text-text-primary">Latest Point</span>
              <span className="text-[10px] text-text-muted font-mono mt-0.5">Continuous</span>
            </div>
          </div>
        </div>
      </div>

      {/* Backup Artifact History */}
      <div className="op-card p-4 sm:p-5 space-y-3">
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide border-b border-border pb-3">
          Backup History & Stored Artifacts
        </h4>

        {backups.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-border rounded-md text-xs text-text-muted">
            No backups stored yet for this database. Click "Backup Now" to trigger your first backup.
          </div>
        ) : (
          <div className="space-y-2">
            {backups.map((b) => (
              <div
                key={b.id}
                className="p-3 bg-surface-secondary rounded-md border border-border flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <span className="font-semibold text-text-primary uppercase">{b.type} BACKUP</span>
                  <span className="text-text-muted ml-2 truncate block sm:inline">{b.storagePath}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-text-muted">{(b.sizeBytes / 1024).toFixed(1)} KB</span>
                  <span className="text-success">✓ {b.verificationState}</span>
                  <button
                    onClick={() => onRestoreBackup(b)}
                    className="op-btn-secondary !text-[11px] !py-1 !px-2.5 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3 text-accent" />
                    <span>Restore</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
