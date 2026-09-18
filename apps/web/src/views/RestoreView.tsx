import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  X,
  GitCommit,
  ArrowRight,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { RestoreJob, Backup, Database as DatabaseType, Server as ServerType } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { useControlPlane } from '../context/ControlPlaneContext';
import { api } from '../services/api';

interface RestoreViewProps {
  restoreJobs?: RestoreJob[];
  backups?: Backup[];
  databases?: DatabaseType[];
  servers?: ServerType[];
  onRefresh?: () => void;
  preselectedBackup?: Backup | null;
}

export const RestoreView: React.FC<RestoreViewProps> = (props) => {
  const context = useControlPlane();
  const restoreJobs = props.restoreJobs || context.restoreJobs;
  const backups = props.backups || context.backups;
  const databases = props.databases || context.databases;
  const servers = props.servers || context.servers;
  const onRefresh = props.onRefresh || context.refresh;

  const [showModal, setShowModal] = useState(!!props.preselectedBackup);
  const [selectedBackupId, setSelectedBackupId] = useState(props.preselectedBackup?.id || backups[0]?.id || '');
  const [targetType, setTargetType] = useState<'original' | 'new_database' | 'different_server'>('original');
  const [targetDatabaseId, setTargetDatabaseId] = useState(databases[0]?.id || '');
  const [targetServerId, setTargetServerId] = useState(servers[0]?.id || '');
  const [overwriteConfirmed, setOverwriteConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Restore Plan State
  const [restorePlan, setRestorePlan] = useState<any | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  useEffect(() => {
    if (selectedBackupId && showModal) {
      loadRestorePlan(selectedBackupId);
    }
  }, [selectedBackupId, showModal]);

  const loadRestorePlan = async (id: string) => {
    try {
      setLoadingPlan(true);
      const plan = await api.backups.getRestorePlan(id);
      setRestorePlan(plan);
    } catch (err) {
      console.warn('Could not fetch restore plan:', err);
      setRestorePlan(null);
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleStartRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBackupId || !overwriteConfirmed) return;
    if (restorePlan && !restorePlan.canRestore) {
      alert(`Cannot execute restore: ${restorePlan.brokenReason || 'Recovery chain is broken.'}`);
      return;
    }

    setSubmitting(true);
    try {
      await api.restore.create({
        backupId: selectedBackupId,
        targetType,
        targetDatabaseId: targetType === 'original' ? undefined : targetDatabaseId,
        targetServerId: targetType === 'different_server' ? targetServerId : undefined,
        overwriteConfirmed,
      });
      setShowModal(false);
      setOverwriteConfirmed(false);
      onRefresh();
    } catch (err: any) {
      alert(`Restore request failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 op-card p-4 sm:p-5">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-text-primary flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-text-muted" />
            Disaster Recovery & Lineage-Aware Restore Operations
          </h2>
          <p className="text-xs text-text-muted mt-0.5 max-w-2xl">
            Deterministic state reconstruction from verified Base snapshots, sequential incremental deltas, and point-in-time recovery logs.
          </p>
        </div>

        <button
          onClick={() => {
            if (backups.length > 0 && !selectedBackupId) setSelectedBackupId(backups[0].id);
            setShowModal(true);
          }}
          disabled={backups.length === 0}
          className="op-btn-primary self-start sm:self-auto disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Launch Restore</span>
        </button>
      </div>

      {/* Restore Executions History */}
      <div className="op-card p-4 sm:p-5 space-y-3">
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide border-b border-border pb-3">
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
          <div className="space-y-2.5 font-mono text-xs">
            {restoreJobs.map((job) => (
              <div
                key={job.id}
                className="p-3.5 bg-surface-secondary rounded-md border border-border space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">Restore #{job.id.slice(0, 8)}</span>
                    <span className="text-text-muted">• Target: {job.targetType}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      job.state === 'completed'
                        ? 'bg-success-muted text-success border border-success/30'
                        : job.state === 'running'
                        ? 'bg-accent/15 text-accent border border-accent/30'
                        : 'bg-surface-elevated text-text-muted border border-border'
                    }`}
                  >
                    {job.state.toUpperCase()}
                  </span>
                </div>

                <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden border border-border">
                  <div
                    className="bg-accent h-full rounded-full transition-all"
                    style={{ width: `${job.progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-text-muted">
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="op-card-elevated max-w-xl w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-text-muted" />
                <h3 className="font-semibold text-xs text-text-primary">Lineage-Aware Restore Operation</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStartRestore} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-text-secondary mb-1">Target Recovery Point</label>
                <select
                  value={selectedBackupId}
                  onChange={(e) => setSelectedBackupId(e.target.value)}
                  className="op-input font-mono"
                >
                  {backups.map((b) => (
                    <option key={b.id} value={b.id}>
                      [{b.type.toUpperCase()} #{b.sequence || 1}] {b.storagePath.split('/').pop()} ({new Date(b.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Chain-Aware Restore Plan Section */}
              {loadingPlan ? (
                <div className="p-3 bg-surface-secondary rounded-md border border-border text-center text-text-muted">
                  Analyzing recovery chain dependencies...
                </div>
              ) : restorePlan ? (
                <div className="p-3 bg-surface-secondary rounded-md border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text-primary flex items-center gap-1.5">
                      <GitCommit className="w-3.5 h-3.5 text-accent" />
                      Required Recovery Chain
                    </span>
                    {restorePlan.canRestore ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-success-muted text-success border border-success/30">
                        <CheckCircle2 className="w-3 h-3" />
                        CHAIN HEALTHY ({restorePlan.requiredBackups?.length} artifacts)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-error-muted text-error border border-error/30">
                        <XCircle className="w-3 h-3" />
                        CHAIN BROKEN
                      </span>
                    )}
                  </div>

                  {restorePlan.brokenReason && (
                    <div className="p-2 bg-error-muted border border-error/30 rounded text-error text-[11px]">
                      {restorePlan.brokenReason}
                    </div>
                  )}

                  {/* Required Backups Sequence */}
                  <div className="space-y-1 text-[11px] font-mono">
                    {restorePlan.requiredBackups?.map((rb: any, i: number) => (
                      <div
                        key={rb.id}
                        className="flex items-center justify-between p-1.5 rounded bg-surface border border-border"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-text-muted">Step {i + 1}:</span>
                          <span className="font-semibold text-accent uppercase">
                            {rb.type} #{rb.sequence || 1}
                          </span>
                          <span className="text-text-secondary truncate max-w-[200px]">
                            {rb.storagePath?.split('/').pop()}
                          </span>
                        </div>
                        <span className="text-text-muted">{formatBytes(rb.sizeBytes)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-text-secondary">
                    <span>Payload: <strong className="text-text-primary font-mono">{formatBytes(restorePlan.totalRestoreSizeBytes)}</strong></span>
                    <span>Est. Time: <strong className="text-text-primary font-mono">~{restorePlan.estimatedRestoreTimeSeconds}s</strong></span>
                  </div>
                </div>
              ) : null}

              <div>
                <label className="block text-text-secondary mb-1">Restore Target Strategy</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="op-input"
                >
                  <option value="original">Restore to Original Database (Overwrites target tables)</option>
                  <option value="new_database">Restore to New Database Instance</option>
                  <option value="different_server">Restore to Different Server Host</option>
                </select>
              </div>

              {/* Destructive Warning Box */}
              <div className="p-3 rounded-md bg-warning-muted border border-warning/30 space-y-2">
                <div className="flex items-start gap-2 text-warning">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-xs text-text-primary">Destructive Operation Notice</h5>
                    <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                      Restoring from backup will replay sequential changes into the target database.
                      Ensure active transactions are halted on the destination.
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={overwriteConfirmed}
                    onChange={(e) => setOverwriteConfirmed(e.target.checked)}
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  <span className="text-xs text-text-primary font-medium">
                    I understand the target data implications and authorize this restore.
                  </span>
                </label>
              </div>

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
                  disabled={!overwriteConfirmed || submitting || (restorePlan && !restorePlan.canRestore)}
                  className="op-btn-primary disabled:opacity-50"
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
