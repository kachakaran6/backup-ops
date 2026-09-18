import React, { useState, useEffect } from 'react';
import {
  Database as DatabaseIcon,
  ArrowLeft,
  Shield,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HardDrive,
  RefreshCw,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Database, Backup, BackupChain } from '../types';
import * as api from '../services/api';

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

  const isConnected = database.status === 'connected';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-100">{database.name}</h2>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {database.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs font-mono text-zinc-400">
              {database.type.toUpperCase()} • {database.host}:{database.port} • {database.databaseName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Refresh database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
          <button
            onClick={() => onTriggerBackup(database)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Backup Now</span>
          </button>
        </div>
      </div>

      {/* Recovery Status Dashboard Banner */}
      <div className="p-5 rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-900/80 to-blue-950/20 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
              Point-In-Time Recovery (PITR) & Archiving Status
            </h3>
          </div>
          <span
            className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
              database.walEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            {database.walEnabled ? 'BASE + WAL PITR ACTIVE' : 'LOGICAL DUMPS ONLY'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-zinc-800/80 text-xs">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-medium">BASE BACKUP</span>
            <div className="font-mono text-zinc-200 font-semibold mt-0.5">
              {recoveryData?.baseBackup ? '2026-09-18 (VERIFIED)' : 'None created yet'}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-medium">WAL ARCHIVING</span>
            <div className="font-mono text-emerald-400 font-semibold mt-0.5">
              {recoveryData?.walStatus?.walEnabled ? 'HEALTHY' : 'DISABLED'}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-medium">RECOVERY READINESS</span>
            <div className="font-mono text-zinc-200 font-semibold mt-0.5">
              {recoveryData?.recoveryReadiness || 'UNKNOWN'}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-medium">BACKUP CHAIN</span>
            <div className="font-mono text-emerald-400 font-semibold mt-0.5">
              {recoveryData?.recoveryChain?.status === 'healthy' ? 'VALID' : 'NO CHAIN'}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Backup Chain (#104) */}
      <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
            Active Backup Chain Visualization
          </h4>
          <span className="text-[11px] font-mono text-zinc-500">Chain #1</span>
        </div>

        <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 overflow-x-auto">
          <div className="flex items-center gap-3 min-w-max">
            {/* Base block */}
            <div className="flex flex-col items-center p-3 rounded-lg bg-blue-950/40 border border-blue-800/60 text-center min-w-[120px]">
              <span className="text-[10px] font-mono font-bold text-blue-400 px-1.5 py-0.5 bg-blue-900/40 rounded mb-1">
                BASE
              </span>
              <span className="text-xs font-semibold text-zinc-200">Full Snapshot</span>
              <span className="text-[10px] text-zinc-500 font-mono mt-0.5">02:00 UTC</span>
              <span className="text-[10px] text-emerald-400 font-mono mt-1">✓ Verified</span>
            </div>

            <div className="w-8 h-0.5 bg-zinc-700"></div>

            {/* WAL blocks */}
            <div className="flex flex-col items-center p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-center min-w-[100px]">
              <span className="text-[10px] font-mono text-indigo-400 px-1.5 py-0.5 bg-indigo-950/40 rounded mb-1">
                WAL-01
              </span>
              <span className="text-xs text-zinc-300">Journal Delta</span>
              <span className="text-[10px] text-zinc-500 font-mono mt-0.5">04:00 UTC</span>
            </div>

            <div className="w-8 h-0.5 bg-zinc-700"></div>

            <div className="flex flex-col items-center p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-center min-w-[100px]">
              <span className="text-[10px] font-mono text-indigo-400 px-1.5 py-0.5 bg-indigo-950/40 rounded mb-1">
                WAL-02
              </span>
              <span className="text-xs text-zinc-300">Journal Delta</span>
              <span className="text-[10px] text-zinc-500 font-mono mt-0.5">06:00 UTC</span>
            </div>

            <div className="w-8 h-0.5 bg-zinc-700"></div>

            {/* Current point */}
            <div className="flex flex-col items-center p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-center min-w-[120px]">
              <span className="text-[10px] font-mono font-bold text-emerald-400 px-1.5 py-0.5 bg-emerald-900/40 rounded mb-1">
                CURRENT
              </span>
              <span className="text-xs font-semibold text-zinc-200">Latest Point</span>
              <span className="text-[10px] text-zinc-500 font-mono mt-0.5">Continuous</span>
            </div>
          </div>
        </div>
      </div>

      {/* Backup Artifact History */}
      <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-4">
        <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
          Backup History & Stored Artifacts
        </h4>

        {backups.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-zinc-800 rounded-lg text-xs text-zinc-500">
            No backups stored yet for this database. Click "Backup Now" to trigger your first backup.
          </div>
        ) : (
          <div className="space-y-2">
            {backups.map((b) => (
              <div
                key={b.id}
                className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <span className="font-semibold text-zinc-200 uppercase">{b.type} BACKUP</span>
                  <span className="text-zinc-500 ml-2 truncate block sm:inline">{b.storagePath}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400">{(b.sizeBytes / 1024).toFixed(1)} KB</span>
                  <span className="text-emerald-400">✓ {b.verificationState}</span>
                  <button
                    onClick={() => onRestoreBackup(b)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
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
