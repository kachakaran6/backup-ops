import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useControlPlane } from '../context/ControlPlaneContext';
import {
  Settings,
  User,
  Shield,
  Server,
  Database,
  Layers,
  Key,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Sliders,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user, logout } = useAuth();
  const { servers, databases, backups, refresh, isRefreshing } = useControlPlane();
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleClearCache = () => {
    sessionStorage.clear();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="op-card p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-surface-secondary border border-border text-text-muted">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-text-primary">
                System Settings &amp; Workspace Configuration
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Control plane parameters, authenticated operator profile, and engine runtime diagnostics.
              </p>
            </div>
          </div>

          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="op-btn-secondary self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-accent' : 'text-text-muted'}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* Operator Account Section */}
      <div className="op-card p-4 sm:p-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border mb-4">
          <User className="w-4 h-4 text-text-muted" />
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Active Operator Session
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-surface-secondary p-3 rounded-md border border-border">
            <div className="text-text-muted mb-1 text-[11px]">Authenticated Email</div>
            <div className="font-semibold text-text-primary font-mono truncate">{user?.email || 'admin@gmail.com'}</div>
          </div>
          <div className="bg-surface-secondary p-3 rounded-md border border-border">
            <div className="text-text-muted mb-1 text-[11px]">Username / Identifier</div>
            <div className="font-semibold text-text-primary font-mono truncate">{user?.username || 'admin'}</div>
          </div>
          <div className="bg-surface-secondary p-3 rounded-md border border-border">
            <div className="text-text-muted mb-1 text-[11px]">Access Role</div>
            <div className="inline-flex items-center gap-1 text-success font-mono font-medium text-[11px]">
              <Shield className="w-3 h-3" />
              <span>{user?.role?.toUpperCase() || 'SUPER_ADMIN'}</span>
            </div>
          </div>
          <div className="bg-surface-secondary p-3 rounded-md border border-border">
            <div className="text-text-muted mb-1 text-[11px]">Workspace ID</div>
            <div className="font-mono text-text-secondary truncate">{user?.organizationId || 'default'}</div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-text-muted flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            <span>Session protected by cryptographic JWT bearer tokens.</span>
          </div>
          <button
            onClick={logout}
            className="op-btn-danger self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Terminate Session</span>
          </button>
        </div>
      </div>

      {/* Platform & Runtime Diagnostics */}
      <div className="op-card p-4 sm:p-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border mb-4">
          <Layers className="w-4 h-4 text-text-muted" />
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Control Plane Architecture &amp; Health
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-md bg-surface-secondary border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-text-muted" />
                Infrastructure Registry
              </span>
              <span className="px-1.5 py-0.5 rounded bg-surface-elevated text-text-muted font-mono text-[10px] border border-border">
                {servers.length} Hosts
              </span>
            </div>
            <p className="text-text-muted text-[11px] leading-relaxed">
              Idempotent server deduplication active with composite provider keys and stable UUID mapping.
            </p>
          </div>

          <div className="p-3 rounded-md bg-surface-secondary border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-text-muted" />
                Database Engines
              </span>
              <span className="px-1.5 py-0.5 rounded bg-surface-elevated text-text-muted font-mono text-[10px] border border-border">
                {databases.length} Databases
              </span>
            </div>
            <p className="text-text-muted text-[11px] leading-relaxed">
              PostgreSQL Base+WAL and MySQL/MariaDB engines with live connection telemetry and PITR readiness.
            </p>
          </div>

          <div className="p-3 rounded-md bg-surface-secondary border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-text-muted" />
                Secrets &amp; Encryption
              </span>
              <span className="px-1.5 py-0.5 rounded bg-surface-elevated text-text-muted font-mono text-[10px] border border-border">
                AES-256-GCM
              </span>
            </div>
            <p className="text-text-muted text-[11px] leading-relaxed">
              Zero plaintext storage for SSH private keys, provider credentials, and SMTP/Telegram bot tokens.
            </p>
          </div>
        </div>
      </div>

      {/* Diagnostics & Client Storage */}
      <div className="op-card p-4 sm:p-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border mb-4">
          <Sliders className="w-4 h-4 text-text-muted" />
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Operational Diagnostics &amp; Cache Control
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <div className="font-semibold text-text-primary">Clear Client Route Cache</div>
            <div className="text-text-muted mt-0.5">
              Reset cached session queries and force fresh state synchronization without logging out.
            </div>
          </div>

          <button
            onClick={handleClearCache}
            className="op-btn-secondary self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-accent" />
            <span>{cacheCleared ? 'Cache Cleared!' : 'Purge Client Cache'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
