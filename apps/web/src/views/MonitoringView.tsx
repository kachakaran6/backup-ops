import React, { useState, useEffect } from 'react';
import {
  Layers,
  Server,
  Database,
  HardDrive,
  ShieldCheck,
  RefreshCw,
  Radio,
} from 'lucide-react';
import { DashboardStats } from '../types';
import * as api from '../services/api';
import { StatusIndicator } from '../components/common/StatusIndicator';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-sm sm:text-base font-semibold text-text-primary flex items-center gap-2">
            <Layers className="w-4 h-4 text-text-muted" />
            Infrastructure & Recovery Health
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Real-time control-plane telemetry, service connectivity, and backup recovery chain readiness.
          </p>
        </div>
        <button
          onClick={loadMonitoring}
          disabled={loading}
          className="op-btn-secondary self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : 'text-text-muted'}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Control Plane Topology Status */}
      <div className="op-card p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-text-muted" />
            Control Plane Core Services
          </h3>
          <span className="text-[10px] text-text-muted font-mono">Cluster: local-default</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-md bg-surface-secondary border border-border">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary font-medium">NestJS API</span>
              <StatusIndicator status="online" variant="inline" />
            </div>
            <div className="mt-2 text-xs font-mono text-text-primary">HTTP Port 3000</div>
            <div className="text-[10px] text-text-muted mt-0.5">REST /api/v1 operational</div>
          </div>

          <div className="p-3 rounded-md bg-surface-secondary border border-border">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary font-medium">Metadata Store</span>
              <StatusIndicator status="connected" variant="inline" />
            </div>
            <div className="mt-2 text-xs font-mono text-text-primary">PostgreSQL Active</div>
            <div className="text-[10px] text-text-muted mt-0.5">TypeORM persistence verified</div>
          </div>

          <div className="p-3 rounded-md bg-surface-secondary border border-border">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary font-medium">Async Job Queue</span>
              <StatusIndicator status="ready" variant="inline" />
            </div>
            <div className="mt-2 text-xs font-mono text-text-primary">BullMQ (Redis)</div>
            <div className="text-[10px] text-text-muted mt-0.5">backup-operations queue</div>
          </div>

          <div className="p-3 rounded-md bg-surface-secondary border border-border">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary font-medium">Worker Daemon</span>
              <StatusIndicator status="running" variant="inline" label="Listening" />
            </div>
            <div className="mt-2 text-xs font-mono text-text-primary">Streaming / Checksums</div>
            <div className="text-[10px] text-text-muted mt-0.5">Asynchronous task processor</div>
          </div>
        </div>
      </div>

      {/* Domain Pillars Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Infrastructure & Servers */}
        <div className="op-card p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-text-muted" />
              <h3 className="font-semibold text-xs text-text-primary uppercase tracking-wide">Server Infrastructure</h3>
            </div>
            <span className="text-xs font-mono text-text-muted">
              {stats?.infrastructure.totalServers || 0} Registered
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-md bg-surface-secondary border border-border">
              <div className="text-[10px] text-text-muted uppercase font-medium">Online</div>
              <div className="text-base font-bold text-text-primary font-mono mt-1">
                {stats?.infrastructure.onlineServers || 0}
              </div>
              <div className="text-[10px] text-success font-mono mt-0.5">Healthy</div>
            </div>
            <div className="p-3 rounded-md bg-surface-secondary border border-border">
              <div className="text-[10px] text-text-muted uppercase font-medium">Offline</div>
              <div className="text-base font-bold text-text-primary font-mono mt-1">
                {stats?.infrastructure.offlineServers || 0}
              </div>
              <div className="text-[10px] text-text-muted font-mono mt-0.5">Unreachable</div>
            </div>
            <div className="p-3 rounded-md bg-surface-secondary border border-border">
              <div className="text-[10px] text-text-muted uppercase font-medium">Coolify</div>
              <div className="text-base font-bold text-text-primary font-mono mt-1">
                {stats?.infrastructure.coolifyInstances || 0}
              </div>
              <div className="text-[10px] text-accent font-mono mt-0.5">Synced</div>
            </div>
          </div>
        </div>

        {/* Database Protection */}
        <div className="op-card p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-text-muted" />
              <h3 className="font-semibold text-xs text-text-primary uppercase tracking-wide">Database Protection & RPO</h3>
            </div>
            <span className="text-xs font-mono text-text-muted">
              {stats?.databases.totalDatabases || 0} Managed
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-md bg-surface-secondary border border-border">
              <div className="text-[10px] text-text-muted uppercase font-medium">Within RPO</div>
              <div className="text-base font-bold text-text-primary font-mono mt-1">
                {stats?.databases.healthyDatabases || 0}
              </div>
              <div className="text-[10px] text-success font-mono mt-0.5">Protected</div>
            </div>
            <div className="p-3 rounded-md bg-surface-secondary border border-border">
              <div className="text-[10px] text-text-muted uppercase font-medium">Overdue</div>
              <div className="text-base font-bold text-text-primary font-mono mt-1">
                {stats?.databases.backupOverdueDatabases || 0}
              </div>
              <div className="text-[10px] text-warning font-mono mt-0.5">Lag &gt; 24h</div>
            </div>
            <div className="p-3 rounded-md bg-surface-secondary border border-border">
              <div className="text-[10px] text-text-muted uppercase font-medium">Unprotected</div>
              <div className="text-base font-bold text-text-primary font-mono mt-1">
                {stats?.databases.unprotectedDatabases || 0}
              </div>
              <div className="text-[10px] text-text-muted font-mono mt-0.5">No policy</div>
            </div>
          </div>
        </div>

        {/* Storage Capacity */}
        <div className="op-card p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-text-muted" />
              <h3 className="font-semibold text-xs text-text-primary uppercase tracking-wide">Storage Destinations</h3>
            </div>
            <span className="text-xs font-mono text-text-muted">
              {stats?.storage.totalDestinations || 0} Configured
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded bg-surface-secondary border border-border">
              <span className="text-text-muted">Total Backups Stored:</span>
              <span className="font-mono text-text-primary font-medium">
                {stats?.storage.usedCapacityBytes
                  ? `${(stats.storage.usedCapacityBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
                  : '0.00 GB'}
              </span>
            </div>
            <div className="flex justify-between p-2 rounded bg-surface-secondary border border-border">
              <span className="text-text-muted">Available Host Capacity:</span>
              <span className="font-mono text-text-primary font-medium">
                {stats?.storage.availableCapacityBytes
                  ? `${(stats.storage.availableCapacityBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
                  : 'Reported by OS'}
              </span>
            </div>
          </div>
        </div>

        {/* Recovery Chains */}
        <div className="op-card p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-text-muted" />
              <h3 className="font-semibold text-xs text-text-primary uppercase tracking-wide">Recovery Chain Integrity</h3>
            </div>
            <span className="text-xs font-mono text-text-muted">
              {(stats?.recovery.validChains || 0) + (stats?.recovery.brokenChains || 0)} Lineages
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-md bg-surface-secondary border border-border">
              <div className="text-[10px] text-text-muted uppercase font-medium">Valid Chains</div>
              <div className="text-lg font-bold text-text-primary font-mono mt-1">
                {stats?.recovery.validChains || 0}
              </div>
              <div className="text-[10px] text-success font-mono mt-0.5">Base + WAL ready</div>
            </div>
            <div className="p-3 rounded-md bg-surface-secondary border border-border">
              <div className="text-[10px] text-text-muted uppercase font-medium">Broken Chains</div>
              <div className="text-lg font-bold text-text-primary font-mono mt-1">
                {stats?.recovery.brokenChains || 0}
              </div>
              <div className="text-[10px] text-error font-mono mt-0.5">Missing ancestor</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
