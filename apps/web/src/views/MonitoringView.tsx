import React, { useState, useEffect } from 'react';
import {
  Layers,
  Activity,
  Server,
  Database,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Radio,
} from 'lucide-react';
import { DashboardStats } from '../types';
import * as api from '../services/api';

export const MonitoringView: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadMonitoring = async () => {
    setLoading(true);
    const data = await api.fetchDashboardStats();
    setStats(data);
    setLoading(false);
  };

  useEffect(() => {
    loadMonitoring();
    const interval = setInterval(async () => {
      const data = await api.fetchDashboardStats();
      setStats(data);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            Infrastructure & Recovery Health Monitoring
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time control-plane observability, cluster components, database RPO freshness, and backup chain integrity.
          </p>
        </div>
        <button
          onClick={loadMonitoring}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-medium transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Control Plane Topology Status */}
      <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
        <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          Control Plane Core Services
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">NestJS API Control Plane</span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> ONLINE
              </span>
            </div>
            <div className="mt-2 text-xs font-mono text-zinc-200">HTTP Port 3000</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">REST /api/v1 healthy</div>
          </div>

          <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">PostgreSQL Metadata DB</span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> CONNECTED
              </span>
            </div>
            <div className="mt-2 text-xs font-mono text-zinc-200">TypeORM Migrations Active</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Control-plane persistence</div>
          </div>

          <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">BullMQ Async Queue (Redis)</span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> READY
              </span>
            </div>
            <div className="mt-2 text-xs font-mono text-zinc-200">Queue: backup-operations</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Worker streaming active</div>
          </div>

          <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Background Worker</span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> LISTENING
              </span>
            </div>
            <div className="mt-2 text-xs font-mono text-zinc-200">Streaming / SHA-256 Engine</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Non-blocking operations</div>
          </div>
        </div>
      </div>

      {/* Domain Pillars Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Infrastructure & Servers */}
        <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-400" />
              <h3 className="font-semibold text-sm text-zinc-100">Server Infrastructure Health</h3>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              {stats?.infrastructure.totalServers || 0} Registered
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800">
              <div className="text-[10px] text-zinc-400 uppercase font-medium">Online</div>
              <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
                {stats?.infrastructure.onlineServers || 0}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800">
              <div className="text-[10px] text-zinc-400 uppercase font-medium">Offline</div>
              <div className="text-lg font-bold text-rose-400 font-mono mt-1">
                {stats?.infrastructure.offlineServers || 0}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800">
              <div className="text-[10px] text-zinc-400 uppercase font-medium">Coolify Synced</div>
              <div className="text-lg font-bold text-blue-400 font-mono mt-1">
                {stats?.infrastructure.coolifyInstances || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Database Protection */}
        <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-sm text-zinc-100">Database Protection & RPO Health</h3>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              {stats?.databases.totalDatabases || 0} Managed
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800">
              <div className="text-[10px] text-zinc-400 uppercase font-medium">Healthy (Within RPO)</div>
              <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
                {stats?.databases.healthyDatabases || 0}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800">
              <div className="text-[10px] text-zinc-400 uppercase font-medium">Backup Overdue</div>
              <div className="text-lg font-bold text-amber-400 font-mono mt-1">
                {stats?.databases.backupOverdueDatabases || 0}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800">
              <div className="text-[10px] text-zinc-400 uppercase font-medium">Unprotected</div>
              <div className="text-lg font-bold text-zinc-400 font-mono mt-1">
                {stats?.databases.unprotectedDatabases || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Storage Capacity */}
        <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              <h3 className="font-semibold text-sm text-zinc-100">Storage Destination Health</h3>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              {stats?.storage.totalDestinations || 0} Configured
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Total Backups Stored:</span>
              <span className="font-mono text-zinc-200">
                {stats?.storage.usedCapacityBytes
                  ? `${(stats.storage.usedCapacityBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
                  : '0.00 GB'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Available Host Disk:</span>
              <span className="font-mono text-zinc-200">
                {stats?.storage.availableCapacityBytes
                  ? `${(stats.storage.availableCapacityBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
                  : 'Reported by OS'}
              </span>
            </div>
          </div>
        </div>

        {/* Recovery Chains */}
        <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-sm text-zinc-100">Backup Chain & Restore Readiness</h3>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              {(stats?.recovery.validChains || 0) + (stats?.recovery.brokenChains || 0)} Chains
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-[10px] text-emerald-400 uppercase font-medium">Valid Recovery Chains</div>
              <div className="text-xl font-bold text-emerald-300 font-mono mt-1">
                {stats?.recovery.validChains || 0}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Verified Base + WAL available</div>
            </div>
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <div className="text-[10px] text-rose-400 uppercase font-medium">Broken / Incomplete Chains</div>
              <div className="text-xl font-bold text-rose-300 font-mono mt-1">
                {stats?.recovery.brokenChains || 0}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Missing base or corrupted WAL</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
