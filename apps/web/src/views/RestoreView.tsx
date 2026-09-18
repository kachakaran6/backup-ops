import React, { useState } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Database,
  Server,
  ShieldAlert,
  Clock,
  HardDrive,
  X,
} from 'lucide-react';
import { RestoreJob, Backup, Database as DatabaseType, Server as ServerType } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import * as api from '../services/api';

interface RestoreViewProps {
  restoreJobs: RestoreJob[];
  backups: Backup[];
  databases: DatabaseType[];
  servers: ServerType[];
  onRefresh: () => void;
  preselectedBackup?: Backup | null;
}

export const RestoreView: React.FC<RestoreViewProps> = ({
  restoreJobs,
  backups,
  databases,
  servers,
  onRefresh,
  preselectedBackup,
}) => {
  const [showModal, setShowModal] = useState(!!preselectedBackup);
  const [selectedBackupId, setSelectedBackupId] = useState(preselectedBackup?.id || backups[0]?.id || '');
  const [targetType, setTargetType] = useState<'original' | 'new_database' | 'different_server'>('original');
  const [targetDatabaseId, setTargetDatabaseId] = useState(databases[0]?.id || '');
  const [targetServerId, setTargetServerId] = useState(servers[0]?.id || '');
  const [overwriteConfirmed, setOverwriteConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedBackup = backups.find((b) => b.id === selectedBackupId);

  const handleStartRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBackupId || !overwriteConfirmed) return;
    setSubmitting(true);
    await api.createRestoreJob({
      backupId: selectedBackupId,
      targetType,
      targetDatabaseId: targetType === 'original' ? undefined : targetDatabaseId,
      targetServerId: targetType === 'different_server' ? targetServerId : undefined,
      overwriteConfirmed,
    });
    setSubmitting(false);
    setShowModal(false);
    setOverwriteConfirmed(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Disaster Recovery & Restore Operations</h3>
          <p className="text-xs text-zinc-400">
            Recover databases and filesystems from verified backups with safety controls and point-in-time recovery.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={backups.length === 0}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Launch Restore Operation</span>
        </button>
      </div>

      {/* Restore Jobs List */}
      <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4">
        <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
          Recent Restore Executions ({restoreJobs.length})
        </h4>

        {restoreJobs.length === 0 ? (
          <EmptyState
            icon={RotateCcw}
            title="No restore operations executed yet"
            description="When disaster strikes or a staging database needs seeding, launch a restore operation from any verified backup archive."
            actionText={backups.length > 0 ? 'Launch Restore Operation' : undefined}
            onAction={() => setShowModal(true)}
          />
        ) : (
          <div className="space-y-3">
            {restoreJobs.map((job) => (
              <div
                key={job.id}
                className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 space-y-2 text-xs font-mono"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-200">Restore #{job.id.slice(0, 8)}</span>
                    <span className="text-zinc-500">• Target: {job.targetType}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      job.state === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : job.state === 'running'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {job.state.toUpperCase()}
                  </span>
                </div>

                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${job.progressPercent}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span>{job.currentStep}</span>
                  <span>{new Date(job.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Restore Wizard Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="font-semibold text-sm text-zinc-100">Database Restore Operation</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartRestore} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Select Backup Source</label>
                <select
                  value={selectedBackupId}
                  onChange={(e) => setSelectedBackupId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-rose-500 font-mono"
                >
                  {backups.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.type.toUpperCase()} - {b.storagePath} ({new Date(b.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Restore Target Strategy</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-rose-500"
                >
                  <option value="original">Restore to Original Source Database (Destructive overwrite)</option>
                  <option value="new_database">Restore to New Database Instance (Safe)</option>
                  <option value="different_server">Restore to Different Server Host</option>
                </select>
              </div>

              {/* High-risk Overwrite Confirmation Box */}
              <div className="p-4 rounded-lg bg-rose-950/30 border border-rose-900/50 space-y-3">
                <div className="flex items-start gap-2 text-rose-400">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-xs">Destructive Operation Warning</h5>
                    <p className="text-[11px] text-rose-300/80 mt-0.5 leading-relaxed">
                      Restoring from backup will alter or overwrite target database tables and sequences. This operation
                      cannot be undone once the worker streams the snapshot.
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={overwriteConfirmed}
                    onChange={(e) => setOverwriteConfirmed(e.target.checked)}
                    className="rounded border-rose-700 text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-xs font-semibold text-rose-200">
                    I confirm that I understand the target data implications and wish to execute this restore.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 bg-transparent hover:bg-zinc-800 text-zinc-400 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!overwriteConfirmed || submitting}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Dispatching to BullMQ...' : 'Confirm & Execute Restore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
