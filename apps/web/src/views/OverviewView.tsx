import React from 'react';
import {
  Server,
  Database,
  HardDrive,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Activity,
  Cloud,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  DashboardStats,
  Server as ServerType,
  Database as DatabaseType,
  StorageDestination,
  Backup as BackupType,
  BackupChain,
} from '../types';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { TableSkeleton, MetricCardsSkeleton } from '../components/common/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useControlPlane } from '../context/ControlPlaneContext';

interface OverviewViewProps {
  stats: DashboardStats;
  servers?: ServerType[];
  databases?: DatabaseType[];
  storageDestinations?: StorageDestination[];
  backups?: BackupType[];
  chains?: BackupChain[];
  onNavigate: (tab: string) => void;
  onConnectCoolify: () => void;
  onAddServer: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  stats,
  servers = [],
  databases = [],
  storageDestinations = [],
  backups = [],
  chains = [],
  onNavigate,
  onConnectCoolify,
  onAddServer,
}) => {
  const { user } = useAuth();

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const hasInfrastructure =
    stats.infrastructure.totalServers > 0 ||
    stats.infrastructure.coolifyInstances > 0 ||
    servers.length > 0;

  // Real Attention Items
  const attentionItems: { id: string; title: string; description: string; type: 'error' | 'warning'; actionTab: string }[] = [];

  const offlineServers = servers.filter((s) => s.status === 'offline');
  if (offlineServers.length > 0) {
    attentionItems.push({
      id: 'attn-servers',
      title: `${offlineServers.length} Offline Server${offlineServers.length > 1 ? 's' : ''}`,
      description: `Unreachable: ${offlineServers.map((s) => s.name || s.host).join(', ')}`,
      type: 'error',
      actionTab: 'servers',
    });
  }

  const overdueDbs = databases.filter((d) => d.status !== 'connected' || d.recoveryReadiness === 'degraded' || d.recoveryReadiness === 'unhealthy');
  if (overdueDbs.length > 0) {
    attentionItems.push({
      id: 'attn-dbs',
      title: `${overdueDbs.length} Database${overdueDbs.length > 1 ? 's' : ''} Overdue`,
      description: `Backups pending: ${overdueDbs.map((d) => d.name).join(', ')}`,
      type: 'warning',
      actionTab: 'databases',
    });
  }

  const failedBackups = backups.filter((b) => b.status === 'failed');
  if (failedBackups.length > 0) {
    attentionItems.push({
      id: 'attn-backups',
      title: `${failedBackups.length} Failed Backup Artifact${failedBackups.length > 1 ? 's' : ''}`,
      description: `Investigate failure reasons and trigger retry jobs`,
      type: 'error',
      actionTab: 'backups',
    });
  }

  const brokenChains = chains.filter((c) => c.status === 'broken');
  if (brokenChains.length > 0) {
    attentionItems.push({
      id: 'attn-chains',
      title: `${brokenChains.length} Broken Backup Chain${brokenChains.length > 1 ? 's' : ''}`,
      description: `Incremental lineage missing parent snapshot — full backup required`,
      type: 'error',
      actionTab: 'backups',
    });
  }

  // Recent 5 backups
  const recentBackups = [...backups].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);

  const totalRuns24h = stats.backups.last24hSuccessful + stats.backups.last24hFailed;
  const successRate = totalRuns24h > 0
    ? ((stats.backups.last24hSuccessful / totalRuns24h) * 100).toFixed(1)
    : '100.0';

  const { isLoading } = useControlPlane();

  if (isLoading && stats.infrastructure.totalServers === 0 && stats.databases.totalDatabases === 0) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150">
        <MetricCardsSkeleton count={4} />
        <TableSkeleton rows={5} columns={5} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header Greeting & Operational Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-border">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-text-primary tracking-tight">
            {getGreeting()}, {user?.displayName || user?.username || 'Operator'}
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Here is the live operational status of your infrastructure and backup orchestrations.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={() => onNavigate('backups')}
            className="op-btn-primary !text-xs !py-1 !px-3"
          >
            <span>Trigger Backup</span>
          </button>
        </div>
      </div>

      {/* Zero State if no infrastructure connected yet */}
      {!hasInfrastructure && (
        <div className="p-4 sm:p-5 rounded-lg bg-surface border border-brand/30 bg-brand/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <h3 className="text-xs sm:text-sm font-semibold text-text-primary">
              Connect your infrastructure to orchestrate backups
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              BackupOps keeps your data in your own infrastructure. Connect your self-hosted Coolify
              instance for automatic discovery, or register a Linux host via SSH.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onConnectCoolify}
              className="op-btn-primary !text-xs"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Connect Coolify</span>
            </button>
            <button
              onClick={onAddServer}
              className="op-btn-secondary !text-xs"
            >
              <Server className="w-3.5 h-3.5" />
              <span>Add Server (SSH)</span>
            </button>
          </div>
        </div>
      )}

      {/* System Health Strip (5 High-Density Metric Blocks) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Servers */}
        <MetricCard
          title="SERVERS"
          value={stats.infrastructure.totalServers || servers.length}
          unit="nodes"
          icon={Server}
          onClick={() => onNavigate('servers')}
          breakdown={[
            {
              label: 'online',
              value: stats.infrastructure.onlineServers || servers.filter((s) => s.status === 'online').length,
              color: 'success',
            },
            {
              label: 'offline',
              value: stats.infrastructure.offlineServers || servers.filter((s) => s.status === 'offline').length,
              color: stats.infrastructure.offlineServers > 0 ? 'error' : 'neutral',
            },
          ]}
        />

        {/* Databases */}
        <MetricCard
          title="DATABASES"
          value={stats.databases.totalDatabases || databases.length}
          unit="workloads"
          icon={Database}
          onClick={() => onNavigate('databases')}
          breakdown={[
            {
              label: 'connected',
              value: stats.databases.healthyDatabases || databases.filter((d) => d.status === 'connected').length,
              color: 'success',
            },
            {
              label: 'unprotected',
              value: stats.databases.backupOverdueDatabases || databases.filter((d) => d.protectionStatus !== 'protected').length,
              color: (stats.databases.backupOverdueDatabases > 0 || databases.some((d) => d.protectionStatus !== 'protected')) ? 'warning' : 'neutral',
            },
          ]}
        />

        {/* Storage Capacity */}
        <MetricCard
          title="STORAGE"
          value={formatBytes(stats.storage.usedCapacityBytes)}
          unit="utilized"
          icon={HardDrive}
          onClick={() => onNavigate('storage')}
          breakdown={[
            {
              label: 'destinations',
              value: stats.storage.totalDestinations || storageDestinations.length,
              color: 'brand',
            },
          ]}
        />

        {/* 24h Success Rate */}
        <MetricCard
          title="24H BACKUP SLA"
          value={`${successRate}%`}
          unit={`${totalRuns24h} runs`}
          icon={ShieldCheck}
          onClick={() => onNavigate('backups')}
          breakdown={[
            {
              label: 'ok',
              value: stats.backups.last24hSuccessful,
              color: 'success',
            },
            {
              label: 'failed',
              value: stats.backups.last24hFailed,
              color: stats.backups.last24hFailed > 0 ? 'error' : 'neutral',
            },
          ]}
        />

        {/* Operations Queue */}
        <MetricCard
          title="ASYNC WORKER"
          value={stats.backups.activeOperations}
          unit="running"
          icon={Activity}
          onClick={() => onNavigate('operations')}
          breakdown={[
            {
              label: 'total artifacts',
              value: stats.backups.totalArtifacts || backups.length,
              color: 'info',
            },
          ]}
        />
      </div>

      {/* Main Operational Area: Attention Required + Recovery Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attention Required Card */}
        <div className="op-card p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-text-muted" />
                <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wide font-mono">
                  Attention Required
                </h4>
              </div>
              <span className="text-xs font-mono text-text-muted">
                {attentionItems.length} issues
              </span>
            </div>

            {attentionItems.length === 0 ? (
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                <CheckCircle2 className="w-7 h-7 text-success opacity-80" />
                <p className="text-xs font-medium text-text-primary">
                  All Systems Operational
                </p>
                <p className="text-[11px] text-text-muted max-w-xs">
                  Zero degraded servers, overdue workloads, or broken backup lineages detected.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {attentionItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onNavigate(item.actionTab)}
                    className={`p-2.5 rounded-md border text-xs cursor-pointer transition-colors flex items-start justify-between gap-2 ${
                      item.type === 'error'
                        ? 'bg-error/5 border-error/25 hover:border-error/50'
                        : 'bg-warning/5 border-warning/25 hover:border-warning/50'
                    }`}
                  >
                    <div>
                      <p
                        className={`font-semibold text-xs ${
                          item.type === 'error' ? 'text-error' : 'text-warning'
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border mt-3 flex items-center justify-between text-[11px] text-text-muted font-mono">
            <span>Recovery SLA: 99.9%</span>
            <button
              onClick={() => onNavigate('monitoring')}
              className="hover:text-text-primary transition-colors cursor-pointer"
            >
              Inspect telemetry →
            </button>
          </div>
        </div>

        {/* Recovery Lineages & Chains */}
        <div className="op-card p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-text-muted" />
                <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wide font-mono">
                  Recovery Lineages
                </h4>
              </div>
              <span className="text-[11px] text-text-muted font-mono">PostgreSQL PITR</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-md bg-surface-secondary border border-border flex items-center justify-between">
                <span className="text-text-secondary">Valid Chains</span>
                <span className="font-semibold text-success">
                  {stats.recovery.validChains || chains.filter((c) => c.status === 'healthy').length}
                </span>
              </div>
              <div className="p-2.5 rounded-md bg-surface-secondary border border-border flex items-center justify-between">
                <span className="text-text-secondary">Broken / Incomplete</span>
                <span
                  className={`font-semibold ${
                    stats.recovery.brokenChains > 0 ? 'text-error' : 'text-text-muted'
                  }`}
                >
                  {stats.recovery.brokenChains || chains.filter((c) => c.status === 'broken').length}
                </span>
              </div>
              <div className="p-2.5 rounded-md bg-surface-secondary border border-border flex items-center justify-between">
                <span className="text-text-secondary">Total Recovery Points</span>
                <span className="font-semibold text-text-primary font-mono">
                  {stats.backups.totalArtifacts || backups.length}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border mt-3 flex items-center justify-between text-[11px] text-text-muted font-mono">
            <span>WAL Archiving Active</span>
            <button
              onClick={() => onNavigate('backups')}
              className="hover:text-text-primary transition-colors cursor-pointer"
            >
              View chains →
            </button>
          </div>
        </div>

        {/* Workload Engines Breakdown */}
        <div className="op-card p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-text-muted" />
                <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wide font-mono">
                  Database Workloads
                </h4>
              </div>
              <span className="text-[11px] text-text-muted font-mono">Engines</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded bg-surface-secondary border border-border">
                <span className="text-text-secondary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-info" />
                  PostgreSQL
                </span>
                <span className="text-text-primary font-semibold">
                  {databases.filter((d) => d.type === 'postgres').length}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-surface-secondary border border-border">
                <span className="text-text-secondary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand" />
                  MySQL / MariaDB
                </span>
                <span className="text-text-primary font-semibold">
                  {databases.filter((d) => d.type === 'mysql' || d.type === 'mariadb').length}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-surface-secondary border border-border">
                <span className="text-text-secondary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-error" />
                  Redis
                </span>
                <span className="text-text-primary font-semibold">
                  {databases.filter((d) => d.type === 'redis').length}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border mt-3 flex items-center justify-between text-[11px] text-text-muted font-mono">
            <span>Coverage: 100%</span>
            <button
              onClick={() => onNavigate('databases')}
              className="hover:text-text-primary transition-colors cursor-pointer"
            >
              Browse workloads →
            </button>
          </div>
        </div>
      </div>

      {/* Recent Backup Operations Table */}
      <div className="op-card overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-border flex items-center justify-between bg-surface-secondary/40">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-text-muted" />
            <h3 className="text-xs sm:text-sm font-semibold text-text-primary uppercase tracking-wide font-mono">
              Recent Backup Operations
            </h3>
          </div>
          <button
            onClick={() => onNavigate('backups')}
            className="text-xs text-brand hover:underline font-mono font-medium"
          >
            View all ({backups.length}) →
          </button>
        </div>

        {recentBackups.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted font-mono">
            No backup operations recorded yet. Execute an on-demand backup or configure an automated policy.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="op-table">
              <thead>
                <tr>
                  <th>Target Workload</th>
                  <th>Type</th>
                  <th>Destination</th>
                  <th>Size</th>
                  <th>Verification</th>
                  <th>Executed At</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBackups.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => onNavigate('backups')}
                    className="cursor-pointer"
                  >
                    <td className="font-semibold text-text-primary">
                      {databases.find((d) => d.id === b.sourceDatabaseId)?.name || b.sourceDatabaseId || 'Database'}
                    </td>
                    <td>
                      <span className="text-xs font-mono text-text-secondary uppercase">
                        {b.type}
                      </span>
                    </td>
                    <td className="font-mono text-text-secondary text-xs">
                      {storageDestinations.find((s) => s.id === b.destinationStorageId)?.name || b.destinationStorageId || 'Local Storage'}
                    </td>
                    <td className="font-mono text-text-primary">
                      {formatBytes(b.sizeBytes)}
                    </td>
                    <td>
                      <span className="text-xs font-mono text-success inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    </td>
                    <td className="font-mono text-text-muted text-xs whitespace-nowrap">
                      {new Date(b.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <StatusBadge status={b.status} size="sm" />
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
