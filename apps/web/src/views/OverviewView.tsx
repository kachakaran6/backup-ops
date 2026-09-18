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
} from 'lucide-react';
import { DashboardStats } from '../types';

interface OverviewViewProps {
  stats: DashboardStats;
  onNavigate: (tab: any) => void;
  onConnectCoolify: () => void;
  onAddServer: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  stats,
  onNavigate,
  onConnectCoolify,
  onAddServer,
}) => {
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const hasInfrastructure = stats.infrastructure.totalServers > 0 || stats.infrastructure.coolifyInstances > 0;

  return (
    <div className="space-y-6">
      {/* Zero State if no infrastructure */}
      {!hasInfrastructure && (
        <div className="p-5 rounded-lg bg-surface border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-surface-secondary text-text-secondary border border-border">
              GETTING STARTED
            </span>
            <h3 className="text-sm sm:text-base font-semibold text-text-primary mt-1">
              Connect your infrastructure to orchestrate backups
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              BackupOps does not own your data or require proprietary storage. Connect your existing
              Coolify instance for automated discovery, or add a Linux server via SSH.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onConnectCoolify}
              className="op-btn-primary"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Connect Coolify</span>
            </button>
            <button
              onClick={onAddServer}
              className="op-btn-secondary"
            >
              <Server className="w-3.5 h-3.5" />
              <span>Add Server (SSH)</span>
            </button>
          </div>
        </div>
      )}

      {/* Operational Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Infrastructure Card */}
        <div
          onClick={() => onNavigate('servers')}
          className="op-card p-4 hover:border-border-strong transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">SERVERS</span>
            <Server className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
          </div>
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-2xl font-semibold text-text-primary font-mono">
              {stats.infrastructure.totalServers}
            </span>
            <span className="text-xs text-text-muted">registered</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-success flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
              {stats.infrastructure.onlineServers} online
            </span>
            {stats.infrastructure.offlineServers > 0 && (
              <span className="text-text-muted flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-border-strong"></span>
                {stats.infrastructure.offlineServers} offline
              </span>
            )}
          </div>
        </div>

        {/* Database Health Card */}
        <div
          onClick={() => onNavigate('databases')}
          className="op-card p-4 hover:border-border-strong transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">DATABASES</span>
            <Database className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
          </div>
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-2xl font-semibold text-text-primary font-mono">
              {stats.databases.totalDatabases}
            </span>
            <span className="text-xs text-text-muted">instances</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-success">{stats.databases.healthyDatabases} healthy</span>
            {stats.databases.backupOverdueDatabases > 0 ? (
              <span className="text-warning flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {stats.databases.backupOverdueDatabases} overdue
              </span>
            ) : (
              <span className="text-text-muted">0 overdue</span>
            )}
          </div>
        </div>

        {/* Backup Operations (24h) */}
        <div
          onClick={() => onNavigate('backups')}
          className="op-card p-4 hover:border-border-strong transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">BACKUPS (24H)</span>
            <ShieldCheck className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
          </div>
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-2xl font-semibold text-text-primary font-mono">
              {stats.backups.last24hSuccessful + stats.backups.last24hFailed}
            </span>
            <span className="text-xs text-text-muted">runs</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-success">{stats.backups.last24hSuccessful} succeeded</span>
            {stats.backups.last24hFailed > 0 ? (
              <span className="text-error">{stats.backups.last24hFailed} failed</span>
            ) : (
              <span className="text-text-muted">0 failed</span>
            )}
          </div>
        </div>

        {/* Storage Capacity */}
        <div
          onClick={() => onNavigate('storage')}
          className="op-card p-4 hover:border-border-strong transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">STORAGE POOLS</span>
            <HardDrive className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
          </div>
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-2xl font-semibold text-text-primary font-mono">
              {formatBytes(stats.storage.usedCapacityBytes)}
            </span>
            <span className="text-xs text-text-muted">used</span>
          </div>
          <div className="text-xs font-mono text-text-muted">
            {stats.storage.totalDestinations} destinations connected
          </div>
        </div>
      </div>

      {/* Recovery Readiness & Operation Flow Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recovery Chains */}
        <div className="op-card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-text-muted" />
              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wide">
                Recovery Chains
              </h4>
            </div>
            <span className="text-[11px] text-text-muted font-mono">Base + WAL</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between p-2.5 rounded-md bg-surface-secondary border border-border">
              <span className="text-text-muted">Valid Lineages</span>
              <span className="font-semibold text-success">
                {stats.recovery.validChains}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-md bg-surface-secondary border border-border">
              <span className="text-text-muted">Broken Segments</span>
              <span className={`font-semibold ${stats.recovery.brokenChains > 0 ? 'text-error' : 'text-text-muted'}`}>
                {stats.recovery.brokenChains}
              </span>
            </div>
          </div>
        </div>

        {/* Active Operations */}
        <div className="op-card p-4 sm:p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3 border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-text-muted" />
              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wide">
                Active Operations Queue
              </h4>
            </div>
            <span className="text-[11px] text-text-muted font-mono">BullMQ Worker</span>
          </div>
          {stats.backups.activeOperations === 0 ? (
            <div className="p-6 text-center border border-dashed border-border rounded-md text-text-muted text-xs">
              No operations running. Asynchronous worker is listening and idle.
            </div>
          ) : (
            <div className="flex items-center gap-2.5 p-3 bg-surface-secondary border border-border rounded-md text-text-primary text-xs">
              <span className="w-2 h-2 rounded-full bg-accent"></span>
              <span>{stats.backups.activeOperations} active operations executing in background worker</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
