import React from 'react';
import {
  Server,
  Database,
  HardDrive,
  ShieldCheck,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  Activity,
  Cloud,
  CheckCircle2,
  XCircle,
  Clock,
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
      {/* Zero State Hero if no infrastructure */}
      {!hasInfrastructure && (
        <div className="p-6 rounded-xl bg-gradient-to-r from-blue-950/40 via-indigo-950/20 to-zinc-900 border border-blue-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              GETTING STARTED
            </span>
            <h3 className="text-lg font-bold text-zinc-100 mt-2">
              Connect your infrastructure to orchestrate backups
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              BackupOps does not own your data or require proprietary cloud storage. Connect your existing
              Coolify instance for automated discovery, or add a Linux server via SSH.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onConnectCoolify}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Cloud className="w-4 h-4" />
              <span>Connect Coolify</span>
            </button>
            <button
              onClick={onAddServer}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition-all cursor-pointer"
            >
              <Server className="w-4 h-4" />
              <span>Add Server (SSH)</span>
            </button>
          </div>
        </div>
      )}

      {/* Real Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Infrastructure Card */}
        <div
          onClick={() => onNavigate('servers')}
          className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-400">INFRASTRUCTURE</span>
            <Server className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold text-zinc-100 font-mono">
              {stats.infrastructure.totalServers}
            </span>
            <span className="text-xs text-zinc-400">Servers</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {stats.infrastructure.onlineServers} Online
            </span>
            <span className="flex items-center gap-1 text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
              {stats.infrastructure.offlineServers} Offline
            </span>
          </div>
        </div>

        {/* Database Health Card */}
        <div
          onClick={() => onNavigate('databases')}
          className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-400">DATABASES</span>
            <Database className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold text-zinc-100 font-mono">
              {stats.databases.totalDatabases}
            </span>
            <span className="text-xs text-zinc-400">Connected</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="text-emerald-400">{stats.databases.healthyDatabases} Healthy</span>
            {stats.databases.backupOverdueDatabases > 0 ? (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {stats.databases.backupOverdueDatabases} Overdue
              </span>
            ) : (
              <span className="text-zinc-400">0 Overdue</span>
            )}
          </div>
        </div>

        {/* Backup Operations (24h) */}
        <div
          onClick={() => onNavigate('backups')}
          className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-400">BACKUPS (LAST 24H)</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold text-zinc-100 font-mono">
              {stats.backups.last24hSuccessful}
            </span>
            <span className="text-xs text-emerald-400">Successful</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className={stats.backups.last24hFailed > 0 ? 'text-rose-400' : 'text-zinc-400'}>
              {stats.backups.last24hFailed} Failed
            </span>
            <span className="text-zinc-400">{stats.backups.totalArtifacts} Total Artifacts</span>
          </div>
        </div>

        {/* Storage Capacity */}
        <div
          onClick={() => onNavigate('storage')}
          className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-400">STORAGE POOLS</span>
            <HardDrive className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold text-zinc-100 font-mono">
              {formatBytes(stats.storage.usedCapacityBytes)}
            </span>
            <span className="text-xs text-zinc-400">Used</span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400">
            {stats.storage.totalDestinations} Destinations configured
          </div>
        </div>
      </div>

      {/* Recovery Readiness & Operation Flow Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recovery Chains */}
        <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
                Recovery Chains
              </h4>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">Base + WAL</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
              <span className="text-xs text-zinc-400">Valid Recovery Chains</span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {stats.recovery.validChains}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
              <span className="text-xs text-zinc-400">Broken Segments</span>
              <span className={`text-xs font-mono font-bold ${stats.recovery.brokenChains > 0 ? 'text-rose-400' : 'text-zinc-500'}`}>
                {stats.recovery.brokenChains}
              </span>
            </div>
          </div>
        </div>

        {/* Active Operations */}
        <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
                Active Operations Queue
              </h4>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">BullMQ Worker</span>
          </div>
          {stats.backups.activeOperations === 0 ? (
            <div className="p-6 text-center border border-dashed border-zinc-800/80 rounded-lg text-zinc-400 text-xs">
              No operations currently running. The asynchronous worker is idle and ready.
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-blue-950/20 border border-blue-900/40 rounded-lg text-blue-300 text-xs">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
              <span>{stats.backups.activeOperations} active operations executing in background</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
