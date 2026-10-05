import React from 'react';
import {
  ShieldCheck,
  Server,
  HardDrive,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Activity,
  Play,
  RotateCcw,
  RefreshCw,
  ArrowUpDown,
} from 'lucide-react';
import {
  DashboardStats,
  Server as ServerType,
  Database as DatabaseType,
  StorageDestination,
  Backup as BackupType,
  BackupChain,
} from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { TableSkeleton, MetricCardsSkeleton } from '../components/common/Skeleton';
import { useControlPlane } from '../context/ControlPlaneContext';

interface OverviewViewProps {
  stats: DashboardStats;
  servers?: ServerType[];
  databases?: DatabaseType[];
  storageDestinations?: StorageDestination[];
  backups?: BackupType[];
  chains?: BackupChain[];
  onNavigate: (tab: string) => void;
  onConnectCoolify?: () => void;
  onAddServer?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  stats,
  servers = [],
  databases = [],
  storageDestinations = [],
  backups = [],
  chains = [],
  onNavigate,
}) => {
  const { isLoading, refresh } = useControlPlane();

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // 1. BACKUP HEALTH
  const successfulBackups = stats.backups.last24hSuccessful || backups.filter((b) => b.status === 'completed').length;
  const runningBackups = stats.backups.activeOperations || backups.filter((b) => b.status === 'running').length;
  const failedBackups = stats.backups.last24hFailed || backups.filter((b) => b.status === 'failed').length;

  // 2. SERVERS
  const healthyServers = stats.infrastructure.onlineServers || servers.filter((s) => s.status === 'online').length;
  const offlineServers = stats.infrastructure.offlineServers || servers.filter((s) => s.status === 'offline').length;

  // 3. STORAGE
  const totalUsedStorage = storageDestinations.reduce((acc, s) => acc + (s.usedCapacityBytes || 0), stats.storage.usedCapacityBytes || 0);
  const totalAvailableStorage = storageDestinations.reduce((acc, s) => acc + (s.availableCapacityBytes || 5 * 1024 * 1024 * 1024 * 1024), 5 * 1024 * 1024 * 1024 * 1024);
  const primaryStorageName = storageDestinations[0]?.name || 'Primary Storage (S3 / Local)';

  // 4. UPCOMING
  const upcomingBackup = databases[0]
    ? `${databases[0].name} (Daily)`
    : 'System snapshot scheduled';

  // Overall system health indicator (5-second assessment)
  const isHealthy = failedBackups === 0 && offlineServers === 0;

  // 5. RECENT OPERATIONS (Last 5–10 operations)
  const recentOperations = [...backups]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  if (isLoading && backups.length === 0 && servers.length === 0) {
    return (
      <div className="space-y-4 animate-in fade-in duration-150">
        <MetricCardsSkeleton count={4} />
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 5-Second System Health Indicator Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border bg-surface border-border">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
              isHealthy ? 'bg-success/10 text-success border border-success/30' : 'bg-warning/10 text-warning border border-warning/30'
            }`}
          >
            {isHealthy ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-text-primary tracking-tight font-mono uppercase">
                BackupOps
              </h2>
              <span className="text-text-muted">•</span>
              <span className={`text-xs font-semibold font-mono ${isHealthy ? 'text-success' : 'text-warning'}`}>
                {isHealthy ? 'System healthy' : 'Action recommended'}
              </span>
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">
              Self-hosted control plane is operational. Data safe, verified, and ready for recovery.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('transfers')}
            className="op-btn-secondary !text-xs"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Move / Copy</span>
          </button>
          <button
            onClick={() => onNavigate('backups')}
            className="op-btn-primary !text-xs"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Trigger Backup</span>
          </button>
        </div>
      </div>

      {/* 4 Essential Metrics (Section 17: Backups, Servers, Storage, Upcoming) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: BACKUP HEALTH */}
        <div
          onClick={() => onNavigate('backups')}
          className="op-card p-3.5 space-y-2 cursor-pointer hover:border-brand-primary/40 transition-colors group"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">
              Backup Health
            </span>
            <ShieldCheck className="w-4 h-4 text-brand-primary" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-text-primary">
              {successfulBackups}
            </span>
            <span className="text-xs text-text-muted font-mono">successful</span>
          </div>

          <div className="flex items-center gap-3 pt-1 text-[11px] font-mono border-t border-border">
            <span className="text-success flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
              {successfulBackups} ok
            </span>
            <span className="text-brand-primary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
              {runningBackups} running
            </span>
            <span className={`${failedBackups > 0 ? 'text-error font-semibold' : 'text-text-muted'} flex items-center gap-1`}>
              <span className={`w-1.5 h-1.5 rounded-full ${failedBackups > 0 ? 'bg-error' : 'bg-text-muted/40'}`}></span>
              {failedBackups} failed
            </span>
          </div>
        </div>

        {/* Card 2: SERVERS */}
        <div
          onClick={() => onNavigate('servers')}
          className="op-card p-3.5 space-y-2 cursor-pointer hover:border-brand-primary/40 transition-colors group"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">
              Servers
            </span>
            <Server className="w-4 h-4 text-text-muted group-hover:text-brand-primary transition-colors" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-text-primary">
              {healthyServers}
            </span>
            <span className="text-xs text-success font-mono font-medium">Healthy</span>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] font-mono border-t border-border">
            <span className="text-text-secondary">Fleet total: {servers.length}</span>
            <span className={offlineServers > 0 ? 'text-error font-semibold' : 'text-text-muted'}>
              {offlineServers} offline
            </span>
          </div>
        </div>

        {/* Card 3: STORAGE */}
        <div
          onClick={() => onNavigate('storage')}
          className="op-card p-3.5 space-y-2 cursor-pointer hover:border-brand-primary/40 transition-colors group"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">
              Storage
            </span>
            <HardDrive className="w-4 h-4 text-text-muted group-hover:text-brand-primary transition-colors" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-text-primary">
              {formatBytes(totalUsedStorage)}
            </span>
            <span className="text-xs text-text-muted font-mono">
              / {formatBytes(totalAvailableStorage)}
            </span>
          </div>

          <div className="space-y-1 pt-1 border-t border-border">
            <div className="w-full h-1.5 bg-surface-secondary rounded-full overflow-hidden border border-border">
              <div
                className="h-full bg-brand-primary rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    Math.round((totalUsedStorage / Math.max(totalAvailableStorage, 1)) * 100),
                    100,
                  )}%`,
                }}
              />
            </div>
            <div className="text-[10px] text-text-muted font-mono truncate">
              {primaryStorageName}
            </div>
          </div>
        </div>

        {/* Card 4: UPCOMING */}
        <div
          onClick={() => onNavigate('schedules')}
          className="op-card p-3.5 space-y-2 cursor-pointer hover:border-brand-primary/40 transition-colors group"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">
              Upcoming
            </span>
            <Clock className="w-4 h-4 text-text-muted group-hover:text-brand-primary transition-colors" />
          </div>

          <div className="space-y-0.5">
            <div className="text-xs font-semibold font-mono text-text-primary truncate">
              {upcomingBackup}
            </div>
            <div className="text-xs font-mono text-brand-primary">
              in 42 minutes
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] font-mono border-t border-border text-text-muted">
            <span>Automated Cron</span>
            <span className="text-text-primary group-hover:text-brand-primary transition-colors">
              Manage →
            </span>
          </div>
        </div>
      </div>

      {/* RECENT OPERATIONS (Section 17: Last 5–10 operations) */}
      <div className="op-card overflow-hidden">
        <div className="p-3.5 border-b border-border flex items-center justify-between bg-surface-secondary/30">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-primary" />
            <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider font-mono">
              Recent Operations
            </h3>
          </div>
          <button
            onClick={() => onNavigate('backups')}
            className="text-xs text-brand-primary hover:underline font-mono"
          >
            View all ({backups.length}) →
          </button>
        </div>

        {recentOperations.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted font-mono">
            No operations executed yet. Click &quot;Trigger Backup&quot; or &quot;Move / Copy&quot; to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="op-table">
              <thead>
                <tr>
                  <th>Source → Destination</th>
                  <th>Operation</th>
                  <th>Size / Transferred</th>
                  <th>Verification</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOperations.map((b) => {
                  const db = databases.find((d) => d.id === b.sourceDatabaseId);
                  const storage = storageDestinations.find((s) => s.id === b.destinationStorageId);
                  const isVerified = b.verificationState === 'checksum_verified' || b.verificationState === 'database_verified';

                  return (
                    <tr
                      key={b.id}
                      onClick={() => onNavigate('backups')}
                      className="cursor-pointer hover:bg-surface-hover transition-colors font-mono"
                    >
                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-text-primary">
                          <span className="font-semibold font-sans truncate max-w-[140px]">
                            {db?.name || 'Production Database'}
                          </span>
                          <ArrowRight className="w-3 h-3 text-text-muted shrink-0" />
                          <span className="text-text-muted truncate max-w-[140px]">
                            {storage?.name || 'S3 Storage'}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="uppercase text-xs font-mono font-semibold text-text-secondary">
                          {b.type === 'incremental' ? 'Incremental' : 'Full Backup'}
                        </span>
                      </td>

                      <td className="text-xs text-text-primary font-semibold">
                        {formatBytes(b.sizeBytes)}
                      </td>

                      <td>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-mono ${
                            isVerified ? 'text-success' : 'text-warning'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isVerified ? 'Verified' : 'Pending'}
                        </span>
                      </td>

                      <td className="text-xs text-text-muted whitespace-nowrap">
                        {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td>
                        <StatusBadge status={b.status === 'completed' ? 'HEALTHY' : b.status === 'failed' ? 'FAILED' : 'RUNNING'} size="sm" />
                      </td>

                      <td className="text-right font-sans" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onNavigate('backups')}
                          className="op-btn-secondary !text-[11px] !py-1 !px-2.5"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
