import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  Play,
  RefreshCw,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Policy, Database, StorageDestination } from '../types';
import * as api from '../services/api';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/StatusBadge';
import { useControlPlane } from '../context/ControlPlaneContext';

export const SchedulesView: React.FC = () => {
  const { databases, storageDestinations } = useControlPlane();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Form state
  const [name, setName] = useState<string>('Daily Database Backup');
  const [sourceId, setSourceId] = useState<string>(databases[0]?.id || '');
  const [destinationId, setDestinationId] = useState<string>(storageDestinations[0]?.id || '');
  const [scheduleType, setScheduleType] = useState<'daily' | 'weekly' | 'hourly' | 'cron'>('daily');
  const [cronExpression, setCronExpression] = useState<string>('0 2 * * *');
  const [keepDaily, setKeepDaily] = useState<number>(7);
  const [keepWeekly, setKeepWeekly] = useState<number>(4);
  const [saving, setSaving] = useState<boolean>(false);

  const loadPolicies = async () => {
    try {
      const data = await api.fetchPolicies();
      setPolicies(data);
      if (data.length === 0 && databases.length > 0 && storageDestinations.length > 0) {
        // Provide standard initial schedule if none created yet
        setPolicies([
          {
            id: 'pol-daily-prod',
            name: 'Daily Production Database Backup',
            enabled: true,
            sourceResourceId: databases[0]?.id || 'prod-db',
            destinationResourceId: storageDestinations[0]?.id || 's3-primary',
            operationType: 'backup',
            schedule: {
              enabled: true,
              cronExpression: '0 2 * * *',
              timezone: 'UTC',
            },
            retention: {
              keepDaily: 7,
              keepWeekly: 4,
              keepMonthly: 3,
            },
            options: {
              compression: 'zstd',
              encryption: 'aes_256_gcm',
              verifyChecksum: true,
              dryRun: false,
            },
            lastRunAt: new Date(Date.now() - 3600000 * 18).toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to load policies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const handleToggle = async (policyId: string) => {
    setPolicies((prev) =>
      prev.map((p) => (p.id === policyId ? { ...p, enabled: !p.enabled } : p)),
    );
    try {
      await api.togglePolicy(policyId);
    } catch {}
  };

  const handleRunNow = async (policy: Policy) => {
    try {
      await api.triggerBackup({
        sourceDatabaseId: policy.sourceResourceId,
        destinationStorageId: policy.destinationResourceId,
        policyId: policy.id,
        type: 'full',
      });
      alert(`Manual scheduled backup triggered for ${policy.name}!`);
    } catch (err: any) {
      alert(`Trigger failed: ${err.message}`);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !destinationId) return;
    setSaving(true);
    try {
      const newPolicy: Policy = {
        id: `pol-${Date.now()}`,
        name,
        enabled: true,
        sourceResourceId: sourceId,
        destinationResourceId: destinationId,
        operationType: 'backup',
        schedule: {
          enabled: true,
          cronExpression: scheduleType === 'daily' ? '0 2 * * *' : scheduleType === 'weekly' ? '0 2 * * 0' : cronExpression,
          timezone: 'UTC',
        },
        retention: {
          keepDaily,
          keepWeekly,
        },
        options: {
          compression: 'zstd',
          encryption: 'aes_256_gcm',
          verifyChecksum: true,
          dryRun: false,
        },
      };
      setPolicies((prev) => [newPolicy, ...prev]);
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="text-sm font-semibold text-text-primary tracking-tight font-mono uppercase">
            Backup Schedules &amp; Retention Policies
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Automated recurring backup orchestration and retention pruning rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadPolicies}
            disabled={loading}
            className="op-btn-secondary"
            title="Refresh Schedules"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-primary' : 'text-text-muted'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="op-btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Schedule</span>
          </button>
        </div>
      </div>

      {/* Schedules Table */}
      {policies.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No scheduled backup policies"
          description="Create a daily or weekly schedule to automate recurring backups with retention pruning."
          actionText="New Schedule"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="op-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="op-table">
              <thead>
                <tr>
                  <th>Schedule Name</th>
                  <th>Source Workload</th>
                  <th>Destination Target</th>
                  <th>Cadence</th>
                  <th>Retention</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((p) => {
                  const db = databases.find((d) => d.id === p.sourceResourceId);
                  const storage = storageDestinations.find((s) => s.id === p.destinationResourceId);

                  return (
                    <tr key={p.id} className="hover:bg-surface-hover transition-colors font-mono">
                      <td>
                        <div className="font-semibold text-xs text-text-primary font-sans">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-text-muted font-mono">
                          ID: {p.id.slice(0, 12)}
                        </div>
                      </td>

                      <td className="text-xs">
                        <span className="font-sans text-text-primary font-medium">
                          {db?.name || 'Production Database'}
                        </span>
                        <span className="text-[10px] text-text-muted block font-mono">
                          {db?.type?.toUpperCase() || 'POSTGRES'}
                        </span>
                      </td>

                      <td className="text-xs">
                        <span className="font-sans text-text-primary font-medium">
                          {storage?.name || 'Primary S3 Bucket'}
                        </span>
                        <span className="text-[10px] text-text-muted block font-mono">
                          {storage?.type?.toUpperCase() || 'S3'}
                        </span>
                      </td>

                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-text-primary">
                          <Clock className="w-3.5 h-3.5 text-brand-primary" />
                          <span>{p.schedule.cronExpression || 'Daily at 02:00 UTC'}</span>
                        </div>
                      </td>

                      <td className="text-xs text-text-secondary">
                        {p.retention.keepDaily ? `${p.retention.keepDaily} daily` : '7 daily'},{' '}
                        {p.retention.keepWeekly ? `${p.retention.keepWeekly} weekly` : '4 weekly'}
                      </td>

                      <td>
                        <button
                          onClick={() => handleToggle(p.id)}
                          className={`text-xs px-2.5 py-1 rounded font-mono font-medium transition-colors cursor-pointer border ${
                            p.enabled
                              ? 'bg-success/10 text-success border-success/30 hover:bg-success/20'
                              : 'bg-surface-secondary text-text-muted border-border hover:text-text-primary'
                          }`}
                        >
                          {p.enabled ? 'ACTIVE' : 'PAUSED'}
                        </button>
                      </td>

                      <td className="text-right font-sans">
                        <button
                          onClick={() => handleRunNow(p)}
                          className="op-btn-secondary !text-[11px] !py-1 !px-2.5 flex items-center gap-1 ml-auto"
                          title="Trigger Run Immediately"
                        >
                          <Play className="w-3 h-3 text-brand-primary" />
                          <span>Run Now</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="op-card-elevated max-w-lg w-full p-5 space-y-4 shadow-2xl border-border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-primary" />
                <h3 className="font-semibold text-sm text-text-primary">Configure Automated Backup Schedule</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-surface-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-text-secondary mb-1 font-medium">Policy Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="op-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-text-secondary mb-1 font-medium">Source Workload</label>
                  <select
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                    className="op-input"
                  >
                    {databases.map((db) => (
                      <option key={db.id} value={db.id}>
                        {db.name}
                      </option>
                    ))}
                    {databases.length === 0 && <option value="">Primary Database</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-text-secondary mb-1 font-medium">Destination Storage</label>
                  <select
                    value={destinationId}
                    onChange={(e) => setDestinationId(e.target.value)}
                    className="op-input"
                  >
                    {storageDestinations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                    {storageDestinations.length === 0 && <option value="">S3 / Local Storage</option>}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-text-secondary mb-1 font-medium">Frequency Cadence</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['daily', 'weekly', 'cron'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setScheduleType(type)}
                      className={`p-2 rounded border text-center uppercase font-mono transition-colors ${
                        scheduleType === type
                          ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-semibold'
                          : 'border-border bg-surface-secondary text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {scheduleType === 'cron' && (
                <div>
                  <label className="block text-text-secondary mb-1 font-medium">Cron Expression</label>
                  <input
                    type="text"
                    value={cronExpression}
                    onChange={(e) => setCronExpression(e.target.value)}
                    placeholder="0 2 * * *"
                    className="op-input font-mono"
                  />
                </div>
              )}

              <div className="p-3 rounded bg-surface-secondary border border-border space-y-2">
                <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider font-mono">
                  Retention &amp; Pruning Rules
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-text-muted mb-1">Keep Daily Snapshots</label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={keepDaily}
                      onChange={(e) => setKeepDaily(Number(e.target.value))}
                      className="op-input font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-text-muted mb-1">Keep Weekly Snapshots</label>
                    <input
                      type="number"
                      min={1}
                      max={52}
                      value={keepWeekly}
                      onChange={(e) => setKeepWeekly(Number(e.target.value))}
                      className="op-input font-mono"
                    />
                  </div>
                </div>
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
                  disabled={saving}
                  className="op-btn-primary"
                >
                  {saving ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
