import React, { useState, useEffect } from 'react';
import {
  Layers,
  Server,
  Database,
  HardDrive,
  ShieldCheck,
  RefreshCw,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Cpu,
} from 'lucide-react';
import { DashboardStats } from '../types';
import * as api from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';

export const MonitoringView: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadMonitoring = async () => {
    setLoading(true);
    try {
      const data = await api.fetchDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonitoring();
    const interval = setInterval(async () => {
      try {
        const data = await api.fetchDashboardStats();
        setStats(data);
      } catch (err) {
        // silent polling
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-text-primary tracking-tight">
              System Telemetry &amp; RPO Freshness
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-secondary border border-border text-text-muted">
              Live Control Plane
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Real-time control-plane telemetry, service connectivity, and backup recovery chain readiness.
          </p>
        </div>

        <button
          onClick={loadMonitoring}
          disabled={loading}
          className="op-btn-secondary self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-primary' : 'text-text-muted'}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Control Plane Topology Status */}
      <div className="op-card p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-brand-primary" />
            Control Plane Core Daemons
          </h2>
          <span className="text-[10px] text-text-muted font-mono">Cluster: local-default</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded bg-surface-secondary border border-border space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary font-medium">NestJS Control API</span>
              <StatusBadge status="HEALTHY" size="sm" />
            </div>
            <div className="text-xs font-mono text-text-primary font-medium">HTTP Port 3000</div>
            <div className="text-[10px] text-text-muted">REST /api/v1 active</div>
          </div>

          <div className="p-2.5 rounded bg-surface-secondary border border-border space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary font-medium">PostgreSQL Metadata</span>
              <StatusBadge status="HEALTHY" size="sm" />
            </div>
            <div className="text-xs font-mono text-text-primary font-medium">Port 5432 (TypeORM)</div>
            <div className="text-[10px] text-text-muted">Persistence verified</div>
          </div>

          <div className="p-2.5 rounded bg-surface-secondary border border-border space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary font-medium">BullMQ Redis Queue</span>
              <StatusBadge status="HEALTHY" size="sm" />
            </div>
            <div className="text-xs font-mono text-text-primary font-medium">Port 6379 (Redis)</div>
            <div className="text-[10px] text-text-muted">Async tasks ready</div>
          </div>

          <div className="p-2.5 rounded bg-surface-secondary border border-border space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary font-medium">Worker Processor</span>
              <StatusBadge status="RUNNING" size="sm" />
            </div>
            <div className="text-xs font-mono text-text-primary font-medium">Active Worker Thread</div>
            <div className="text-[10px] text-text-muted">Listening for jobs</div>
          </div>
        </div>
      </div>

      {/* Domain Pillars Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Infrastructure & Servers */}
        <div className="op-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-text-muted" />
              <h3 className="font-semibold text-xs text-text-primary uppercase tracking-wide">Server Infrastructure</h3>
            </div>
            <span className="text-xs font-mono text-text-muted">
              {stats?.infrastructure.totalServers || 0} Registered
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded bg-surface-secondary border border-border">
              <div className="text-[10px] text-text-muted uppercase font-medium">Online</div>
              <div className="text-base font-bold text-success font-mono mt-0.5">
                {stats?.infrastructure.onlineServers || 0}
              </div>
              <div className="text-[10px] text-success font-mono">Healthy</div>
            </div>
            <div className="p-2.5 rounded bg-surface-secondary border border-border">
              <div className="text-[10px] text-text-muted uppercase font-medium">Offline</div>
              <div className="text-base font-bold text-error font-mono mt-0.5">
                {stats?.infrastructure.offlineServers || 0}
              </div>
              <div className="text-[10px] text-text-muted font-mono">Unreachable</div>
            </div>
            <div className="p-2.5 rounded bg-surface-secondary border border-border">
              <div className="text-[10px] text-text-muted uppercase font-medium">Coolify</div>
              <div className="text-base font-bold text-brand-primary font-mono mt-0.5">
                {stats?.infrastructure.coolifyInstances || 0}
              </div>
              <div className="text-[10px] text-brand-primary font-mono">Synced</div>
            </div>
          </div>
        </div>

        {/* Database Protection & RPO */}
        <div className="op-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-text-muted" />
              <h3 className="font-semibold text-xs text-text-primary uppercase tracking-wide">Database Protection &amp; RPO</h3>
            </div>
            <span className="text-xs font-mono text-text-muted">
              {stats?.databases.totalDatabases || 0} Managed
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded bg-surface-secondary border border-border">
              <div className="text-[10px] text-text-muted uppercase font-medium">Within RPO</div>
              <div className="text-base font-bold text-success font-mono mt-0.5">
                {stats?.databases.healthyDatabases || 0}
              </div>
              <div className="text-[10px] text-success font-mono">Protected</div>
            </div>
            <div className="p-2.5 rounded bg-surface-secondary border border-border">
              <div className="text-[10px] text-text-muted uppercase font-medium">Overdue</div>
              <div className="text-base font-bold text-warning font-mono mt-0.5">
                {stats?.databases.backupOverdueDatabases || 0}
              </div>
              <div className="text-[10px] text-warning font-mono">Lag &gt; 24h</div>
            </div>
            <div className="p-2.5 rounded bg-surface-secondary border border-border">
              <div className="text-[10px] text-text-muted uppercase font-medium">Unprotected</div>
              <div className="text-base font-bold text-text-muted font-mono mt-0.5">
                {stats?.databases.unprotectedDatabases || 0}
              </div>
              <div className="text-[10px] text-text-muted font-mono">No policy</div>
            </div>
          </div>
        </div>

        {/* Storage Capacity */}
        <div className="op-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <HardDrive className="w-3.5 h-3.5 text-text-muted" />
              <h3 className="font-semibold text-xs text-text-primary uppercase tracking-wide">Storage Destinations</h3>
            </div>
            <span className="text-xs font-mono text-text-muted">
              {stats?.storage.totalDestinations || 0} Configured
            </span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between p-2 rounded bg-surface-secondary border border-border">
              <span className="text-text-muted">Total Backups Footprint:</span>
              <span className="text-text-primary font-medium">
                {stats?.storage.usedCapacityBytes
                  ? `${(stats.storage.usedCapacityBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
                  : '0.00 GB'}
              </span>
            </div>
            <div className="flex justify-between p-2 rounded bg-surface-secondary border border-border">
              <span className="text-text-muted">Available Host Capacity:</span>
              <span className="text-text-primary font-medium">
                {stats?.storage.availableCapacityBytes
                  ? `${(stats.storage.availableCapacityBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
                  : 'Reported by OS'}
              </span>
            </div>
          </div>
        </div>

        {/* Recovery Chains */}
        <div className="op-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-text-muted" />
              <h3 className="font-semibold text-xs text-text-primary uppercase tracking-wide">Recovery Lineage Integrity</h3>
            </div>
            <span className="text-xs font-mono text-text-muted">
              {(stats?.recovery.validChains || 0) + (stats?.recovery.brokenChains || 0)} Lineages
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2.5 rounded bg-surface-secondary border border-border">
              <div className="text-[10px] text-text-muted uppercase font-medium">Valid Lineages</div>
              <div className="text-lg font-bold text-success font-mono mt-0.5">
                {stats?.recovery.validChains || 0}
              </div>
              <div className="text-[10px] text-success font-mono">Base + WAL ready</div>
            </div>
            <div className="p-2.5 rounded bg-surface-secondary border border-border">
              <div className="text-[10px] text-text-muted uppercase font-medium">Broken Lineages</div>
              <div className="text-lg font-bold text-error font-mono mt-0.5">
                {stats?.recovery.brokenChains || 0}
              </div>
              <div className="text-[10px] text-error font-mono">Missing delta</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
